# 📋 HƯỚNG DẪN DEMO IEEE TEST SUITE - STOCKLAB
**Kiểm thử Hộp đen + Hộp trắng | Bảo vệ đồ án**

---

## 🏗️ CẤU TRÚC TEST PLAN

```
📁 StockLab - IEEE Test Suite (Black Box + White Box)
├── ⚙️ Setup: Authentication (Admin + User Login + 2FA tự động)
└── 🧪 IEEE Functional Test (225 Cases)
    ├── 📁 Module 1: Authentication        (40 TC) — EP, BVA, BC, DT
    ├── 📁 Module 2: Stock Management      (30 TC) — EP, BVA, DT
    ├── 📁 Module 3: Order Management      (80 TC) — EP, BVA, DT, PC, BC ⭐
    ├── 📁 Module 4: Wallet Management     (40 TC) — EP, BVA, DT, PC, BC
    ├── 📁 Module 5: User Profile          (30 TC) — EP, BVA, BC
    ├── 📁 Module 6: Admin Controls        (50 TC) — EP, BC, DT, CC
    └── 📁 Module 7: Bot & System          (20 TC) — EP
```

**Ký hiệu kỹ thuật kiểm thử trong tên test case:**
| Ký hiệu | Kỹ thuật | Loại | Ý nghĩa |
|:-:|:--|:-:|:--|
| `[EP]` | Equivalence Partitioning | Hộp đen | Chia dữ liệu thành nhóm hợp lệ/không hợp lệ |
| `[BVA]` | Boundary Value Analysis | Hộp đen | Test giá trị biên: 0, -1, empty, max |
| `[DT]` | Decision Table | Hộp đen | Kết hợp nhiều điều kiện đầu vào |
| `[BC]` | Branch Coverage | Hộp trắng | Kiểm tra cả 2 nhánh if/else |
| `[PC]` | Path Coverage | Hộp trắng | Kiểm tra toàn bộ luồng đầu-cuối |
| `[CC]` | Condition Coverage | Hộp trắng | Kiểm tra từng điều kiện đơn lẻ |

---

## 🔑 CƠ CHẾ LẤY OTP TỰ ĐỘNG

**Luồng OTP trong JMeter (cho Order/Withdraw):**
```
1. POST /api/otp/send → Server trả OTP trong response.data
2. JSONPostProcessor trích xuất $.data → biến ${OTP_CODE}
3. POST /api/orders body chứa "otpCode": "${OTP_CODE}"
```

**🗣️ Giải thích cho giáo viên:**
> "Em đã tích hợp cơ chế trích xuất OTP tự động: JMeter gọi API yêu cầu OTP, server trả mã OTP về, JMeter dùng JSON Path Extractor lấy mã đó và truyền vào lệnh đặt tiếp theo. Toàn bộ luồng diễn ra tự động chỉ trong vài mili giây."

---

## 🎬 KỊCH BẢN DEMO

### Bước 1: Giới thiệu (1 phút)
> "Nhóm em đã xây dựng bộ **225 test case** theo chuẩn IEEE 829, kết hợp 3 kỹ thuật kiểm thử Hộp đen (EP, BVA, DT) và 3 kỹ thuật Hộp trắng (BC, PC, CC), phủ kín 7 module với hơn 50 API endpoints."

### Bước 2: Demo Module 3 — Order (3 phút) ⭐ Ăn điểm
1. Disable tất cả module trừ **Module 3**
2. Bấm Play → View Results Tree
3. Chỉ cho giáo viên thấy:
   - `[PC] Request OTP for BUY VNM` → Xanh 200 (lấy OTP)
   - `[PC] BUY LIMIT VNM with valid OTP` → Xanh 200 (đặt lệnh thành công!)
   - `[DT] BUY VNM without OTP` → HTTP 400 nhưng **cờ xanh** (vì expect 400)
   - `[BVA] Quantity = -1` → HTTP 400, **cờ xanh** (validation hoạt động)

### Bước 3: Demo Module 6 — Admin Phân quyền (2 phút)
1. Enable **Module 6**
2. Chỉ các test case `[CC]`: User truy cập API Admin → **403 Forbidden**
> "Đây là kiểm thử Condition Coverage: em dùng token của User thường để gọi API Admin, hệ thống chặn đúng trả về 403."

### Bước 4: Chạy toàn bộ 225 case (2 phút)
1. Enable all → Clear All → Play
2. Chuyển sang **Summary Report** để đọc tổng kết

---

## ❓ Q&A
**Q: Tại sao có Error % > 0?**
> "Error % bao gồm các test case Negative (EP, BVA, DT). Nhìn View Results Tree, tất cả đều cờ xanh — nghĩa là hệ thống phản hồi đúng như kỳ vọng."

**Q: Hộp đen khác Hộp trắng chỗ nào?**
> "Hộp đen: em chỉ nhìn input/output — ví dụ chia luồng hợp lệ/không hợp lệ (EP), test giá trị biên 0/-1 (BVA). Hộp trắng: em đọc code để biết có nhánh if/else nào — ví dụ Branch Coverage test cả nhánh thành công và thất bại."

**Q: OTP lấy từ đâu?**
> "Backend trả OTP trong response khi gọi API /api/otp/send. JMeter tự động trích xuất bằng JSON Path Extractor rồi truyền vào request tiếp theo."
