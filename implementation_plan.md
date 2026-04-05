# 📊 StockLab — Implementation Plan

> Hệ thống mô phỏng sàn giao dịch chứng khoán thực tế
> Cập nhật: 2026-03-23

---

## Tổng quan hệ thống

```
                    ┌──────────────┐
                    │   Frontend   │ (ReactJS + Vite)
                    └──────┬───────┘
                           │ REST API + WebSocket
                    ┌──────▼───────┐
                    │   Backend    │ (Spring Boot)
                    └──────┬───────┘
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
    ┌───────────┐   ┌───────────┐   ┌───────────┐
    │    OMS    │   │  Matching │   │ WebSocket │
    │  (Lệnh)  │──▶│  Engine   │──▶│ (Realtime)│
    └───────────┘   └───────────┘   └───────────┘
          │                │
          ▼                ▼
    ┌───────────┐   ┌───────────┐
    │   MySQL   │   │   Redis   │
    └───────────┘   └───────────┘
```

### Core Flow bắt buộc
```
User/Bot → Đặt lệnh (BUY/SELL)
       → OMS (quản lý, validate, lock tài sản)
       → Matching Engine (khớp lệnh Price-Time Priority)
       → Cập nhật giá + khối lượng
       → Push realtime qua WebSocket
       → Frontend update UI
```

---

## ĐÃ HOÀN THÀNH ✅

| Module | Chi tiết |
|--------|----------|
| Setup Spring Boot + React | `pom.xml`, Vite, Axios, Router |
| Database Schema | User, Stock, Transaction, Portfolio, Watchlist, StockPriceHistory |
| JWT Authentication | Register, Login, JwtAuthFilter, SecurityConfig |
| User Profile | Xem/sửa profile, đổi mật khẩu |
| Stock Management | Danh sách, chi tiết, lịch sử giá, tìm kiếm |
| Trading cơ bản | Mua/bán trực tiếp *(sẽ refactor sang OMS)* |
| Portfolio | Xem danh mục, tính lãi/lỗ, Pie Chart |
| Watchlist | Thêm/xóa cổ phiếu theo dõi |
| Transaction History | Xem lịch sử giao dịch, filter, pagination |

---

## CẦN LÀM — Chia theo Module

---

### Module 1: 🔐 Bảo mật và Xác thực (Security & OTP)

Nâng cấp hệ thống xác thực để giống sàn giao dịch thực tế.

| ID | Task | Backend | Frontend | Trạng thái |
|----|------|---------|----------|------------|
| SEC-1 | **Gửi OTP qua Email** | `OtpService` — sinh OTP 6 số, lưu Redis (TTL 5 phút), gửi email qua `JavaMailSender` | — | ❌ |
| SEC-2 | **Xác thực OTP khi đăng ký** | `AuthController` — sau register → yêu cầu nhập OTP xác thực email trước khi kích hoạt tài khoản | Màn hình nhập OTP, countdown timer, nút gửi lại | ❌ |
| SEC-3 | **OTP khi đặt lệnh giao dịch** | `OrderService` — lệnh có giá trị lớn (>= X VND) yêu cầu OTP xác nhận | Modal nhập OTP trước khi xác nhận lệnh | ❌ |
| SEC-4 | **OTP khi đổi mật khẩu** | `UserService.changePassword()` — gửi OTP về email, verify trước khi đổi | Form đổi MK → bước 1: nhập OTP, bước 2: nhập MK mới | ❌ |
| SEC-5 | **Quên mật khẩu** | `AuthController.forgotPassword()` — gửi OTP, `resetPassword()` — verify OTP + đặt MK mới | Trang quên MK → nhập email → nhập OTP → đặt MK mới | ❌ |
| SEC-6 | **Xác thực 2 bước (2FA) cho đăng nhập** | Sau login thành công → gửi OTP → verify mới trả token | Bước 2 đăng nhập: nhập OTP | ❌ |
| SEC-7 | **Token Blacklist (Logout)** | Lưu token đã logout vào Redis, check trong `JwtAuthFilter` | Xóa token + gọi API logout | ❌ |

#### Files cần tạo:
```
service/OtpService.java           [NEW] — Sinh, lưu (Redis), gửi (Email), verify OTP
service/EmailService.java         [NEW] — Gửi email qua JavaMailSender
config/RedisConfig.java           [NEW] — Cấu hình Redis
dto/OtpVerifyRequest.java         [NEW]
dto/ForgotPasswordRequest.java    [NEW]
dto/ResetPasswordRequest.java     [NEW]
```

