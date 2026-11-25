/* ===================================================
   THUẬT TOÁN IDW - Inverse Distance Weighting
   (Nội suy nghịch đảo khoảng cách)

   Ý tưởng: giá trị tại một điểm bất kỳ bằng
   trung bình có trọng số của tất cả điểm đo.
   Điểm đo càng gần thì trọng số càng lớn.
   Trọng số = 1 / khoảng_cách^2
   =================================================== */

/**
 * Tính lưới IDW từ danh sách điểm đo.
 *
 * @param {Array} diem   - Danh sách điểm đo {viDo, kinhDo, dbm}
 * @param {Number} soDong - Số hàng của lưới
 * @param {Number} soCot  - Số cột của lưới
 * @returns {Object}     - { luoi, latMin, latMax, lngMin, lngMax, soDong, soCot }
 */
function tinhIdw(diem, soDong, soCot) {
    // 1. Tìm khung bao quanh tất cả điểm đo
    var latMin = Infinity, latMax = -Infinity;
    var lngMin = Infinity, lngMax = -Infinity;

    diem.forEach(function (d) {
        if (d.viDo < latMin) latMin = d.viDo;
        if (d.viDo > latMax) latMax = d.viDo;
        if (d.kinhDo < lngMin) lngMin = d.kinhDo;
        if (d.kinhDo > lngMax) lngMax = d.kinhDo;
    });

    // 2. Mở rộng khung một chút (5%) quanh các điểm đo
    var padLat = (latMax - latMin) * 0.05;
    var padLng = (lngMax - lngMin) * 0.05;
    latMin -= padLat; latMax += padLat;
    lngMin -= padLng; lngMax += padLng;

    // 3. Tính lại số cột cho đúng tỉ lệ thực tế của khung
    //    (mỗi ô lưới phải là hình vuông, nếu không ảnh sẽ bị méo)
    var vLatMet = (latMax - latMin) * 111000;                                  // chiều cao (m)
    var langMet = (lngMax - lngMin) * 111000 * Math.cos(((latMin + latMax) / 2) * Math.PI / 180); // chiều rộng (m)

    soCot = Math.max(10, Math.round(soDong * (langMet / vLatMet)));

    // 4. Tính giá trị dBm cho từng ô lưới
    var luoi = [];

    for (var i = 0; i < soDong; i++) {
        var hangMoi = [];

        // Vĩ độ của tâm ô hiện tại
        var lat = latMin + (latMax - latMin) * i / (soDong - 1);

        for (var j = 0; j < soCot; j++) {
            // Kinh độ của tâm ô hiện tại
            var lng = lngMin + (lngMax - lngMin) * j / (soCot - 1);

            var tongTuSo = 0;
            var tongMauSo = 0;

            // Duyệt tất cả điểm đo
            for (var k = 0; k < diem.length; k++) {
                var d = diem[k];

                // Khoảng cách trên mặt phẳng (đổi độ sang mét cho dễ hình dung)
                // 1 độ vĩ độ  ≈ 111.000 m
                // 1 độ kinh độ ≈ 111.000 m × cos(vĩ độ)
                var dx = (d.kinhDo - lng) * 111000 * Math.cos(lat * Math.PI / 180);
                var dy = (d.viDo - lat) * 111000;
                var khoangCach = Math.sqrt(dx * dx + dy * dy);

                // Tránh chia cho 0 khi ô lưới trùng điểm đo
                if (khoangCach < 1) khoangCach = 1;

                // Trọng số nghịch đảo bình phương khoảng cách
                var trongSo = 1 / (khoangCach * khoangCach);

                tongTuSo += d.dbm * trongSo;
                tongMauSo += trongSo;
            }

            hangMoi.push(tongTuSo / tongMauSo);
        }

        luoi.push(hangMoi);
    }

    return {
        luoi: luoi,
        latMin: latMin, latMax: latMax,
        lngMin: lngMin, lngMax: lngMax,
        soDong: soDong, soCot: soCot
    };
}
