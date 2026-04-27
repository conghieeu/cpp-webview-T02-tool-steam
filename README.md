dùng **Electron làm giao diện (Frontend)** nhưng phần **logic xử lý nặng hoặc hệ thống bên dưới lại viết bằng C++ (Backend)** và quản lý bằng **CMake**. 

Để kết hợp hai thế giới này, sẽ dùng **Node Addon API (N-API)** và công cụ **CMake-js** để "cầu nối" (bridge) giữa JavaScript và C++.

Dưới đây là cấu trúc thư mục và file `README` chuẩn cho mô hình **Electron + C++ Native Addon** này.

Cấu trúc thư mục chuẩn (Hybrid)

```text
cpp-electron-app/
├── src/                # Toàn bộ mã nguồn C++ (Native Addon)
│   ├── main.cpp        # File đăng ký module N-API
│   ├── functions.cpp   # Logic xử lý C++
│   └── functions.hpp
├── app/                # Toàn bộ mã nguồn Electron (JavaScript/TypeScript)
│   ├── main.js         # Electron Main Process
│   ├── preload.js      # Cầu nối bảo mật (Context Bridge)
│   └── renderer.js     # Logic phía giao diện
├── ui/                 # Giao diện người dùng (HTML/CSS)
│   └── index.html
├── docs/               # Tài liệu Markdown (.md)
├── CMakeLists.txt      # Cấu hình build C++ cho Node.js (dùng CMake-js)
├── package.json        # Quản lý dependencies (Electron, CMake-js)
└── README.md           # Tài liệu tổng quan dự 

Dự án sử dụng **Electron (Chromium)** để phát triển giao diện người dùng (Frontend) trực quan, hiện đại. Trong khi đó, toàn bộ logic xử lý nặng, tính toán cốt lõi và tương tác hệ thống cấp thấp (Backend/Core) được viết bằng **C++** và quản lý biên dịch thông qua **CMake**.

Công nghệ & Kiến trúc

1. Giao diện (Frontend)
* **Khung ứng dụng (Framework):** Electron (Chromium & Node.js).
* **Công nghệ:** HTML, CSS, JavaScript.

2. Lõi xử lý (Backend / Native Modules)
* **Ngôn ngữ:** C++ (chuyên xử lý đa luồng, bộ nhớ và các tác vụ nặng).
* **Hệ thống biên dịch (Build System):** CMake.
* **Thư viện C++ tích hợp:**
  * **Abseil:** Bộ thư viện C++ tiêu chuẩn từ Google giúp tối ưu hóa hiệu năng, xử lý chuỗi và đồng bộ hóa.
  * **OpenCV:** Xử lý hình ảnh và thị giác máy tính hiệu năng cao.
  * **BoringSSL:** Đảm nhiệm các tác vụ mã hóa và bảo mật mạng.

⚙️ Yêu cầu hệ thống (Prerequisites)
Để biên dịch và chạy dự án, máy tính của bạn cần cài đặt:
1. **Node.js** 
2. **CMake** 
3. **Trình biên dịch C++:** * Windows: Visual Studio (MSVC)
   * macOS: Xcode / Clang
   * Linux: GCC / G++