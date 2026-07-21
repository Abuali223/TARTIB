# -*- coding: utf-8 -*-
"""
splitter.py — TARTIB Qur'on ajratuvchi yadrosi.

To'liq sura MP3'ini oyatlarga bo'ladi va `SSSAAA.mp3` (masalan `001001.mp3`)
qilib nomlaydi. Ishlash tamoyili:

  1) Ovoz ffmpeg orqali PCM'ga o'giriladi (16 kHz mono — tahlil uchun).
  2) RMS (baland-pastlik) bo'yicha jimlik oraliqlari topiladi (qori har
     oyat oxirida to'xtaydi — "waqf").
  3) Suraning ANIQ oyat soni ma'lum. Chegaralar oyat matnining nisbiy
     uzunligiga (mora — harakat/madd hisobi) qarab joylashtiriladi va eng
     yaqin haqiqiy jimlikka "yopishtiriladi". Shu tariqa kesish oyat
     matniga mos, bir xilda bo'ladi.
  4) Bismillah qoidasi (Fotiha — 1-oyat; Tavba — yo'q; qolganlari — alohida)
     hisobga olinadi.
  5) Har bir bo'lak asl MP3'dan (to'liq sifatda) kesib olinadi.

Hech qanday avtomatik usul 100% aniq emas — shuning uchun har sura uchun
"ishonch" bahosi beriladi va past ishonchlilar tekshirish uchun belgilanadi
(`review.html` orqali quloq bilan tekshirib, chegaralarni to'g'rilash mumkin).
"""

import json
import os
import shutil
import subprocess

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, "data")

# ————— Ma'lumot (oflayn) —————
with open(os.path.join(DATA, "ayah_meta.json"), encoding="utf-8") as _f:
    AYAH_META = json.load(_f)          # {"1": [[mora, letters, text], ...], ...}
with open(os.path.join(DATA, "surah_meta.json"), encoding="utf-8") as _f:
    SURAH_META = json.load(_f)          # {"1": {"name","ayahs","bismillah"}, ...}

# Bismillah tilovatining taxminiy "mora"si (= Fotiha 1-oyati bilan bir xil)
BISMILLAH_MORA = 32.0


# ————— ffmpeg —————
def find_ffmpeg():
    """Tizim ffmpeg'i, bo'lmasa imageio-ffmpeg paketidagi ffmpeg."""
    exe = shutil.which("ffmpeg")
    if exe:
        return exe
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        raise RuntimeError(
            "ffmpeg topilmadi. Tizimga ffmpeg o'rnating yoki "
            "`pip install imageio-ffmpeg` bajaring."
        )


FFMPEG = find_ffmpeg()


# ————— Dekod / tahlil —————
def decode_pcm(path, sr=16000):
    """MP3/ovoz faylini mono float32 PCM massivga o'giradi (tahlil uchun)."""
    cmd = [FFMPEG, "-v", "error", "-i", path, "-ac", "1", "-ar", str(sr),
           "-f", "s16le", "-"]
    proc = subprocess.run(cmd, capture_output=True)
    if proc.returncode != 0:
        raise RuntimeError("ffmpeg dekod xatosi: " +
                           proc.stderr.decode("utf-8", "replace")[:500])
    x = np.frombuffer(proc.stdout, dtype=np.int16).astype(np.float32) / 32768.0
    return x, sr


def rms_db(x, sr, win_ms=25, hop_ms=10):
    """Oyna bo'yicha RMS (dB). Har kadr uchun markaziy vaqt qaytadi."""
    win = max(1, int(sr * win_ms / 1000))
    hop = max(1, int(sr * hop_ms / 1000))
    if len(x) < win:
        win = len(x)
    csq = np.concatenate(([0.0], np.cumsum(x.astype(np.float64) ** 2)))
    starts = np.arange(0, len(x) - win + 1, hop)
    if len(starts) == 0:
        starts = np.array([0])
    energy = (csq[starts + win] - csq[starts]) / win
    rms = np.sqrt(np.maximum(energy, 0.0)) + 1e-9
    db = 20.0 * np.log10(rms)
    t = (starts + win / 2.0) / sr            # kadr markazi (soniya)
    return db.astype(np.float32), t, hop / sr


