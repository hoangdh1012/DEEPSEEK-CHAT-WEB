# Animation & Motion Skill for DeepSeek

Khi thiết kế animation và transition cho web app, tuân thủ các quy tắc sau:

## Duration (CRITICAL)
- Micro-interaction (hover, focus, click): 150–200ms
- UI transition (modal, panel, tab switch): 200–300ms
- Complex animation (page transition): 300–400ms
- TỐI ĐA 500ms cho mọi UI animation — nhanh hơn cảm giác "đợi"

## Easing Functions
- **Enter (xuất hiện)**: `ease-out` — bắt đầu nhanh, kết thúc chậm
- **Exit (biến mất)**: `ease-in` — bắt đầu chậm, kết thúc nhanh
- **Standard transition**: `ease` hoặc `cubic-bezier(0.4, 0, 0.2, 1)`
- **KHÔNG dùng linear** cho UI transition (cảm giác robot)

## Exit vs Enter Timing
- Exit animation LUÔN NHANH HƠN enter (~60-70% thời lượng enter)
- Ví dụ: Enter 300ms → Exit 200ms

## Performance (CRITICAL)
- CHỈ animate `transform` và `opacity` — KHÔNG animate `width`, `height`, `top`, `left`
- Dùng `translate3d()` thay vì `translate()` để tận dụng GPU
- Dùng `will-change` cho elements sẽ animate (nhưng dùng hạn chế)
- KHÔNG animate quá 2 elements cùng lúc mỗi view

## Motion Meaning
- MỖI animation phải có Ý NGHĨA (cause → effect)
- KHÔNG animation "trang trí" vô nghĩa
- Animation phải thể hiện quan hệ không gian (vào từ đâu, ra đi đâu)

## Modal/Overlay Animations
- **Xuất hiện**: Scale 0.95→1 + fade in + slide up nhẹ
- **Biến mất**: Scale 1→0.95 + fade out + slide down nhẹ
- **Duration**: Enter 200ms, Exit 150ms
- **Backdrop**: Fade in/out nền đen 50% opacity

## State Transitions
- Hover → màu/thay đổi transition 150ms
- Active → scale-down 0.97 trong 100ms
- Tab switch → crossfade hoặc slide ngang 200ms
- Panel mở/đóng → slide + fade 250ms

## Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Sequence & Stagger
- List items xuất hiện lần lượt: stagger 30-50ms mỗi item
- Card grid: stagger theo hàng, 50ms mỗi hàng
- KHÔNG "tất cả cùng lúc" hoặc "quá chậm"

## Toast Animations
- **Enter**: Slide up từ dưới + fade in, 300ms ease-out
- **Exit**: Fade out 200ms rồi remove
- **Auto-dismiss**: Sau 3-5 giây

## Button Ripple/Click
- Scale 0.97 khi active, trở về 1 khi release
- Transition: 100ms
- Có thể thêm ripple effect (circle lan tỏa từ điểm click)
