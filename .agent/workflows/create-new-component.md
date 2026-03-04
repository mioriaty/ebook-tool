---
description: UI Component Usage
---

# Workflow: UI Creation Feature

## 1. Ngữ cảnh (Context)

Sử dụng workflow này khi cần xây dựng một giao diện tính năng mới hoặc một phần của trang (ví dụ: User Profile Section,
Data Table, Auth Form).

## 2. Các bước thực hiện (Steps)

### Bước 1: Kiểm tra Thư viện UI (`.agent/rules/ui-component-usage.md`)

- Phân tích thiết kế/yêu cầu để tìm các thành phần Shadcn UI tương ứng.
- Kiểm tra trong `src/libs/components/ui` xem các component đó đã tồn tại chưa.
- **Nếu chưa có:** Thực thi lệnh `npx shadcn@latest add [component-name]` và đảm bảo nó được cài vào đúng path.

### Bước 2: Khởi tạo Component Tính năng

- Xác định Feature Folder tại `src/features/[feature-name]`.
- Tạo component mới trong `src/features/[feature-name]/components/[component-name].tsx`.
- **Import:** Luôn sử dụng alias `@/libs/components/ui` để gọi các base components.

### Bước 3: Triển khai & Tùy biến (Customization)

- **Styling:** Sử dụng helper `cn()` để ghi đè hoặc bổ sung Tailwind classes cho Shadcn components.
- **Icons:** Chỉ sử dụng thư viện `lucide-react`.
- **Logic:** Nếu cần thay đổi logic của base component, ưu tiên phương pháp Wrapping (bao bọc) thay vì sửa trực tiếp
  file trong `ui/`.

### Bước 4: Kiểm tra cấu trúc thư mục

- Đảm bảo KHÔNG tạo component dùng chung (shared) linh tinh.
- Mọi thứ dùng chung phải nằm ở `src/libs/components/ui`.
- Mọi thứ theo tính năng phải nằm ở `src/features/[feature]/components`.

## 3. Yêu cầu đầu ra (Output)

- Code sạch, tuân thủ đúng vị trí thư mục đã quy định trong Rule.
- File component phải export rõ ràng và có kiểu dữ liệu TypeScript cho props.
- Giải thích ngắn gọn các component Shadcn nào đã được sử dụng hoặc vừa được cài thêm.
