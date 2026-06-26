# Accessibility Design Skill for DeepSeek

Khi thiết kế giao diện web app, tuân thủ các quy tắc accessibility sau:

## Tương Phản Màu Sắc (CRITICAL)
- Tỷ lệ tương phản tối thiểu 4.5:1 cho text thường, 3:1 cho text lớn (≥18px hoặc bold ≥14px)
- Kiểm tra tương phản bằng công cụ: https://webaim.org/resources/contrastchecker/
- KHÔNG dùng màu xám trên nền xám — luôn có độ tương phản rõ ràng

## Focus States (CRITICAL)
- TẤT CẢ interactive elements (button, input, select, textarea) phải có focus ring visible
- Focus ring: 2-4px, màu tương phản cao (vàng/trắng/tím)
- KHÔNG BAO GIỜ dùng `outline: none` mà không có alternative focus indicator
- Dùng `:focus-visible` thay vì `:focus` để tránh focus ring khi click chuột

## Labels & ARIA
- Mọi input phải có `<label>` với thuộc tính `for` trỏ đến input id
- Icon-only buttons PHẢI có `aria-label` mô tả chức năng
- KHÔNG dùng placeholder thay cho label
- Form errors phải dùng `aria-live="polite"` hoặc `role="alert"`
- Toast notifications phải có `aria-live="polite"`, không steal focus

## Keyboard Navigation
- Tab order phải khớp với visual order
- Mọi interactive element phải reachable bằng Tab
- Modal phải trap focus bên trong khi mở
- Escape key phải đóng modal/dropdown

## Heading Hierarchy
- Dùng heading tuần tự: h1 → h2 → h3 (không nhảy cấp)
- Mỗi trang chỉ có MỘT h1
- Heading dùng để tổ chức nội dung, không dùng vì style

## Màu Sắc & Ý Nghĩa
- KHÔNG truyền tải thông tin CHỈ bằng màu sắc
- Error state: màu đỏ + icon + text message
- Success state: màu xanh + icon + text message
- Link phải có underline hoặc khác biệt rõ với text thường (không chỉ màu)

## Screen Readers
- Icon buttons: `aria-label="Đóng"` thay vì chỉ có icon ✕
- Images có ý nghĩa: phải có `alt` text mô tả
- Decorative images: `alt=""` (chuỗi rỗng)
- Dynamic content updates: dùng `aria-live` regions

## Skip Link & Navigation
- Cung cấp "Skip to main content" link ở đầu trang (visible khi focus)
- Navigation phải nhất quán giữa các trang

## Reduced Motion
- Tôn trọng `prefers-reduced-motion` media query
- Khi user bật reduced motion: tắt hoặc giảm animation

## Dark Mode
- Dark mode dùng desaturated/lighter tones, KHÔNG đảo ngược màu
- Test contrast riêng cho cả light và dark mode
- Dùng CSS variables để dễ chuyển đổi theme
