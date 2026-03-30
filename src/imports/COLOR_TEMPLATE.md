# Color Template — Smart Hospital Executive Dashboard
## RSUD Dr. H. Abdul Moeloek

> **File referensi:** `src/app/components/colors.ts` · `src/styles/theme.css` · `src/styles/fonts.css`
> **Font utama:** Plus Jakarta Sans (300, 400, 500, 600, 700, 800)

---

## 1. Brand Colors — Identitas Visual Utama

| Token | Hex | Nama | Penggunaan |
|---|---|---|---|
| `C.brand` | `#013E37` | Deep Forest Teal | Sidebar bg, header gradient, border-left aksen |
| `C.brandMid` | `#025C52` | Medium Teal | Hover state, tab aktif, gradient end |
| `C.brandLight` | `#038E7D` | Bright Teal | Chart line, icon aksen, ring/focus |
| `C.brandXLight` | `#5BB5AB` | Pale Teal | Switch bg, subtle accent, separator |
| `C.lemon` | `#FFEFB2` | Creamy Lemon | Sidebar active pill, heading text on dark |
| `C.lemonDark` | `#F5D800` | Golden Lemon | Teks lemon bold on dark bg |
| `C.lemonMid` | `#FFE066` | Medium Lemon | Lemon medium — badge, aksen interaktif |
| `C.lemonSoft` | `#FFF9DC` | Pale Lemon | Hover tint di atas bg terang |

```
Primer:  ████ #013E37  Deep Forest Teal
Aksen:   ████ #FFEFB2  Creamy Lemon
```

---

## 2. Layout & Surface Colors

| Token | Hex | Penggunaan |
|---|---|---|
| `C.bg` | `#EEF7F5` | Background halaman utama |
| `C.card` | `#FFFFFF` | Background card / panel |
| `C.cardHover` | `#F5FBFA` | Hover state pada card |
| `C.sidebar` | `#013E37` | Background sidebar navigasi |

---

## 3. Border Colors

| Token | Hex | Penggunaan |
|---|---|---|
| `C.border` | `#C3DDD9` | Border card, divider umum |
| `C.borderLight` | `#DFF0EC` | Border lebih tipis, separator ringan |

---

## 4. Semantic Status Colors

| Token | Hex | Nama | Digunakan untuk |
|---|---|---|---|
| `C.success` | `#16A34A` | Emerald Green | KPI tercapai, indikator baik, badge hijau |
| `C.warning` | `#D97706` | Amber | KPI mendekati batas, risiko sedang |
| `C.danger` | `#DC2626` | Red | KPI di bawah target, status bahaya |
| `C.primary` | `#E8F5F2` | Light Teal Surface | Surface bg panel, secondary container |
| `C.secondary` | `#025C52` | Interactive Teal | Link, tab aktif, tombol sekunder |
| `C.accent` | `#038E7D` | Accent Teal | Icon, chart line, ring |

### Aturan penggunaan status

```
Tercapai / On Target   → C.success  #16A34A  ██████
Mendekati Batas        → C.warning  #D97706  ██████
Di Bawah Target        → C.danger   #DC2626  ██████
```

---

## 5. Text Colors

| Token | Hex | Penggunaan |
|---|---|---|
| `C.text` | `#012D29` | Body text, label utama, value KPI |
| `C.textMuted` | `#4D8078` | Label sekunder, satuan, keterangan |
| `C.white` | `#FFFFFF` | Teks di atas background gelap |

---

## 6. Sidebar-Specific Tokens

> Digunakan **hanya** di `Layout.tsx`

| Token | Nilai | Keterangan |
|---|---|---|
| `C.sidebarText` | `#FFFFFF` | Teks item menu biasa |
| `C.sidebarTextMuted` | `rgba(255,255,255,0.55)` | Label seksi / sub-label |
| `C.sidebarActiveText` | `#013E37` | Teks menu aktif (di atas lemon pill) |
| `C.sidebarActiveBg` | `#FFEFB2` | Background lemon pill menu aktif |
| `C.sidebarHoverBg` | `rgba(255,239,178,0.10)` | Hover state menu |
| `C.sidebarBorder` | `rgba(255,239,178,0.15)` | Divider dalam sidebar |
| `C.sidebarSectionLabel` | `rgba(255,239,178,0.45)` | Label seksi (DASHBOARD, KPI DIREKSI…) |

