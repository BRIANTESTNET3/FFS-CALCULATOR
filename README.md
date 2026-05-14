# FFS Calculator – API 579-1/ASME FFS-1 2016

Bộ công cụ tính toán Fitness-For-Service. Hiện có: Part 4 (Level 1 & 2), Part 5 (Level 1 & 2).

---

## Cài đặt & chạy lần đầu

Mở Command Prompt trong thư mục này rồi chạy:

```
npm install
npm start
```

Trình duyệt tự mở tại http://localhost:3000

---

## Đưa lên GitHub

```
git init
git add .
git commit -m "FFS Calculator – Part 4 & 5"
git remote add origin https://github.com/TEN-BAN/ffs-calculator.git
git push -u origin main
```

---

## Deploy lên Netlify

1. Vào netlify.com → Add new site → Import from GitHub
2. Chọn repo ffs-calculator
3. Build command: `npm run build`
4. Publish directory: `build`
5. Click Deploy

---

## Thêm Part mới

1. Tạo file mới trong `src/modules/` (ví dụ: `Part6Level1.js`)
2. Import vào `src/App.js` và thêm vào mảng `MODULES`
3. `git add . && git commit -m "add Part 6" && git push`
4. Netlify tự build và deploy trong ~60 giây

---

## Cấu trúc thư mục

```
src/
  App.js              ← Navigation chính
  App.css             ← Toàn bộ CSS
  modules/
    shared.js         ← Folias Mt, calcMAWP, calcTmin, getQ (dùng chung)
    ResultCard.js     ← Component hiển thị kết quả
    Part4Level1.js
    Part4Level2.js
    Part5Level1.js
    Part5Level2.js
```
