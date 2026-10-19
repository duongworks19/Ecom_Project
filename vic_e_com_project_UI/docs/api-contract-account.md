# Tài Liệu Đặc Tả API — Khu Vực "Tài Khoản Của Tôi" (Customer Account)

Tài liệu này mô tả hợp đồng dữ liệu (API Contract) giữa Frontend (`vic_e_com_project_UI`) và Backend (`vic_e_com_project`) cho khu vực **Tài khoản của tôi** (`/account/*`) và menu người dùng trên header khách hàng.

---

## 1. Quy Ước Chung

### 1.1. Base URL & Tiền Tố
- Token cấu hình: `API_BASE_URL` (`src/app/core/config/api-base-url.token.ts`).
- Giá trị mặc định lấy từ `environment.apiUrl` (`http://localhost:9090/api`), fallback `'/api'`.

### 1.2. Xác Thực (Authentication)
- Tất cả các endpoint `/customer/**` và `/auth/logout` yêu cầu header:
  ```http
  Authorization: Bearer <accessToken>
  ```
- Header này được đính kèm tự động bởi HTTP interceptor sẵn có của ứng dụng (`passwordChangeInterceptor`).

### 1.3. Định Dạng Envelope Linh Hoạt
Frontend hỗ trợ **cả hai** kiểu phản hồi từ Backend:
1. **Trả trực tiếp payload `T`**:
   ```json
   { "id": 12, "username": "nguyenvana", ... }
   ```
2. **Bọc trong `ApiResponse<T>` chuẩn của Spring Boot**:
   ```json
   {
     "code": 200,
     "message": "Success",
     "data": { "id": 12, "username": "nguyenvana", ... }
   }
   ```

### 1.4. Chuẩn Hóa Lỗi HTTP (`ApiError`)
Mọi lỗi HTTP được chuẩn hóa qua `mapHttpError` (`src/app/core/api/api-error.mapper.ts`) thành:
```ts
export interface ApiError {
  status: number;
  code: string;
  message: string;
  field?: string;
  fieldErrors?: Record<string, string>;
}
```
Khi Backend trả lỗi nghiệp vụ (ví dụ `400`, `409`), khuyến nghị trả body:
```json
{
  "code": "DUPLICATE_PHONE",
  "message": "Số điện thoại đã được sử dụng bởi tài khoản khác.",
  "field": "phone"
}
```

---

## 2. Hồ Sơ Cá Nhân (`Profile`)

### 2.1. Lấy thông tin hồ sơ hiện tại
- **Method & Path**: `GET /api/customer/profile`
- **Headers**: `Authorization: Bearer <token>`
- **Response `200 OK`** (`CustomerProfile`):
  ```json
  {
    "id": 101,
    "username": "minhanh_vic",
    "fullName": "Nguyễn Minh Anh",
    "email": "minhanh@example.com",
    "phone": "0912345678",
    "gender": "FEMALE",
    "birthDate": "1998-05-20",
    "avatarUrl": "https://cdn.example.com/avatars/u101.jpg"
  }
  ```
  - `gender`: `'MALE' | 'FEMALE' | 'OTHER' | null`
  - `birthDate`: chuỗi ISO `YYYY-MM-DD` hoặc `null`
  - `avatarUrl`: URL ảnh hoặc `null`
- **Mã lỗi**:
  - `401 Unauthorized`: Chưa đăng nhập hoặc token hết hạn.
  - `404 Not Found`: Không tìm thấy hồ sơ khách hàng.

---

### 2.2. Cập nhật thông tin hồ sơ
- **Method & Path**: `PUT /api/customer/profile`
- **Headers**: `Authorization: Bearer <token>`, `Content-Type: application/json`
- **Request Body** (`UpdateProfileRequest`):
  ```json
  {
    "fullName": "Nguyễn Minh Anh",
    "phone": "0912345678",
    "gender": "FEMALE",
    "birthDate": "1998-05-20"
  }
  ```
  - `fullName`: bắt buộc, 2–100 ký tự.
  - `phone`: số điện thoại Việt Nam đã chuẩn hóa (`0[3|5|7|8|9]xxxxxxxx`, 10 chữ số).
  - `gender`: `'MALE' | 'FEMALE' | 'OTHER' | null`.
  - `birthDate`: `YYYY-MM-DD` hoặc `null` (không lớn hơn ngày hiện tại, năm >= 1900).