---

## 7. Chart Helper Colors

| Token | Hex | Penggunaan |
|---|---|---|
| `C.chartGrid` | `#C3DDD9` | Grid line pada semua SVG chart |
| `C.chartTooltipBg` | `#012D29` | Background tooltip interaktif chart |

---

## 8. Multi-Series Chart Palette — `CHART_COLORS[]`

Digunakan untuk chart dengan banyak seri. Urutan index dipertahankan konsisten.

| Index | Hex | Nama | Contoh penggunaan |
|---|---|---|---|
| `[0]` | `#038E7D` | Bright Teal | Seri utama / primary line |
| `[1]` | `#FFBE00` | Golden Lemon | Seri kedua / area fill |
| `[2]` | `#E87040` | Warm Coral | Seri ketiga / bar aksen |
| `[3]` | `#0891B2` | Sky Blue | Seri keempat |
| `[4]` | `#6C63FF` | Violet | Seri kelima |
| `[5]` | `#FF6B6B` | Soft Red | Seri keenam |
| `[6]` | `#4ECDC4` | Aqua | Seri ketujuh |
| `[7]` | `#16A34A` | Emerald | Seri kedelapan |

---

## 9. Page Accent Colors — per Halaman / Tab

Setiap halaman utama memiliki warna aksen tersendiri yang diterapkan ke:
header border-left, icon container, badge, progress bar, dan chart dominant color.

| Halaman / Tab | Aksen Utama | Hex | Light Bg | Light Border |
|---|---|---|---|---|
| Executive Command Center | Teal (brand) | `#013E37` | `#E0F7F4` | `#5BB5AB` |
| Bidang Keperawatan | Brand Teal | `#038E7D` | `#E0F7F4` | `#5BB5AB` |
| Bidang Pelayanan Medik | Deep Violet | `#7C3AED` | `#F5F3FF` | `#C4B5FD` |
| Bidang Penunjang Medik | Amber | `#D97706` | `#FFFBEB` | `#FCD34D` |
| Keuangan & Anggaran | Sky Blue | `#0891B2` | `#EFF6FF` | `#93C5FD` |
| SDM & Kepegawaian | Emerald | `#16A34A` | `#F0FDF4` | `#86EFAC` |
| Sarana & Prasarana | Coral | `#E87040` | `#FFF7F0` | `#FDBA74` |
| IGD / Emergency | Red | `#DC2626` | `#FFF1F2` | `#FCA5A5` |

---

## 10. Insight / Alert Box Colors

Digunakan pada kotak insight di bawah section KPI dan chart.

| Tipe | Background | Border | Ikon | Digunakan saat |
|---|---|---|---|---|
| `success` | `#F0FDF4` | `#86EFAC` | ✅ | Semua KPI tercapai atau melampaui target |
| `warning` | `#FFFBEB` | `#FCD34D` | ⚠️ | Ada KPI mendekati batas atau sedikit melebihi |
| `danger` | `#FFF1F2` | `#FCA5A5` | 🚨 | KPI signifikan di bawah target |
| `info` | `#EFF6FF` | `#93C5FD` | 📈 | Informasi volume / kontekstual |

---

## 11. BSC Perspective Colors

Empat perspektif BSC menggunakan warna berbeda agar mudah dibedakan secara visual.

| Perspektif | Warna | Hex |
|---|---|---|
| Keuangan & Pendapatan | Amber | `#D97706` |
| Pelanggan / Pasien | Sky Blue | `#0891B2` |
| Proses Bisnis Internal | Bright Teal / Green | `#16A34A` |
| Pembelajaran & Pertumbuhan | Violet | `#7C3AED` |

---

## 12. CSS Custom Properties — `theme.css`

Seluruh token di bawah tersedia sebagai CSS variable global (`var(--nama)`).

