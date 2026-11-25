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
            '<div class="dong"><i style="background:#fff;border-radius:50%;border:2px solid #333"></i>Điểm đo</div></div>';
    div.innerHTML = html;
    return div;
};
chuGiai.addTo(map);

// ---------- 3. Vẽ vùng phủ sóng IDW ----------
var lopVungPhu = null;

function veVungPhu() {
    // Tính lưới IDW: số hàng cố định, số cột tự tính theo tỉ lệ khung
    var ketQua = tinhIdw(DIEM_DO, 150, 200);
    var soDong = ketQua.soDong;
    var soCot = ketQua.soCot;

    // Tạo canvas, mỗi ô lưới = 1 điểm ảnh
    var cv = document.createElement("canvas");
    cv.width = soCot;
    cv.height = soDong;
    var ctx = cv.getContext("2d");

    var anh = ctx.createImageData(soCot, soDong);
    var duLieuAnh = anh.data;

    // Đổ màu từng ô
    for (var i = 0; i < soDong; i++) {
        for (var j = 0; j < soCot; j++) {
            var dbm = ketQua.luoi[i][j];
            var mauHex = layMau(dbm);

            // Đổi #rrggbb -> r, g, b
            var r = parseInt(mauHex.substr(1, 2), 16);
            var g = parseInt(mauHex.substr(3, 2), 16);
            var b = parseInt(mauHex.substr(5, 2), 16);

            var idx = (i * soCot + j) * 4;
            duLieuAnh[idx] = r;
            duLieuAnh[idx + 1] = g;
            duLieuAnh[idx + 2] = b;
            duLieuAnh[idx + 3] = 255;
        }
    }

    ctx.putImageData(anh, 0, 0);

    // Khung tọa độ: latMin/latMax/lngMin/lngMax là TÂM ô đầu và TÂM ô cuối.
    // Mỗi ô rộng đúng 1 bước lưới, nên khung ảnh phải mở rộng thêm nửa bước mỗi phía.
    var buocLat = (ketQua.latMax - ketQua.latMin) / (soDong - 1);
    var buocLng = (ketQua.lngMax - ketQua.lngMin) / (soCot - 1);

    var khung = [
        [ketQua.latMin - buocLat / 2, ketQua.lngMin - buocLng / 2],
        [ketQua.latMax + buocLat / 2, ketQua.lngMax + buocLng / 2]
    ];

    lopVungPhu = L.imageOverlay(cv.toDataURL(), khung, {
        opacity: 0.62,
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

// Vẽ vùng phủ trước, điểm đo đè lên trên
veVungPhu();

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