---

### Module 2: 💰 Quản lý Tài khoản Tiền (Nạp / Rút)

| ID | Task | Backend | Frontend | Trạng thái |
|----|------|---------|----------|------------|
| WAL-1 | **Nạp tiền (Deposit)** | `WalletController.deposit()` — thêm tiền vào balance, tạo `WalletTransaction` (DEPOSIT) | Form nạp tiền — nhập số tiền, chọn phương thức (mô phỏng), xác nhận OTP | ❌ |
| WAL-2 | **Rút tiền (Withdraw)** | `WalletController.withdraw()` — validate balance ≥ amount, trừ tiền, tạo `WalletTransaction` (WITHDRAW), yêu cầu OTP | Form rút tiền — nhập số tiền, nhập tài khoản NH, xác nhận OTP | ❌ |
| WAL-3 | **Lịch sử nạp/rút** | `WalletController.getHistory()` — pagination, filter theo loại/ngày | Trang lịch sử ví — bảng nạp/rút, filter, tổng nạp/rút | ❌ |
| WAL-4 | **Số dư khả dụng vs Tổng số dư** | Tổng = balance, Khả dụng = balance - tiền đang lock trong lệnh PENDING | Hiển thị cả 2 số dư trên header/profile | ❌ |
| WAL-5 | **Giới hạn nạp/rút** | Validate min/max mỗi lần, giới hạn/ngày | Hiển thị thông báo giới hạn | ❌ |

#### Files cần tạo:
```
model/WalletTransaction.java       [NEW] — id, user, type (DEPOSIT/WITHDRAW), amount, status, bankAccount, note, createdAt
model/WalletTransactionType.java   [NEW] — enum: DEPOSIT, WITHDRAW
repository/WalletTransactionRepository.java [NEW]
dto/DepositRequest.java            [NEW]
dto/WithdrawRequest.java           [NEW]
dto/WalletTransactionResponse.java [NEW]
service/WalletService.java         [NEW]
controller/WalletController.java   [NEW]
pages/WalletPage.jsx + .css        [NEW]
```

---

### Module 3: 📦 OMS — Order Management System

Refactor toàn bộ hệ thống giao dịch sang đặt lệnh.

| ID | Task | Backend | Frontend | Trạng thái |
|----|------|---------|----------|------------|
| OMS-1 | **Order Model & Enums** | Entity `Order` — user, stock, type (BUY/SELL), orderType (MARKET/LIMIT), quantity, filledQty, price, status, createdAt | — | ✅ |
| OMS-2 | **Đặt lệnh (Place Order)** | `OrderService.placeOrder()` — validate số dư/CP khả dụng, lock tiền (BUY) hoặc lock CP (SELL), status = PENDING | Form đặt lệnh — chọn BUY/SELL, MARKET/LIMIT, nhập giá (LIMIT), số lượng. Hiển thị tổng tiền dự kiến, số dư sau GD | ✅ |
| OMS-3 | **Hủy lệnh (Cancel Order)** | `OrderService.cancelOrder()` — chỉ hủy lệnh PENDING/PARTIAL, mở khóa tiền/CP đã lock | Nút hủy lệnh trên sổ lệnh, xác nhận trước khi hủy | ✅ |
| OMS-4 | **Sửa lệnh (Modify Order)** | `OrderService.modifyOrder()` — hủy lệnh cũ + tạo lệnh mới (giá/số lượng mới) | Form sửa lệnh — cho phép thay đổi giá/số lượng | ✅ |
| OMS-5 | **Sổ lệnh (Order Book)** | `OrderController.getOrderBook(ticker)` — tất cả lệnh BUY/SELL đang PENDING cho 1 CP, group theo mức giá | Component OrderBook — bảng 2 cột: bên mua (xanh) / bên bán (đỏ), hiển thị giá × khối lượng | ✅ |
| OMS-6 | **Lịch sử lệnh (My Orders)** | `OrderController.getMyOrders()` — tất cả lệnh của user, filter theo status/ticker/ngày | Trang lịch sử lệnh — bảng danh sách lệnh + trạng thái (badge màu), nút hủy cho lệnh PENDING | ✅ |
| OMS-7 | **Chi tiết lệnh** | `OrderController.getOrderDetail(id)` — thông tin chi tiết 1 lệnh + các match đã xảy ra | Modal chi tiết — timeline trạng thái, danh sách match | ❌ |
| OMS-8 | **Xác nhận lệnh bằng OTP** | Lệnh ≥ ngưỡng → yêu cầu OTP trước khi lưu vào hệ thống | Modal OTP trước khi submit lệnh | ❌ |

