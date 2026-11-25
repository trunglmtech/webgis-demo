# WebGIS Demo — Phủ sóng WiFi Đại học Nha Trang

Xây dựng **hệ thống WebGIS** phân tích và trực quan hóa mức độ phủ sóng WiFi trong khuôn viên **Trường Đại học Nha Trang**.

Bản đồ nền lấy từ **OpenStreetMap**, dữ liệu là **15 điểm đo thực tế** (cường độ dBm) và vùng phủ sóng được nội suy bằng thuật toán **IDW (Inverse Distance Weighting)** chạy trực tiếp trên trình duyệt.

---

## Mục lục

- [Tính năng](#tính-năng)
- [Công nghệ sử dụng](#công-nghệ-sử-dụng)
- [Cấu trúc dự án](#cấu-trúc-dự-án)
- [Cài đặt và chạy](#cài-đặt-và-chạy)
- [Dữ liệu](#dữ-liệu)
- [Thang đo tín hiệu](#thang-đo-tín-hiệu)
- [Thuật toán IDW](#thuật-toán-idw)
- [Quy trình thực hiện](#quy-trình-thực-hiện)
- [Kiểm thử](#kiểm-thử)
- [Hạn chế và hướng phát triển](#hạn-chế-và-hướng-phát-triển)
- [Giấy phép](#giấy-phép)

---

## Tính năng

| Chức năng | Mô tả |
|---|---|
| **Bản đồ tương tác** | Zoom, kéo bản đồ, xem bản đồ nền OpenStreetMap |
| **Vùng phủ sóng** | Nội suy IDW từ 15 điểm đo, hiển thị 5 mức màu liên tục |
| **Điểm đo** | Hiển thị 15 điểm đo với màu theo cường độ tín hiệu |
| **Popup thông tin** | Click vào điểm để xem tên, dBm, mức, tọa độ |
| **Lọc dữ liệu** | Lọc theo tên điểm, theo mức tín hiệu, theo ngưỡng dBm |
| **Thống kê** | Đếm số điểm theo từng mức, cập nhật theo kết quả lọc |
| **Bật/tắt lớp** | Công tắc bật/tắt hiển thị vùng phủ sóng |
| **Giao diện tiếng Việt** | Toàn bộ giao diện và nội dung bằng tiếng Việt |

---

## Công nghệ sử dụng

| Thành phần | Công cụ | Vai trò |
|---|---|---|
| Ngôn ngữ | **HTML5, CSS3, JavaScript (thuần)** | Toàn bộ ứng dụng |
| Thư viện bản đồ | **[Leaflet 1.9.4](https://leafletjs.com/)** | Hiển thị bản đồ tương tác |
| Bản đồ nền | **OpenStreetMap** | Lớp bản đồ nền miễn phí |
| Thuật toán | **IDW tự viết** | Nội suy phủ sóng |
| Lưu trữ | Không cần — dữ liệu trong `js/data.js` | |

### Vì sao chọn JavaScript thuần + Leaflet?

- **Không cần server**, không cần build, mở là chạy.
- **Không cần cài đặt** gì ngoài trình duyệt.
- **Nhẹ**, tải nhanh, chạy mượt trên máy cấu hình thấp.
- Có thể **deploy miễn phí** lên GitHub Pages.
- Đây là **cách phổ biến nhất** để làm WebGIS hiện nay.

---

## Cấu trúc dự án

```
webgis-demo/
├── index.html          # Trang chính: giao diện + khởi tạo bản đồ
├── css/
│   └── style.css       # Toàn bộ giao diện
├── js/
│   ├── data.js         # Dữ liệu 15 điểm đo + ngưỡng phân loại
│   ├── idw.js          # Thuật toán nội suy IDW
│   └── map.js          # Khởi tạo bản đồ, vẽ, lọc, thống kê
├── README.md
└── LICENSE
```

### Vai trò từng file

| File | Nội dung |
|---|---|
| `data.js` | Danh sách điểm đo (tên, vĩ độ, kinh độ, dBm) và bảng ngưỡng/màu |
| `idw.js` | Hàm `tinhIdw()` — tính giá trị dBm cho từng ô lưới |
| `map.js` | Tạo bản đồ, chú giải, vẽ vùng phủ, vẽ điểm, lọc, thống kê |
| `index.html` | Khung giao diện: thanh tiêu đề, thanh lọc, khung bản đồ |
| `style.css` | Định dạng toàn bộ: màu sắc, bố cục, popup, chú giải |

---

## Cài đặt và chạy

### Cách 1 — Mở trực tiếp (đơn giản nhất)

1. Tải hoặc clone dự án về máy.
2. Mở file `index.html` bằng trình duyệt (Chrome, Edge, Firefox).

> Một số trình duyệt chặn file local; nếu bản đồ không hiện, dùng Cách 2.

### Cách 2 — Chạy bằng server tĩnh

Nếu có Python:

```bash
cd webgis-demo
python -m http.server 8080
```

Mở trình duyệt: <http://localhost:8080>

Nếu có Node.js:

```bash
npx http-server . -p 8080
```

### Cách 3 — GitHub Pages

Repository đã cấu hình sẵn GitHub Pages. Link chạy trực tiếp:

```
https://trunglmtech.github.io/webgis-demo/
```

---

## Dữ liệu

### 15 điểm đo cường độ WiFi

| Mã | Tên điểm | Vĩ độ | Kinh độ | dBm | Mức |
|---|---|---|---|---|---|
| D1 | TTTD | 12.2685760 | 109.2022400 | −75 | Yếu |
| D2 | G1 | 12.2687800 | 109.2039520 | −65 | Mạnh |
| D3 | G2 | 12.2682570 | 109.2043320 | −62 | Rất mạnh |
| D4 | K8 | 12.2691430 | 109.2025770 | −75 | Yếu |
| D5 | Vô danh | 12.2678340 | 109.2037250 | −80 | Rất yếu |
| D6 | K7 | 12.2682600 | 109.1989720 | −77 | Rất yếu |
| D7 | HT3 | 12.2689097 | 109.1995465 | −75 | Yếu |
| D8 | NDN | 12.2670510 | 109.2000630 | −57 | Rất mạnh |
| D9 | G6 | 12.2671195 | 109.2003864 | −64 | Mạnh |
| D10 | G7 | 12.2675504 | 109.1999250 | −65 | Mạnh |
| D11 | Cổng trường | 12.2685080 | 109.2010550 | −75 | Yếu |
| D12 | G5 | 12.2673120 | 109.2014370 | −79 | Rất yếu |
| D13 | G4 | 12.2673080 | 109.2014450 | −71 | Yếu |
| D14 | Phòng đào tạo | 12.2673370 | 109.2019940 | −78 | Rất yếu |
| D15 | Nhà cựu sinh viên | 12.2681710 | 109.2015480 | −70 | Trung bình |

### Thống kê

| Mức | Số điểm | Tỉ lệ |
|---|---|---|
| Rất mạnh | 2 (D3, D8) | 13,3% |
| Mạnh | 3 (D2, D9, D10) | 20,0% |
| Trung bình | 1 (D15) | 6,7% |
| Yếu | 5 (D1, D4, D7, D11, D13) | 33,3% |
| Rất yếu | 4 (D5, D6, D12, D14) | 26,7% |

### Cách thu thập dữ liệu

1. Dùng điện thoại Android + ứng dụng đo WiFi (WiFi Analyzer / WiGLE) để đọc dBm.
2. Lấy tọa độ từ Google Maps (nhấn giữ vị trí → xem tọa độ).
3. Ghi kết quả vào Excel theo mẫu: `Ten_diem | Vi_do | Kinh_do | dBm`.
4. Nhập vào `js/data.js`.

### Cách cập nhật dữ liệu

Mở `js/data.js`, sửa mảng `DIEM_DO`:

```javascript
var DIEM_DO = [
    { ten: "D1 - TTTD", viDo: 12.2685760, kinhDo: 109.2022400, dbm: -75 },
    // thêm điểm mới theo đúng dạng trên
];
```

Mức và màu sẽ tự động tính lại theo ngưỡng.

---

## Thang đo tín hiệu

Phân loại dựa trên **mức cường độ thu (RSSI)** tính bằng **dBm**.
Ngưỡng càng cao (gần 0) thì tín hiệu càng mạnh.

| Mức | Khoảng dBm | Màu | Ý nghĩa |
|---|---|---|---|
| 🟢 **Rất mạnh** | ≥ −62 | `#006600` | Tín hiệu rất tốt, sử dụng mượt |
| 🟢 **Mạnh** | −66 → −62 | `#66cc66` | Tín hiệu tốt |
| 🟡 **Trung bình** | −70 → −66 | `#ffcc00` | Đủ dùng cơ bản |
| 🟠 **Yếu** | −75 → −70 | `#ff9933` | Chậm, dễ ngắt kết nối |
| 🔴 **Rất yếu** | < −75 | `#cc0000` | Khó sử dụng |

> **Quy ước màu:** dBm càng cao (mạnh) thì càng xanh; dBm càng thấp (yếu) thì càng đỏ.

---

## Thuật toán IDW

### Nguyên lý

IDW (Inverse Distance Weighting — nội suy nghịch đảo khoảng cách) tính giá trị tại một điểm bất kỳ bằng **trung bình có trọng số** của tất cả điểm đo. Điểm đo càng gần thì trọng số càng lớn.

### Công thức

```
                n
              Σ  ( Zᵢ / dᵢ² )
             i=1
    Z(x) = ────────────────────
                n
              Σ  ( 1 / dᵢ² )
             i=1
```

Trong đó:
- `Z(x)` — giá trị dBm cần tính tại điểm x
- `Zᵢ` — giá trị dBm của điểm đo thứ i
- `dᵢ` — khoảng cách từ x tới điểm đo thứ i
- `n` — tổng số điểm đo (15)

### Cách tính khoảng cách

```javascript
// 1 độ vĩ độ  ≈ 111.000 m
// 1 độ kinh độ ≈ 111.000 m × cos(vĩ độ)
var dx = (kinhDo - lng) * 111000 * Math.cos(lat * Math.PI / 180);
var dy = (viDo - lat) * 111000;
var khoangCach = Math.sqrt(dx*dx + dy*dy);
```

### Quy trình tính

1. Xác định khung bao quanh 15 điểm đo, mở rộng thêm 10%.
2. Chia khung thành lưới **150 hàng × 200 cột**.
3. Với mỗi ô lưới: tính giá trị dBm theo công thức IDW.
4. Đổi giá trị dBm sang mã màu theo bảng ngưỡng.
5. Vẽ lưới thành 1 ảnh canvas, đặt lên bản đồ Leaflet.

---

## Quy trình thực hiện

```
Bước 1  Khảo sát, xác định yêu cầu
Bước 2  Thu thập dữ liệu (15 điểm đo thực tế)
Bước 3  Nhập dữ liệu vào js/data.js
Bước 4  Xây dựng bản đồ nền Leaflet + OpenStreetMap
Bước 5  Cài đặt thuật toán IDW (js/idw.js)
Bước 6  Vẽ vùng phủ sóng bằng canvas
Bước 7  Vẽ điểm đo + popup thông tin
Bước 8  Thêm chức năng lọc và thống kê
Bước 9  Hoàn thiện giao diện
Bước 10 Kiểm thử và triển khai GitHub Pages
```

---

## Kiểm thử

| # | Test case | Dữ liệu vào | Kết quả mong đợi | Kết quả |
|---|---|---|---|---|
| 1 | Tải trang | Mở `index.html` | Bản đồ hiện, 15 điểm, vùng màu | ✅ Đạt |
| 2 | Popup | Click điểm D5 | Hiện tên, −80 dBm, Rất yếu | ✅ Đạt |
| 3 | Lọc theo mức | Chọn "Rất yếu" | Còn 4 điểm (D5, D6, D12, D14) | ✅ Đạt |
| 4 | Lọc theo tên | Gõ "G5" | Chỉ còn D12, tự zoom | ✅ Đạt |
| 5 | Lọc theo dBm | `> −70` | Hiện điểm mạnh hơn −70 | ✅ Đạt |
| 6 | Xoá lọc | Bấm "Xoá" | Về đủ 15 điểm | ✅ Đạt |
| 7 | Bật/tắt lớp | Bỏ tick "Vùng phủ sóng" | Vùng màu ẩn, điểm vẫn hiện | ✅ Đạt |
| 8 | Thống kê | Tải trang | Rất mạnh 2, Mạnh 3, TB 1, Yếu 5, Rất yếu 4 | ✅ Đạt |
| 9 | Màu đúng | D8 (−57) | Xanh đậm | ✅ Đạt |
| 10 | Màu đúng | D5 (−80) | Đỏ | ✅ Đạt |

---

## Hạn chế và hướng phát triển

### Hạn chế

- Dữ liệu chỉ có **15 điểm**, mật độ thưa nên vùng nội suy ngoài điểm đo mang tính ước lượng.
- IDW **không xét vật cản** (tường, tầng, cây) — chỉ dựa trên khoảng cách.
- Không có dữ liệu **thời gian thực**.
- Tọa độ điểm AP chưa được ghi nhận.

### Hướng phát triển

- Tăng số điểm đo (60–100 điểm) để nội suy chính xác hơn.
- Thêm lớp **vị trí các Access Point** và vẽ vùng phủ theo bán kính.
- Thêm **biểu đồ thống kê** (Chart.js).
- Cho phép **nhập điểm đo trên web** (form).
- Kết nối **dữ liệu thời gian thực** từ cảm biến.
- Xuất **báo cáo PDF** với bản đồ.

---

## Giấy phép

Dự án phục vụ mục đích học tập môn **Hệ thống thông tin địa lý (GIS)** — Trường Đại học Nha Trang.

- Bản đồ nền: © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors
- Thư viện bản đồ: [Leaflet](https://leafletjs.com/) — BSD 2-Clause License

---

## Tác giả

**Lê Minh Trung**
Trường Đại học Nha Trang — Ngành Công nghệ thông tin
