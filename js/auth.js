// ============================================
// AUTHENTICATION LOGIC
// ============================================
// File ini menangani semua logic autentikasi menggunakan AJAX dan JWT

// jQuery: Document ready - dipanggil ketika DOM sudah siap
$(document).ready(function() {

    // Pastikan Supabase sudah dikonfigurasi; jika belum, hentikan dan beri tahu user
    if (typeof validateSupabaseConfig === 'function' && !validateSupabaseConfig()) {
        const message = 'Supabase belum dikonfigurasi. Silakan update `js/config.js` dengan SUPABASE_URL dan SUPABASE_ANON_KEY Anda.';
        console.error(message);
        if ($('#alert').length) {
            showAlert(message, 'error');
        } else {
            alert(message);
        }

        // Non-aktifkan tombol submit jika ada
        $('#loginBtn').prop('disabled', true);
        $('#registerBtn').prop('disabled', true);

        // Stop further initialization to avoid failing network calls
        return;
    }


    // ============================================
    // LOGIN FORM HANDLER
    // ============================================

    // jQuery: Event handler untuk form login submit
    $('#loginForm').on('submit', function(e) {
        e.preventDefault(); // Prevent default form submission

        // jQuery: Ambil nilai dari input fields
        const email = $('#email').val().trim();
        const password = $('#password').val();

        // Validasi input
        if (!email || !password) {
            showAlert('Email dan password harus diisi!', 'error');
            return;
        }

        // Show loader
        showLoader('#loginBtn');

        // AJAX: Request login ke Supabase Auth API
        $.ajax({
            url: `${SUPABASE_AUTH_URL}/token?grant_type=password`,
            method: 'POST',
            headers: SUPABASE_HEADERS,
            contentType: 'application/json',
            dataType: 'json',
            data: JSON.stringify({
                email: email,
                password: password
            }),
            success: function(response) {
                // JWT: Simpan access token (JWT) ke localStorage
                saveToken(response.access_token);

                // Simpan user data
                localStorage.setItem('user_data', JSON.stringify(response.user));

                showAlert('Login berhasil! Mengalihkan...', 'success');

                // Redirect ke dashboard setelah 1 detik
                setTimeout(function() {
                    window.location.href = 'dashboard.html';
                }, 1000);
            },
            error: function(xhr) {
                hideLoader('#loginBtn');

                let errorMessage = 'Login gagal. Periksa email dan password Anda.';

                if (xhr.responseJSON && xhr.responseJSON.error_description) {
                    errorMessage = xhr.responseJSON.error_description;
                }

                showAlert(errorMessage, 'error');
            }
        });
    });

    // ============================================
    // REGISTER FORM HANDLER
    // ============================================

    // jQuery: Event handler untuk form register submit
    $('#registerForm').on('submit', function(e) {
        e.preventDefault();

        // jQuery: Ambil nilai dari input fields
        const email = $('#email').val().trim();
        const password = $('#password').val();
        const confirmPassword = $('#confirmPassword').val();

        // Validasi input
        if (!email || !password || !confirmPassword) {
            showAlert('Semua field harus diisi!', 'error');
            return;
        }

        if (password.length < 6) {
            showAlert('Password minimal 6 karakter!', 'error');
            return;
        }

        if (password !== confirmPassword) {
            showAlert('Password dan konfirmasi password tidak sama!', 'error');
            return;
        }

        // Show loader
        showLoader('#registerBtn');

        // AJAX: Request register ke Supabase Auth API
        $.ajax({
            url: `${SUPABASE_AUTH_URL}/signup`,
            method: 'POST',
            headers: SUPABASE_HEADERS,
            contentType: 'application/json',
            dataType: 'json',
            data: JSON.stringify({
                email: email,
                password: password
            }),
            success: function(response) {
                hideLoader('#registerBtn');

                // JWT: Simpan access token (JWT) ke localStorage
                if (response.access_token) {
                    saveToken(response.access_token);
                    localStorage.setItem('user_data', JSON.stringify(response.user));

                    showAlert('Registrasi berhasil! Mengalihkan ke dashboard...', 'success');

                    // Redirect ke dashboard setelah 1.5 detik
                    setTimeout(function() {
                        window.location.href = 'dashboard.html';
                    }, 1500);
                } else {
                    showAlert('Registrasi berhasil! Silakan login.', 'success');

                    // Redirect ke login setelah 2 detik
                    setTimeout(function() {
                        window.location.href = 'login.html';
                    }, 2000);
                }
            },
            error: function(xhr) {
                hideLoader('#registerBtn');

                let errorMessage = 'Registrasi gagal. Silakan coba lagi.';

                if (xhr.responseJSON && xhr.responseJSON.error_description) {
                    errorMessage = xhr.responseJSON.error_description;
                } else if (xhr.responseJSON && xhr.responseJSON.msg) {
                    errorMessage = xhr.responseJSON.msg;
                }

                showAlert(errorMessage, 'error');
            }
        });
    });

    // ============================================
    // LOGOUT HANDLER
    // ============================================

    // jQuery: Event handler untuk tombol logout
    $(document).on('click', '#logoutBtn', function() {
        // JWT: Hapus token dari localStorage
        removeToken();

        showAlert('Logout berhasil!', 'success');

        // Redirect ke login page
        setTimeout(function() {
            window.location.href = 'login.html';
        }, 500);
    });
});

