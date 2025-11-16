// ============================================
// MODELS CRUD & COMPARISON LOGIC
// ============================================
// File ini menangani CRUD operations untuk AI models dan fitur comparison
// menggunakan AJAX ke Supabase REST API dengan JWT Authorization

// Global variable untuk menyimpan data models
let allModels = [];

// ============================================
// LOAD MODELS - READ OPERATION
// ============================================

// AJAX: Fungsi untuk load semua models dari database
function loadModels() {
    // Show loading indicator
    $('#loadingIndicator').show();
    $('#modelsTableBody').empty();

    // JWT: Get authorization headers dengan JWT token
    const headers = getAuthHeaders();

    // AJAX: GET request ke Supabase untuk mengambil semua models
    $.ajax({
        url: `${SUPABASE_REST_URL}/models?select=*&order=created_at.desc`,
        method: 'GET',
        headers: headers,
        success: function(response) {
            $('#loadingIndicator').hide();

            // Simpan data ke variable global
            allModels = response;

            if (response.length === 0) {
                // jQuery: Tampilkan pesan jika belum ada data
                $('#modelsTableBody').html(`
                    <tr>
                        <td colspan="6" style="text-align: center; padding: 30px;">
                            Belum ada data model AI. Klik tombol "Tambah Model AI" untuk menambahkan.
                        </td>
                    </tr>
                `);
            } else {
                // jQuery: Loop dan tampilkan data ke table
                $.each(response, function(index, model) {
                    const capabilitiesText = formatCapabilities(model.capabilities);

                    // jQuery: Append row ke table body
                    $('#modelsTableBody').append(`
                        <tr data-id="${model.id}">
                            <td>${escapeHtml(model.name)}</td>
                            <td>${escapeHtml(model.provider)}</td>
                            <td>${formatNumber(model.context_length)} tokens</td>
                            <td><span class="badge-score">${model.benchmark_score}</span></td>
                            <td>${capabilitiesText}</td>
                            <td class="action-buttons">
                                <button class="btn-icon btn-edit" data-id="${model.id}" title="Edit">
                                    ✏️
                                </button>
                                <button class="btn-icon btn-delete" data-id="${model.id}" title="Delete">
                                    🗑️
                                </button>
                            </td>
                        </tr>
                    `);
                });
            }
        },
        error: function(xhr) {
            $('#loadingIndicator').hide();

            // JWT: Cek jika error karena unauthorized (token invalid/expired)
            if (xhr.status === 401) {
                showAlert('Session expired. Silakan login kembali.', 'error');
                setTimeout(function() {
                    removeToken();
                    window.location.href = 'login.html';
                }, 2000);
            } else {
                showAlert('Gagal memuat data models.', 'error');
            }
        }
    });
}

// ============================================
// MODAL MANAGEMENT
// ============================================

// jQuery: Event handler untuk tombol Tambah Model
$(document).on('click', '#addModelBtn', function() {
    $('#modalTitle').text('Tambah Model AI');
    $('#modelForm')[0].reset(); // Reset form
    $('#modelId').val(''); // Clear hidden ID field
    $('#modelModal').fadeIn(); // jQuery animation: Show modal
});

// jQuery: Event handler untuk tombol close modal
$(document).on('click', '.close, #cancelBtn', function() {
    $('#modelModal').fadeOut(); // jQuery animation: Hide modal
});

// jQuery: Event handler untuk click di luar modal (close modal)
$(document).on('click', '#modelModal', function(e) {
    if (e.target.id === 'modelModal') {
        $('#modelModal').fadeOut();
    }
});

// ============================================
// CREATE & UPDATE MODEL
// ============================================

