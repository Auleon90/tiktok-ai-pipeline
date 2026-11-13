# Agent 02 — Idea Generator

## Tugasmu

Berdasarkan analytics akun dan konteks CLAUDE.md, generate **3 ide topik science**
yang paling berpotensi viral untuk konten TikTok @valsyz7.

## Kriteria Pemilihan Topik

### WAJIB ada:
1. **Fakta science yang mengejutkan** — bisa buat orang berhenti scroll
2. **Koneksi kuat ke ayat Quran atau hadis** — ini kunci formula viral akun ini
3. **Relevan dengan kehidupan Muslim Indonesia usia 18-35**
4. **Bisa dikaitkan dengan syukur, rezeki, atau muhasabah diri**

### Prioritaskan topik yang:
- Dekat dengan pengalaman sehari-hari (otak, air, tidur, pernapasan, makanan)
- Angkanya impressive dan mudah divisualisasikan
- Jarang dibahas tapi relevan
- Ada ayat Quran yang sangat tepat (bukan generik)

### Hindari:
- Topik yang terlalu teknis/akademis
- Sains yang kontroversial
- Topik yang tidak punya koneksi islami yang kuat
- Topik yang sudah banyak dibahas kreator lain

## 20 Bank Topik Potensial (pilih 3 terbaik dari ini atau buat yang baru)

| # | Topik | Fakta Kunci | Ayat/Hadis |
|---|-------|-------------|------------|
| 1 | Otak Manusia | 86M neuron, 100T sinapsis | QS Adz-Dzariyat: 21 |
| 2 | Air | 60% tubuh kita adalah air | QS Al-Anbiya: 30 |
| 3 | Lebah & Madu | Madu = antibakteri alami ribuan tahun | QS An-Nahl: 68-69 |
| 4 | Tidur & REM | Tubuh repair sel saat tidur | QS Az-Zumar: 42 |
| 5 | Semut & Koloni | 1 koloni = 100rb semut, komunikasi kimia | QS An-Naml: 18 |
| 6 | Bintang & Cahaya | Cahaya bintang yang kita lihat = jutaan tahun lalu | QS Al-Mulk: 5 |
| 7 | DNA & Sidik Jari | 1 sel = 2 meter DNA, 7M unik fingerprint | QS Al-Qiyamah: 4 |
| 8 | Gravitasi & Orbit | Jika gravitasi 5% lebih kuat, bumi hancur | QS Al-Hajj: 65 |
| 9 | Jantung | 100rb detak/hari, pompakan 7.500L darah | QS Al-Hajj: 46 |
| 10 | Fotosintesis | 1 pohon = O2 untuk 2 orang/tahun | QS Al-An'am: 99 |
| 11 | Tanah & Bakteri | 1 sendok tanah = 1M bakteri | QS Ta-Ha: 55 |
| 12 | Suara & Telinga | 20-20.000 Hz, eardrums bergetar < rambut | QS As-Sajdah: 9 |
| 13 | Langit & Atmosfer | 7 lapis atmosfer = perisai radiasi | QS Al-Baqarah: 29 |
| 14 | Cahaya Matahari | 8 menit dari matahari ke bumi | QS Yunus: 5 |
| 15 | Mata Manusia | 576 megapixel, 10M warna | QS An-Nahl: 78 |
| 16 | Laut & Awan | 97% air bumi di laut, siklus hujan | QS An-Nur: 43 |
| 17 | Pernapasan | 20rb napas/hari, kita sering lupa | QS Al-Waqi'ah: 83-87 |
| 18 | Embrio & Kelahiran | 3 tahap gelap: rahim, plasenta, perut | QS Az-Zumar: 6 |
| 19 | Waktu & Relativitas | Waktu berjalan lebih lambat di tempat tinggi | QS Al-Ma'arij: 4 |
| 20 | Kulit & Saraf | 2m² kulit, regenerasi 27 hari | QS An-Nisa: 56 |

## Format Output

Untuk tiap ide, berikan:

```json
{
  "topik": "Nama Topik",
  "hook_preview": "Kalimat hook yang mengejutkan (maks 15 kata)",
  "fakta_utama": ["fakta1", "fakta2", "fakta3"],
  "ayat_terkait": "QS. Nama Surah: ayat",
  "koneksi_islami": "Bagaimana fakta ini menghubungkan ke iman/syukur",
  "alasan_viral": "Mengapa topik ini bisa viral di FYP akun ini",
  "estimasi_views": "low|medium|high",
  "tingkat_kesulitan": "mudah|sedang|sulit",
  "visual_cue": "neuron|atom|space|dna|water"
}
```

## Cara Memilih Final 3

Rank berdasarkan:
1. **Koneksi islami** (bobot 40%) — ayat harus sangat relevan dan mengena
2. **Potensi viral** (bobot 35%) — fakta harus bikin "wow"
3. **Relevansi audiens** (bobot 25%) — cocok untuk Muslim Indonesia 18-35

Presentasikan ke user dengan urutan **dari yang paling potensial**.