// ============================================
// AUTHENTICATION CHECK FUNCTIONS
// ============================================

// JWT: Fungsi untuk mengecek apakah user sudah login (mengecek JWT token)
function checkAuth() {
    const token = getToken();

    // JWT: Cek apakah token ada dan belum expired
    if (!token || isTokenExpired(token)) {
        // JWT: Token tidak valid, redirect ke login
        removeToken();
        window.location.href = 'login.html';
        return false;
    }

    return true;
}

// JWT: Fungsi untuk mengecek apakah user sudah login di halaman public (login/register)
function checkAlreadyLoggedIn() {
    const token = getToken();

    // JWT: Jika sudah login dan token masih valid, redirect ke dashboard
    if (token && !isTokenExpired(token)) {
        window.location.href = 'dashboard.html';
    }
}

// ============================================
// UI HELPER FUNCTIONS
// ============================================

// jQuery: Fungsi untuk menampilkan alert message
function showAlert(message, type) {
    const $alert = $('#alert');

    // jQuery: Set class berdasarkan tipe (success/error)
    $alert.removeClass('alert-success alert-error')
          .addClass(`alert-${type}`)
          .text(message)
          .fadeIn(); // jQuery animation

    // jQuery: Auto hide alert setelah 5 detik
    setTimeout(function() {
        $alert.fadeOut(); // jQuery animation
    }, 5000);
}

// jQuery: Fungsi untuk show loader pada tombol
function showLoader(buttonSelector) {
    $(buttonSelector).prop('disabled', true); // jQuery: Disable button
    $(buttonSelector).find('.btn-text').hide(); // jQuery: Hide text
    $(buttonSelector).find('.loader').show(); // jQuery: Show loader
}

// jQuery: Fungsi untuk hide loader pada tombol
function hideLoader(buttonSelector) {
    $(buttonSelector).prop('disabled', false); // jQuery: Enable button
    $(buttonSelector).find('.btn-text').show(); // jQuery: Show text
    $(buttonSelector).find('.loader').hide(); // jQuery: Hide loader
}

// ============================================
// AUTO CHECK AUTH ON PUBLIC PAGES
// ============================================

// jQuery: Jika berada di halaman login/register, cek apakah sudah login
$(document).ready(function() {
    const currentPage = window.location.pathname.split('/').pop();

    if (currentPage === 'login.html' || currentPage === 'register.html' || currentPage === '') {
        checkAlreadyLoggedIn();
    }
});