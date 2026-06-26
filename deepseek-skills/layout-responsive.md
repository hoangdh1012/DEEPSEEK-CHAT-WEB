# Layout & Responsive Skill for DeepSeek

Khi thiết kế layout và responsive cho web app, tuân thủ các quy tắc sau:

## Viewport Meta (REQUIRED)
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```
- KHÔNG BAO GIỜ disable zoom (`user-scalable=no`)
- KHÔNG dùng `maximum-scale=1.0`

## Mobile First (CRITICAL)
- CSS mặc định cho MOBILE (< 768px)
- Dùng `min-width` media queries để thêm style cho màn hình lớn hơn
- Test trên độ rộng 375px (iPhone) và 414px (Android)

## Breakpoints Hệ Thống
```css
/* Mobile (default) */
/* Tablet */
@media (min-width: 768px) { ... }
/* Desktop */
@media (min-width: 1024px) { ... }
/* Wide */
@media (min-width: 1440px) { ... }
```

## Font Size trên Mobile (CRITICAL)
- Body text TỐI THIỂU 16px trên mobile
- Nếu < 16px, iOS sẽ auto-zoom khi focus input
- Input text có thể 14px nếu có `font-size: 16px` trên input container

## Horizontal Scroll (CRITICAL)
- KHÔNG CÓ horizontal scroll trên mobile
- Mọi content phải fit trong viewport width
- Kiểm tra: `overflow-x: hidden` trên body (chỉ debug)
- Nguyên nhân thường gặp: padding/margin cộng vượt 100%

## Spacing System
```css
/* Dùng bội số của 4px */
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
```

## Container Width
- Desktop: `max-width: 1200px` (7xl) hoặc `780px` (văn bản)
- Nội dung văn bản dài: `max-width: 65ch`
- Container luôn `margin: 0 auto` + `padding: 0 16px`

## Z-Index System
```css
--z-base: 0;        /* Nội dung thường */
--z-dropdown: 100;   /* Dropdown menu */
--z-sticky: 200;     /* Sticky header */
--z-overlay: 300;    /* Backdrop/overlay */
--z-modal: 400;      /* Modal dialog */
--z-toast: 500;      /* Toast notification */
--z-tooltip: 600;    /* Tooltip */
```

## Fixed Elements
- Fixed navbar: PHẢI thêm `padding-top` = navbar height cho body
- Fixed bottom bar: PHẢI thêm `padding-bottom`
- Trên iOS: dùng `padding-bottom: env(safe-area-inset-bottom)`

## Viewport Height
- KHÔNG dùng `100vh` cho full-screen layout trên mobile
- Dùng `min-height: 100dvh` (dynamic viewport height) nếu hỗ trợ
- Fallback: `min-height: 100vh`

## Visual Hierarchy
- Size: Lớn = quan trọng
- Spacing: Nhiều space xung quanh = quan trọng
- Contrast: Tương phản cao = quan trọng
- Position: Trên cùng / trung tâm = quan trọng
- KHÔNG dùng MÀU SẮC làm yếu tố hierarchy duy nhất

## Grid System
- Dùng CSS Grid cho layout chính (page)
- Dùng Flexbox cho component/internal layout
- Grid gap dùng bội số của 4px hoặc 8px

## Responsive Navigation
- Mobile (< 768px): Hamburger menu hoặc bottom bar ≤5 items
- Tablet (768-1024px): Có thể sidebar hoặc top nav
- Desktop (≥1024px): Sidebar hoặc full top nav

## Responsive Form
- Mobile: label TRÊN input (stacked)
- Desktop: label có thể BÊN TRÁI input (side-by-side)
- Input width: 100% trên mobile