// jQuery: Event handler untuk form submit (Create/Update)
$(document).on('submit', '#modelForm', function(e) {
    e.preventDefault();

    // jQuery: Ambil nilai dari form fields
    const modelId = $('#modelId').val();
    const name = $('#modelName').val().trim();
    const provider = $('#modelProvider').val().trim();
    const contextLength = parseInt($('#contextLength').val());
    const benchmarkScore = parseFloat($('#benchmarkScore').val());
    const capabilitiesText = $('#capabilities').val().trim();

    // Validasi
    if (!name || !provider || !contextLength || !benchmarkScore) {
        showAlert('Semua field wajib harus diisi!', 'error');
        return;
    }

    if (benchmarkScore < 0 || benchmarkScore > 100) {
        showAlert('Benchmark score harus antara 0-100!', 'error');
        return;
    }

    // Parse capabilities JSON
    let capabilities = {};
    if (capabilitiesText) {
        try {
            capabilities = JSON.parse(capabilitiesText);
        } catch (error) {
            showAlert('Format JSON capabilities tidak valid!', 'error');
            return;
        }
    }

    // JWT: Get user ID dari token
    const token = getToken();
    const decoded = decodeJWT(token);
    const userId = decoded.sub;

    // Data untuk dikirim
    const modelData = {
        name: name,
        provider: provider,
        context_length: contextLength,
        benchmark_score: benchmarkScore,
        capabilities: capabilities,
        user_id: userId
    };

    // Show loader
    showLoader('#saveModelBtn');

    // JWT: Get authorization headers dengan JWT token
    const headers = getAuthHeaders();

    if (modelId) {
        // AJAX: UPDATE - PUT request untuk update model yang sudah ada
        $.ajax({
            url: `${SUPABASE_REST_URL}/models?id=eq.${modelId}`,
            method: 'PATCH',
            headers: headers,
            data: JSON.stringify(modelData),
            success: function(response) {
                hideLoader('#saveModelBtn');
                $('#modelModal').fadeOut(); // jQuery: Close modal
                showAlert('Model berhasil diupdate!', 'success');

                // Reload table data
                loadModels();
            },
            error: function(xhr) {
                hideLoader('#saveModelBtn');

                // JWT: Cek unauthorized
                if (xhr.status === 401) {
                    showAlert('Session expired. Silakan login kembali.', 'error');
                } else {
                    showAlert('Gagal update model.', 'error');
                }
            }
        });
    } else {
        // AJAX: CREATE - POST request untuk create model baru
        $.ajax({
            url: `${SUPABASE_REST_URL}/models`,
            method: 'POST',
            headers: {
                ...headers,
                'Prefer': 'return=representation'
            },
            data: JSON.stringify(modelData),
            success: function(response) {
                hideLoader('#saveModelBtn');
                $('#modelModal').fadeOut(); // jQuery: Close modal
                showAlert('Model berhasil ditambahkan!', 'success');

                // Reload table data
                loadModels();
            },
            error: function(xhr) {
                hideLoader('#saveModelBtn');

                // JWT: Cek unauthorized
                if (xhr.status === 401) {
                    showAlert('Session expired. Silakan login kembali.', 'error');
                } else {
                    showAlert('Gagal menambahkan model.', 'error');
                }
            }
        });
    }
});

// ============================================
// EDIT MODEL
// ============================================

// jQuery: Event handler untuk tombol edit
$(document).on('click', '.btn-edit', function() {
    const modelId = $(this).data('id');

    // Cari model dari data yang sudah di-load
    const model = allModels.find(m => m.id === modelId);

    if (model) {
        // jQuery: Populate form dengan data model yang akan diedit
        $('#modalTitle').text('Edit Model AI');
        $('#modelId').val(model.id);
        $('#modelName').val(model.name);
        $('#modelProvider').val(model.provider);
        $('#contextLength').val(model.context_length);
        $('#benchmarkScore').val(model.benchmark_score);
        $('#capabilities').val(JSON.stringify(model.capabilities, null, 2));

        // jQuery: Show modal
        $('#modelModal').fadeIn();
    }
});

// ============================================
// DELETE MODEL
// ============================================

// jQuery: Event handler untuk tombol delete
$(document).on('click', '.btn-delete', function() {
    const modelId = $(this).data('id');

    // jQuery: Konfirmasi sebelum delete
    if (!confirm('Apakah Anda yakin ingin menghapus model ini?')) {
        return;
    }

    // JWT: Get authorization headers dengan JWT token
    const headers = getAuthHeaders();

    // AJAX: DELETE request untuk menghapus model
    $.ajax({
        url: `${SUPABASE_REST_URL}/models?id=eq.${modelId}`,
        method: 'DELETE',
        headers: headers,
        success: function(response) {
            showAlert('Model berhasil dihapus!', 'success');

            // jQuery: Remove row dari table dengan animasi
            $(`tr[data-id="${modelId}"]`).fadeOut(300, function() {
                $(this).remove();

                // Cek jika table kosong
                if ($('#modelsTableBody tr').length === 0) {
                    loadModels();
                }
            });
        },
        error: function(xhr) {
            // JWT: Cek unauthorized
            if (xhr.status === 401) {
                showAlert('Session expired. Silakan login kembali.', 'error');
            } else {
                showAlert('Gagal menghapus model.', 'error');
            }
        }
    });
});

// ============================================
// COMPARISON FEATURE
// ============================================