- **Response `200 OK`**: Trả về `CustomerProfile` sau khi cập nhật.
- **Mã lỗi**:
  - `400 Bad Request`: Dữ liệu không hợp lệ (kèm `field` hoặc `fieldErrors`).
  - `409 Conflict`: Số điện thoại đã tồn tại (`{ "code": "PHONE_EXISTS", "field": "phone", "message": "Số điện thoại đã được sử dụng." }`).

---

### 2.3. Tải lên ảnh đại diện (Avatar)
- **Method & Path**: `POST /api/customer/profile/avatar`
- **Headers**: `Authorization: Bearer <token>`, `Content-Type: multipart/form-data`
- **Form Data**:
  - Field `file`: file nhị phân định dạng `image/jpeg` hoặc `image/png`, dung lượng tối đa **1 MB** (`1,048,576` bytes).
- **Response `200 OK`** (`AvatarUploadResponse`):
  ```json
  {
    "avatarUrl": "https://cdn.example.com/avatars/u101-new.png"
  }
  ```
- **Mã lỗi**:
  - `400 Bad Request`: Định dạng file không hỗ trợ hoặc vượt quá 1 MB.

---

## 3. Sổ Địa Chỉ Nhận Hàng (`Addresses`)

### 3.1. Lấy danh sách địa chỉ
- **Method & Path**: `GET /api/customer/addresses`
- **Headers**: `Authorization: Bearer <token>`
- **Response `200 OK`** (`CustomerAddress[]`):
  ```json
  [
    {
      "id": 1,
      "recipientName": "Nguyễn Minh Anh",
      "phone": "0912345678",
      "province": "TP. Hồ Chí Minh",
      "district": "Quận 1",
      "ward": "Phường Bến Nghé",
      "detailAddress": "Số 12 Đường Lê Lợi",
      "isDefault": true
    }
  ]
  ```
  *(Lưu ý: Frontend tự động sắp xếp địa chỉ có `isDefault: true` lên đầu danh sách).*

---

### 3.2. Thêm địa chỉ mới
- **Method & Path**: `POST /api/customer/addresses`
- **Headers**: `Authorization: Bearer <token>`, `Content-Type: application/json`
- **Request Body** (`UpsertAddressRequest`):
  ```json
  {
    "recipientName": "Nguyễn Minh Anh",
    "phone": "0912345678",
    "province": "TP. Hồ Chí Minh",
    "district": "Quận 1",
    "ward": "Phường Bến Nghé",
    "detailAddress": "Số 12 Đường Lê Lợi",
    "isDefault": true
  }
  ```
- **Response `201 Created` / `200 OK`**: Trả về `CustomerAddress` vừa tạo.
- **Mã lỗi**:
  - `400 Bad Request`: Thiếu trường bắt buộc hoặc số điện thoại không hợp lệ.

---

### 3.3. Cập nhật địa chỉ
- **Method & Path**: `PUT /api/customer/addresses/:id`
- **Path Params**: `id` (số nguyên dương - ID địa chỉ).
- **Request Body** (`UpsertAddressRequest`): Tương tự `POST /api/customer/addresses`.
- **Response `200 OK`**: Trả về `CustomerAddress` sau khi cập nhật.
- **Mã lỗi**:
  - `400 Bad Request`: Dữ liệu không hợp lệ.
  - `404 Not Found`: Không tìm thấy địa chỉ thuộc về khách hàng.

---

### 3.4. Xóa địa chỉ
- **Method & Path**: `DELETE /api/customer/addresses/:id`
- **Path Params**: `id` (ID địa chỉ cần xóa).
- **Response `200 OK` / `204 No Content`**: Xóa thành công.
- **Mã lỗi**:
  - `400 Bad Request` / `409 Conflict`: Không cho phép xóa địa chỉ đang là mặc định.
  - `404 Not Found`: Địa chỉ không tồn tại.

---

### 3.5. Thiết lập địa chỉ mặc định
- **Method & Path**: `PATCH /api/customer/addresses/:id/default`
- **Path Params**: `id` (ID địa chỉ muốn đặt làm mặc định).
- **Request Body**: `{}`
- **Response `200 OK`**: Trả về `CustomerAddress` đã được đặt `isDefault: true` (hoặc `204 No Content`).

---

## 4. Đơn Mua Của Khách Hàng (`Orders`)

