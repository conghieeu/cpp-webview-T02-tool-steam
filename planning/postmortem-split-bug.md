# Postmortem: postbuild.js Chunking Bug

## Triệu chứng

Sau khi thêm translations cho es/fr/de/ja vào `src/main.js`, C++ app không nhấn được button nào. Web version (Vite dev server) vẫn chạy hoàn toàn bình thường.

## Sai lầm

3 lần trước đó, tôi chỉ kiểm tra:

- `node --check src/main.js` — syntax OK
- `npm run build` — build thành công
- So sánh `dist/index.html` với `dist/index_html.h` — byte-perfect match
- Kết luận: "code đúng, build pipeline đúng, chắc tại cache hoặc C++ build"

Tôi đã kiểm tra **nội dung** của file mà không kiểm tra **cách file được dùng**. `index_html.h` match với `index.html` về byte — nhưng cách C++ nối các raw string literal lại **thêm ký tự** không có trong file gốc. So sánh byte không phát hiện được lỗi này vì tôi so sánh sai thứ: so sánh input (dist/index.html) với input (dist/index_html.h), thay vì mô phỏng C++ concatenation để ra output thực tế.

## Root Cause

`postbuild.js` bọc mỗi chunk trong raw string literal có `\n` ở đầu và cuối:

```js
// Before (bug)
.map((c) => `R"${delim}(\n${c}\n)${delim}"`)

// Sau khi C++ nối 4 chunk lại, mỗi điểm nối có thêm 2 newlines:
// chunk1 + chunk2 = "...content1\n" + "\ncontent2..."
//                 = "...content1\n\ncontent2..."
```

HTML có inline JavaScript được Vite minify thành **một dòng duy nhất** (~57KB). Khi postbuild.js split ở byte 15500 và 46500, nó cắt ngang giữa:

- `document` → `do\n\ncument` — **SyntaxError: `do` keyword không có `while()`**
- `uppercase` → `upper\n\ncase` — **hỏng string bên trong template literal**
- `pas ?` → `pa\n\ns ?` — **hỏng French translation string**

Lỗi SyntaxError ở split thứ 3 (do\n\ncument) làm toàn bộ `<script type="module">` không execute → không event listener nào được gắn → button chết.

## Fix

Xóa `\n` khỏi chunk wrapping:

```js
// After (fix)
.map((c) => `R"${delim}(${c})${delim}"`)
```

Raw string literal trong C++ cho phép nội dung bắt đầu ngay sau `R"INDEX_HTML(` và kết thúc ngay trước `)INDEX_HTML"`. Các chunk nối nhau không thêm ký tự thừa.

## Bài Học

1. **Kiểm tra output thực tế, không chỉ kiểm tra input.** So sánh byte giữa `dist/index.html` và `dist/index_html.h` chỉ chứng minh postbuild.js ghi đúng input vào header — nó không chứng minh C++ reconstruct ra HTML đúng. Cần simulate C++ concatenation để verify output thật.

2. **"Web chạy, app không chạy" → tập trung vào điểm khác biệt duy nhất.** Web chạy Vite dev server (serve file gốc). App chạy pipeline: Vite build → postbuild.js → C++ compiler → WebView2. Pipeline càng nhiều stage, càng nhiều chỗ hỏng.

3. **Split binary data ở line boundary.** Giải pháp đúng hơn: split ở newline boundary để không cắt ngang token/string. Nhưng Vite minify JS xuống một dòng, nên không có line boundary nào trong vùng JS. Giải pháp thực tế: không thêm ký tự thừa vào raw string literal.

4. **Bug tưởng "khó" nhưng thực ra rất đơn giản.** 3 lần đầu tôi nghĩ "chắc tại C++, tại cache, tại WebView2" — lần nào cũng kiểm tra lung tung. Lần cuối tôi hỏi đúng câu hỏi: "điểm khác biệt giữa web và app là gì?" → nhìn vào postbuild.js → thấy `\n` thừa → xác minh split point rơi vào `document` → fix.
