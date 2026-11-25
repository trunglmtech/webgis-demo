/* ===================================================
   KHỞI TẠO BẢN ĐỒ VÀ VẼ DỮ LIỆU
   =================================================== */

// ---------- 1. Tạo bản đồ nền ----------
var map = L.map("banDo", {
    center: [12.2680, 109.2015],
    zoom: 17,
    zoomControl: false
});

L.control.zoom({ position: "bottomright" }).addTo(map);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

L.control.scale({ metric: true, imperial: false, position: "bottomleft" }).addTo(map);

// ---------- 2. Chú giải ----------
var chuGiai = L.control({ position: "topright" });
chuGiai.onAdd = function () {
    var div = L.DomUtil.create("div", "hop-chu-giai");
    var html = "<b>Mức tín hiệu</b>";
    var dsHien = [
        { mau: "#006600", ten: "Rất mạnh (≥ -62 dBm)" },
        { mau: "#66cc66", ten: "Mạnh (-66 → -62)" },
        { mau: "#ffcc00", ten: "Trung bình (-70 → -66)" },
        { mau: "#ff9933", ten: "Yếu (-75 → -70)" },
        { mau: "#cc0000", ten: "Rất yếu (< -75)" }
    ];
    dsHien.forEach(function (m) {
        html += '<div class="dong"><i style="background:' + m.mau + '"></i>' + m.ten + "</div>";
    });
    html += '<div style="margin-top:10px;border-top:1px solid #e0e4e8;padding-top:8px;">' +
            '<div class="dong"><i style="background:#fff;border-radius:50%;border:2px solid #333"></i>Điểm đo</div>' +
            '<div class="dong"><i style="background:#e8d5f2;border:2px solid #7b2d8e"></i>Ranh giới trường</div></div>';
    div.innerHTML = html;
    return div;
};
chuGiai.addTo(map);

// ---------- 3. Vẽ ranh giới khuôn viên trường ----------
function diemTrongDaGiac(lat, lng, daGiac) {
    // Thuật toán tia (ray casting): đếm số lần tia từ điểm cắt qua các cạnh
    var benTrong = false;
    for (var i = 0, j = daGiac.length - 1; i < daGiac.length; j = i++) {
        var yi = daGiac[i][0], xi = daGiac[i][1];
        var yj = daGiac[j][0], xj = daGiac[j][1];

        var cat = ((yi > lat) !== (yj > lat)) &&
                  (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);

        if (cat) benTrong = !benTrong;
    }
    return benTrong;
}

var lopRanhGioi = null;

if (typeof RANH_GIOI_KHUON_VIEN !== "undefined" && RANH_GIOI_KHUON_VIEN.length > 0) {
    lopRanhGioi = L.polygon(RANH_GIOI_KHUON_VIEN, {
        color: "#7b2d8e",
        weight: 2.5,
        fillColor: "#e8d5f2",
        fillOpacity: 0.18,
        dashArray: null
    }).addTo(map);

    // Cho bản đồ tự căn theo ranh giới khuôn viên
    map.fitBounds(lopRanhGioi.getBounds(), { padding: [20, 20] });
}

// ---------- 4. Vẽ vùng phủ sóng IDW (giống bản đồ phủ sóng 4G/5G) ----------
// Gọi server lấy lưới IDW, vẽ thành 1 ảnh canvas rồi đặt lên bản đồ
var lopVungPhu = null;

