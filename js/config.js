// ============================================
// SUPABASE CONFIGURATION
// ============================================
// File ini berisi konfigurasi untuk koneksi ke Supabase
// PENTING: Ganti SUPABASE_URL dan SUPABASE_ANON_KEY dengan kredensial Anda

const SUPABASE_URL = 'https://wdwzowefjebfvkgxiake.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indkd3pvd2VmamViZnZrZ3hpYWtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyNjYyNTksImV4cCI6MjA3ODg0MjI1OX0.yK2YRr0G9aeOHaur2VEG2cMgusTie42KUqn9piarI58';

// Supabase API endpoints
const SUPABASE_AUTH_URL = `${SUPABASE_URL}/auth/v1`;
const SUPABASE_REST_URL = `${SUPABASE_URL}/rest/v1`;

// Headers untuk Supabase requests
const SUPABASE_HEADERS = {
    'apikey': SUPABASE_ANON_KEY,
    'Content-Type': 'application/json'
};

// Utility: Validasi apakah pengaturan Supabase sudah diganti dari placeholder
function validateSupabaseConfig() {
    if (!SUPABASE_URL || SUPABASE_URL.includes('YOUR_')) return false;
    if (!SUPABASE_ANON_KEY || SUPABASE_ANON_KEY.includes('YOUR_')) return false;
    return true;
}

// ============================================
// JWT HELPER FUNCTIONS
// ============================================

// JWT: Fungsi untuk menyimpan JWT token ke localStorage
function saveToken(token) {
    localStorage.setItem('jwt_token', token);
}

// JWT: Fungsi untuk mengambil JWT token dari localStorage
function getToken() {
    return localStorage.getItem('jwt_token');
}

// JWT: Fungsi untuk menghapus JWT token dari localStorage (logout)
function removeToken() {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_data');
}

// JWT: Fungsi untuk mendecode JWT token dan mendapatkan payload
function decodeJWT(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (error) {
        console.error('Error decoding JWT:', error);
        return null;
    }
}

// JWT: Fungsi untuk mengecek apakah JWT token sudah expired
function isTokenExpired(token) {
    if (!token) return true;

    const decoded = decodeJWT(token);
    if (!decoded || !decoded.exp) return true;

    // exp dalam JWT adalah dalam seconds, Date.now() adalah dalam milliseconds
    const currentTime = Date.now() / 1000;
    return decoded.exp < currentTime;
}

// JWT: Fungsi untuk mendapatkan header Authorization dengan JWT token
function getAuthHeaders() {
    const token = getToken();
    return {
        ...SUPABASE_HEADERS,
        'Authorization': `Bearer ${token}`
    };
}