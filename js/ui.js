// User Interface, HUD, Shop System, Missions, and Local Storage Manager
class UIManager {
    constructor() {
        this.highScore = parseInt(localStorage.getItem('metrorush_highscore') || '0', 10);
        this.totalCoins = parseInt(localStorage.getItem('metrorush_total_coins') || '0', 10);
        this.unlockedChars = JSON.parse(localStorage.getItem('metrorush_unlocked_chars') || '["dash"]');
        this.unlockedBoards = JSON.parse(localStorage.getItem('metrorush_unlocked_boards') || '["neon"]');

        this.selectedChar = localStorage.getItem('metrorush_selected_char') || 'dash';
        this.selectedBoard = localStorage.getItem('metrorush_selected_board') || 'neon';
        this.shopTab = 'chars'; // 'chars', 'boards', or 'upgrades'

        this.upgrades = JSON.parse(localStorage.getItem('metrorush_upgrades') || JSON.stringify({
            magnet: 1,
            jetpack: 1,
            slowmo: 1,
            blast: 1
        }));

        this.toastTimer = null;
        this.countdownTimer = null;
        this.isSpinning = false;

        // Default Hall of Fame Leaderboard
        const defaultLeaderboard = [
            { name: 'ApexRunner', score: 48500, date: 'Today' },
            { name: 'CyberDash', score: 39200, date: 'Today' },
            { name: 'NeonGhost', score: 31400, date: 'Yesterday' },
            { name: 'SkySurfer', score: 26800, date: '2d ago' },
            { name: 'DevilDodger', score: 21900, date: '3d ago' }
        ];
        this.leaderboard = JSON.parse(localStorage.getItem('metrorush_leaderboard') || JSON.stringify(defaultLeaderboard));
    }

    init() {
        this.bindElements();
        this.updateMenuStats();
        this.renderShop();
        this.renderLeaderboard();
        this.initPWA();
    }

