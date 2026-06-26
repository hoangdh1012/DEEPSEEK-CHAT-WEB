# UI/UX Design Checklist — Quick Reference for DeepSeek

Checklist nhanh khi thiết kế UI. Dùng làm System Prompt ngắn.

## 1. Accessibility
- [ ] Contrast ≥ 4.5:1 cho text thường, ≥ 3:1 cho text lớn
- [ ] Focus ring 2-4px visible trên mọi interactive element
- [ ] Mọi input có `<label>` với `for` attribute
- [ ] Icon-only button có `aria-label`
- [ ] Tab order khớp visual order
- [ ] Heading tuần tự h1→h2→h3, 1 h1 mỗi trang
- [ ] Respect `prefers-reduced-motion`

## 2. Touch & Interaction
- [ ] Touch target TỐI THIỂU 44×44px
- [ ] Spacing giữa touch targets ≥ 8px
- [ ] Button loading: disabled + spinner + text thay đổi
- [ ] Error hiển thị NGAY CẠNH trường lỗi
- [ ] Success: checkmark + toast 3-5 giây

## 3. Animation
- [ ] Duration 150-300ms cho micro-interaction
- [ ] Chỉ animate `transform` + `opacity` (GPU-friendly)
- [ ] Exit nhanh hơn enter (~60-70%)
- [ ] Ease-out cho enter, ease-in cho exit
- [ ] Modal: scale 0.95→1 + fade, 200ms

## 4. Màu Sắc & Typography
- [ ] Dùng CSS custom properties cho màu (KHÔNG raw hex)
- [ ] Base font 16px, line-height 1.5
- [ ] Mobile body text ≥ 16px
- [ ] Line length 60-75 ký tự
- [ ] Max 2 font families
- [ ] Dùng SVG icon, KHÔNG emoji

## 5. Layout & Responsive
- [ ] Viewport meta: `width=device-width, initial-scale=1`
- [ ] Mobile-first CSS (default mobile, min-width cho desktop)
- [ ] KHÔNG horizontal scroll trên mobile
- [ ] Z-index scale: 0/100/200/300/400/500
- [ ] Container max-width 1200px desktop

## 6. Forms & Feedback
- [ ] Toast auto-dismiss 3-5s, có nút ✕
- [ ] Toast: `aria-live="polite"`, không steal focus
- [ ] Required field có asterisk (*)
- [ ] Disabled: opacity 0.5 + cursor not-allowed
- [ ] Confirmation dialog cho destructive action
- [ ] KHÔNG dùng native `confirm()`/`alert()`

## Code Snippets

### Focus Ring
```css
*:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}
```

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Touch Target
```css
.btn, a, input, select, textarea {
  min-height: 44px;
  min-width: 44px;
}
```

### Responsive Container
```css
.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px;
}
```