def adaptive_threshold(db):
    """Yozuvga moslashuvchan jimlik chegarasi (dB)."""
    lo = float(np.percentile(db, 10))
    hi = float(np.percentile(db, 85))
    thr = lo + 0.35 * (hi - lo)
    thr = min(thr, hi - 6.0)
    thr = max(thr, lo + 3.0)
    return thr


def detect_silences(db, t, thr, min_sil_s):
    """thr'dan past, min_sil_s'dan uzun jimlik oraliqlari: [(start, end), ...]."""
    sil = db < thr
    runs = []
    i, n = 0, len(sil)
    while i < n:
        if sil[i]:
            j = i
            while j < n and sil[j]:
                j += 1
            start, end = float(t[i]), float(t[j - 1])
            if end - start >= min_sil_s:
                runs.append([start, end])
            i = j
        else:
            i += 1
    return runs


def voice_bounds(db, t, thr):
    """Birinchi va oxirgi ovozli kadr vaqti."""
    idx = np.where(db >= thr)[0]
    if len(idx) == 0:
        return float(t[0]), float(t[-1])
    return float(t[idx[0]]), float(t[idx[-1]])


def quietest_time(db, t, t0, radius_s=0.6):
    """t0 atrofidagi eng tinch kadr vaqti (sun'iy kesim uchun)."""
    lo = np.searchsorted(t, t0 - radius_s)
    hi = np.searchsorted(t, t0 + radius_s)
    if hi <= lo:
        return t0
    k = lo + int(np.argmin(db[lo:hi]))
    return float(t[k])


# ————— Chegaralarni tanlash —————
def _seg_cost(dur, exp):
    d = dur - exp
    return d * d


def _select_cuts(prior, cands, vs, ve, db, t):
    """
    prior  — segmentlarning nisbiy uzunliklari (mora); uzunligi = G.
    cands  — haqiqiy jimlik nomzodlari: [{"t":c, "r0":..,"r1":..}, ...] (tartiblangan).
    vs, ve — ovoz boshlanishi/tugashi (soniya).
    G-1 ta kesim tanlanadi. Qaytadi: (boundaries, cost, weak_count)
      boundaries — G-1 ta {"t","r0","r1","weak"} tartiblangan.

    Muhim qoida: jimliklar oyatlardan KO'P bo'lsa (qori uzun oyat ichида nafas
    olgan), birinchi haqiqiy pauzani himoya qilamiz — qori qisqa ochilish
    oyati / Bismillah ichida nafas olmaydi, shuning uchun birinchi pauza deyarli
    har doim haqiqiy chegara. Qolgan ortiqcha jimlik(lar) DP orqali tashlanadi.
    """
    G = len(prior)
    K = G - 1
    span = max(ve - vs, 1e-6)
    tot = float(sum(prior)) or 1.0
    exp = [p / tot * span for p in prior]

    real = sorted(cands, key=lambda c: c["t"])

    # Jimliklar oyatlardan ko'p — birinchi pauzani himoya qilib, qolganini yechamiz.
    if len(real) > K and K >= 2:
        first = real[0]
        sub_bnds, sub_cost, sub_weak = _dp_select(prior[1:], real[1:], first["t"], ve, db, t)
        cost = _seg_cost(first["t"] - vs, exp[0]) + sub_cost
        return [dict(first, weak=False)] + sub_bnds, cost, sub_weak

    return _dp_select(prior, real, vs, ve, db, t)