    initPWA() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('./sw.js').catch(() => {});
            });
        }
    }

    bindElements() {
        // Screens
        this.startScreen = document.getElementById('start-screen');
        this.hudScreen = document.getElementById('hud-screen');
        this.gameOverScreen = document.getElementById('game-over-screen');
        this.pauseScreen = document.getElementById('pause-screen');
        this.shopModal = document.getElementById('shop-modal');
        this.missionsModal = document.getElementById('missions-modal');
        this.leaderboardModal = document.getElementById('leaderboard-modal');
        this.wheelModal = document.getElementById('wheel-modal');

        // HUD text elements
        this.scoreDisplay = document.getElementById('hud-score');
        this.coinsDisplay = document.getElementById('hud-coins');
        this.distanceDisplay = document.getElementById('hud-distance');
        this.highScoreDisplay = document.getElementById('hud-highscore');
        this.comboBadge = document.getElementById('hud-combo-badge');

        // Buttons
        document.getElementById('btn-play').addEventListener('click', () => this.startGame());
        document.getElementById('btn-restart').addEventListener('click', () => this.startGame());
        document.getElementById('btn-pause').addEventListener('click', () => {
            if (window.game) window.game.togglePause();
        });
        document.getElementById('btn-resume').addEventListener('click', () => this.resumeGameWithCountdown());
        document.getElementById('btn-menu').addEventListener('click', () => this.returnToMenu());

        document.getElementById('btn-shop').addEventListener('click', () => this.openShop(true));
        document.getElementById('btn-close-shop').addEventListener('click', () => this.openShop(false));
        document.getElementById('btn-gameover-shop').addEventListener('click', () => {
            this.gameOverScreen.classList.add('hidden');
            this.openShop(true);
        });

        document.getElementById('btn-missions').addEventListener('click', () => this.openMissions(true));
        document.getElementById('btn-close-missions').addEventListener('click', () => this.openMissions(false));

        // Leaderboard
        const btnLb = document.getElementById('btn-leaderboard');
        if (btnLb) btnLb.addEventListener('click', () => this.openLeaderboard(true));
        const btnCloseLb = document.getElementById('btn-close-leaderboard');
        if (btnCloseLb) btnCloseLb.addEventListener('click', () => this.openLeaderboard(false));

        // Lucky Spin Wheel
        const btnWheel = document.getElementById('btn-wheel');
        if (btnWheel) btnWheel.addEventListener('click', () => this.openWheel(true));
        const btnCloseWheel = document.getElementById('btn-close-wheel');
        if (btnCloseWheel) btnCloseWheel.addEventListener('click', () => this.openWheel(false));
        const btnSpin = document.getElementById('btn-spin-wheel');
        if (btnSpin) btnSpin.addEventListener('click', () => this.spinWheel());

        // Shop Tabs (Characters vs Hoverboards vs Upgrades)
        const tabChars = document.getElementById('tab-shop-chars');
        const tabBoards = document.getElementById('tab-shop-boards');
        const tabUpgrades = document.getElementById('tab-shop-upgrades');
        if (tabChars && tabBoards) {
            tabChars.addEventListener('click', () => {
                this.shopTab = 'chars';
                tabChars.classList.add('active');
                tabBoards.classList.remove('active');
                if (tabUpgrades) tabUpgrades.classList.remove('active');
                this.renderShop();
            });
            tabBoards.addEventListener('click', () => {
                this.shopTab = 'boards';
                tabBoards.classList.add('active');
                tabChars.classList.remove('active');
                if (tabUpgrades) tabUpgrades.classList.remove('active');
                this.renderShop();
            });
            if (tabUpgrades) {
                tabUpgrades.addEventListener('click', () => {
                    this.shopTab = 'upgrades';
                    tabUpgrades.classList.add('active');
                    tabChars.classList.remove('active');
                    tabBoards.classList.remove('active');
                    this.renderShop();
                });
            }
        }

        // Share score button on Game Over screen
        const btnShare = document.getElementById('btn-share-score');
        if (btnShare) {
            btnShare.addEventListener('click', () => this.shareScore());
        }

        // Save Leaderboard score from Game Over screen
        const btnSaveScore = document.getElementById('btn-save-score');
        if (btnSaveScore) {
            btnSaveScore.addEventListener('click', () => {
                const nameInput = document.getElementById('input-player-name');
                const name = (nameInput && nameInput.value.trim()) || 'Runner';
                if (window.game) {
                    this.addLeaderboardEntry(name, window.game.score);
                    btnSaveScore.textContent = 'SAVED! ✔';
                    btnSaveScore.disabled = true;
                    this.showToast('🏆 SUBMITTED TO LEADERBOARD!');
                }
            });
        }

        // Sound toggles
        const sfxBtn = document.getElementById('btn-toggle-sfx');
        if (sfxBtn) {
            sfxBtn.addEventListener('click', () => {
                const isMuted = !window.sounds.sfxMuted;
                window.sounds.setSFXMute(isMuted);
                sfxBtn.textContent = isMuted ? '🔇 SFX OFF' : '🔊 SFX ON';
            });
        }

        const musicBtn = document.getElementById('btn-toggle-music');
        if (musicBtn) {
            musicBtn.addEventListener('click', () => {
                const isMuted = !window.sounds.musicMuted;
                window.sounds.setMusicMute(isMuted);
                musicBtn.textContent = isMuted ? '🔇 MUSIC OFF' : '🎵 MUSIC ON';
            });
        }

        // On-screen Hoverboard quick button
        const hbBtn = document.getElementById('btn-hoverboard-quick');
        if (hbBtn) {
            hbBtn.addEventListener('click', () => {
                if (window.game) window.game.activateHoverboard();
            });
        }
    }

    updateMenuStats() {
        document.getElementById('menu-highscore').textContent = this.highScore.toLocaleString();
        document.getElementById('menu-coins').textContent = this.totalCoins.toLocaleString();
        if (this.highScoreDisplay) this.highScoreDisplay.textContent = this.highScore.toLocaleString();
    }

    startGame() {
        this.startScreen.classList.add('hidden');
        this.gameOverScreen.classList.add('hidden');
        this.pauseScreen.classList.add('hidden');
        this.hudScreen.classList.remove('hidden');

        if (window.game) {
            window.game.selectedCharacter = this.selectedChar;
            window.game.selectedBoard = this.selectedBoard;
            this.applyUpgradesToGame();
            window.game.start();
        }
    }

    applyUpgradesToGame() {
        if (!window.game) return;
        window.game.activePowerups.magnet.maxTimer = 15 + (this.upgrades.magnet - 1) * 3.5;
        window.game.activePowerups.jetpack.maxTimer = 12 + (this.upgrades.jetpack - 1) * 3;
        window.game.activePowerups.slowmo.maxTimer = 8 + (this.upgrades.slowmo - 1) * 2;
        window.game.activePowerups.blast.maxTimer = 10 + (this.upgrades.blast - 1) * 2.5;
    }

    shareScore() {
        const score = window.game ? window.game.score : this.highScore;
        const text = `🚇 I scored ${score.toLocaleString()} points escaping the Devil in Metro Rush: Skyrail Surge! Can you beat me? Play now: ${window.location.href}`;
        if (navigator.share) {
            navigator.share({
                title: 'Metro Rush Challenge',
                text: text,
                url: window.location.href
            }).catch(() => {});
        } else if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                this.showToast('📋 SCORE COPIED TO CLIPBOARD!');
            }).catch(() => {
                this.showToast('🏆 Score: ' + score.toLocaleString());
            });
        }
    }

    showDevilWarning(show) {
        const vignette = document.getElementById('devil-vignette');
        const alertTag = document.getElementById('devil-alert-tag');
        if (!vignette) return;
        if (show) {
            vignette.classList.add('active');
            if (alertTag) alertTag.classList.remove('hidden');
        } else {
            vignette.classList.remove('active');
            if (alertTag) alertTag.classList.add('hidden');
        }
    }

    showStageBanner(text) {
        const banner = document.getElementById('stage-progression-banner');
        if (!banner) return;
        banner.textContent = text;
        banner.classList.remove('hidden');
        banner.classList.add('animate-banner');
        setTimeout(() => {
            banner.classList.remove('animate-banner');
            banner.classList.add('hidden');
        }, 3200);
    }

    returnToMenu() {
        this.pauseScreen.classList.add('hidden');
        this.gameOverScreen.classList.add('hidden');
        this.hudScreen.classList.add('hidden');
        this.startScreen.classList.remove('hidden');
        this.updateMenuStats();
        if (window.game) window.game.resetGame();
    }

    updateHUD(score, coins, distance, comboBoost = 1) {
        this.scoreDisplay.textContent = score.toLocaleString();
        this.coinsDisplay.textContent = coins.toLocaleString();
        this.distanceDisplay.textContent = `${distance}m`;

        if (this.comboBadge) {
            if (comboBoost > 1) {
                this.comboBadge.textContent = `${comboBoost}X COMBO!`;
                this.comboBadge.classList.remove('hidden');
            } else {
                this.comboBadge.classList.add('hidden');
            }
        }

        if (score > this.highScore) {
            this.highScore = score;
            if (this.highScoreDisplay) {
                this.highScoreDisplay.textContent = this.highScore.toLocaleString();
            }
            localStorage.setItem('metrorush_highscore', this.highScore.toString());
        }
    }

    updatePowerupBar(type, ratio) {
        const item = document.getElementById(`powerup-${type}`);
        if (!item) return;

        if (ratio <= 0) {
            item.classList.add('hidden');
        } else {
            item.classList.remove('hidden');
            const fill = item.querySelector('.powerup-progress-fill');
            if (fill) fill.style.width = `${Math.floor(ratio * 100)}%`;
        }
    }

    showToast(message) {
        const toast = document.getElementById('toast-notification');
        if (!toast) return;

        toast.textContent = message;
        toast.classList.remove('hidden');
        toast.classList.add('show');

        clearTimeout(this.toastTimer);
        this.toastTimer = setTimeout(() => {
            toast.classList.remove('show');
            toast.classList.add('hidden');
        }, 2200);
    }

    showPauseMenu(visible) {
        if (visible) {
            this.pauseScreen.classList.remove('hidden');
        } else {
            this.pauseScreen.classList.add('hidden');
        }
    }

    resumeGameWithCountdown() {
        this.pauseScreen.classList.add('hidden');
        const countdownEl = document.getElementById('resume-countdown');
        countdownEl.classList.remove('hidden');

        let count = 3;
        countdownEl.textContent = count;

        if (this.countdownTimer) clearInterval(this.countdownTimer);
        this.countdownTimer = setInterval(() => {
            count--;
            if (count > 0) {
                countdownEl.textContent = count;
                window.sounds.playCoin();
            } else {
                clearInterval(this.countdownTimer);
                countdownEl.classList.add('hidden');
                if (window.game) window.game.togglePause();
            }
        }, 800);
    }

    showGameOver(finalScore, coinsEarned, finalDistance) {
        this.hudScreen.classList.add('hidden');
        this.gameOverScreen.classList.remove('hidden');

        // Add coins to wallet
        this.totalCoins += coinsEarned;
        localStorage.setItem('metrorush_total_coins', this.totalCoins.toString());

        document.getElementById('go-final-score').textContent = finalScore.toLocaleString();
        document.getElementById('go-coins-earned').textContent = `+${coinsEarned.toLocaleString()}`;
        document.getElementById('go-distance').textContent = `${finalDistance}m`;
        document.getElementById('go-highscore').textContent = this.highScore.toLocaleString();

        const btnSave = document.getElementById('btn-save-score');
        if (btnSave) {
            btnSave.textContent = 'SUBMIT SCORE 🏆';
            btnSave.disabled = false;
        }

        const newRecordBanner = document.getElementById('go-new-record');
        if (finalScore >= this.highScore && finalScore > 0) {
            newRecordBanner.classList.remove('hidden');
        } else {
            newRecordBanner.classList.add('hidden');
        }
    }

    // Shop System (Characters & Specialty Hoverboards)
    openShop(open) {
        if (open) {
            this.renderShop();
            this.shopModal.classList.remove('hidden');
        } else {
            this.shopModal.classList.add('hidden');
            this.updateMenuStats();
        }
    }

    renderShop() {
        document.getElementById('shop-coins-val').textContent = this.totalCoins.toLocaleString();
        const charList = document.getElementById('shop-char-list');
        charList.innerHTML = '';

        if (this.shopTab === 'chars') {
            const characters = [
                { id: 'dash', name: 'Dash', cost: 0, desc: 'Classic Street Runner', color: '#ff3b30' },
                { id: 'nova', name: 'Nova', cost: 150, desc: 'Cyberpunk Neon Runner', color: '#00f0ff' },
                { id: 'spark', name: 'Spark', cost: 350, desc: 'Rooftop Speedster', color: '#f77f00' }
            ];

            characters.forEach(char => {
                const isUnlocked = this.unlockedChars.includes(char.id);
                const isSelected = this.selectedChar === char.id;

                const card = document.createElement('div');
                card.className = `shop-card ${isSelected ? 'selected' : ''}`;
                card.innerHTML = `
                    <div class="shop-card-badge" style="background:${char.color}">🏃</div>
                    <div class="shop-card-info">
                        <div class="shop-card-name">${char.name}</div>
                        <div class="shop-card-desc">${char.desc}</div>
                    </div>
                    <div class="shop-card-action">
                        ${isSelected ? '<span class="tag-equipped">EQUIPPED</span>' : 
                          (isUnlocked ? `<button class="btn-shop-select" data-type="char" data-id="${char.id}">SELECT</button>` : 
                                        `<button class="btn-shop-buy" data-type="char" data-id="${char.id}" data-cost="${char.cost}">🪙 ${char.cost}</button>`)}
                    </div>
                `;
                charList.appendChild(card);
            });
        } else if (this.shopTab === 'boards') {
            // Hoverboards Tab
            const boards = [
                { id: 'neon', name: 'Neon Cruiser', cost: 0, desc: 'Classic Extra-Life Shield', color: '#00f0ff', perk: 'Shield' },
                { id: 'firestorm', name: 'Firestorm Blade', cost: 180, desc: 'Fiery Trail + Smashes Hurdles', color: '#ff3b30', perk: 'Fire Trail' },
                { id: 'glider', name: 'Cloud Glider', cost: 300, desc: 'Air Glide (Slower Falling)', color: '#af52de', perk: 'Glide' },
                { id: 'bouncer', name: 'Thunder Spring', cost: 450, desc: '+35% Super Jump Force', color: '#06d6a0', perk: 'Super Jump' }
            ];

            boards.forEach(b => {
                const isUnlocked = this.unlockedBoards.includes(b.id);
                const isSelected = this.selectedBoard === b.id;

                const card = document.createElement('div');
                card.className = `shop-card ${isSelected ? 'selected' : ''}`;
                card.innerHTML = `
                    <div class="shop-card-badge" style="background:${b.color}">🛹</div>
                    <div class="shop-card-info">
                        <div class="shop-card-name">${b.name} <span class="badge-perk">${b.perk}</span></div>
                        <div class="shop-card-desc">${b.desc}</div>
                    </div>
                    <div class="shop-card-action">
                        ${isSelected ? '<span class="tag-equipped">EQUIPPED</span>' : 
                          (isUnlocked ? `<button class="btn-shop-select" data-type="board" data-id="${b.id}">SELECT</button>` : 
                                        `<button class="btn-shop-buy" data-type="board" data-id="${b.id}" data-cost="${b.cost}">🪙 ${b.cost}</button>`)}
                    </div>
                `;
                charList.appendChild(card);
            });
        } else {
            // Upgrades Tab (Coin Sink)
            const upgList = [
                { id: 'magnet', name: 'Coin Magnet', desc: 'Increases magnetic duration', icon: '🧲', color: '#ff0055' },
                { id: 'jetpack', name: 'Jetpack Rocket', desc: 'Increases sky flight duration', icon: '🚀', color: '#00f0ff' },
                { id: 'slowmo', name: 'Chrono Slow-Mo', desc: 'Increases matrix dodge duration', icon: '⏱️', color: '#00f5d4' },
                { id: 'blast', name: 'Shockwave Core', desc: 'Increases barrier smashing time', icon: '💥', color: '#ff5400' }
            ];

            upgList.forEach(u => {
                const currentLvl = this.upgrades[u.id] || 1;
                const isMax = currentLvl >= 5;
                const cost = currentLvl * 100;

                const card = document.createElement('div');
                card.className = 'shop-card';
                card.innerHTML = `
                    <div class="shop-card-badge" style="background:${u.color}">${u.icon}</div>
                    <div class="shop-card-info">
                        <div class="shop-card-name">${u.name} <span class="badge-perk">Lv ${currentLvl}/5</span></div>
                        <div class="shop-card-desc">${u.desc}</div>
                    </div>
                    <div class="shop-card-action">
                        ${isMax ? '<span class="tag-equipped">MAX LEVEL</span>' : 
                                  `<button class="btn-shop-upgrade" data-id="${u.id}" data-cost="${cost}">🪙 ${cost}</button>`}
                    </div>
                `;
                charList.appendChild(card);
            });
        }

        // Bind clicks
        charList.querySelectorAll('.btn-shop-upgrade').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                const cost = parseInt(e.target.getAttribute('data-cost'), 10);
                if (this.totalCoins >= cost) {
                    this.totalCoins -= cost;
                    this.upgrades[id] = (this.upgrades[id] || 1) + 1;
                    localStorage.setItem('metrorush_total_coins', this.totalCoins.toString());
                    localStorage.setItem('metrorush_upgrades', JSON.stringify(this.upgrades));
                    this.applyUpgradesToGame();
                    window.sounds.playPowerup();
                    this.showToast(`⚡ ${id.toUpperCase()} UPGRADED TO LV ${this.upgrades[id]}!`);
                    this.renderShop();
                } else {
                    alert('Not enough coins to upgrade!');
                }
            });
        });

        // Bind clicks
        charList.querySelectorAll('.btn-shop-select').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.target.getAttribute('data-type');
                const id = e.target.getAttribute('data-id');
                if (type === 'char') {
                    this.selectedChar = id;
                    localStorage.setItem('metrorush_selected_char', this.selectedChar);
                } else {
                    this.selectedBoard = id;
                    localStorage.setItem('metrorush_selected_board', this.selectedBoard);
                }
                window.sounds.playCoin();
                this.renderShop();
            });
        });

        charList.querySelectorAll('.btn-shop-buy').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.target.getAttribute('data-type');
                const id = e.target.getAttribute('data-id');
                const cost = parseInt(e.target.getAttribute('data-cost'), 10);
                if (this.totalCoins >= cost) {
                    this.totalCoins -= cost;
                    if (type === 'char') {
                        this.unlockedChars.push(id);
                        this.selectedChar = id;
                        localStorage.setItem('metrorush_unlocked_chars', JSON.stringify(this.unlockedChars));
                        localStorage.setItem('metrorush_selected_char', this.selectedChar);
                    } else {
                        this.unlockedBoards.push(id);
                        this.selectedBoard = id;
                        localStorage.setItem('metrorush_unlocked_boards', JSON.stringify(this.unlockedBoards));
                        localStorage.setItem('metrorush_selected_board', this.selectedBoard);
                    }
                    localStorage.setItem('metrorush_total_coins', this.totalCoins.toString());
                    window.sounds.playPowerup();
                    this.renderShop();
                } else {
                    alert('Not enough coins! Run more to collect coins.');
                }
            });
        });
    }

    // Leaderboard
    openLeaderboard(open) {
        if (open) {
            this.renderLeaderboard();
            this.leaderboardModal.classList.remove('hidden');
        } else {
            this.leaderboardModal.classList.add('hidden');
        }
    }

    renderLeaderboard() {
        const lbList = document.getElementById('leaderboard-list');
        if (!lbList) return;
        lbList.innerHTML = '';

        this.leaderboard.sort((a, b) => b.score - a.score);

        this.leaderboard.slice(0, 10).forEach((entry, idx) => {
            const row = document.createElement('div');
            row.className = `leaderboard-row ${idx === 0 ? 'top-1' : ''}`;
            const medal = idx === 0 ? '🥇' : (idx === 1 ? '🥈' : (idx === 2 ? '🥉' : `#${idx + 1}`));
            row.innerHTML = `
                <div class="lb-rank">${medal}</div>
                <div class="lb-name">${entry.name}</div>
                <div class="lb-score">${entry.score.toLocaleString()}</div>
            `;
            lbList.appendChild(row);
        });
    }

    addLeaderboardEntry(name, score) {
        this.leaderboard.push({ name, score, date: 'Just now' });
        this.leaderboard.sort((a, b) => b.score - a.score);
        this.leaderboard = this.leaderboard.slice(0, 15);
        localStorage.setItem('metrorush_leaderboard', JSON.stringify(this.leaderboard));
        this.renderLeaderboard();
    }

    // Lucky Spin Wheel Modal
    openWheel(open) {
        if (open) {
            this.wheelModal.classList.remove('hidden');
        } else {
            this.wheelModal.classList.add('hidden');
            this.updateMenuStats();
        }
    }

    spinWheel() {
        if (this.isSpinning) return;
        this.isSpinning = true;

        const wheelEl = document.getElementById('lucky-wheel-disc');
        const spinBtn = document.getElementById('btn-spin-wheel');
        spinBtn.disabled = true;

        const prizes = [
            { text: '+50 Coins', coins: 50 },
            { text: '+100 Coins', coins: 100 },
            { text: '+250 Coins', coins: 250 },
            { text: '🛹 FREE HOVERBOARD', perk: 'hoverboard' },
            { text: '+500 JACKPOT!', coins: 500 },
            { text: '+75 Coins', coins: 75 }
        ];

        const winningIdx = Math.floor(Math.random() * prizes.length);
        const prize = prizes[winningIdx];
        const degrees = 1800 + winningIdx * (360 / prizes.length); // 5 full rotations + segment offset

        wheelEl.style.transition = 'transform 3.5s cubic-bezier(0.15, 0.9, 0.25, 1)';
        wheelEl.style.transform = `rotate(${degrees}deg)`;
        window.sounds.playSlide();

        let clickInterval = setInterval(() => {
            if (window.sounds) window.sounds.playWheelClick();
        }, 130);
        setTimeout(() => clearInterval(clickInterval), 3200);

        setTimeout(() => {
            this.isSpinning = false;
            spinBtn.disabled = false;
            if (prize.coins) {
                this.totalCoins += prize.coins;
                localStorage.setItem('metrorush_total_coins', this.totalCoins.toString());
                window.sounds.playCoin();
            } else {
                window.sounds.playPowerup();
            }
            this.showToast(`🎉 LUCKY SPIN WON: ${prize.text}!`);
            this.updateMenuStats();
        }, 3600);
    }

    openMissions(open) {
        if (open) {
            this.missionsModal.classList.remove('hidden');
        } else {
            this.missionsModal.classList.add('hidden');
        }
    }
}

window.ui = new UIManager();
