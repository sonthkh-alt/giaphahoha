# 🏛️ Gia phả dòng họ Hà — Yên Bái, Yên Định, Thanh Hóa

Website gia phả dòng họ Hà bắt nguồn từ cụ tổ **Hà Ngọc Quán** và cụ bà **Trịnh Thị Ngạc**. Trang web lưu trữ thông tin 180+ thành viên qua nhiều thế hệ.

## ✨ Tính năng

- 🌳 **Cây gia phả tương tác** — Từ cụ tổ đến con cháu hiện tại
- 👤 **180+ thành viên** — Thông tin chi tiết mỗi người
- 📱 **Mobile-friendly** — Responsive trên mọi thiết bị
- 🎨 **Thiết kế truyền thống Việt Nam** — Tone màu đỏ, vàng, nâu đất
- 🔍 **Tìm kiếm & lọc** — Theo tên, còn sống/đã mất
- 🕊️ **Đánh dấu người đã mất** — Icon và styling riêng
- 💑 **Quan hệ gia đình** — Cha mẹ, vợ chồng, con cái
- ⚡ **Static site** — Deploy dễ dàng lên GitHub Pages

## 📊 Dữ liệu gia phả

- **Cụ tổ**: Hà Ngọc Quán (id: "quan") & Trịnh Thị Ngạc (id: "ngac")
- **Tổng số thành viên**: 180 người
- **Cấu trúc**: Multi-generational family tree
- **Thông tin**: Tên, sinh/mất, giới tính, quan hệ, quê quán, tiểu sử

## 🚀 Cách sử dụng

### Xem trực tiếp
```bash
cd ha-giapha
python3 -m http.server 8080
# Mở http://localhost:8080
```

### Deploy lên GitHub Pages
1. Tạo repository mới trên GitHub
2. Push code:
```bash
git init
git add .
git commit -m "🏛️ Gia phả dòng họ Hà"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/ha-giapha.git
git push -u origin main
```
3. Settings → Pages → Deploy from branch `main`
4. Truy cập: `https://YOUR_USERNAME.github.io/ha-giapha/`

## 📁 Cấu trúc project

```
ha-giapha/
├── index.html          # Trang chính (15KB)
├── styles.css          # CSS styling (25KB)
├── script.js           # JavaScript logic (15KB)
├── data/
│   └── family.json     # Dữ liệu 180 thành viên
├── test.html           # Test page
└── README.md           # Documentation
```

## 📝 Cấu trúc dữ liệu

Mỗi thành viên có format:
```json
{
  "id": "unique_id",
  "name": "Hà Ngọc Quán",
  "birthDate": "1899-01-01",
  "deathYear": "1965",
  "isDeceased": true,
  "gender": "Male", // hoặc "Female"
  "fatherId": "father_id",
  "motherId": "mother_id", 
  "spouseId": "spouse_id",
  "hometown": "Yên Bái, Yên Định, Thanh Hóa",
  "bio": "Cụ tổ chi thứ họ Hà...",
  "photoUrl": null, // base64 photos stripped
  "status": "approved"
}
```

## ✏️ Chỉnh sửa dữ liệu

1. Mở `data/family.json`
2. Thêm/sửa thành viên theo cấu trúc trên
3. Đảm bảo `id` unique và `fatherId`/`motherId` reference đúng
4. Refresh website

## 🎨 Tùy chỉnh giao diện

Chỉnh CSS variables trong `styles.css`:
```css
:root {
  --color-primary: #8B1A1A;      /* Đỏ chính */
  --color-gold: #D4A843;          /* Vàng */
  --color-earth: #6B4226;         /* Nâu đất */
  --color-cream: #FFF8E7;         /* Kem */
}
```

## 📸 Photos

- Base64 photos đã được strip khỏi JSON (quá lớn)
- PhotoUrl hiện tại = null cho tất cả members
- Để thêm photos: host images riêng và update photoUrl

## 🛠️ Tech Stack

- **HTML5 + CSS3 + Vanilla JavaScript**
- **No frameworks, no build tools**
- **Google Fonts**: Noto Serif, Nunito, Playfair Display
- **Mobile-first responsive design**
- **Static site - works offline**

## ✅ Features implemented

- ✅ Vietnamese family genealogy tree
- ✅ 180+ family members from real data
- ✅ Root ancestors: Hà Ngọc Quán & Trịnh Thị Ngạc
- ✅ Interactive member details modal
- ✅ Search and filter functionality
- ✅ Mobile responsive design
- ✅ Traditional Vietnamese aesthetic
- ✅ Deceased member marking
- ✅ Base64 photo stripping for git
- ✅ Static site (GitHub Pages ready)
- ✅ Clean, working code

## 📄 License

© 2026 Dòng họ Hà - Yên Bái, Yên Định, Thanh Hóa

---

*"Uống nước nhớ nguồn"* 🏛️