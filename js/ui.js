// User Interface, HUD, Shop System, Missions, and Local Storage Manager
class UIManager {
    constructor() {
        this.highScore = parseInt(localStorage.getItem('metrorush_highscore') || '0', 10);
        this.totalCoins = parseInt(localStorage.getItem('metrorush_total_coins') || '0', 10);
        this.unlockedChars = JSON.parse(localStorage.getItem('metrorush_unlocked_chars') || '["dash"]');
        this.unlockedBoards = JSON.parse(localStorage.getItem('metrorush_unlocked_boards') || '["neon"]');

        this.selectedChar = localStorage.getItem('metrorush_selected_char') || 'dash';
        this.selectedBoard = localStorage.getItem('metrorush_selected_board') || 'neon';

        this.toastTimer = null;
        this.countdownTimer = null;
    }

    init() {
        this.bindElements();
        this.updateMenuStats();
        this.renderShop();
    }

    bindElements() {
        // Screens
        this.startScreen = document.getElementById('start-screen');
        this.hudScreen = document.getElementById('hud-screen');
        this.gameOverScreen = document.getElementById('game-over-screen');
        this.pauseScreen = document.getElementById('pause-screen');
        this.shopModal = document.getElementById('shop-modal');
        this.missionsModal = document.getElementById('missions-modal');

        // HUD text elements
        this.scoreDisplay = document.getElementById('hud-score');
        this.coinsDisplay = document.getElementById('hud-coins');
        this.distanceDisplay = document.getElementById('hud-distance');
        this.highScoreDisplay = document.getElementById('hud-highscore');

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
            window.game.start();
        }
    }

    returnToMenu() {
        this.pauseScreen.classList.add('hidden');
        this.gameOverScreen.classList.add('hidden');
        this.hudScreen.classList.add('hidden');
        this.startScreen.classList.remove('hidden');
        this.updateMenuStats();
        if (window.game) window.game.resetGame();
    }

    updateHUD(score, coins, distance) {
        this.scoreDisplay.textContent = score.toLocaleString();
        this.coinsDisplay.textContent = coins.toLocaleString();
        this.distanceDisplay.textContent = `${distance}m`;

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

        const newRecordBanner = document.getElementById('go-new-record');
        if (finalScore >= this.highScore && finalScore > 0) {
            newRecordBanner.classList.remove('hidden');
        } else {
            newRecordBanner.classList.add('hidden');
        }
    }

    // Shop System
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

        const characters = [
            { id: 'dash', name: 'Dash', cost: 0, desc: 'Classic Street Runner', color: '#ff3b30' },
            { id: 'nova', name: 'Nova', cost: 150, desc: 'Cyberpunk Neon Runner', color: '#00f0ff' },
            { id: 'spark', name: 'Spark', cost: 350, desc: 'Rooftop Speedster', color: '#f77f00' }
        ];

        const charList = document.getElementById('shop-char-list');
        charList.innerHTML = '';

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
                      (isUnlocked ? `<button class="btn-shop-select" data-id="${char.id}">SELECT</button>` : 
                                    `<button class="btn-shop-buy" data-id="${char.id}" data-cost="${char.cost}">🪙 ${char.cost}</button>`)}
                </div>
            `;
            charList.appendChild(card);
        });

        // Bind clicks
        charList.querySelectorAll('.btn-shop-select').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectedChar = e.target.getAttribute('data-id');
                localStorage.setItem('metrorush_selected_char', this.selectedChar);
                window.sounds.playCoin();
                this.renderShop();
            });
        });

        charList.querySelectorAll('.btn-shop-buy').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                const cost = parseInt(e.target.getAttribute('data-cost'), 10);
                if (this.totalCoins >= cost) {
                    this.totalCoins -= cost;
                    this.unlockedChars.push(id);
                    this.selectedChar = id;
                    localStorage.setItem('metrorush_total_coins', this.totalCoins.toString());
                    localStorage.setItem('metrorush_unlocked_chars', JSON.stringify(this.unlockedChars));
                    localStorage.setItem('metrorush_selected_char', this.selectedChar);
                    window.sounds.playPowerup();
                    this.renderShop();
                } else {
                    alert('Not enough coins! Run more to collect coins.');
                }
            });
        });
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