#### Files cần tạo:
```
model/Order.java                [NEW]
model/OrderStatus.java          [NEW] — PENDING, PARTIAL, FILLED, CANCELLED, REJECTED
model/OrderType.java            [NEW] — MARKET, LIMIT
repository/OrderRepository.java [NEW]
dto/OrderRequest.java           [NEW]
dto/OrderResponse.java          [NEW]
dto/OrderBookResponse.java      [NEW]
dto/ModifyOrderRequest.java     [NEW]
service/OrderService.java       [NEW]
controller/OrderController.java [NEW]
pages/OrderBookPage.jsx + .css  [NEW]
pages/MyOrdersPage.jsx + .css   [NEW]
pages/TradingPage.jsx           [MODIFY] — chuyển sang đặt lệnh
api/api.js                      [MODIFY] — thêm orderAPI
App.jsx                         [MODIFY] — thêm routes
```

---

### Module 4: ⚡ Matching Engine

| ID | Task | Backend | Frontend | Trạng thái |
|----|------|---------|----------|------------|
| ME-1 | **Thuật toán Price-Time Priority** | `MatchingEngine.matchOrders(stock)` — BUY giá cao nhất vs SELL giá thấp nhất, cùng giá → FIFO | — | ❌ |
| ME-2 | **Xử lý MARKET Order** | Match ngay với lệnh đối ứng giá tốt nhất; nếu không đủ đối ứng → PARTIAL hoặc REJECT | — | ❌ |
| ME-3 | **Xử lý LIMIT Order** | Chỉ match khi giá mua ≥ giá bán; lệnh chưa match → chờ trong order book | — | ❌ |
| ME-4 | **Xử lý sau khớp** | Tạo Transaction, cập nhật filledQty/status Order, cập nhật Portfolio + balance, cập nhật giá Stock | — | ❌ |
| ME-5 | **Matching Scheduler** | `@Scheduled(fixedRate=3000)` — khớp lệnh liên tục mỗi 3s cho tất cả CP có PENDING | — | ❌ |
| ME-6 | **Lock tài sản khi đặt lệnh** | BUY → lock tiền (balance -= lockAmount); SELL → lock CP (lockQty). Hủy → hoàn lại | — | ❌ |

#### Files cần tạo:
```
engine/MatchingEngine.java       [NEW]
engine/MatchResult.java          [NEW]
scheduler/MatchingScheduler.java [NEW]
model/User.java                  [MODIFY] — thêm lockedBalance
model/Portfolio.java             [MODIFY] — thêm lockedQuantity
```

---

### Module 5: 📡 WebSocket — Realtime

| ID | Task | Backend | Frontend | Trạng thái |
|----|------|---------|----------|------------|
| WS-1 | **WebSocket Config** | `spring-boot-starter-websocket`, STOMP endpoint `/ws`, message broker `/topic` | — | ❌ |
| WS-2 | **Broadcast giá cổ phiếu** | Sau match → push `/topic/stocks` (all) + `/topic/stock/{ticker}` (cụ thể) | `StockListPage` — flash xanh/đỏ khi thay đổi giá | ❌ |
| WS-3 | **Broadcast trạng thái lệnh** | Order thay đổi status → push `/user/{userId}/orders` | `MyOrdersPage` — tự cập nhật trạng thái, notification | ❌ |
| WS-4 | **Broadcast order book** | Sau match hoặc place/cancel → push `/topic/orderbook/{ticker}` | `OrderBookPage` — bảng giá live | ❌ |
| WS-5 | **Thông báo giao dịch** | Lệnh được khớp → push notification cho user | Toast notification trên header | ❌ |

#### Files cần tạo:
```
pom.xml                          [MODIFY]
config/WebSocketConfig.java      [NEW]
services/websocket.js            [NEW] (frontend)
components/Notification.jsx      [NEW] (frontend)
```

---

### Module 6: 🤖 Trading Bot (tạo thanh khoản)

| ID | Task | Backend | Frontend | Trạng thái |
|----|------|---------|----------|------------|
| BOT-1 | **Bot User** | Tạo tài khoản bot trong DataSeeder (ROLE_BOT), balance lớn | — | ❌ |
| BOT-2 | **Auto Place Orders** | `@Scheduled` — đặt lệnh BUY/SELL ngẫu nhiên quanh giá hiện tại (±1-3%), số lượng ngẫu nhiên | — | ❌ |
| BOT-3 | **Cấu hình Bot** | Config: bật/tắt, tần suất, biên độ giá, khối lượng min/max | Admin toggle bật/tắt bot | ❌ |

