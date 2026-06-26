# Forms & Feedback Skill for DeepSeek

Khi thiết kế form, dialog, toast notification cho web app, tuân thủ các quy tắc sau:

## Input Labels (CRITICAL)
- MỌI input phải có `<label>` visible
- Label dùng `for="input-id"` trỏ đến input
- KHÔNG dùng placeholder thay cho label
- Label nằm TRÊN input (mobile) hoặc bên trái (desktop)

## Error Handling (CRITICAL)
- Error message hiển thị NGAY DƯỚI trường bị lỗi
- Format: "[Nguyên nhân]. [Cách sửa]."
- Ví dụ: "Email không hợp lệ. Vui lòng nhập địa chỉ email đúng định dạng."
- Border input chuyển đỏ + icon ⚠️
- Validation khi blur (rời khỏi input), KHÔNG khi đang gõ
- Sau submit lỗi: auto-focus trường lỗi đầu tiên
- Nhiều lỗi: hiển thị summary ở trên + link đến từng trường

## Required Fields
- Đánh dấu required bằng asterisk (*) màu đỏ
- Hoặc text "(bắt buộc)" bên cạnh label
- KHÔNG chỉ dùng màu đỏ để chỉ required

## Disabled States
```css
.disabled, button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}
```
- Disabled KHÁC read-only (read-only vẫn focus được)
- Tooltip giải thích TẠI SAO bị disabled

## Submit Button
- Disable ngay khi click để tránh double submit
- Hiển thị spinner + text "Đang gửi..."
- Sau khi xong: hiển thị success/error state
- Nếu lỗi: enable lại button để retry

## Toast Notifications
```css
/* Vị trí: bottom-right (desktop), bottom-center (mobile) */
.toast {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 500;
  max-width: 380px;
  animation: slideUp 0.3s ease-out;
}
```

### Toast Rules
- **Success**: Nền xanh, icon ✅
- **Error**: Nền đỏ, icon ❌
- **Warning**: Nền vàng, icon ⚠️
- **Info**: Nền tím/xanh, icon ℹ️
- Auto-dismiss sau 3-5 giây
- Có nút ✕ để dismiss thủ công
- Có aria-live="polite" cho screen reader
- KHÔNG steal focus
- Tối đa 3 toast cùng lúc (queue)

## Modal / Dialog
- Backdrop: nền đen 50-60% opacity
- Nội dung modal: căn giữa màn hình
- Animation: scale 0.95→1 + fade in (200ms)
- Close: nút ✕ góc phải + click backdrop + Escape key
- Focus trap bên trong modal
- KHÔNG mở modal từ modal (chỉ 1 layer)

## Confirmation Dialog
- Dùng cho destructive actions (xóa, thoát)
- Title: câu hỏi rõ ràng ("Xóa bản lưu này?")
- 2 nút: [Hủy] (secondary) + [Xác Nhận] (danger/primary)
- Nút hủy focus mặc định
- KHÔNG dùng native `confirm()` — tự custom

## Empty States
- Khi không có data: hiển thị message hữu ích
- Icon minh họa + text + action button nếu có
- Ví dụ: "Chưa có bản lưu nào. Hãy tạo ván mới!"

## Helper Text
- Dùng helper text cho input phức tạp
- Nằm DƯỚI input, trên error message
- Màu xám nhạt, font nhỏ hơn body

## Progressive Disclosure
- Form dài: chia thành các bước (step 1, 2, 3...)
- Hiển thị step indicator + progress bar
- Cho phép back về step trước
- KHÔNG "nhồi nhét" tất cả field vào 1 trang

## Autosave (Forms)
- Form dài: auto-save draft vào localStorage
- Khi mất kết nối hoặc refresh: khôi phục draft
- Thông báo "Đã lưu nháp" nhẹ nhàng (không toast to)

## Multi-Column Forms (Desktop)
- Maximum 2 cột cho form
- Label trên, input dưới (stacked) dễ scan hơn label trái
- Group related fields bằng fieldset/legend hoặc visual grouping