// AJAX: Load models untuk dropdown selection di halaman compare
function loadModelsForComparison() {
    // JWT: Get authorization headers dengan JWT token
    const headers = getAuthHeaders();

    // AJAX: GET request untuk mengambil semua models
    $.ajax({
        url: `${SUPABASE_REST_URL}/models?select=*&order=name.asc`,
        method: 'GET',
        headers: headers,
        success: function(response) {
            allModels = response;

            // jQuery: Populate dropdown options
            $.each(response, function(index, model) {
                const option = `<option value="${model.id}">${escapeHtml(model.name)} (${escapeHtml(model.provider)})</option>`;
                $('#model1Select').append(option);
                $('#model2Select').append(option);
            });
        },
        error: function(xhr) {
            // JWT: Cek unauthorized
            if (xhr.status === 401) {
                showAlert('Session expired. Silakan login kembali.', 'error');
                setTimeout(function() {
                    removeToken();
                    window.location.href = 'login.html';
                }, 2000);
            } else {
                showAlert('Gagal memuat data models.', 'error');
            }
        }
    });
}

// jQuery: Event handler untuk tombol compare
$(document).on('click', '#compareBtn', function() {
    const model1Id = $('#model1Select').val();
    const model2Id = $('#model2Select').val();

    // Validasi
    if (!model1Id || !model2Id) {
        showAlert('Pilih 2 model untuk dibandingkan!', 'error');
        return;
    }

    if (model1Id === model2Id) {
        showAlert('Pilih 2 model yang berbeda!', 'error');
        return;
    }

    // Cari data model dari array
    const model1 = allModels.find(m => m.id === model1Id);
    const model2 = allModels.find(m => m.id === model2Id);

    if (!model1 || !model2) {
        showAlert('Model tidak ditemukan!', 'error');
        return;
    }

    // Tampilkan hasil comparison
    displayComparison(model1, model2);
});

// Fungsi untuk menampilkan hasil comparison
function displayComparison(model1, model2) {
    // jQuery: Populate model 1 data
    $('#model1Name').text(model1.name);
    $('#model1Provider').text(model1.provider);
    $('#model1Context').text(formatNumber(model1.context_length) + ' tokens');
    $('#model1Score').text(model1.benchmark_score);
    $('#model1Capabilities').html(formatCapabilitiesHTML(model1.capabilities));

    // jQuery: Populate model 2 data
    $('#model2Name').text(model2.name);
    $('#model2Provider').text(model2.provider);
    $('#model2Context').text(formatNumber(model2.context_length) + ' tokens');
    $('#model2Score').text(model2.benchmark_score);
    $('#model2Capabilities').html(formatCapabilitiesHTML(model2.capabilities));

    // Populate comparison table
    $('#compTableModel1').text(model1.name);
    $('#compTableModel2').text(model2.name);

    const comparisonRows = [
        {
            aspect: 'Context Length',
            val1: model1.context_length,
            val2: model2.context_length,
            display1: formatNumber(model1.context_length) + ' tokens',
            display2: formatNumber(model2.context_length) + ' tokens',
            higher_better: true
        },
        {
            aspect: 'Benchmark Score',
            val1: model1.benchmark_score,
            val2: model2.benchmark_score,
            display1: model1.benchmark_score,
            display2: model2.benchmark_score,
            higher_better: true
        }
    ];

    // jQuery: Clear dan populate comparison table
    $('#comparisonTableBody').empty();

    $.each(comparisonRows, function(index, row) {
        let winner = '-';
        if (row.higher_better) {
            if (row.val1 > row.val2) {
                winner = model1.name;
            } else if (row.val2 > row.val1) {
                winner = model2.name;
            } else {
                winner = 'Draw';
            }
        }

        $('#comparisonTableBody').append(`
            <tr>
                <td><strong>${row.aspect}</strong></td>
                <td>${row.display1}</td>
                <td>${row.display2}</td>
                <td><span class="winner-badge">${escapeHtml(winner)}</span></td>
            </tr>
        `);
    });

    // jQuery: Show comparison result dengan animasi
    $('#comparisonResult').fadeIn();
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Format capabilities object menjadi string
function formatCapabilities(capabilities) {
    if (!capabilities || Object.keys(capabilities).length === 0) {
        return '<span class="text-muted">-</span>';
    }

    const caps = [];
    for (const [key, value] of Object.entries(capabilities)) {
        if (value) {
            caps.push(key);
        }
    }

    return caps.length > 0 ? caps.join(', ') : '<span class="text-muted">-</span>';
}

// Format capabilities untuk display HTML dengan badges
function formatCapabilitiesHTML(capabilities) {
    if (!capabilities || Object.keys(capabilities).length === 0) {
        return '<span class="text-muted">-</span>';
    }

    let html = '';
    for (const [key, value] of Object.entries(capabilities)) {
        if (value) {
            html += `<span class="capability-badge">${escapeHtml(key)}</span> `;
        }
    }

    return html || '<span class="text-muted">-</span>';
}

// Format number dengan thousand separator
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Escape HTML untuk prevent XSS
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, function(m) { return map[m]; });
}