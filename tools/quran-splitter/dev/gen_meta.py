#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
gen_meta.py — Tanzil Uthmoniy matnidan (quran-uthmani.xml) splitter uchun
oflayn metama'lumot yaratadi:
  data/ayah_meta.json  — har oyat uchun [mora, letters, text]
  data/surah_meta.json — 114 sura: nomi, oyat soni, bismillah qoidasi

"mora" — tilovat davomiyligining taxminiy o'lchovi (harakat/madd hisobi).
Bu matn uzunligiga qaraganda tilovat vaqtini yaxshiroq baholaydi va
kesish chegaralarini oyat matniga moslashda "prior" sifatida ishlatiladi.

Ishga tushirish:  python3 dev/gen_meta.py
Manba: Tanzil.net Uthmani (CC BY 3.0). http://tanzil.net
"""
import json, os, xml.etree.ElementTree as ET

HERE = os.path.dirname(os.path.abspath(__file__))
XML = os.path.join(HERE, "quran-uthmani.xml")
OUT = os.path.abspath(os.path.join(HERE, "..", "data"))

# ——— Belgilar (Uthmoniy diakritika) ———
SHORT = {0x064E, 0x0650, 0x064F}                 # fatha, kasra, damma
TANWIN = {0x064B, 0x064C, 0x064D}                # tanvin (2 mora: unli + nun)
MADD_LETTERS = {0x0627, 0x0648, 0x064A, 0x0649}  # alif, waw, ya, alif maqsura
SHADDA, SUKUN, DAGGER_ALIF, MADDA, WASLA = 0x0651, 0x0652, 0x0670, 0x0653, 0x0671


def mora(text):
    """Tilovat davomiyligining taxminiy o'lchovi (harakat asosida)."""
    m = 0.0
    prev = None
    for ch in text:
        cp = ord(ch)
        if ch == " ":
            continue
        if cp in SHORT:
            m += 1
        elif cp in TANWIN:
            m += 2
        elif cp == SHADDA:
            m += 1
        elif cp == DAGGER_ALIF:
            m += 2            # cho'ziq "aa"
        elif cp == MADDA:
            m += 3            # madd belgisi
        elif cp == SUKUN:
            m += 0
        elif cp == WASLA:
            m += 0            # vasl alifi — tushib qoladi
        elif cp in MADD_LETTERS:
            m += 2 if prev in SHORT else 1   # cho'ziqlik yoki undosh
        elif 0x0620 <= cp <= 0x06FF:
            m += 1            # boshqa undoshlar
        prev = cp
    return round(m, 1)


def letters(text):
    return sum(1 for c in text if c != " ")


# ——— Sura nomlari (transliteratsiya) ———
NAMES = [
    "Al-Fatiha", "Al-Baqara", "Ali Imron", "An-Niso", "Al-Moida", "Al-An'om",
    "Al-A'rof", "Al-Anfol", "At-Tavba", "Yunus", "Hud", "Yusuf", "Ar-Ra'd",
    "Ibrohim", "Al-Hijr", "An-Nahl", "Al-Isro", "Al-Kahf", "Maryam", "Toha",
    "Al-Anbiyo", "Al-Hajj", "Al-Mu'minun", "An-Nur", "Al-Furqon", "Ash-Shuaro",
    "An-Naml", "Al-Qasas", "Al-Ankabut", "Ar-Rum", "Luqmon", "As-Sajda",
    "Al-Ahzob", "Saba", "Fotir", "Yosin", "As-Soffot", "Sod", "Az-Zumar",
    "G'ofir", "Fussilat", "Ash-Shuro", "Az-Zuxruf", "Ad-Duxon", "Al-Josiya",
    "Al-Ahqof", "Muhammad", "Al-Fath", "Al-Hujurot", "Qof", "Az-Zoriyot",
    "At-Tur", "An-Najm", "Al-Qamar", "Ar-Rahmon", "Al-Voqia", "Al-Hadid",
    "Al-Mujodala", "Al-Hashr", "Al-Mumtahana", "As-Saff", "Al-Jumua",
    "Al-Munofiqun", "At-Tag'obun", "At-Taloq", "At-Tahrim", "Al-Mulk",
    "Al-Qalam", "Al-Haqqa", "Al-Maorij", "Nuh", "Al-Jinn", "Al-Muzzammil",
    "Al-Muddassir", "Al-Qiyoma", "Al-Inson", "Al-Mursalot", "An-Nabaa",
    "An-Noziot", "Abasa", "At-Takvir", "Al-Infitor", "Al-Mutaffifin",
    "Al-Inshiqoq", "Al-Buruj", "At-Toriq", "Al-A'lo", "Al-G'oshiya",
    "Al-Fajr", "Al-Balad", "Ash-Shams", "Al-Layl", "Az-Zuho", "Ash-Sharh",
    "At-Tin", "Al-Alaq", "Al-Qadr", "Al-Bayyina", "Az-Zalzala", "Al-Odiyot",
    "Al-Qoria", "At-Takosur", "Al-Asr", "Al-Humaza", "Al-Fil", "Quraysh",
    "Al-Moun", "Al-Kavsar", "Al-Kofirun", "An-Nasr", "Al-Masad", "Al-Ixlos",
    "Al-Falaq", "An-Nos",
]


def bismillah_rule(surah):
    """'counted' — bismillah 1-oyat (Fotiha); 'none' — bismillahsiz (Tavba);
       'separate' — bismillah oyatlardan oldin alohida o'qiladi (qolganlari)."""
    if surah == 1:
        return "counted"
    if surah == 9:
        return "none"
    return "separate"


def main():
    root = ET.parse(XML).getroot()
    ayah_meta = {}
    surah_meta = {}
    total = 0
    for s in root.findall("sura"):
        n = int(s.get("index"))
        ayas = s.findall("aya")
        rows = []
        for a in ayas:
            t = a.get("text")
            rows.append([mora(t), letters(t), t])
        ayah_meta[str(n)] = rows
        surah_meta[str(n)] = {
            "name": NAMES[n - 1],
            "ayahs": len(ayas),
            "bismillah": bismillah_rule(n),
        }
        total += len(ayas)

    os.makedirs(OUT, exist_ok=True)
    with open(os.path.join(OUT, "ayah_meta.json"), "w", encoding="utf-8") as f:
        json.dump(ayah_meta, f, ensure_ascii=False, separators=(",", ":"))
    with open(os.path.join(OUT, "surah_meta.json"), "w", encoding="utf-8") as f:
        json.dump(surah_meta, f, ensure_ascii=False, separators=(",", ":"))

    assert total == 6236, f"Jami oyat {total} != 6236"
    assert len(NAMES) == 114
    print(f"OK: {len(surah_meta)} sura, {total} oyat")
    print("ayah_meta.json:", os.path.getsize(os.path.join(OUT, "ayah_meta.json")), "bayt")


if __name__ == "__main__":
    main()
