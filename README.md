## 🧠 System Architecture & Data Flow

### 🔷 Tổng quan

Hệ thống **StockLab** được xây dựng theo kiến trúc **Client – Server**, kết hợp xử lý **Realtime (WebSocket)** và mô phỏng **Order Matching Engine** giống sàn giao dịch thực tế.

---

## 🔄 Luồng hoạt động chính

### 1. 📡 Request/Response (HTTP API)

```text
User → Frontend → Spring Boot API → Controller → Service → Repository → MySQL
```

* Người dùng thao tác trên giao diện (React)
* Frontend gửi request đến Backend (Spring Boot)
* Backend xử lý qua các tầng:

  * **Controller**: nhận request
  * **Service**: xử lý logic nghiệp vụ
  * **Repository**: truy vấn database
* Dữ liệu được lưu trữ tại **MySQL (Laragon)**

---

### 2. ⚡ Realtime Flow (WebSocket)

```text
Backend → WebSocket Server → Frontend
```

* Backend gửi dữ liệu realtime (giá cổ phiếu, trạng thái lệnh)
* Frontend nhận và cập nhật UI ngay lập tức (không cần reload)

---

## 🧩 Các thành phần chính

### 🔹 Frontend (React / HTML / JS)

* Giao diện người dùng
* Hiển thị bảng giá, biểu đồ, danh mục đầu tư
* Gửi request API và nhận dữ liệu realtime

---

### 🔹 Spring Boot API

* Xử lý toàn bộ request từ frontend
* Điều phối luồng dữ liệu trong hệ thống

---

### 🔹 Controller Layer

* Nhận request từ client
* Mapping API endpoints

---

### 🔹 Service Layer

* Xử lý business logic
* Điều phối giữa các module

---

### 🔹 Repository Layer

* Làm việc với database
* Sử dụng JPA / Hibernate

---

### 🔹 Database (MySQL - Laragon)

* Lưu trữ:

  * Người dùng
  * Cổ phiếu
  * Giao dịch
  * Danh mục đầu tư

---

## ⚙️ Core Engine (Quan trọng nhất)

### 🔥 OMS – Order Management System

* Quản lý lệnh:

  * Mua (Buy)
  * Bán (Sell)
* Kiểm tra:

  * Số dư
  * Khối lượng
* Lưu trạng thái lệnh

---

### ⚡ Matching Engine

* Thực hiện **khớp lệnh**
* So sánh:

  * Giá mua ↔ Giá bán
* Tạo giao dịch khi match
* Cập nhật:

  * Giá cổ phiếu
  * Khối lượng

---

### 🧠 Redis (Optional)

* Cache dữ liệu realtime
* Tăng hiệu năng hệ thống
* Giảm tải database

---

## 🔗 Luồng giao dịch (Trading Flow)

```text
User đặt lệnh → Frontend → Backend API
→ Service → OMS → Matching Engine
→ Cập nhật Database + Redis
→ Gửi realtime qua WebSocket → Frontend update UI
```

---

## 🎯 Tổng kết

Hệ thống gồm 3 phần cốt lõi:

1. **API Layer (Spring Boot)** → xử lý request
2. **Core Engine (OMS + Matching Engine)** → mô phỏng giao dịch
3. **Realtime Layer (WebSocket)** → cập nhật dữ liệu tức thời

👉 Kiến trúc này cho phép hệ thống:

* Mô phỏng giao dịch giống sàn thật
* Xử lý realtime
* Dễ mở rộng (scale)
