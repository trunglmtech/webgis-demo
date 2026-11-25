/* ===================================================
   DỮ LIỆU ĐIỂM ĐO WIFI
   15 điểm đo thực tế trong khuôn viên Trường ĐH Nha Trang
   =================================================== */

var DIEM_DO = [
    { ten: "D1 - TTTD", viDo: 12.2685760, kinhDo: 109.2022400, dbm: -75 },
    { ten: "D2 - G1", viDo: 12.2687800, kinhDo: 109.2039520, dbm: -65 },
    { ten: "D3 - G2", viDo: 12.2682570, kinhDo: 109.2043320, dbm: -62 },
    { ten: "D4 - K8", viDo: 12.2691430, kinhDo: 109.2025770, dbm: -75 },
    { ten: "D5 - Vô danh", viDo: 12.2678340, kinhDo: 109.2037250, dbm: -80 },
    { ten: "D6 - K7", viDo: 12.2682600, kinhDo: 109.1989720, dbm: -77 },
    { ten: "D7 - HT3", viDo: 12.2689097, kinhDo: 109.1995465, dbm: -75 },
    { ten: "D8 - NDN", viDo: 12.2670510, kinhDo: 109.2000630, dbm: -57 },
    { ten: "D9 - G6", viDo: 12.2671195, kinhDo: 109.2003864, dbm: -64 },
    { ten: "D10 - G7", viDo: 12.2675504, kinhDo: 109.1999250, dbm: -65 },
    { ten: "D11 - Cổng trường", viDo: 12.2685080, kinhDo: 109.2010550, dbm: -75 },
    { ten: "D12 - G5", viDo: 12.2673120, kinhDo: 109.2014370, dbm: -79 },
    { ten: "D13 - G4", viDo: 12.2673080, kinhDo: 109.2014450, dbm: -71 },
    { ten: "D14 - Phòng đào tạo", viDo: 12.2673370, kinhDo: 109.2019940, dbm: -78 },
    { ten: "D15 - Nhà cựu sinh viên", viDo: 12.2681710, kinhDo: 109.2015480, dbm: -70 }
];

/* ===================================================
   NGƯỠNG PHÂN LOẠI VÀ MÀU
   dBm cao (mạnh)  -> xanh
   dBm thấp (yếu)  -> đỏ
   =================================================== */

var CAC_MUC = [
    { ten: "Rất mạnh",   min: -62,  mau: "#006600" },
    { ten: "Mạnh",       min: -66,  mau: "#66cc66" },
    { ten: "Trung bình", min: -70,  mau: "#ffcc00" },
    { ten: "Yếu",        min: -75,  mau: "#ff9933" },
    { ten: "Rất yếu",    min: -999, mau: "#cc0000" }
];

// Trả về tên mức của một giá trị dBm
function layMuc(dbm) {
    for (var i = 0; i < CAC_MUC.length; i++) {
        if (dbm >= CAC_MUC[i].min) return CAC_MUC[i].ten;
    }
    return "Rất yếu";
}

// Trả về mã màu của một giá trị dBm
function layMau(dbm) {
    for (var i = 0; i < CAC_MUC.length; i++) {
        if (dbm >= CAC_MUC[i].min) return CAC_MUC[i].mau;
    }
    return "#cc0000";
}

// Gắn thêm thuộc tính "muc" và "mau" cho từng điểm
DIEM_DO.forEach(function (d) {
    d.muc = layMuc(d.dbm);
    d.mau = layMau(d.dbm);
});
