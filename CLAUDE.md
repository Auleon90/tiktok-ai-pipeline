# TikTok Account Context
# Digunakan oleh semua agent di pipeline — jaga tetap < 500 token

username: valsyz7
bio: "Akun iseng di waktu luang, kumpulan inspirasi sebagai pengingat diri sendiri"
followers: 1K | likes_total: 4.2K | total_posts: 98

niche: motivasi-hidup, renungan-islami, pengembangan-diri
sub_niche: syukur, self-reminder, kata-kata bijak, kisah islami, filosofi hewan (singa)
language: Bahasa Indonesia
target_audience: usia 18-35, Muslim Indonesia, sedang berjuang/berkembang, suka konten renungan & inspirasi
brand_voice: inspiratif, hangat, lugas — seperti teman yang menasehati dengan tulus
tone: positif, mendorong, kadang filosofis, bernuansa islami — hindari menggurui atau terlalu formal

visual_style: motion graphic teks animasi, latar gelap/sinematik, font bold besar
video_format: 1080x1920 vertikal, durasi 30-60 detik, narasi voice over + teks on screen
voice_gender: male
voice_language: id (Bahasa Indonesia)
voice_tone: dalam, tenang, berwibawa

top_hashtags: #MotivasiHidup #Bersyukur #RenunganHidup #PengingatDiri #NasihatIslami #SelfReminder #KataKataBijak #MuhasabahDiri #FYP #RenunganIslami

top_performing_content:
  - renungan syukur + ayat Quran + hook bersyukur = VIRAL 32K views, 744 likes, 13 komentar ← POLA TERBAIK
  - konten rezeki + hikmah islami (6.7K views) = pola kedua terkuat
  - ayat islami + cobaan/ujian (3.5K views)
  - filosofi singa/mindset (3.8K views)
  - kisah Rasulullah/sahabat + pesan akhlak (926 views)
  - narasi perjuangan & jangan menyerah (345 views)

viral_formula: hook emosional (nikmat yang sering dilupakan) → kutipan/ayat Quran → narasi personal → CTA pertanyaan reflektif
traffic_source: 98.7% For You Page — sangat bergantung algoritma FYP
search_queries_trending: "jangan kasi takut ini mental baja", "inspirasi solusi quran", "singa sama serigala lebih kuat mana"

content_formula:
  - Hook kuat di 3 detik: pertanyaan atau statement mengejutkan tentang nikmat/hidup
  - Konten utama 30-55 detik: 1 pesan utama, bisa pakai ayat Quran atau kisah islami
  - CTA di akhir: pertanyaan reflektif untuk komentar (contoh: "Sudahkah kita bersyukur hari ini?")
  - Konten islami-ringan (bukan dakwah berat) performa lebih tinggi dari konten motivasi umum

content_pillars:
  1. Renungan Syukur + Ayat Quran (TERKUAT — lihat video 32K)
  2. Konten Rezeki/Memantaskan Diri (islami)
  3. Filosofi Hewan/Mindset (singa, serigala)
  4. Self-Reminder Kehidupan
  5. Kisah Islami (Nabi, Sahabat) — potensi tinggi belum dimaksimalkan

avoid:
  - konten motivasi generik tanpa nuansa islami (performa rendah)
  - konten negatif atau menghakimi
  - video lebih dari 60 detik (completion rate turun)
  - terlalu banyak hashtag tidak relevan

account_status: akun berkembang organik, 1K followers, fokus FYP
posting_schedule: 3x/hari — slot A (pagi), slot B (sore), slot C (malam)
data_updated: 2026-11-12

scheduled_task:
  name: "Daily TikTok Content Pipeline"
  trigger_id: trig_01JnGRGr7c1NZ5LYr2QHeJY9
  jadwal: "04:00 WIB setiap hari (CRON_TZ=Asia/Jakarta 0 4 * * *)"
  status_terakhir: disabled — mode manual test (per 2026-11-13)
  github_repo: https://github.com/Auleon90/tiktok-ai-pipeline
  perintah_cepat:
    aktifkan: update_trigger trig_01JnGRGr7c1NZ5LYr2QHeJY9 enabled=true
    matikan:  update_trigger trig_01JnGRGr7c1NZ5LYr2QHeJY9 enabled=false
    fire_manual: fire_trigger trig_01JnGRGr7c1NZ5LYr2QHeJY9
