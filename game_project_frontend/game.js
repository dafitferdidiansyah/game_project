document.addEventListener('DOMContentLoaded', () => {
    // --- Konfigurasi API ---
    const apiUrlHeroes = 'http://127.0.0.1:8000/api/heroes/';
    const apiUrlSkills = 'http://127.0.0.1:8000/api/skills/';
    const token = localStorage.getItem('gameToken');

    if (!token) {
        alert("Silakan login terlebih dahulu!");
        window.location.href = 'login.html';
        return;
    }

    // --- State Game ---
    let allHeroes = [];
    let allSkills = [];
    
    let player = { data: null, currentHp: 0, skills: [] };
    let enemy = { data: null, currentHp: 0, skills: [] };
    let isPlayerTurn = true;

    // --- 1. Load Data dari Django ---
    async function loadGameData() {
        try {
            // Ambil Hero dan Skill secara paralel
            const [resHeroes, resSkills] = await Promise.all([
                fetch(apiUrlHeroes, { headers: { 'Authorization': 'Token ' + token } }),
                fetch(apiUrlSkills, { headers: { 'Authorization': 'Token ' + token } })
            ]);

            allHeroes = await resHeroes.json();
            allSkills = await resSkills.json();

            populateSelection();
        } catch (err) {
            console.error("Gagal memuat data game", err);
            alert("Gagal koneksi ke server game.");
        }
    }

    // --- 2. Isi Dropdown Pemilihan ---
    function populateSelection() {
        const pSelect = document.getElementById('select-player');
        const eSelect = document.getElementById('select-enemy');

        allHeroes.forEach(hero => {
            const option = `<option value="${hero.id}">${hero.nama} (HP: ${hero.hp_base})</option>`;
            pSelect.innerHTML += option;
            eSelect.innerHTML += option;
        });

        // Pilih lawan random secara default agar beda
        if(allHeroes.length > 1) {
            eSelect.selectedIndex = 1; 
        }
    }

    // --- 3. Mulai Pertarungan ---
    document.getElementById('start-btn').addEventListener('click', () => {
        const pId = parseInt(document.getElementById('select-player').value);
        const eId = parseInt(document.getElementById('select-enemy').value);

        // Setup Player
        const pData = allHeroes.find(h => h.id === pId);
        player.data = pData;
        player.currentHp = pData.hp_base;
        // Filter skill milik hero ini saja
        player.skills = allSkills.filter(s => s.hero === pId);

        // Setup Enemy
        const eData = allHeroes.find(h => h.id === eId);
        enemy.data = eData;
        enemy.currentHp = eData.hp_base;
        enemy.skills = allSkills.filter(s => s.hero === eId);

        if (player.skills.length === 0) {
            alert(`${pData.nama} tidak memiliki skill! Tambahkan skill dulu di menu Dashboard.`);
            return;
        }
        if (enemy.skills.length === 0) {
            alert(`${eData.nama} (Lawan) tidak memiliki skill! Pilih lawan yang tangguh.`);
            return;
        }

        // Tampilkan Arena
        document.getElementById('selection-screen').style.display = 'none';
        document.getElementById('battle-screen').style.display = 'block';

        renderBattleInfo();
        renderPlayerSkills();
        logMessage(`<strong>${player.data.nama}</strong> vs <strong>${enemy.data.nama}</strong> dimulai!`);
    });

    // --- 4. Render Tampilan (Update HP & Nama) ---
    function renderBattleInfo() {
        // Player UI
        document.getElementById('player-name').textContent = player.data.nama;
        document.getElementById('player-max-hp').textContent = player.data.hp_base;
        updateHpBar('player', player.currentHp, player.data.hp_base);

        // Enemy UI
        document.getElementById('enemy-name').textContent = enemy.data.nama;
        document.getElementById('enemy-max-hp').textContent = enemy.data.hp_base;
        updateHpBar('enemy', enemy.currentHp, enemy.data.hp_base);
    }

    function updateHpBar(who, current, max) {
        const percent = Math.max(0, (current / max) * 100);
        const bar = document.getElementById(`${who}-hp-bar`);
        const text = document.getElementById(`${who}-current-hp`);
        
        bar.style.width = percent + '%';
        text.textContent = current;

        // Ubah warna bar jika sekarat
        if (percent < 30) {
            bar.className = 'hp-fill bg-danger';
        } else if (percent < 60) {
            bar.className = 'hp-fill bg-warning';
        } else {
            bar.className = 'hp-fill bg-success';
        }
    }

    // --- 5. Render Tombol Skill Player ---
    function renderPlayerSkills() {
        const container = document.getElementById('player-skills');
        container.innerHTML = '';

        player.skills.forEach(skill => {
            const btn = document.createElement('button');
            btn.className = 'btn btn-outline-light text-start border-2 fw-bold';
            btn.innerHTML = `${skill.nama_skill} <span class="badge bg-danger float-end">-${skill.damage} HP</span>`;
            
            btn.onclick = () => playerAttack(skill);
            container.appendChild(btn);
        });
    }

    // --- 6. Logika Serangan ---
    function playerAttack(skill) {
        if (!isPlayerTurn) return; // Cegah spam klik saat giliran musuh

        // Kurangi HP Musuh
        enemy.currentHp -= skill.damage;
        if (enemy.currentHp < 0) enemy.currentHp = 0;
        
        // Efek Visual
        document.getElementById('enemy-card').classList.add('shake');
        setTimeout(() => document.getElementById('enemy-card').classList.remove('shake'), 500);

        logMessage(`<span class="text-primary">${player.data.nama}</span> menggunakan <strong>${skill.nama_skill}</strong>! Musuh terkena ${skill.damage} DMG.`);
        
        updateHpBar('enemy', enemy.currentHp, enemy.data.hp_base);

        // Cek Menang
        if (enemy.currentHp <= 0) {
            endGame(true);
        } else {
            // Ganti Giliran ke Musuh
            isPlayerTurn = false;
            disablePlayerControls(true);
            document.getElementById('enemy-action-text').textContent = "Sedang berpikir...";
            setTimeout(enemyTurn, 1500); // Jeda biar terasa natural
        }
    }

    function enemyTurn() {
        // AI Sederhana: Pilih skill random
        const randomIdx = Math.floor(Math.random() * enemy.skills.length);
        const skill = enemy.skills[randomIdx];

        // Kurangi HP Player
        player.currentHp -= skill.damage;
        if (player.currentHp < 0) player.currentHp = 0;

        // Efek Visual
        document.getElementById('player-card').classList.add('shake');
        setTimeout(() => document.getElementById('player-card').classList.remove('shake'), 500);

        logMessage(`<span class="text-danger">${enemy.data.nama}</span> membalas dengan <strong>${skill.nama_skill}</strong>! Kamu terkena ${skill.damage} DMG.`);
        document.getElementById('enemy-action-text').textContent = `Menggunakan ${skill.nama_skill}!`;

        updateHpBar('player', player.currentHp, player.data.hp_base);

        // Cek Kalah
        if (player.currentHp <= 0) {
            endGame(false);
        } else {
            // Kembali ke Giliran Player
            isPlayerTurn = true;
            disablePlayerControls(false);
        }
    }

    // --- 7. Utilitas ---
    function logMessage(msg) {
        const log = document.getElementById('battle-log');
        log.innerHTML += `<div>> ${msg}</div>`;
        log.scrollTop = log.scrollHeight; // Auto scroll ke bawah
    }

    function disablePlayerControls(disabled) {
        const btns = document.querySelectorAll('#player-skills button');
        btns.forEach(btn => btn.disabled = disabled);
    }

    function endGame(isWin) {
        disablePlayerControls(true);
        const restartBtn = document.getElementById('restart-btn');
        restartBtn.classList.remove('d-none');
        restartBtn.onclick = () => location.reload();

        if (isWin) {
            logMessage(`<h4 class="text-success fw-bold mt-2">🏆 VICTORY! Kamu Mengalahkan ${enemy.data.nama}!</h4>`);
            document.getElementById('enemy-action-text').textContent = "Tumbang X_X";
        } else {
            logMessage(`<h4 class="text-danger fw-bold mt-2">💀 DEFEAT! Kamu Kalah...</h4>`);
            document.getElementById('player-name').textContent += " (Tumbang)";
        }
    }

    // Jalankan saat load
    loadGameData();
});