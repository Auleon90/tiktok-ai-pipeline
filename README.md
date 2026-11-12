# TikTok AI Pipeline

Sistem AI Tim Agency TikTok — berjalan 100% otomatis di cloud.

## Stack
- Claude Pro $20/bln — orkestrasi semua agent
- Buffer MCP $5/bln — auto-schedule & post TikTok
- Cartesia TTS $5/bln — voice over Bahasa Indonesia
- Remotion — render motion graphic .mp4
- TikTok Studio — analytics (review manual tiap Minggu)

**Total: $30/bln**

## Struktur
```
config/
  schedule_config.json    ← jam posting optimal (update tiap Minggu)
analytics/
  analytics_YYYY-MM-DD.json  ← data TikTok Studio mingguan
logs/
  pipeline_log_YYYY-MM-DD.json  ← log pipeline harian
CLAUDE.md                 ← konteks akun (niche, voice, style)
```

## Jadwal Otomatis
- **04:00 WIB setiap hari** — Pipeline harian (8 step, 3 video)
- **09:07 WIB setiap Minggu** — Pengingat review TikTok Studio
