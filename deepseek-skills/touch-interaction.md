# Touch & Interaction Skill for DeepSeek

Khi thiết kế interactive elements cho web app, tuân thủ các quy tắc sau:

## Touch Target Size (CRITICAL)
- Nút bấm, link, input, select: KÍCH THƯỚC TỐI THIỂU 44×44px
- Nếu visual nhỏ hơn 44px, mở rộng hit area bằng padding ảo
- Khoảng cách giữa các touch target: TỐI THIỂU 8px
- Trên desktop: cursor pointer cho tất cả clickable elements

## Button States
- **Normal**: Màu nền + text rõ ràng
- **Hover** (desktop): Sáng hơn 10-15%, shadow tăng nhẹ
- **Active/Pressed**: Scale 0.97, màu tối hơn 5%
- **Disabled**: Opacity 0.4-0.5, cursor not-allowed, KHÔNG nhận click
- **Loading**: Disable button, hiển thị spinner + text "Đang xử lý..."

## Loading Feedback (CRITICAL)
- Khi async operation > 300ms: HIỂN THỊ loading indicator
- Button trong lúc chờ: disable + spinner + text thay đổi
- Overlay loading cho cả trang: semi-transparent overlay + spinner + text
- KHÔNG để UI "đơ" không phản hồi — luôn có feedback

## Hover vs Tap
- Dùng click/tap cho primary interactions
- KHÔNG dựa vào hover cho chức năng chính (hỏng trên mobile)
- Hover chỉ dùng cho secondary info (tooltip, preview)

## Gesture & Scroll
- KHÔNG chặn scroll tự nhiên của trang
- Tránh horizontal swipe trên nội dung chính
- Dùng `touch-action: manipulation` để giảm 300ms delay trên mobile

## Press Feedback
- Nút khi nhấn: hiệu ứng scale (0.95-0.97) hoặc màu tối hơn
- Transition press feedback: 100-150ms
- Card khi click: ripple effect hoặc border highlight

## Safe Areas
- Trên mobile: nội dung quan trọng tránh notch, Dynamic Island
- Bottom action bar: phải có padding-bottom an toàn
- Fixed elements: đảm bảo không bị che bởi system UI

## Error Feedback (CRITICAL)
- Lỗi hiển thị NGAY CẠNH trường bị lỗi
- Message lỗi: "nguyên nhân + cách sửa" (không chỉ "Invalid input")
- Highlight border đỏ + icon cảnh báo + text message
- Sau khi submit lỗi: auto-focus vào trường lỗi đầu tiên

## Success Feedback
- Action thành công: checkmark + toast/color flash ngắn
- Toast auto-dismiss sau 3-5 giây
- Cung cấp nút "Undo" cho destructive actions
