#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
split.py — TARTIB Qur'on ajratuvchi (buyruq qatori).

To'liq sura MP3'ini oyatlarga bo'lib `SSSAAA.mp3` qilib nomlaydi.

Misollar
--------
  # Bitta sura (Fotiha):
  python split.py 001__FOTIHA.mp3 --surah 1 -o chiqish --reciter uzbek_qori

  # Butun papka (fayllar 001.mp3, 002.mp3 ... nomlangan):
  python split.py --batch surahs/ -o chiqish --reciter uzbek_qori

  # Faqat tahlil + tekshirish sahifasi (hali kesmaydi):
  python split.py 001.mp3 --surah 1 -o chiqish --plan-only

  # Tekshirishdan keyin, to'g'rilangan cuts.json'dan qayta kesish:
  python split.py 001.mp3 --from-cuts chiqish/uzbek_qori/_review/001.cuts.json -o chiqish --reciter uzbek_qori

Ishlash: har sura uchun `SSSAAA.mp3` fayllari + `_review/SSS.review.html`
(quloq bilan tekshirib, chegaralarni to'g'rilash uchun) yaratiladi.
Past "ishonch"li suralar tekshirish uchun belgilanadi.
"""

import argparse
import json
import os
import re
import sys

import splitter
import review as review_mod


def parse_surah_from_name(fname):
    """Fayl nomidan sura raqamini oladi: '001__FOTIHA.mp3' -> 1."""
    base = os.path.basename(fname)
    m = re.search(r"(\d{1,3})", base)
    if not m:
        return None
    n = int(m.group(1))
    return n if 1 <= n <= 114 else None


def opts_from_args(args):
    o = {"pad": args.pad, "min_sil": args.min_sil}
    if args.thresh is not None:
        o["thresh_db"] = args.thresh
    if args.bismillah != "auto":
        o["bismillah"] = args.bismillah
    if args.bismillah == "file":
        o["bismillah"] = "separate"
        o["bismillah_file"] = True
    return o


def bar(conf):
    n = int(round(conf / 10))
    return "█" * n + "·" * (10 - n)


def review_dir(out_dir, reciter):
    d = os.path.join(out_dir, reciter, "_review")
    os.makedirs(d, exist_ok=True)
    return d


def write_plan_artifacts(plan, audio_path, out_dir, reciter):
    """cuts.json + review.html yozadi."""
    rd = review_dir(out_dir, reciter)
    sss = splitter.pad3(plan["surah"])
    cuts = {
        "surah": plan["surah"],
        "name": plan["name"],
        "bismillah_mode": plan["bismillah_mode"],
        "audio": os.path.basename(audio_path),
        "confidence": plan["confidence"],
        "segments": [{"ayah": s["ayah"],
                      "start": round(s["start"], 3),
                      "end": round(s["end"], 3)} for s in plan["segments"]],
    }
    with open(os.path.join(rd, f"{sss}.cuts.json"), "w", encoding="utf-8") as f:
        json.dump(cuts, f, ensure_ascii=False, indent=1)
    html = review_mod.render(plan, audio_path)
    with open(os.path.join(rd, f"{sss}.review.html"), "w", encoding="utf-8") as f:
        f.write(html)
    return rd


def do_one(audio_path, surah, args):
    plan = splitter.split_surah(audio_path, surah, opts_from_args(args))
    reciter = args.reciter
    out_dir = args.out
    rd = write_plan_artifacts(plan, audio_path, out_dir, reciter)

    written = []
    if not args.plan_only:
        ayah_dir = os.path.join(out_dir, reciter)
        written = splitter.export_plan(audio_path, plan, ayah_dir, bitrate=args.bitrate)

    a = plan["_analysis"]
    tag = "TEKSHIRING" if plan["confidence"] < 75 else "yaxshi"
    print(f"  [{bar(plan['confidence'])}] {plan['confidence']:5.1f}%  "
          f"{splitter.pad3(surah)} {plan['name']:<14} "
          f"oyat:{plan['ayahs']:>3}  jimlik:{plan['candidates']:>3}  "
          f"{'kesildi' if written else 'reja'}:{len(written) or len(plan['segments']):>3}  [{tag}]")
    for note in plan["notes"]:
        print(f"           · {note}")
    return plan


def do_from_cuts(audio_path, cuts_path, args):
    with open(cuts_path, encoding="utf-8") as f:
        cuts = json.load(f)
    surah = cuts["surah"]
    plan = {"surah": surah, "segments": cuts["segments"]}
    ayah_dir = os.path.join(args.out, args.reciter)
    written = splitter.export_plan(audio_path, plan, ayah_dir, bitrate=args.bitrate)
    print(f"  {splitter.pad3(surah)} {cuts.get('name','')}: {len(written)} oyat "
          f"qayta kesildi -> {ayah_dir}")


def main(argv=None):
    ap = argparse.ArgumentParser(
        description="TARTIB Qur'on ajratuvchi — to'liq surani oyatlarga bo'ladi (SSSAAA.mp3).")
    ap.add_argument("audio", nargs="?", help="Sura MP3 fayli (bitta sura rejimi)")
    ap.add_argument("--surah", type=int, help="Sura raqami (1-114)")
    ap.add_argument("--batch", metavar="PAPKA",
                    help="Papkadagi barcha suralar (fayllar 001.mp3, 002.mp3 ...)")
    ap.add_argument("--from-cuts", metavar="CUTS.JSON",
                    help="To'g'rilangan cuts.json'dan qayta kesish")
    ap.add_argument("-o", "--out", default="chiqish", help="Chiqish papkasi (default: chiqish)")
    ap.add_argument("--reciter", default="qori",
                    help="Qori nomi = chiqish ichki papkasi (default: qori)")
    ap.add_argument("--bismillah", default="auto",
                    choices=["auto", "separate", "merged", "none", "file"],
                    help="Bismillah: auto | separate (oldida alohida) | merged "
                         "(1-oyat ichida) | none | file (SSS000.mp3 sifatida saqlash)")
    ap.add_argument("--pad", type=float, default=0.25, help="Kesim atrofidagi jimlik (s, default 0.25)")
    ap.add_argument("--min-sil", type=float, default=0.30, help="Eng qisqa jimlik (s, default 0.30)")
    ap.add_argument("--thresh", type=float, default=None, help="Jimlik chegarasi dB (default: avtomatik)")
    ap.add_argument("--bitrate", default="128k", help="Chiqish MP3 bitreyti (default 128k)")
    ap.add_argument("--plan-only", action="store_true",
                    help="Faqat tahlil + tekshirish sahifasi (MP3 kesmaydi)")
    args = ap.parse_args(argv)

    print(f"ffmpeg: {splitter.FFMPEG}")

    # Qayta kesish rejimi
    if args.from_cuts:
        if not args.audio:
            ap.error("--from-cuts uchun asl audio fayl ham kerak (audio argumenti)")
        do_from_cuts(args.audio, args.from_cuts, args)
        return 0

    # Ommaviy (batch) rejim
    if args.batch:
        files = []
        for fn in sorted(os.listdir(args.batch)):
            if fn.lower().endswith((".mp3", ".m4a", ".wav", ".ogg", ".opus", ".flac")):
                s = parse_surah_from_name(fn)
                if s:
                    files.append((s, os.path.join(args.batch, fn)))
                else:
                    print(f"  ! {fn}: sura raqami topilmadi, o'tkazib yuborildi")
        if not files:
            print("Papkada mos audio fayl yo'q.")
            return 1
        print(f"\n{len(files)} sura topildi. Ishlov berilmoqda...\n")
        plans = []
        for s, path in sorted(files):
            try:
                plans.append(do_one(path, s, args))
            except Exception as e:
                print(f"  ! {splitter.pad3(s)}: XATO — {e}")
        # Ishonch bo'yicha xulosa
        low = [p for p in plans if p["confidence"] < 75]
        print(f"\n— Jami {len(plans)} sura. Tekshirish tavsiya etiladi: {len(low)} ta.")
        if low:
            rd = os.path.join(args.out, args.reciter, "_review")
            print(f"  Tekshirish sahifalari: {rd}/SSS.review.html")
            for p in sorted(low, key=lambda x: x["confidence"]):
                print(f"    · {splitter.pad3(p['surah'])} {p['name']} — {p['confidence']:.0f}%")
        return 0

    # Bitta sura rejimi
    if not args.audio:
        ap.error("audio fayl kiriting (yoki --batch / --from-cuts ishlating)")
    surah = args.surah or parse_surah_from_name(args.audio)
    if not surah:
        ap.error("sura raqamini aniqlab bo'lmadi — --surah N bilan ko'rsating")
    print()
    do_one(args.audio, surah, args)
    rd = os.path.join(args.out, args.reciter, "_review")
    print(f"\nTekshirish: {os.path.join(rd, splitter.pad3(surah) + '.review.html')}")
    print("  (brauzerda oching, sura MP3'ini tanlang, har oyatni tinglab tekshiring)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