function veVungPhu() {
    // Tính lưới IDW theo khung RANH GIỚI khuôn viên (không phải khung điểm đo)
    var ketQua = tinhIdw(DIEM_DO, 200, 200, RANH_GIOI_KHUON_VIEN);
    var soDong = ketQua.soDong;
    var soCot = ketQua.soCot;

    // Tạo canvas, mỗi ô lưới = 1 điểm ảnh
    var cv = document.createElement("canvas");
    cv.width = soCot;
    cv.height = soDong;
    var ctx = cv.getContext("2d");

    var anh = ctx.createImageData(soCot, soDong);
    var duLieuAnh = anh.data;

    // Bước lưới (độ)
    var buocLat = (ketQua.latMax - ketQua.latMin) / (soDong - 1);
    var buocLng = (ketQua.lngMax - ketQua.lngMin) / (soCot - 1);

    // Đổ màu từng ô
    // LƯU Ý: lưới tính từ latMin (phía Nam) lên latMax (phía Bắc),
    // nhưng ảnh thì hàng 0 nằm ở TRÊN (phía Bắc). Nên phải đảo thứ tự hàng.
    for (var i = 0; i < soDong; i++) {
        var hangLuoi = soDong - 1 - i;   // đảo hàng
        var latO = ketQua.latMin + buocLat * hangLuoi;

        for (var j = 0; j < soCot; j++) {
            var lngO = ketQua.lngMin + buocLng * j;

            var idx = (i * soCot + j) * 4;

            // Chỉ tô màu nếu ô nằm TRONG ranh giới khuôn viên
            var trongKhuonVien = true;
            if (RANH_GIOI_KHUON_VIEN && RANH_GIOI_KHUON_VIEN.length > 0) {
                trongKhuonVien = diemTrongDaGiac(latO, lngO, RANH_GIOI_KHUON_VIEN);
            }

            if (!trongKhuonVien) {
                // Ngoài khuôn viên: trong suốt
                duLieuAnh[idx + 3] = 0;
                continue;
            }

            var dbm = ketQua.luoi[hangLuoi][j];
            var mauHex = layMau(dbm);

            // Đổi #rrggbb -> r, g, b
            var r = parseInt(mauHex.substr(1, 2), 16);
            var g = parseInt(mauHex.substr(3, 2), 16);
            var b = parseInt(mauHex.substr(5, 2), 16);

            duLieuAnh[idx] = r;
            duLieuAnh[idx + 1] = g;
            duLieuAnh[idx + 2] = b;
            duLieuAnh[idx + 3] = 255;
        }
    }

    ctx.putImageData(anh, 0, 0);

    // Khung tọa độ: latMin/latMax/lngMin/lngMax là TÂM ô đầu và TÂM ô cuối.
    // Mỗi ô rộng đúng 1 bước lưới, nên khung ảnh phải mở rộng thêm nửa bước mỗi phía.
    var khung = [
        [ketQua.latMin - buocLat / 2, ketQua.lngMin - buocLng / 2],
        [ketQua.latMax + buocLat / 2, ketQua.lngMax + buocLng / 2]
    ];

    lopVungPhu = L.imageOverlay(cv.toDataURL(), khung, {
        opacity: 0.72,
        interactive: false
    });

    if (document.getElementById("batVungPhu").checked) {
        lopVungPhu.addTo(map);
    }
}

// ---------- 4. Vẽ điểm đo ----------
var dsMarker = [];

DIEM_DO.forEach(function (d) {
    var marker = L.circleMarker([d.viDo, d.kinhDo], {
        radius: 7,
        fillColor: d.mau,
        color: "#fff",
        weight: 2.5,
        fillOpacity: 1
    });

    // Nội dung popup
    var popup =
        '<span class="popup-tieu-de">' + d.ten + "</span>" +
        '<div class="popup-dong"><span>Cường độ</span><b>' + d.dbm + " dBm</b></div>" +
        '<div class="popup-dong"><span>Mức</span><b style="color:' + d.mau + '">' + d.muc + "</b></div>" +
        '<div class="popup-dong"><span>Vĩ độ</span><span>' + d.viDo.toFixed(6) + "</span></div>" +
        '<div class="popup-dong"><span>Kinh độ</span><span>' + d.kinhDo.toFixed(6) + "</span></div>";

    marker.bindPopup(popup);
    marker.duLieu = d;
    marker.addTo(map);
    dsMarker.push(marker);
});

