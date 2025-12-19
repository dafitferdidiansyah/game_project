document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('hero-list-container');
    
    // Sesuaikan URL dengan API Encyclopedia kamu
    const apiUrlHero = 'http://127.0.0.1:8000/api/heroes/';
    const apiUrlRole = 'http://127.0.0.1:8000/api/roles/';

    // Ambil token dari Login
    const token = localStorage.getItem('gameToken');

    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // --- Logout Logic ---
    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.removeItem('gameToken');
        window.location.href = 'login.html';
    });

    // --- Helper: Load Roles untuk Dropdown ---
    // Kita butuh ini agar saat tambah Hero, kita bisa memilih Role (Tank, Mage, dll)
    let rolesMap = {}; // Untuk menyimpan nama role berdasarkan ID

    async function loadRoles() {
        try {
            const resp = await fetch(apiUrlRole, {
                headers: { 'Authorization': 'Token ' + token }
            });
            const data = await resp.json();
            const select = document.getElementById('hero-role');
            
            // Bersihkan opsi lama kecuali yang pertama
            select.innerHTML = '<option value="">Pilih Role...</option>';

            data.forEach(role => {
                // Simpan ke map agar nanti mudah menampilkan nama role di card
                rolesMap[role.id] = role.nama;

                // Masukkan ke dropdown modal
                const option = document.createElement('option');
                option.value = role.id;
                option.textContent = role.nama;
                select.appendChild(option);
            });
        } catch (err) {
            console.error('Gagal memuat roles:', err);
        }
    }

    // --- Fungsi Render Card Hero ---
    function renderHeroCard(hero, index) {
        // Ambil nama role dari map yang kita buat tadi
        const roleName = rolesMap[hero.role] || 'Unknown Role';

        const col = document.createElement('div');
        col.className = 'col-md-6 col-lg-4';
        
        col.innerHTML = `
            <div class="card h-100 shadow-sm">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start">
                        <h5 class="card-title text-primary fw-bold">${hero.nama}</h5>
                        <span class="badge bg-secondary">${roleName}</span>
                    </div>
                    <p class="card-text mt-2 small text-muted">HP: ${hero.hp_base}</p>
                    <p class="card-text">${hero.lore || '-'}</p>
                </div>
                <div class="card-footer bg-white border-top-0 d-flex justify-content-end gap-2 pb-3">
                    <button class="btn btn-sm btn-outline-warning btn-edit" data-index="${index}">Edit</button>
                    <button class="btn btn-sm btn-outline-danger btn-delete" data-id="${hero.id}">Hapus</button>
                </div>
            </div>
        `;
        return col;
    }

    // --- Load Data Hero ---
    let heroesList = [];

    async function loadHeroes() {
        container.innerHTML = '<div class="col-12 text-center py-5"><div class="spinner-border text-primary"></div></div>';
        
        try {
            const resp = await fetch(apiUrlHero, {
                headers: { 'Authorization': 'Token ' + token }
            });

            if (!resp.ok) throw new Error('Gagal fetch data');

            const data = await resp.json();
            heroesList = data; // Simpan di variabel global untuk akses tombol edit
            
            container.innerHTML = ''; // Hapus spinner

            if (data.length === 0) {
                container.innerHTML = '<div class="col-12 text-center text-muted">Belum ada data Hero.</div>';
                return;
            }

            data.forEach((hero, index) => {
                container.appendChild(renderHeroCard(hero, index));
            });

            attachEventListeners(); // Pasang event click tombol edit/hapus

        } catch (err) {
            console.error(err);
            container.innerHTML = '<div class="alert alert-danger">Gagal memuat data. Pastikan backend menyala.</div>';
        }
    }

    // --- Modal Logic ---
    const heroModal = new bootstrap.Modal(document.getElementById('heroModal'));
    const deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));

    // Tombol Tambah
    document.getElementById('add-hero-btn').addEventListener('click', () => {
        document.getElementById('hero-form').reset();
        document.getElementById('hero-id').value = '';
        document.getElementById('heroModalLabel').textContent = 'Tambah Hero Baru';
        heroModal.show();
    });

    // Event Listener untuk tombol Edit dan Hapus di dalam Card
    function attachEventListeners() {
        // Edit
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = e.target.getAttribute('data-index');
                const hero = heroesList[index];

                document.getElementById('hero-id').value = hero.id;
                document.getElementById('hero-nama').value = hero.nama;
                document.getElementById('hero-role').value = hero.role; // Set dropdown
                document.getElementById('hero-hp').value = hero.hp_base;
                document.getElementById('hero-lore').value = hero.lore;
                
                document.getElementById('heroModalLabel').textContent = 'Edit Hero';
                heroModal.show();
            });
        });

        // Delete
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                // Simpan ID di tombol konfirmasi
                document.getElementById('confirm-delete-btn').setAttribute('data-id', id);
                deleteModal.show();
            });
        });
    }

    // --- Simpan Data (Create / Update) ---
    document.getElementById('hero-save-btn').addEventListener('click', async () => {
        const id = document.getElementById('hero-id').value;
        const nama = document.getElementById('hero-nama').value;
        const role = document.getElementById('hero-role').value;
        const hp = document.getElementById('hero-hp').value;
        const lore = document.getElementById('hero-lore').value;

        if(!nama || !role || !hp) {
            alert("Nama, Role, dan HP wajib diisi!");
            return;
        }

        const payload = {
            nama: nama,
            role: parseInt(role), // Backend butuh integer ID
            hp_base: parseInt(hp),
            lore: lore
        };

        const url = id ? `${apiUrlHero}${id}/` : apiUrlHero;
        const method = id ? 'PUT' : 'POST';

        try {
            const resp = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Token ' + token
                },
                body: JSON.stringify(payload)
            });

            if (!resp.ok) {
                const errData = await resp.json();
                alert("Gagal menyimpan: " + JSON.stringify(errData));
                return;
            }

            heroModal.hide();
            loadHeroes(); // Refresh data

        } catch (err) {
            console.error(err);
            alert("Terjadi kesalahan sistem.");
        }
    });

    // --- Hapus Data ---
    document.getElementById('confirm-delete-btn').addEventListener('click', async (e) => {
        const id = e.target.getAttribute('data-id');
        try {
            const resp = await fetch(`${apiUrlHero}${id}/`, {
                method: 'DELETE',
                headers: { 'Authorization': 'Token ' + token }
            });

            if (!resp.ok) {
                alert("Gagal menghapus data.");
                return;
            }

            deleteModal.hide();
            loadHeroes();

        } catch (err) {
            console.error(err);
        }
    });

    // --- Inisialisasi ---
    // Load Roles dulu, setelah selesai baru load Heroes
    loadRoles().then(() => {
        loadHeroes();
    });
});