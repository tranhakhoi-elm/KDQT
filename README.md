# Elmich Cookware Single-Page Catalogue Studio

Ứng dụng thiết kế và xuất bản catalogue 1 trang chuẩn xuất khẩu cho thương hiệu Elmich, tích hợp AI phân tích ảnh nồi chảo và xuất file PDF Vector 100% chuẩn in ấn.

---

## 🚀 Hướng Dẫn Triển Khai Lên GitHub & Vercel

### Bước 1: Đẩy mã nguồn lên GitHub (Push to GitHub)
```bash
git init
git add .
git commit -m "feat: elmich single-page catalog studio"
git branch -M main
git remote add origin https://github.com/<tai-khoan-cua-ban>/<ten-repo>.git
git push -u origin main
```

---

### Bước 2: Kết nối và cấu hình trên Vercel
1. Đăng nhập vào [Vercel Dashboard](https://vercel.com/dashboard).
2. Nhấn **Add New...** -> **Project** -> Chọn repository từ GitHub bạn vừa đẩy lên.
3. Trong mục **Build & Output Settings**:
   - **Framework Preset**: Chọn `Vite` (Vercel tự động nhận diện).
   - **Build Command**: `vite build` (mặc định).
   - **Output Directory**: `dist` (mặc định).

---

### Bước 3: Khai báo biến môi trường `GEMINI_API_KEY` trên Vercel
1. Tại màn hình cấu hình dự án (hoặc vào **Settings** -> **Environment Variables**):
2. Thêm biến môi trường:
   - **Key**: `GEMINI_API_KEY`
   - **Value**: Dán mã khóa Gemini API của bạn (Lấy miễn phí tại: https://aistudio.google.com/app/apikey)
3. Tích chọn các môi trường:
   - ✅ **Production**
   - ✅ **Preview**
   - ✅ **Development**
4. Nhấn **Save**.
5. Nhấn **Deploy** (hoặc **Redeploy** nếu dự án đã build trước đó).

> **Lưu ý phụ:** Nếu bạn muốn dự phòng cho chạy tĩnh hoàn toàn phía trình duyệt, bạn có thể thêm thêm biến `VITE_GEMINI_API_KEY` với cùng giá trị API Key.

---

## 🖨️ Lưu File PDF Giữ Nguyên 100% Font Chữ & Tỷ Lệ (Chuẩn Ctrl+P)

1. Nhấn nút **"Lưu PDF (Ctrl+P Chuẩn 100%)"** trên thanh công cụ (hoặc nhấn tổ hợp phím **Ctrl + P** / **⌘ + P**).
2. Trong hộp thoại in của trình duyệt (Chrome, Edge, Cốc Cốc, Brave):
   - **Mục Đích / Destination**: Chọn **"Lưu dưới dạng PDF"** (*Save as PDF*).
   - **Khổ giấy / Paper size**: **A4**.
   - **Hướng giấy / Layout**: **Ngang** (*Landscape*).
   - **Tỷ lệ / Scale**: **Mặc định** (*Default*) hoặc **100%**.
   - **Lề / Margins**: **Tối thiểu** (*None*) hoặc **Mặc định**.
   - **Tùy chọn khác**: Tích chọn **"Đồ họa nền"** (*Background graphics*).
3. Nhấn **Lưu** (*Save*). Toàn bộ chữ, font serif Playfair Display, sans-serif Plus Jakarta Sans, độ dãn chữ (`letter-spacing`), dãn dòng (`line-height`) và ảnh crop 100% chuẩn vector, không bị vỡ hạt hay méo tỷ lệ.