def _dp_select(prior, real, vs, ve, db, t):
    """Chegara tanlashning yadrosi (himoyasiz): aniq moslik / DP / sun'iy kesim."""
    G = len(prior)
    K = G - 1
    span = max(ve - vs, 1e-6)
    tot = float(sum(prior)) or 1.0
    exp = [p / tot * span for p in prior]
    exp_cum = []
    acc = vs
    for e in exp[:-1]:
        acc += e
        exp_cum.append(acc)

    real = sorted(real, key=lambda c: c["t"])

    if K <= 0:
        return [], 0.0, 0

    # Toza holat: nomzodlar soni aynan mos — hammasini olamiz.
    if len(real) == K:
        bnds = [dict(c, weak=False) for c in real]
        cost = 0.0
        prev = vs
        for k, b in enumerate(bnds):
            cost += _seg_cost(b["t"] - prev, exp[k]); prev = b["t"]
        cost += _seg_cost(ve - prev, exp[-1])
        return bnds, cost, 0

    # Nomzodlar poyi: haqiqiy + (kerak bo'lsa) sun'iy (kutilgan joyda, eng tinch nuqta).
    pool = [dict(c, weak=False, pen=0.0) for c in real]
    if len(real) < K:
        span_ay = span / G
        for ec in exp_cum:
            near = min((abs(ec - c["t"]) for c in real), default=1e9)
            if near > 0.5 * span_ay:                        # yaqinda haqiqiy jimlik yo'q
                qt = quietest_time(db, t, ec)
                pool.append({"t": qt, "r0": qt, "r1": qt, "weak": True,
                             "pen": (0.6 * span_ay) ** 2})
    # Juda ko'p nomzod bo'lsa — kuchsizlarini kesamiz (tezlik uchun).
    cap = max(4 * K, K + 40)
    if len(pool) > cap:
        def strength(c):
            width = c["r1"] - c["r0"]
            prox = min((abs(ec - c["t"]) for ec in exp_cum), default=0.0)
            return width - 0.05 * prox
        pool = sorted(pool, key=strength, reverse=True)[:cap]
    pool = sorted(pool, key=lambda c: c["t"])
    M = len(pool)
    if M < K:
        # Yetarli nomzod yo'q — kutilgan joylarga sun'iy kesim (zaxira).
        bnds = []
        for ec in exp_cum:
            qt = quietest_time(db, t, ec)
            bnds.append({"t": qt, "r0": qt, "r1": qt, "weak": True})
        return bnds, 1e9, len(bnds)

    pos = [c["t"] for c in pool]
    pen = [c["pen"] for c in pool]
    NEG = float("inf")
    # dp[k][i] — k ta kesim, k-chisi i-nomzodda; qiymati minimal narx.
    dp = [[NEG] * M for _ in range(K + 1)]
    par = [[-1] * M for _ in range(K + 1)]
    for i in range(M):
        dp[1][i] = _seg_cost(pos[i] - vs, exp[0]) + pen[i]
    for k in range(2, K + 1):
        for i in range(M):
            best, bj = NEG, -1
            for j in range(i):
                if dp[k - 1][j] == NEG:
                    continue
                c = dp[k - 1][j] + _seg_cost(pos[i] - pos[j], exp[k - 1])
                if c < best:
                    best, bj = c, j
            if bj >= 0:
                dp[k][i] = best + pen[i]
                par[k][i] = bj
    # Oxirgi segment (ve gacha)
    best, bi = NEG, -1
    for i in range(M):
        if dp[K][i] == NEG:
            continue
        c = dp[K][i] + _seg_cost(ve - pos[i], exp[-1])
        if c < best:
            best, bi = c, i
    if bi < 0:
        bnds = [{"t": quietest_time(db, t, ec), "weak": True} for ec in exp_cum]
        return bnds, 1e9, len(bnds)
    # Qayta tiklash
    idxs = []
    k, i = K, bi
    while k >= 1 and i >= 0:
        idxs.append(i)
        i = par[k][i]
        k -= 1
    idxs.reverse()
    bnds = [dict(pool[i]) for i in idxs]
    weak = sum(1 for b in bnds if b.get("weak"))
    return bnds, best, weak


