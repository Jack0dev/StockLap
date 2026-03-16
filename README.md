# 📈 StockLab — Hệ Thống Mô Phỏng Sàn Giao Dịch Chứng Khoán

## 1. Giới thiệu

**StockLab** là hệ thống mô phỏng sàn giao dịch chứng khoán trực tuyến, cho phép người dùng thực hành đầu tư chứng khoán bằng tiền ảo mà không cần sử dụng tiền thật.

### Mục tiêu
- Mô phỏng hoạt động sàn giao dịch chứng khoán
- Cung cấp môi trường thực hành giao dịch cổ phiếu
- Theo dõi biến động giá và xu hướng thị trường
- Quản lý danh mục đầu tư, đánh giá hiệu quả đầu tư
- Xếp hạng nhà đầu tư dựa trên hiệu suất

---

## 2. Kiến trúc hệ thống

Hệ thống xây dựng theo mô hình **Client – Server** kết hợp **MVC**:

| Tầng | Mô tả | Công nghệ |
|------|--------|-----------|
| **Frontend** | Giao diện người dùng | ReactJS, Vite, Chart.js |
| **Backend** | Xử lý nghiệp vụ & API | Spring Boot, Spring Security, JWT |
| **Database** | Lưu trữ dữ liệu | MySQL |

---

## 3. Cấu trúc thư mục

```
StockLap/
├── stocklab-backend/                     # Spring Boot Backend
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/stocklab/
│       │   ├── config/                   # Cấu hình (CORS, Security, Seeder)
│       │   ├── controller/               # REST Controllers
│       │   ├── service/                  # Business Logic
│       │   ├── model/                    # JPA Entities
│       │   ├── repository/               # Data Access
│       │   ├── dto/request/              # Request DTOs
│       │   ├── dto/response/             # Response DTOs
│       │   ├── security/                 # JWT Auth
│       │   └── exception/               # Error Handling
│       └── resources/
│           └── application.properties
│
└── stocklab-frontend/                    # React + Vite Frontend
    └── src/
        ├── components/ui/                # Reusable UI components
        ├── context/                      # React Context (Auth, Market...)
        ├── features/                     # Feature modules
        │   ├── auth/                     # Đăng nhập, Đăng ký
        │   ├── market/                   # Danh sách cổ phiếu
        │   ├── trading/                  # Giao dịch mua/bán
        │   ├── portfolio/                # Danh mục đầu tư
        │   └── leaderboard/              # Bảng xếp hạng
        ├── layouts/                      # Header, Sidebar, Layout
        ├── services/                     # API service layer
        └── styles/                       # CSS
```

---

## 4. Chức năng chính

| STT | Chức năng | Mô tả |
|-----|-----------|-------|
| 1 | Quản lý người dùng | Đăng ký, đăng nhập, cập nhật thông tin, đổi mật khẩu |
| 2 | Quản lý cổ phiếu | Xem danh sách, chi tiết, biểu đồ giá |
| 3 | Giao dịch | Mua/bán cổ phiếu, kiểm tra số dư, lịch sử giao dịch |
| 4 | Danh mục đầu tư | Cổ phiếu đang nắm giữ, lợi nhuận/thua lỗ |
| 5 | Bảng xếp hạng | Xếp hạng nhà đầu tư theo hiệu suất |

---

## 5. Công nghệ sử dụng

### Frontend
- HTML / CSS / JavaScript
- ReactJS + Vite
- Chart.js (biểu đồ giá)
- Axios (HTTP Client)

### Backend
- Java 21 + Spring Boot 3.2
- Spring Security + JWT
- Spring Data JPA + Hibernate
- Lombok

### Database & Tools
- MySQL
- Git / GitHub
- Postman
- Docker (tùy chọn)

---

## 6. Cài đặt & Chạy

### Backend
```bash
cd stocklab-backend
# Cấu hình MySQL trong application.properties
./mvnw spring-boot:run
```

### Frontend
```bash
cd stocklab-frontend
npm install
npm run dev
```

---

## 7. Tác giả

**StockLab** — Dự án mô phỏng sàn giao dịch chứng khoán