```css
/* Brand */
--primary:            #013E37;   /* Deep Forest Teal */
--primary-foreground: #FFEFB2;   /* Creamy Lemon */
--secondary:          #025C52;   /* Medium Teal */
--accent:             #FFEFB2;   /* Creamy Lemon */
--accent-foreground:  #013E37;

/* Layout */
--background:         #EEF7F5;
--foreground:         #012D29;
--card:               #ffffff;
--card-foreground:    #012D29;
--muted:              #DFF0EC;
--muted-foreground:   #4D8078;
--border:             #C3DDD9;

/* Status */
--destructive:        #d4183d;
--ring:               #038E7D;

/* Chart */
--chart-1:            #038E7D;   /* Bright Teal */
--chart-2:            #FFBE00;   /* Golden Lemon */
--chart-3:            #E87040;   /* Warm Coral */
--chart-4:            #0891B2;   /* Sky Blue */
--chart-5:            #16A34A;   /* Emerald */

/* Sidebar */
--sidebar:                    #013E37;
--sidebar-foreground:         #FFEFB2;
--sidebar-primary:            #FFEFB2;
--sidebar-primary-foreground: #013E37;
--sidebar-accent:             rgba(255,239,178,0.12);
--sidebar-border:             rgba(255,239,178,0.15);

/* Radius */
--radius: 0.625rem;   /* 10px — default border-radius */
```

---

## 13. Typography

```
Font Family:  Plus Jakarta Sans (utama)
              Inter (fallback)
              Roboto Mono (monospace / angka KPI)

Weights:      300 · 400 · 500 · 600 · 700 · 800

Import:       Google Fonts — fonts.css
```

### Skala font yang umum digunakan

| Konteks | Font Size | Weight | Color |
|---|---|---|---|
| Nilai KPI besar | 24–28px | 800 | Warna aksen halaman |
| Judul card / section | 13px | 700 | `C.text` `#012D29` |
| Label KPI | 11px | 600 | `C.textMuted` `#4D8078` |
| Satuan / unit | 12px | 400 | `C.textMuted` |
| Tooltip chart | 11px | 400 | `#E2E8F0` (on dark) |
| Insight box | 11px | 400 | `C.text` |
| Badge / pill | 10–12px | 700 | Warna aksen |

---

## 14. Border Radius

| Konteks | Radius |
|---|---|
| Card utama | `14–16px` |
| Card inner / metric | `12px` |
| Badge / pill | `20px` |
| Button | `8–10px` |
| Insight box | `6–8px` |
| Progress bar | `4px` |
| Icon container | `7–10px` |

---

## 15. Aturan Universal (Wajib Dipatuhi)

```
1. Fragment  → Gunakan flatMap() atau array biasa. React.Fragment
               hanya boleh menerima prop 'key' dan 'children'.

2. Chart     → Semua chart menggunakan komponen SVG murni dari
               CustomCharts.tsx. DILARANG memakai <Legend> bawaan
               Recharts. Ganti dengan MiniLegend kustom atau baris
               div inline di bawah chart.

3. Animation → isAnimationActive={false} wajib untuk semua chart
               multi-seri Recharts.

4. CSS       → Dilarang mencampur shorthand dengan non-shorthand
               (misalnya: jangan pakai 'border' dan 'borderColor'
               secara bersamaan).

5. Keys      → Setiap elemen dalam .map() wajib memiliki prop
               'key' yang unik dan eksplisit.

6. Warna     → Selalu gunakan token dari colors.ts (C.*) atau
               konstanta lokal per halaman. Jangan hardcode hex
               sembarangan di luar file colors.ts.
```

---

## 16. Referensi File

| File | Isi |
|---|---|
| `src/app/components/colors.ts` | Token warna utama — `C.*` dan `CHART_COLORS[]` |
| `src/styles/theme.css` | CSS custom properties, Tailwind base layer |
| `src/styles/fonts.css` | Import Google Fonts |
| `src/app/components/CustomCharts.tsx` | Semua komponen SVG chart |
| `src/app/components/BSCOKRPanel.tsx` | Panel BSC & OKR universal |
| `src/app/data/bscOkrData.ts` | Data terpusat BSC & OKR semua halaman |
| `src/app/components/Layout.tsx` | Sidebar, navigasi, header utama |

---

*Dokumen ini dihasilkan untuk proyek Smart Hospital Executive Dashboard — RSUD Dr. H. Abdul Moeloek. Versi warna mengacu pada state aktual `colors.ts` per 18 Maret 2026.*
