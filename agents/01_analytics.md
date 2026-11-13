# Agent 01 — Analytics Agent

> Gunakan skill `anthropic-skills:built-in-browser` atau `anthropic-skills:chrome-browser`
> untuk menjalankan agent ini.

---

## Tugasmu

Buka TikTok Studio, login ke akun @valsyz7, baca data analytics 7 hari terakhir,
dan simpan hasilnya ke `analytics/analytics_YYYYMMDD.json`.

## Langkah-langkah

### 1. Buka TikTok Studio
- URL: https://www.tiktok.com/creator-center/analytics
- Atau: https://studio.tiktok.com
- Login jika belum: gunakan akun @valsyz7

### 2. Data yang harus dikumpulkan

**Tab Overview (7 hari terakhir):**
- Total views
- Profile views
- Followers gained/lost
- Likes
- Comments
- Shares

**Tab Content (video per video, 5 video terbaru):**
Per video catat:
- Judul/caption (200 char pertama)
- Views
- Likes
- Comments
- Shares
- Watch time average (%)
- Traffic source breakdown (FYP %, profile %, dll)
- Publish date & time

**Tab Followers:**
- Follower count total
- Top follower activity hours (jam berapa paling aktif)
- Gender breakdown jika tersedia

**Tab LIVE (skip jika tidak ada)**

### 3. Format output JSON

Simpan ke `analytics/analytics_YYYYMMDD.json`:

```json
{
  "date_collected": "2026-11-13",
  "period": "last_7_days",
  "overview": {
    "total_views": 0,
    "profile_views": 0,
    "followers_total": 0,
    "followers_gained": 0,
    "likes": 0,
    "comments": 0,
    "shares": 0
  },
  "top_videos": [
    {
      "rank": 1,
      "caption": "...",
      "views": 0,
      "likes": 0,
      "comments": 0,
      "shares": 0,
      "watch_time_pct": 0,
      "traffic_fyp_pct": 0,
      "publish_datetime": "2026-11-XX HH:MM"
    }
  ],
  "audience": {
    "peak_hours": ["19:00", "20:00", "21:00"],
    "gender_male_pct": 0,
    "gender_female_pct": 0
  },
  "insights": {
    "best_performing_type": "...",
    "avg_views_this_week": 0,
    "trend": "up|down|stable"
  }
}
```

### 4. Analisis tambahan

Setelah data terkumpul, tambahkan field `insights`:
- Konten type apa yang performa paling tinggi minggu ini?
- Jam posting mana yang paling efektif?
- Topic/niche apa yang paling resonan?

### 5. Update CLAUDE.md jika ada insight baru

Jika ada pattern baru yang signifikan, update bagian `top_performing_content`
di `CLAUDE.md` dengan data terbaru.

## Catatan

- Jika login TikTok Studio gagal, catat error dan lanjutkan dengan data analytics yang ada di folder `analytics/`
- Screenshot error jika ada untuk debugging
- Jangan simpan password ke file apapun