### 4.1. Lấy danh sách đơn hàng (phân trang + lọc trạng thái + tìm kiếm)
- **Method & Path**: `GET /api/customer/orders`
- **Query Params**:
  - `status` *(tùy chọn)*: `'PENDING' | 'CONFIRMED' | 'SHIPPING' | 'COMPLETED' | 'CANCELLED'`. Khi người dùng chọn tab **Tất cả** (`ALL`), Frontend **không gửi** query param `status`.
  - `q` *(tùy chọn)*: Từ khóa tìm kiếm theo mã đơn hàng, tên shop hoặc tên sản phẩm (đã `trim()`, debounce `300ms`).
  - `page` *(tùy chọn, mặc định `0`)*: Chỉ số trang bắt đầu từ `0`.
  - `size` *(tùy chọn, mặc định `10`)*: Số lượng đơn mỗi trang.
- **Response `200 OK`** (`CustomerOrderPageResponse`):
  ```json
  {
    "content": [
      {
        "id": 5001,
        "orderCode": "VIC-240918",
        "shopId": 10,
        "shopName": "VIC Studio Official",
        "status": "PENDING",
        "createdAt": "2026-04-12T08:30:00Z",
        "totalAmount": 640000,
        "canCancel": true,
        "items": [
          {
            "productId": 301,
            "productName": "Áo khoác linen cổ đứng form rộng",
            "variantLabel": "Be sáng, Size M",
            "thumbnailUrl": "https://cdn.example.com/products/p301.jpg",
            "quantity": 1,
            "unitPrice": 640000,
            "lineTotal": 640000
          }
        ]
      }
    ],
    "page": 0,
    "size": 10,
    "totalElements": 1,
    "totalPages": 1,
    "countsByStatus": {
      "ALL": 4,
      "PENDING": 1,
      "CONFIRMED": 0,
      "SHIPPING": 1,
      "COMPLETED": 2,
      "CANCELLED": 0
    }
  }
  ```
  *(Trường `countsByStatus` là tùy chọn; nếu có, giao diện sẽ hiển thị số lượng đơn trên từng tab).*

---

### 4.2. Lấy chi tiết một đơn hàng
- **Method & Path**: `GET /api/customer/orders/:id`
- **Path Params**: `id` (ID đơn hàng).
- **Response `200 OK`**: Trả về `CustomerOrder`.
- **Mã lỗi**:
  - `404 Not Found`: Đơn hàng không tồn tại hoặc không thuộc về khách hàng hiện tại.

---

### 4.3. Hủy đơn hàng
- **Method & Path**: `POST /api/customer/orders/:id/cancel`
- **Path Params**: `id` (ID đơn hàng đang ở trạng thái `PENDING` và `canCancel === true`).
- **Request Body** (`CancelOrderRequest`):
  ```json
  {
    "reason": "Muốn thay đổi địa chỉ nhận hàng"
  }
  ```
  - `reason`: bắt buộc, 5–300 ký tự.
- **Response `200 OK`**: Trả về `CustomerOrder` với `status: "CANCELLED"`.
- **Mã lỗi**:
  - `400 Bad Request`: Lý do hủy không hợp lệ.
  - `409 Conflict`: Đơn hàng đã chuyển trạng thái, không thể hủy.

---

### 4.4. Mua lại đơn hàng (`Rebuy`)
- **Method & Path**: `POST /api/customer/orders/:id/rebuy`
- **Path Params**: `id` (ID đơn hàng ở trạng thái `COMPLETED` hoặc `CANCELLED`).
- **Request Body**: `{}`
- **Response `200 OK`** (`RebuyOrderResponse`):
  ```json
  {
    "addedItemCount": 2,
    "cartTotalItems": 5
  }
  ```
- **Mã lỗi**:
  - `409 Conflict` / `400 Bad Request`: Sản phẩm trong đơn đã ngừng kinh doanh hoặc hết hàng hoàn toàn.

---

## 5. Đăng Xuất (`Logout`)

- **Method & Path**: `POST /api/auth/logout`
- **Request Body**: `{}`
- **Response `200 OK` / `204 No Content`**: Hủy phiên/refresh token ở phía server.
- **Hành vi phía Frontend**: Kể cả khi endpoint `/api/auth/logout` trả lỗi mạng hoặc chưa được triển khai ở backend, Frontend vẫn luôn xóa token cục bộ (`authService.logout()`) và điều hướng về `/login`.