def plan_cuts(surah, dur, runs, vs, ve, db, t, opts=None):
    """
    Suraning oyatlarга mos kesim rejasini qaytaradi.
    Natija dict: {surah, ayahs, bismillah_mode, segments, confidence, notes}
      segments — [{ayah, start, end, mora, letters, text}], SSSAAA tartibda.
    """
    opts = opts or {}
    sm = SURAH_META[str(surah)]
    N = sm["ayahs"]
    rule = sm["bismillah"]
    am = AYAH_META[str(surah)]
    moras = [r[0] for r in am]

    # Ichki nomzodlar (ovoz ichidagi jimliklar)
    cands = []
    for r0, r1 in runs:
        c = (r0 + r1) / 2.0
        if vs + 0.05 < c < ve - 0.05:
            cands.append({"t": c, "r0": r0, "r1": r1})

    # Gipotezalar (bismillah alohidami yoki oyat ichidami)
    forced = opts.get("bismillah")   # None|'separate'|'merged'|'none'
    hyps = []
    if rule == "counted" or rule == "none" or forced == "none":
        hyps.append(("plain", moras, "none"))
    elif forced == "separate":
        hyps.append(("sep", [BISMILLAH_MORA] + moras, "separate"))
    elif forced == "merged":
        hyps.append(("merged", [moras[0] + BISMILLAH_MORA] + moras[1:], "merged"))
    else:
        # avtomatik: ikkalasini sinab, nomzodlar soniga mosrog'ini tanlaymiz
        hyps.append(("sep", [BISMILLAH_MORA] + moras, "separate"))
        hyps.append(("merged", [moras[0] + BISMILLAH_MORA] + moras[1:], "merged"))

    C = len(cands)
    best = None
    for label, prior, mode in hyps:
        K = len(prior) - 1
        bnds, cost, weak = _select_cuts(prior, cands, vs, ve, db, t)
        # nomzodlar soniga moslik jarimasi (avtomatik gipotеza tanlashda)
        mism = abs(C - K)
        score = cost / max(len(prior), 1) + 25.0 * mism + 60.0 * weak
        if best is None or score < best["score"]:
            best = {"label": label, "prior": prior, "mode": mode, "K": K,
                    "bnds": bnds, "cost": cost, "weak": weak, "mism": mism,
                    "score": score}

    mode = best["mode"]
    bnds = best["bnds"]
    pad = float(opts.get("pad", 0.25))

    # Chegaralardan segment [start,end] larini yasash (jimlik ichida pad qoldiramiz)
    edges = [{"t": vs, "r0": vs, "r1": vs}] + \
            [{"t": b["t"], "r0": b.get("r0", b["t"]), "r1": b.get("r1", b["t"])} for b in bnds] + \
            [{"t": ve, "r0": ve, "r1": ve}]
    raw_segs = []
    G = best["K"] + 1
    for k in range(G):
        left, right = edges[k], edges[k + 1]
        start = (left["r0"] + left["r1"]) / 2.0 if k == 0 else left["r1"] - pad
        end = (right["r0"] + right["r1"]) / 2.0 if k == G - 1 else right["r0"] + pad
        if k == 0:
            start = max(0.0, vs - pad)
        if k == G - 1:
            end = min(dur, ve + pad)
        if end <= start:
            mid = (left["t"] + right["t"]) / 2.0
            start, end = min(start, mid - 0.05), max(end, mid + 0.05)
        raw_segs.append([start, end])

    # Segmentlarni oyatlarga bog'lash (+ bismillah birlashtirish)
    segments = []
    if mode == "separate":
        # raw_segs[0] = bismillah, [1..N] = oyatlar
        if opts.get("bismillah_file"):
            segments.append({"ayah": 0, "start": raw_segs[0][0], "end": raw_segs[0][1]})
            oy = raw_segs[1:]
        else:
            # bismillahni 1-oyatga qo'shamiz
            oy = [[raw_segs[0][0], raw_segs[1][1]]] + raw_segs[2:]
        for i, (s, e) in enumerate(oy):
            segments.append({"ayah": i + 1, "start": s, "end": e})
    else:
        for i, (s, e) in enumerate(raw_segs):
            segments.append({"ayah": i + 1, "start": s, "end": e})

    # Matn/mora/letters biriktirish + ishonch bahosi
    span = max(ve - vs, 1e-6)
    tot = float(sum(moras)) or 1.0
    devs = []
    for seg in segments:
        a = seg["ayah"]
        if 1 <= a <= N:
            seg["mora"], seg["letters"], seg["text"] = am[a - 1]
            exp = moras[a - 1] / tot * span
            dur_s = seg["end"] - seg["start"]
            # nisbiy og'ish (kutilganidan)
            devs.append(abs(dur_s - exp) / max(exp, 0.5))
        else:
            seg["mora"], seg["letters"], seg["text"] = BISMILLAH_MORA, 0, "﷽"

    med_dev = float(np.median(devs)) if devs else 1.0
    conf = 100.0
    conf -= 100.0 * min(med_dev, 0.8)          # matn bilan moslik
    conf -= 18.0 * best["mism"]                 # nomzodlar soni mos kelmasa
    conf -= 22.0 * best["weak"]                 # sun'iy (jimliksiz) kesimlar
    conf = max(0.0, min(100.0, conf))

    # Har oyat uchun bayroq (juda qisqa/uzun bo'lsa)
    for seg in segments:
        a = seg["ayah"]
        dur_s = seg["end"] - seg["start"]
        flag = ""
        if a >= 1 and a <= N:
            exp = moras[a - 1] / tot * span
            ratio = dur_s / max(exp, 0.4)
            if ratio > 2.2 or ratio < 0.45:
                flag = "tekshiring"
        if dur_s < 0.6:
            flag = "juda qisqa"
        seg["flag"] = flag

    notes = []
    if best["mism"]:
        notes.append(f"jimliklar soni ({C}) oyat chegaralariga ({best['K']}) mos kelmadi")
    if best["weak"]:
        notes.append(f"{best['weak']} ta kesim jimliksiz joyga qo'yildi")

    return {
        "surah": surah,
        "name": sm["name"],
        "ayahs": N,
        "bismillah_mode": mode,
        "duration": dur,
        "candidates": C,
        "confidence": round(conf, 1),
        "notes": notes,
        "segments": segments,
    }


