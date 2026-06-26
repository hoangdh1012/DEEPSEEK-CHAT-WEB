# Color & Typography Skill for DeepSeek

Khi chọn màu sắc và font chữ cho web app, tuân thủ các quy tắc sau:

## Màu Sắc (Color System)

### Semantic Color Tokens (QUAN TRỌNG)
```css
/* Định nghĩa token, KHÔNG dùng raw hex trong component */
--color-primary: #8b5cf6;      /* Màu chính */
--color-primary-hover: #7c3aed; /* Hover state */
--color-secondary: #06b6d4;    /* Màu phụ */
--color-accent: #ffb800;       /* Màu nhấn */
--color-success: #22c55e;      /* Thành công */
--color-danger: #ef4444;       /* Lỗi / Nguy hiểm */
--color-warning: #f59e0b;      /* Cảnh báo */
--color-surface: #1a1930;      /* Nền panel/card */
--color-bg: #0f0e17;          /* Nền trang */
--color-text-primary: #e2e8f0; /* Text chính */
--color-text-secondary: #94a3b8; /* Text phụ */
--color-text-muted: #64748b;   /* Text mờ */
```

### Dark Mode Guidelines
- Dark mode KHÔNG phải là "đảo ngược màu"
- Dùng desaturated/lighter tonal variants
- Nền tối: `#0f0e17` đến `#1a1930`
- Text trên nền tối: `#e2e8f0` (trắng ngà)
- Text phụ trên nền tối: `#94a3b8` (xám nhạt)
- Test contrast RIÊNG cho dark mode

### Contrast (CRITICAL)
- Text nhỏ (< 18px): TỐI THIỂU 4.5:1
- Text lớn (≥ 18px BOLD hoặc ≥ 24px): TỐI THIỂU 3:1
- UI components (border, icon): TỐI THIỂU 3:1
- Màu error/success text PHẢI đạt 4.5:1

### Màu Không Được Dùng Một Mình
- Error state: màu đỏ + icon ⚠️ + text message
- Success state: màu xanh + icon ✅ + text message
- Link: underline + màu khác text thường (không chỉ màu xanh)
- KHÔNG: "Click nút màu đỏ để xóa" — phải có text "Xóa"

## Typography

### Font Scale
```
12px — Caption, label nhỏ
14px — Body text (mobile), label
16px — Body text (desktop), TỐI THIỂU cho mobile
18px — Subheading
24px — Heading 3
32px — Heading 2
48px+ — Heading 1
```

### Font Stack (Web Safe)
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 
             'Segoe UI', Roboto, sans-serif;
```

### Line Height
- Body text: 1.5 – 1.75
- Heading: 1.2 – 1.4
- Code/Monospace: 1.5

### Line Length
- Mobile: 35-60 ký tự mỗi dòng
- Desktop: 60-75 ký tự mỗi dòng
- Dùng `max-width: 65ch` cho văn bản dài

### Weight Hierarchy
- **Bold (700)** — Heading, label quan trọng
- **Semi-bold (600)** — Subheading, button text
- **Medium (500)** — Label, caption
- **Regular (400)** — Body text
- **Light (300)** — Text phụ, chú thích

### Spacing & Typography
- Margin-bottom paragraph: 1em – 1.5em
- Letter-spacing heading: -0.02em (h1), -0.01em (h2)
- Letter-spacing body: 0 (default)
- Tabular numbers cho data table: `font-variant-numeric: tabular-nums`

### Anti-Patterns (TRÁNH)
- ❌ Body text < 12px
- ❌ Gray text on gray background
- ❌ ALL CAPS cho body text dài
- ❌ Justify text trên web (khoảng cách từ không đều)
- ❌ Quá nhiều font khác nhau (tối đa 2)
- ❌ Dùng emoji thay cho icon
