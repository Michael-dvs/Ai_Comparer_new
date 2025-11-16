# AI Comparer

Aplikasi web untuk membandingkan berbagai model AI. Dibangun dengan HTML, CSS, JavaScript murni, jQuery, dan Supabase.

## 🚀 Fitur

- ✅ **Autentikasi** - Login & Register menggunakan Supabase Auth dengan JWT
- ✅ **Dashboard** - Menampilkan daftar model AI dengan fitur CRUD lengkap
- ✅ **Tambah Model** - Form untuk menambahkan model AI baru
- ✅ **Edit Model** - Update informasi model yang sudah ada
- ✅ **Hapus Model** - Delete model dari database
- ✅ **Compare Models** - Bandingkan 2 model AI secara detail
- ✅ **Protected Routes** - Halaman dilindungi dengan JWT authentication

## 🛠️ Teknologi

- **Frontend**: HTML5, CSS3, JavaScript (ES6)
- **Library**: jQuery 3.6.0
- **Backend**: Supabase (Database + Auth)
- **Authentication**: JWT (JSON Web Token)
- **HTTP Requests**: AJAX

## 📋 Persyaratan

- Akun Supabase (gratis di [supabase.com](https://supabase.com))
- Web browser modern
- Node.js & npm (untuk development server)

## 🔧 Setup Supabase

### 1. Buat Project Supabase

1. Buka [supabase.com](https://supabase.com) dan login/register
2. Klik "New Project"
3. Isi nama project, database password, dan pilih region
4. Tunggu hingga project selesai dibuat

### 2. Dapatkan API Credentials

1. Di dashboard Supabase, buka **Settings** → **API**
2. Copy dua nilai berikut:
   - **Project URL** (contoh: `https://xxxxx.supabase.co`)
   - **anon public key** (key yang panjang)

### 3. Konfigurasi Database

Database sudah otomatis dibuat dengan tabel `models`. Schema tabel:

```sql
-- Tabel: models
- id (uuid, primary key)
- name (text) - Nama model AI
- provider (text) - Provider/pembuat model
- context_length (integer) - Panjang context dalam tokens
- capabilities (jsonb) - Kemampuan model dalam format JSON
- benchmark_score (decimal) - Skor benchmark 0-100
- created_at (timestamptz) - Waktu pembuatan
- user_id (uuid) - ID user yang membuat (foreign key ke auth.users)
```

**Row Level Security (RLS)** sudah diaktifkan dengan policy:
- Semua authenticated users dapat melihat semua models
- User hanya bisa insert/update/delete model mereka sendiri

### 4. Konfigurasi Aplikasi

Edit file `js/config.js` dan ganti kredensial Supabase:

```javascript
const SUPABASE_URL = 'https://xxxxx.supabase.co'; // Ganti dengan URL project Anda
const SUPABASE_ANON_KEY = 'eyJxxx...'; // Ganti dengan anon key Anda
```

## 🚀 Cara Menjalankan

### Development (dengan Vite)

```bash
# Install dependencies
npm install

# Jalankan development server
npm run dev
```

Buka browser dan akses `http://localhost:5173`

### Production

```bash
# Build untuk production
npm run build

# Preview production build
npm run preview
```

### Hosting Statis

Aplikasi ini adalah static web app, bisa di-host di:
- Vercel
- Netlify
- GitHub Pages
- Firebase Hosting
- Atau web server biasa (Apache, Nginx)

## 📁 Struktur File

```
ai-comparer/
├── index.html              # Redirect ke login
├── login.html              # Halaman login
├── register.html           # Halaman register
├── dashboard.html          # Dashboard CRUD models
├── compare.html            # Halaman compare models
├── css/
│   └── style.css          # Semua styling aplikasi
├── js/
│   ├── config.js          # Konfigurasi Supabase & JWT helpers
│   ├── auth.js            # Logic autentikasi (login/register/logout)
│   └── models.js          # Logic CRUD models & comparison
├── package.json
└── README.md
```

## 🔐 Cara Kerja Authentication (JWT)

### Login Flow:
1. User input email & password di `login.html`
2. AJAX POST ke `${SUPABASE_URL}/auth/v1/token?grant_type=password`
3. Supabase return JWT access token
4. Token disimpan di `localStorage` dengan key `jwt_token`
5. Redirect ke dashboard

### Protected Routes:
1. Setiap halaman protected memanggil `checkAuth()`
2. Fungsi `checkAuth()` mengecek:
   - Apakah JWT token ada di localStorage?
   - Apakah token belum expired? (decode JWT dan cek `exp` field)
3. Jika tidak valid, redirect ke login

### API Request dengan JWT:
```javascript
// Header untuk setiap AJAX request ke Supabase
{
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': 'Bearer ' + JWT_TOKEN,
  'Content-Type': 'application/json'
}
```

## 📡 Contoh AJAX Request

### GET - Read Models
```javascript
$.ajax({
    url: `${SUPABASE_REST_URL}/models?select=*`,
    method: 'GET',
    headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${jwt_token}`,
        'Content-Type': 'application/json'
    },
    success: function(response) {
        console.log(response); // Array of models
    }
});
```

### POST - Create Model
```javascript
$.ajax({
    url: `${SUPABASE_REST_URL}/models`,
    method: 'POST',
    headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${jwt_token}`,
        'Content-Type': 'application/json'
    },
    data: JSON.stringify({
        name: 'GPT-4',
        provider: 'OpenAI',
        context_length: 128000,
        benchmark_score: 86.4,
        capabilities: {"text": true, "vision": true},
        user_id: user_id
    }),
    success: function(response) {
        console.log('Model created:', response);
    }
});
```

### PATCH - Update Model
```javascript
$.ajax({
    url: `${SUPABASE_REST_URL}/models?id=eq.${model_id}`,
    method: 'PATCH',
    headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${jwt_token}`,
        'Content-Type': 'application/json'
    },
    data: JSON.stringify({
        name: 'GPT-4 Turbo',
        benchmark_score: 87.2
    }),
    success: function(response) {
        console.log('Model updated');
    }
});
```

### DELETE - Delete Model
```javascript
$.ajax({
    url: `${SUPABASE_REST_URL}/models?id=eq.${model_id}`,
    method: 'DELETE',
    headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${jwt_token}`,
        'Content-Type': 'application/json'
    },
    success: function(response) {
        console.log('Model deleted');
    }
});
```

## 🎯 Fitur CRUD

### Create (Tambah Model)
1. Klik tombol "Tambah Model AI" di dashboard
2. Isi form: name, provider, context length, benchmark score, capabilities (JSON)
3. Submit → AJAX POST ke Supabase
4. Table auto refresh

### Read (Lihat Models)
1. Dashboard otomatis load semua models saat page load
2. AJAX GET ke `/models?select=*&order=created_at.desc`
3. Data ditampilkan di table dengan jQuery

### Update (Edit Model)
1. Klik tombol edit (✏️) di row table
2. Modal muncul dengan form terisi data model
3. Edit data → Submit → AJAX PATCH ke Supabase
4. Table auto refresh

### Delete (Hapus Model)
1. Klik tombol delete (🗑️) di row table
2. Confirm dialog muncul
3. AJAX DELETE ke Supabase
4. Row dihapus dari table dengan animasi fade out

## 🔍 Fitur Compare

1. Pilih 2 model berbeda dari dropdown
2. Klik "Bandingkan"
3. Sistem menampilkan:
   - Card detail masing-masing model
   - Tabel perbandingan context length & benchmark score
   - Winner badge untuk setiap aspek

## 📝 Contoh Data Model

```json
{
  "name": "GPT-4",
  "provider": "OpenAI",
  "context_length": 128000,
  "benchmark_score": 86.4,
  "capabilities": {
    "text": true,
    "vision": true,
    "code": true,
    "function_calling": true
  }
}
```

```json
{
  "name": "Claude 3 Opus",
  "provider": "Anthropic",
  "context_length": 200000,
  "benchmark_score": 88.7,
  "capabilities": {
    "text": true,
    "vision": true,
    "code": true,
    "long_context": true
  }
}
```

## 🎨 Komentar Kode

Setiap file JavaScript memiliki komentar lengkap untuk:
- **jQuery**: Penggunaan jQuery selectors dan methods
- **AJAX**: Semua request AJAX ke Supabase REST API
- **JWT**: Handling JWT token (save, get, decode, validate)

## 🐛 Troubleshooting

### Error: "Invalid API key"
- Pastikan `SUPABASE_ANON_KEY` sudah benar di `js/config.js`

### Error: "JWT expired"
- Token JWT expire setelah 1 jam (default Supabase)
- User harus login ulang
- Aplikasi otomatis redirect ke login jika detect token expired

### Error: "Row Level Security policy violation"
- Pastikan user sudah login (JWT valid)
- Cek RLS policies di Supabase dashboard

### Data tidak muncul
- Buka browser console (F12) dan cek error
- Pastikan CORS tidak block request
- Cek network tab untuk melihat response dari Supabase

## 📚 Dokumentasi Referensi

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth API](https://supabase.com/docs/reference/javascript/auth-api)
- [Supabase REST API](https://supabase.com/docs/guides/api)
- [jQuery Documentation](https://api.jquery.com/)
- [JWT.io](https://jwt.io/)

## 📄 Lisensi

MIT License - Bebas digunakan untuk keperluan pribadi maupun komersial.

## 👨‍💻 Author

Proyek ini dibuat sebagai contoh implementasi pure HTML/CSS/JavaScript dengan Supabase dan JWT authentication.

---

**Happy Coding! 🚀**