// Vẽ vùng phủ trước, rồi đưa ranh giới + điểm đo lên trên
veVungPhu();

// Đảm bảo thứ tự lớp: vùng màu (dưới) -> ranh giới -> điểm đo (trên)
if (lopVungPhu) lopVungPhu.bringToBack();
if (lopRanhGioi) lopRanhGioi.bringToFront();
dsMarker.forEach(function (m) { m.bringToFront(); });

// ---------- 5. Bật/tắt vùng phủ sóng ----------
document.getElementById("batVungPhu").addEventListener("change", function () {
    if (!lopVungPhu) return;
    if (this.checked) {
        lopVungPhu.addTo(map);
    } else {
        map.removeLayer(lopVungPhu);
    }
});

// ---------- 6. Thống kê ----------
function capNhatThongKe(dsHienThi) {
    var dem = { "Rất mạnh": 0, "Mạnh": 0, "Trung bình": 0, "Yếu": 0, "Rất yếu": 0 };

    dsHienThi.forEach(function (d) {
        if (dem[d.muc] !== undefined) dem[d.muc]++;
    });

    document.getElementById("tkRatManh").textContent = dem["Rất mạnh"];
    document.getElementById("tkManh").textContent = dem["Mạnh"];
    document.getElementById("tkTrungBinh").textContent = dem["Trung bình"];
    document.getElementById("tkYeu").textContent = dem["Yếu"];
    document.getElementById("tkRatYeu").textContent = dem["Rất yếu"];
    document.getElementById("soDiem").textContent = dsHienThi.length + " điểm đo";
}

capNhatThongKe(DIEM_DO);

// ---------- 7. Chức năng lọc ----------
function thucHienLoc() {
    var tuKhoa = document.getElementById("oTimKiem").value.trim().toLowerCase();
    var mucChon = document.getElementById("oChonMuc").value;
    var phepTinh = document.getElementById("oSoSanh").value;
    var soDb = parseFloat(document.getElementById("oNhapDb").value);

    // Xoá hết marker cũ
    dsMarker.forEach(function (m) { map.removeLayer(m); });

    var dsConLai = [];
    var dsDiemHienThi = [];

    dsMarker.forEach(function (m) {
        var d = m.duLieu;
        var thoa = true;

        // Lọc theo tên
        if (tuKhoa && d.ten.toLowerCase().indexOf(tuKhoa) === -1) thoa = false;

        // Lọc theo mức
        if (mucChon && d.muc !== mucChon) thoa = false;

        // Lọc theo dBm
        if (!isNaN(soDb) && phepTinh) {
            if (phepTinh === ">" && !(d.dbm > soDb)) thoa = false;
            if (phepTinh === "=" && !(d.dbm === soDb)) thoa = false;
            if (phepTinh === "<" && !(d.dbm < soDb)) thoa = false;
        }

        if (thoa) {
            m.addTo(map);
            dsConLai.push(m);
            dsDiemHienThi.push(d);
        }
    });

    // Thống kê theo kết quả lọc
    capNhatThongKe(dsDiemHienThi);

    // Zoom tới vùng có điểm
    if (dsConLai.length > 0) {
        var nhom = L.featureGroup(dsConLai);
        map.fitBounds(nhom.getBounds().pad(0.25));
    }
}

document.getElementById("nutLoc").addEventListener("click", thucHienLoc);

document.getElementById("nutXoa").addEventListener("click", function () {
    document.getElementById("oTimKiem").value = "";
    document.getElementById("oChonMuc").value = "";
    document.getElementById("oSoSanh").value = "";
    document.getElementById("oNhapDb").value = "";
    thucHienLoc();
});

// Bấm Enter trong ô tìm kiếm cũng lọc
document.getElementById("oTimKiem").addEventListener("keydown", function (e) {
    if (e.key === "Enter") thucHienLoc();
});
