// Input management: Touch swipe detection, keyboard controls, virtual buttons, and haptics
class InputManager {
    constructor() {
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchStartTime = 0;
        this.isSwiping = false;
        this.minSwipeDist = 20; // 20px threshold for instant, responsive swipe
        this.maxSwipeTime = 600; // ms
        this.lastTapTime = 0;

        this.swipeCallbacks = {
            left: null,
            right: null,
            up: null,
            down: null,
            doubleTap: null,
            hoverboard: null
        };

        this.touchPoints = [];
        this.trailCanvas = null;
        this.trailCtx = null;
    }

    init(containerEl) {
        this.container = containerEl || document.body;
        this.setupKeyboard();
        this.setupTouch();
        this.setupTrailCanvas();
    }

    on(action, callback) {
        if (this.swipeCallbacks.hasOwnProperty(action)) {
            this.swipeCallbacks[action] = callback;
        }
    }

    trigger(action) {
        if (this.swipeCallbacks[action]) {
            this.swipeCallbacks[action]();
        }
        this.vibrate(action === 'down' ? 25 : 35);
    }

    vibrate(pattern) {
        if ('vibrate' in navigator) {
            try {
                navigator.vibrate(pattern);
            } catch (e) {}
        }
    }

    setupKeyboard() {
        window.addEventListener('keydown', (e) => {
            // Ignore if typing in an input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            switch (e.key) {
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    e.preventDefault();
                    this.trigger('left');
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    e.preventDefault();
                    this.trigger('right');
                    break;
                case 'ArrowUp':
                case 'w':
                case 'W':
                    e.preventDefault();
                    this.trigger('up');
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    e.preventDefault();
                    this.trigger('down');
                    break;
                case ' ':
                    e.preventDefault();
                    this.trigger('hoverboard');
                    break;
                case 'p':
                case 'P':
                case 'Escape':
                    if (window.game) window.game.togglePause();
                    break;
            }
        });
    }

    setupTouch() {
        // Listen on window globally so touches anywhere on the screen register immediately
        window.addEventListener('touchstart', (e) => {
            if (e.touches.length > 0) {
                const touch = e.touches[0];
                this.touchStartX = touch.clientX;
                this.touchStartY = touch.clientY;
                this.touchStartTime = Date.now();
                this.isSwiping = true;

                // Double tap check for hoverboard
                const now = Date.now();
                if (now - this.lastTapTime < 280) {
                    this.trigger('hoverboard');
                    this.lastTapTime = 0;
                } else {
                    this.lastTapTime = now;
                }

                this.addTrailPoint(touch.clientX, touch.clientY);
            }
        }, { passive: true });

        window.addEventListener('touchmove', (e) => {
            if (!this.isSwiping || e.touches.length === 0) return;

            const touch = e.touches[0];
            this.addTrailPoint(touch.clientX, touch.clientY);

            const dx = touch.clientX - this.touchStartX;
            const dy = touch.clientY - this.touchStartY;
            const absDx = Math.abs(dx);
            const absDy = Math.abs(dy);

            // Fast triggering when swipe distance threshold reached
            if (Math.max(absDx, absDy) > this.minSwipeDist) {
                if (absDx > absDy) {
                    if (dx > 0) {
                        this.trigger('right');
                    } else {
                        this.trigger('left');
                    }
                } else {
                    if (dy < 0) {
                        this.trigger('up');
                    } else {
                        this.trigger('down');
                    }
                }
                // Reset so single swipe does not repeat
                this.isSwiping = false;
            }
        }, { passive: true });

        window.addEventListener('touchend', () => {
            this.isSwiping = false;
        });

        window.addEventListener('touchcancel', () => {
            this.isSwiping = false;
        });

        // Mouse drag / desktop swipe support
        let mouseDown = false;
        window.addEventListener('mousedown', (e) => {
            // Ignore if clicking UI buttons
            if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
            mouseDown = true;
            this.touchStartX = e.clientX;
            this.touchStartY = e.clientY;
            this.touchStartTime = Date.now();
            this.addTrailPoint(e.clientX, e.clientY);
        });

        window.addEventListener('mousemove', (e) => {
            if (!mouseDown) return;
            this.addTrailPoint(e.clientX, e.clientY);
            const dx = e.clientX - this.touchStartX;
            const dy = e.clientY - this.touchStartY;
            const absDx = Math.abs(dx);
            const absDy = Math.abs(dy);

            if (Math.max(absDx, absDy) > this.minSwipeDist) {
                if (absDx > absDy) {
                    if (dx > 0) this.trigger('right');
                    else this.trigger('left');
                } else {
                    if (dy < 0) this.trigger('up');
                    else this.trigger('down');
                }
                mouseDown = false;
            }
        });

        window.addEventListener('mouseup', () => {
            mouseDown = false;
        });
    }

    setupTrailCanvas() {
        this.trailCanvas = document.createElement('canvas');
        this.trailCanvas.id = 'swipe-trail-canvas';
        this.trailCanvas.style.position = 'fixed';
        this.trailCanvas.style.top = '0';
        this.trailCanvas.style.left = '0';
        this.trailCanvas.style.width = '100vw';
        this.trailCanvas.style.height = '100vh';
        this.trailCanvas.style.pointerEvents = 'none';
        this.trailCanvas.style.zIndex = '999';
        document.body.appendChild(this.trailCanvas);
        this.trailCtx = this.trailCanvas.getContext('2d');

        const resize = () => {
            this.trailCanvas.width = window.innerWidth;
            this.trailCanvas.height = window.innerHeight;
        };
        window.addEventListener('resize', resize);
        resize();

        // Animation loop for swipe trail
        const renderTrail = () => {
            this.updateTrail();
            requestAnimationFrame(renderTrail);
        };
        renderTrail();
    }

    addTrailPoint(x, y) {
        this.touchPoints.push({ x, y, life: 1.0 });
    }

    updateTrail() {
        if (!this.trailCtx) return;
        this.trailCtx.clearRect(0, 0, this.trailCanvas.width, this.trailCanvas.height);

        for (let i = 0; i < this.touchPoints.length; i++) {
            this.touchPoints[i].life -= 0.06;
        }
        this.touchPoints = this.touchPoints.filter(p => p.life > 0);

        if (this.touchPoints.length < 2) return;

        this.trailCtx.save();
        for (let i = 1; i < this.touchPoints.length; i++) {
            const p0 = this.touchPoints[i - 1];
            const p1 = this.touchPoints[i];

            this.trailCtx.beginPath();
            this.trailCtx.moveTo(p0.x, p0.y);
            this.trailCtx.lineTo(p1.x, p1.y);
            this.trailCtx.strokeStyle = `rgba(0, 240, 255, ${p1.life * 0.8})`;
            this.trailCtx.lineWidth = 14 * p1.life;
            this.trailCtx.lineCap = 'round';
            this.trailCtx.shadowColor = '#00f0ff';
            this.trailCtx.shadowBlur = 12;
            this.trailCtx.stroke();
        }
        this.trailCtx.restore();
    }
}

window.inputManager = new InputManager();
