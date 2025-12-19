document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('skill-list-container');
    
    // URL API (sesuaikan port jika perlu)
    const apiUrlSkill = 'http://127.0.0.1:8000/api/skills/';
    const apiUrlHero = 'http://127.0.0.1:8000/api/heroes/';

    const token = localStorage.getItem('gameToken');

    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // --- 1. Load Data Hero untuk Dropdown & Map Nama ---
    let heroesMap = {}; // Agar kita bisa menampilkan nama hero di kartu skill

    async function loadHeroesForSelect() {
        try {
            const resp = await fetch(apiUrlHero, {
                headers: { 'Authorization': 'Token ' + token }
            });
            const data = await resp.json();
            
            const select = document.getElementById('skill-hero');
            select.innerHTML = '<option value="">Pilih Hero...</option>';

            data.forEach(hero => {
                // Simpan mapping ID -> Nama Hero
                heroesMap[hero.id] = hero.nama;

                // Masukkan ke dropdown modal
                const option = document.createElement('option');
                option.value = hero.id;
                option.textContent = hero.nama;
                select.appendChild(option);
            });
        } catch (err) {
            console.error('Gagal memuat hero:', err);
        }
    }

    // --- 2. Render Kartu Skill ---
    function renderSkillCard(skill, index) {
        // Ambil nama hero dari map, atau tampilkan ID jika tidak ketemu
        const heroName = heroesMap[skill.hero] || `Hero ID: ${skill.hero}`;

        const col = document.createElement('div');
        col.className = 'col-md-6 col-lg-4';
        
        col.innerHTML = `
            <div class="card h-100 shadow-sm border-secondary">
                <div class="card-body">
                    <h5 class="card-title text-success fw-bold">${skill.nama_skill}</h5>
                    <p class="card-subtitle mb-2 text-muted small">Milik: ${heroName}</p>
                    
                    <div class="d-flex justify-content-between mt-3">
                        <span class="badge bg-danger">DMG: ${skill.damage}</span>
                        <span class="badge bg-info text-dark">CD: ${skill.cooldown}s</span>
                    </div>
                </div>
                <div class="card-footer bg-white border-top-0 d-flex justify-content-end gap-2 pb-3">
                    <button class="btn btn-sm btn-outline-warning btn-edit" data-index="${index}">Edit</button>
                    <button class="btn btn-sm btn-outline-danger btn-delete" data-id="${skill.id}">Hapus</button>
                </div>
            </div>
        `;
        return col;
    }

    // --- 3. Load Data Skill ---
    let skillsList = [];

    async function loadSkills() {
        container.innerHTML = '<div class="col-12 text-center py-5"><div class="spinner-border text-success"></div></div>';
        
        try {
            const resp = await fetch(apiUrlSkill, {
                headers: { 'Authorization': 'Token ' + token }
            });

            if (!resp.ok) throw new Error('Gagal fetch data skill');

            const data = await resp.json();
            skillsList = data;
            
            container.innerHTML = ''; 

            if (data.length === 0) {
                container.innerHTML = '<div class="col-12 text-center text-muted">Belum ada data Skill.</div>';
                return;
            }

            data.forEach((skill, index) => {
                container.appendChild(renderSkillCard(skill, index));
            });

            attachEventListeners();

        } catch (err) {
            console.error(err);
            container.innerHTML = '<div class="alert alert-danger">Gagal memuat data skill.</div>';
        }
    }

    // --- 4. Modal & Event Handlers ---
    const skillModal = new bootstrap.Modal(document.getElementById('skillModal'));
    const deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));

    // Tombol Tambah
    document.getElementById('add-skill-btn').addEventListener('click', () => {
        document.getElementById('skill-form').reset();
        document.getElementById('skill-id').value = '';
        document.getElementById('skillModalLabel').textContent = 'Tambah Skill Baru';
        skillModal.show();
    });

    function attachEventListeners() {
        // Edit
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = e.target.getAttribute('data-index');
                const skill = skillsList[index];

                document.getElementById('skill-id').value = skill.id;
                document.getElementById('skill-nama').value = skill.nama_skill;
                document.getElementById('skill-damage').value = skill.damage;
                document.getElementById('skill-cooldown').value = skill.cooldown;
                document.getElementById('skill-hero').value = skill.hero; // Set dropdown hero
                
                document.getElementById('skillModalLabel').textContent = 'Edit Skill';
                skillModal.show();
            });
        });

        // Delete
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                document.getElementById('confirm-delete-btn').setAttribute('data-id', id);
                deleteModal.show();
            });
        });
    }

    // Simpan (POST/PUT)
    document.getElementById('skill-save-btn').addEventListener('click', async () => {
        const id = document.getElementById('skill-id').value;
        const nama = document.getElementById('skill-nama').value;
        const damage = document.getElementById('skill-damage').value;
        const cooldown = document.getElementById('skill-cooldown').value;
        const heroId = document.getElementById('skill-hero').value;

        if(!nama || !damage || !cooldown || !heroId) {
            alert("Semua field wajib diisi!");
            return;
        }

        const payload = {
            nama_skill: nama,
            damage: parseInt(damage),
            cooldown: parseInt(cooldown),
            hero: parseInt(heroId)
        };

        const url = id ? `${apiUrlSkill}${id}/` : apiUrlSkill;
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

            skillModal.hide();
            loadSkills();

        } catch (err) {
            console.error(err);
            alert("Terjadi kesalahan saat menyimpan.");
        }
    });

    // Hapus (DELETE)
    document.getElementById('confirm-delete-btn').addEventListener('click', async (e) => {
        const id = e.target.getAttribute('data-id');
        try {
            const resp = await fetch(`${apiUrlSkill}${id}/`, {
                method: 'DELETE',
                headers: { 'Authorization': 'Token ' + token }
            });

            if (!resp.ok) {
                alert("Gagal menghapus data.");
                return;
            }

            deleteModal.hide();
            loadSkills();

        } catch (err) {
            console.error(err);
        }
    });

    // --- Inisialisasi ---
    // Load Heroes dulu agar map nama terisi, baru load Skills
    loadHeroesForSelect().then(() => {
        loadSkills();
    });
});