# ————— Kesib olish (eksport) —————
def pad3(x):
    return str(int(x)).zfill(3)


def export_segment(src, start, end, out_path, bitrate="128k"):
    dur = max(0.05, end - start)
    cmd = [FFMPEG, "-y", "-hide_banner", "-loglevel", "error",
           "-ss", f"{max(0.0, start):.3f}", "-i", src, "-t", f"{dur:.3f}",
           "-map", "0:a:0", "-c:a", "libmp3lame", "-b:a", bitrate,
           "-ar", "44100", out_path]
    proc = subprocess.run(cmd, capture_output=True)
    if proc.returncode != 0:
        raise RuntimeError("ffmpeg eksport xatosi: " +
                           proc.stderr.decode("utf-8", "replace")[:400])


def export_plan(src, plan, out_dir, bitrate="128k"):
    """Rejaga ko'ra SSSAAA.mp3 fayllarni yozadi. Yozilgan fayllar ro'yxati."""
    os.makedirs(out_dir, exist_ok=True)
    surah = plan["surah"]
    written = []
    for seg in plan["segments"]:
        name = pad3(surah) + pad3(seg["ayah"]) + ".mp3"
        out_path = os.path.join(out_dir, name)
        export_segment(src, seg["start"], seg["end"], out_path, bitrate)
        written.append(name)
    return written


# ————— Yuqori darajali yordamchi —————
def analyze(audio_path, sr=16000, thresh_db=None, min_sil_s=0.30):
    x, sr = decode_pcm(audio_path, sr)
    db, t, hop = rms_db(x, sr)
    thr = thresh_db if thresh_db is not None else adaptive_threshold(db)
    runs = detect_silences(db, t, thr, min_sil_s)
    vs, ve = voice_bounds(db, t, thr)
    dur = len(x) / sr
    return {"db": db, "t": t, "thr": thr, "runs": runs,
            "vs": vs, "ve": ve, "dur": dur}


def split_surah(audio_path, surah, opts=None):
    """Tahlil + reja. (Eksport alohida: export_plan.)"""
    opts = opts or {}
    a = analyze(audio_path,
                thresh_db=opts.get("thresh_db"),
                min_sil_s=float(opts.get("min_sil", 0.30)))
    plan = plan_cuts(surah, a["dur"], a["runs"], a["vs"], a["ve"],
                     a["db"], a["t"], opts)
    # Tekshirish sahifasi uchun to'lqin (envelope) — kichraytirilgan dB
    db = a["db"]
    npts = min(2400, len(db))
    idx = np.linspace(0, len(db) - 1, npts).astype(int)
    env = [round(float(db[i]), 1) for i in idx]
    plan["_analysis"] = {"thr": round(a["thr"], 1), "runs": a["runs"],
                         "vs": round(a["vs"], 3), "ve": round(a["ve"], 3),
                         "env": env}
    return plan