#### Files cần tạo:
```
bot/TradingBot.java              [NEW]
config/BotConfig.java            [NEW]
config/DataSeeder.java           [MODIFY] — thêm bot user
```

---

### Module 7: 🛡️ Quản trị hệ thống (Admin)

| ID | Task | Backend | Frontend | Trạng thái |
|----|------|---------|----------|------------|
| ADM-1 | **Phân quyền Admin** | `@PreAuthorize("hasRole('ADMIN')")`, admin login riêng | Route `/admin/*` protected, redirect nếu không phải admin | ✅ |
| ADM-2 | **Quản lý Users** | CRUD users, khóa/mở tài khoản, xem balance, xem giao dịch | Bảng users, search, filter, actions | ✅ |
| ADM-3 | **Quản lý Stocks** | CRUD stocks, khoá/mở, xoá cứng/mềm, pagination/filter/sort | Bảng stocks nâng cao, modals | ✅ |
| ADM-4 | **Dashboard thống kê** | Tổng user, tổng GD, tổng KL, top CP, doanh thu | Dashboard cards + charts | ✅ |
| ADM-5 | **Quản lý lệnh** | Xem tất cả lệnh, force cancel, xem order book | Bảng lệnh toàn hệ thống | ❌ |
| ADM-7 | **Ghi log hoạt động (Audit Log)** | `AuditLog` entity (lưu action, target, user, value), Ghi nhật ký qua AOP/Service, API Get Logs | Trang `AdminLogsPage.jsx` hiển thị bảng log, Cập nhật Admin Sidebar | ❌ |

#### Files cần tạo:
```
model/AuditLog.java               [NEW]
repository/AuditLogRepository.java[NEW]
service/AuditLogService.java      [NEW]
controller/AuditLogController.java[NEW]
pages/AdminLogsPage.jsx + .css    [NEW]
components/AdminLayout.jsx        [MODIFY] - Thêm link Sidebar
```

---

### Module 8: 🚀 Nâng cao & DevOps

| ID | Task | Chi tiết | Trạng thái |
|----|------|----------|------------|
| DEV-1 | **Redis Cache** | `@Cacheable` stock data, TTL, `@CacheEvict` | ❌ |
| DEV-2 | **Postman Collection** | API documentation, test scripts | ❌ |
| DEV-3 | **Dockerize** | docker-compose: app + mysql + redis | ❌ |
| DEV-4 | **CI/CD** | GitHub Actions: build, test, deploy | ❌ |
| DEV-5 | **Portfolio Performance Chart** | Line chart hiệu suất danh mục theo thời gian | ❌ |
| DEV-6 | **TradingView Widget** | Nâng cấp biểu đồ nến chuyên nghiệp | ❌ |

---

## 📅 Thứ tự triển khai

```
Bước 1: Module 1 (Security + OTP + Redis)     → nền tảng bảo mật
    ↓
Bước 2: Module 2 (Nạp/Rút tiền)               → tài chính
    ↓
Bước 3: Module 3 (OMS)                         → core giao dịch
    ↓
Bước 4: Module 4 (Matching Engine)             → khớp lệnh
    ↓
Bước 5: Module 5 (WebSocket)                   → realtime
    ↓
Bước 6: Module 6 (Trading Bot)                 → thanh khoản
    ↓
Bước 7: Module 7 (Admin)                       → quản trị
    ↓
Bước 8: Module 8 (DevOps)                      → triển khai
```

## 📊 Tổng kết

| Hạng mục | Hoàn thành | Tổng |
|----------|-----------|------|
| ✅ Nền tảng (Setup, DB, Auth, Stock, Trade, Portfolio...) | 23 | 23 |
| Module 1 — Security & OTP | 0 | 7 |
| Module 2 — Nạp/Rút tiền | 0 | 5 |
| Module 3 — OMS | **4** | 8 |
| Module 4 — Matching Engine | 0 | 6 |
| Module 5 — WebSocket | 0 | 5 |
| Module 6 — Trading Bot | 0 | 3 |
| Module 7 — Admin | **4** | 6 |
| Module 8 — DevOps | 0 | 6 |
| **Tổng** | **31** | **69** |
