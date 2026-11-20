// Core Game Loop, Player Physics, Endless Track Generation, and Collision System
class MetroGame {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.models = null;
        this.particles = null;

        // Game State
        this.isRunning = false;
        this.isPaused = false;
        this.score = 0;
        this.coins = 0;
        this.distance = 0;
        this.speed = 26; // Base forward speed
        this.maxSpeed = 54;
        this.acceleration = 0.35; // Speed increase per second
        this.multiplier = 1;

        // Lanes: -1 (Left, -2.5), 0 (Center, 0.0), 1 (Right, 2.5)
        this.currentLane = 0;
        this.targetLaneX = 0;
        this.laneWidth = 2.5;

        // Player physics
        this.player = null;
        this.playerPos = new THREE.Vector3(0, 0, 0);
        this.velocityY = 0;
        this.gravity = -34;
        this.jumpForce = 12.5;
        this.isGrounded = true;
        this.isJumping = false;
        this.isSliding = false;
        this.slideTimer = 0;
        this.slideDuration = 0.8;
        this.groundY = 0;

        // Power-ups
        this.activePowerups = {
            hoverboard: { active: false, timer: 0, maxTimer: 25 },
            magnet: { active: false, timer: 0, maxTimer: 15 },
            jetpack: { active: false, timer: 0, maxTimer: 12 },
            sneakers: { active: false, timer: 0, maxTimer: 16 },
            multiplier: { active: false, timer: 0, maxTimer: 18 }
        };

        // Track & Objects Management
        this.trackChunks = [];
        this.chunkLength = 60;
        this.nextChunkZ = -this.chunkLength;
        this.obstacles = [];
        this.collectibles = [];
        this.trains = [];

        // Animation timing
        this.clock = new THREE.Clock();
        this.runCycle = 0;
        this.rollAngle = 0;

        // Grinding state
        this.isGrinding = false;

        // Selected Character & Board
        this.selectedCharacter = 'dash';
        this.selectedBoard = 'neon';
    }

    init(containerEl) {
        this.container = containerEl || document.body;

        // 1. Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1423); // Sunset purple-dusk
        this.scene.fog = new THREE.FogExp2(0x1a1423, 0.012);

        // 2. Camera setup
        this.camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 300);
        this.camera.position.set(0, 4.2, 5.5);
        this.camera.lookAt(0, 2.0, -10);

        // 3. WebGL Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);

        // 4. Lighting
        const hemiLight = new THREE.HemisphereLight(0xffeedd, 0x332244, 0.7);
        this.scene.add(hemiLight);

        const dirLight = new THREE.DirectionalLight(0xfff0dd, 0.9);
        dirLight.position.set(15, 30, 20);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 1024;
        dirLight.shadow.mapSize.height = 1024;
        dirLight.shadow.camera.near = 0.5;
        dirLight.shadow.camera.far = 100;
        dirLight.shadow.camera.left = -15;
        dirLight.shadow.camera.right = 15;
        dirLight.shadow.camera.top = 25;
        dirLight.shadow.camera.bottom = -10;
        this.scene.add(dirLight);

        // 5. Particle System & Models
        this.particles = new ParticleSystem(this.scene);
        this.models = new ModelFactory();

        // 6. Build Initial Environment & Player
        this.resetGame();

        // 7. Hook up Inputs
        this.setupInputHandlers();

        // 8. Window resize
        window.addEventListener('resize', () => this.onResize());

        // 9. Start Main Loop
        requestAnimationFrame(() => this.loop());
    }

    onResize() {
        if (!this.camera || !this.renderer) return;
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    setupInputHandlers() {
        if (!window.inputManager) return;

        window.inputManager.on('left', () => this.moveLane(-1));
        window.inputManager.on('right', () => this.moveLane(1));
        window.inputManager.on('up', () => this.jump());
        window.inputManager.on('down', () => this.slide());
        window.inputManager.on('hoverboard', () => this.activateHoverboard());
    }

    moveLane(direction) {
        if (!this.isRunning || this.isPaused) return;
        const newLane = Math.max(-1, Math.min(1, this.currentLane + direction));
        if (newLane !== this.currentLane) {
            this.currentLane = newLane;
            this.targetLaneX = this.currentLane * this.laneWidth;
            window.sounds.playSlide();
            this.particles.createDustPuff(this.player.position, 0x00f0ff);
        }
    }

    jump() {
        if (!this.isRunning || this.isPaused) return;

        // Can jump if grounded or on top of train
        if (this.isGrounded) {
            const sneakersBoost = this.activePowerups.sneakers.active ? 1.4 : 1.0;
            this.velocityY = this.jumpForce * sneakersBoost;
            this.isGrounded = false;
            this.isJumping = true;
            this.isSliding = false; // Cancel slide on jump
            window.sounds.playJump();
            this.particles.createDustPuff(this.player.position, 0xffffff);

            // Squash & stretch jump animation
            if (this.player.bodyContainer) {
                this.player.bodyContainer.scale.set(0.75, 1.35, 0.75);
            }
        }
    }

    slide() {
        if (!this.isRunning || this.isPaused) return;

        // If in air, dive down fast!
        if (!this.isGrounded) {
            this.velocityY = -22; // Fast drop slam
        }

        this.isSliding = true;
        this.slideTimer = this.slideDuration;
        this.isJumping = false;
        window.sounds.playSlide();
        this.particles.createDustPuff(this.player.position, 0xff9500);
    }

    activateHoverboard() {
        if (!this.isRunning || this.isPaused) return;
        const hb = this.activePowerups.hoverboard;
        if (!hb.active) {
            hb.active = true;
            hb.timer = hb.maxTimer;
            if (this.player.hoverboard) this.player.hoverboard.visible = true;
            window.sounds.playPowerup();
            this.particles.createDustPuff(this.player.position, 0x00f0ff);
            if (window.ui) window.ui.updatePowerupBar('hoverboard', 1);
        }
    }

    resetGame() {
        // Clear old chunks, obstacles, coins
        this.trackChunks.forEach(c => this.scene.remove(c));
        this.trackChunks = [];

        this.obstacles.forEach(o => this.scene.remove(o));
        this.obstacles = [];

        this.collectibles.forEach(c => this.scene.remove(c));
        this.collectibles = [];

        this.trains.forEach(t => this.scene.remove(t));
        this.trains = [];

        if (this.particles) this.particles.clear();

        // Reset variables
        this.score = 0;
        this.coins = 0;
        this.distance = 0;
        this.speed = 26;
        this.multiplier = 1;
        this.currentLane = 0;
        this.targetLaneX = 0;
        this.playerPos.set(0, 0, 0);
        this.velocityY = 0;
        this.isGrounded = true;
        this.isJumping = false;
        this.isSliding = false;
        this.slideTimer = 0;
        this.groundY = 0;

        // Reset power-ups
        for (let key in this.activePowerups) {
            this.activePowerups[key].active = false;
            this.activePowerups[key].timer = 0;
            if (window.ui) window.ui.updatePowerupBar(key, 0);
        }

        // Spawn Player
        if (this.player) this.scene.remove(this.player);
        this.player = this.models.createCharacter(this.selectedCharacter);
        this.player.position.set(0, 0, 0);
        this.scene.add(this.player);

        // Generate starting tracks (initial safe runway)
        this.nextChunkZ = 0;
        for (let i = 0; i < 6; i++) {
            this.spawnTrackChunk(i < 2); // First 2 chunks are clear runway
        }
    }

    start() {
        this.resetGame();
        this.isRunning = true;
        this.isPaused = false;
        window.sounds.init();
        window.sounds.startMusic();
    }

    togglePause() {
        if (!this.isRunning) return;
        this.isPaused = !this.isPaused;
        if (this.isPaused) {
            window.sounds.stopMusic();
            if (window.ui) window.ui.showPauseMenu(true);
        } else {
            window.sounds.startMusic();
            if (window.ui) window.ui.showPauseMenu(false);
        }
    }

    spawnTrackChunk(isSafeRunway = false) {
        const chunk = this.models.createTrackChunk(this.chunkLength);
        chunk.position.z = this.nextChunkZ;
        this.scene.add(chunk);
        this.trackChunks.push(chunk);

        if (!isSafeRunway) {
            this.populateChunk(this.nextChunkZ);
        }

        this.nextChunkZ -= this.chunkLength;
    }

    populateChunk(chunkCenterZ) {
        // Lanes available: -2.5, 0, 2.5
        const lanes = [-2.5, 0, 2.5];
        const numObstacles = 2 + Math.floor(Math.random() * 2);

        // Track occupied lanes at segment positions to guarantee clear path
        for (let i = 0; i < numObstacles; i++) {
            const zOffset = (Math.random() - 0.5) * (this.chunkLength * 0.75);
            const obstacleZ = chunkCenterZ + zOffset;
            const laneIndex = Math.floor(Math.random() * 3);
            const laneX = lanes[laneIndex];

            const typeRoll = Math.random();

            if (typeRoll < 0.4) {
                // Train (Moving or Stationary with Ramp)
                const isMoving = Math.random() > 0.45;
                const hasRamp = !isMoving && Math.random() > 0.3;
                const color = Math.random() > 0.5 ? 'red' : 'teal';

                const train = this.models.createTrain(color, hasRamp);
                train.position.set(laneX, 0, obstacleZ);
                train.isMoving = isMoving;
                train.moveSpeed = isMoving ? (this.speed * 0.45) : 0; // Moves towards oncoming player (+Z direction)

                this.scene.add(train);
                this.trains.push(train);

                // Spawn coins along train roof!
                if (hasRamp || Math.random() > 0.4) {
                    this.spawnCoinLine(laneX, 3.2, obstacleZ - 7, obstacleZ + 7, 5);
                }

                // If moving train, sound horn when close
                if (isMoving) {
                    train.hasSoundedHorn = false;
                }
            } else if (typeRoll < 0.72) {
                // Low Barrier (Jump over)
                const barrier = this.models.createLowBarrier();
                barrier.position.set(laneX, 0, obstacleZ);
                this.scene.add(barrier);
                this.obstacles.push(barrier);

                // Coins in an arch over the barrier
                this.spawnCoinArch(laneX, obstacleZ);
            } else {
                // High Barrier (Slide under)
                const barrier = this.models.createHighBarrier();
                barrier.position.set(laneX, 0, obstacleZ);
                this.scene.add(barrier);
                this.obstacles.push(barrier);

                // Flat line of coins under barrier
                this.spawnCoinLine(laneX, 0.4, obstacleZ - 3, obstacleZ + 3, 3);
            }
        }

        // Randomly spawn Power-Up
        if (Math.random() < 0.3) {
            const freeLane = lanes[Math.floor(Math.random() * 3)];
            const types = ['magnet', 'jetpack', 'sneakers', 'multiplier'];
            const chosenType = types[Math.floor(Math.random() * types.length)];
            const powerup = this.models.createPowerup(chosenType);
            powerup.position.set(freeLane, 1.2, chunkCenterZ + (Math.random() - 0.5) * 20);
            this.scene.add(powerup);
            this.collectibles.push(powerup);
        }
    }

    spawnCoinLine(laneX, y, startZ, endZ, count) {
        const step = (endZ - startZ) / count;
        for (let i = 0; i < count; i++) {
            const coin = this.models.createCoin();
            coin.position.set(laneX, y, startZ + i * step);
            this.scene.add(coin);
            this.collectibles.push(coin);
        }
    }

    spawnCoinArch(laneX, centerZ) {
        const count = 5;
        const span = 8;
        for (let i = 0; i < count; i++) {
            const t = (i / (count - 1)) * 2 - 1; // -1 to 1
            const y = 1.0 + (1 - t * t) * 1.8; // Parabolic arch
            const z = centerZ + t * (span / 2);

            const coin = this.models.createCoin();
            coin.position.set(laneX, y, z);
            this.scene.add(coin);
            this.collectibles.push(coin);
        }
    }

    // Main Update Loop
    loop() {
        requestAnimationFrame(() => this.loop());

        const delta = Math.min(this.clock.getDelta(), 0.1);

        if (this.isRunning && !this.isPaused) {
            this.update(delta);
        }

        if (this.particles) {
            this.particles.update(delta);
        }

        this.renderer.render(this.scene, this.camera);
    }

    update(delta) {
        // 1. Dynamic speed progression
        this.speed = Math.min(this.maxSpeed, this.speed + this.acceleration * delta);
        const forwardStep = this.speed * delta;
        this.distance += forwardStep;
        this.playerPos.z -= forwardStep;

        // 2. Score progression
        const activeMultiplier = this.multiplier * (this.activePowerups.multiplier.active ? 2 : 1);
        this.score += Math.floor(this.speed * delta * activeMultiplier * 2);

        // 3. Smooth Lane switching (Lerp)
        this.playerPos.x += (this.targetLaneX - this.playerPos.x) * 16 * delta;

        // 4. Power-ups timing
        this.updatePowerups(delta);

        // 5. Physics & Vertical Ground Checking
        this.updatePhysics(delta);

        // 6. Rail Grinding Check (Middle rail with Hoverboard or feet)
        this.checkRailGrind();

        // 7. Update Moving Trains
        this.updateTrains(delta);

        // 8. Update Collectibles & Coin Magnet
        this.updateCollectibles(delta);

        // 9. Collision Detection
        this.checkCollisions();

        // 10. Update Player Rig Animations
        this.updatePlayerAnimations(delta);

        // 11. Camera Follow with Smooth Spring Dampening
        this.updateCamera(delta);

        // 12. Recycle old chunks & spawn new ones ahead
        this.updateTracks();

        // 13. Update UI
        if (window.ui) {
            window.ui.updateHUD(this.score, this.coins, Math.floor(this.distance));
        }
    }

    updatePowerups(delta) {
        for (let key in this.activePowerups) {
            const p = this.activePowerups[key];
            if (p.active) {
                p.timer -= delta;
                if (window.ui) {
                    window.ui.updatePowerupBar(key, p.timer / p.maxTimer);
                }
                if (p.timer <= 0) {
                    p.active = false;
                    if (key === 'hoverboard' && this.player.hoverboard) {
                        this.player.hoverboard.visible = false;
                    }
                    if (key === 'jetpack' && this.player.jetpack) {
                        this.player.jetpack.visible = false;
                    }
                }
            }
        }
    }

    updatePhysics(delta) {
        // Jetpack forces high flight
        if (this.activePowerups.jetpack.active) {
            this.targetFlightY = 8.0;
            this.playerPos.y += (this.targetFlightY - this.playerPos.y) * 5 * delta;
            this.isGrounded = false;
            this.isJumping = false;
            this.velocityY = 0;
            this.particles.createJetpackFlame(this.player.position);
            return;
        }

        // Determine current ground height (either 0, ramp incline, or on top of a train roof)
        let currentGround = 0;
        for (let train of this.trains) {
            const dx = Math.abs(this.playerPos.x - train.position.x);
            const nearZ = train.position.z + train.collider.length / 2;
            const farZ = train.position.z - train.collider.length / 2;

            if (dx < train.collider.width / 2 + 0.3) {
                // Check if on the ramp approaching train
                if (train.hasRamp && this.playerPos.z <= nearZ + 3.2 && this.playerPos.z >= nearZ - 0.5) {
                    const rampRatio = (nearZ + 3.2 - this.playerPos.z) / 3.7;
                    const rampHeight = Math.min(train.collider.height, rampRatio * train.collider.height);
                    if (rampHeight > currentGround) {
                        currentGround = rampHeight;
                    }
                } else if (this.playerPos.z <= nearZ && this.playerPos.z >= farZ) {
                    // On top of train
                    if (this.playerPos.y >= train.collider.height - 0.7) {
                        currentGround = train.collider.height;
                        break;
                    }
                }
            }
        }
        this.groundY = currentGround;

        // Gravity & Vertical Motion
        this.velocityY += this.gravity * delta;
        this.playerPos.y += this.velocityY * delta;

        if (this.playerPos.y <= this.groundY) {
            this.playerPos.y = this.groundY;
            this.velocityY = 0;
            if (!this.isGrounded) {
                this.isGrounded = true;
                this.isJumping = false;
                // Landing dust puff
                this.particles.createDustPuff(this.player.position, 0xffffff);
            }
        }

        // Slide timer
        if (this.isSliding) {
            this.slideTimer -= delta;
            if (this.isGrounded) {
                this.particles.createDustPuff(this.player.position, 0xffaa00);
            }
            if (this.slideTimer <= 0) {
                this.isSliding = false;
            }
        }
    }

    checkRailGrind() {
        // Grinding happens when running down the exact center lane or on a train edge
        const onCenterRail = Math.abs(this.playerPos.x) < 0.25 && this.isGrounded && this.groundY === 0;
        if (onCenterRail && (this.activePowerups.hoverboard.active || this.isSliding)) {
            if (!this.isGrinding) {
                this.isGrinding = true;
                window.sounds.playGrind(true);
            }
            this.particles.createGrindSparks(this.player.position);
            this.score += 5; // Bonus grind points!
        } else {
            if (this.isGrinding) {
                this.isGrinding = false;
                window.sounds.playGrind(false);
            }
        }
    }

    updateTrains(delta) {
        for (let train of this.trains) {
            if (train.isMoving) {
                train.position.z += train.moveSpeed * delta;

                // Train horn warning when approaching player
                const distZ = train.position.z - this.playerPos.z;
                if (distZ < 45 && distZ > 10 && !train.hasSoundedHorn) {
                    window.sounds.playTrainHorn();
                    train.hasSoundedHorn = true;
                }
            }
        }
    }

    updateCollectibles(delta) {
        const magnetActive = this.activePowerups.magnet.active;
        const magnetRadius = 14.0;

        for (let i = this.collectibles.length - 1; i >= 0; i--) {
            const item = this.collectibles[i];

            // Rotate items
            item.rotation.y += 3.0 * delta;

            const dx = item.position.x - this.playerPos.x;
            const dy = item.position.y - this.playerPos.y;
            const dz = item.position.z - this.playerPos.z;
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

            // Magnet pulling coins
            if (magnetActive && item.isCoin && dist < magnetRadius) {
                item.position.x += (this.playerPos.x - item.position.x) * 9 * delta;
                item.position.y += (this.playerPos.y + 0.8 - item.position.y) * 9 * delta;
                item.position.z += (this.playerPos.z - item.position.z) * 9 * delta;
            }

            // Collection check
            if (dist < 1.4) {
                if (item.isCoin) {
                    this.coins++;
                    this.score += 60;
                    window.sounds.playCoin();
                    this.particles.createCoinBurst(item.position);
                } else if (item.powerupType) {
                    this.activatePowerup(item.powerupType);
                }

                this.scene.remove(item);
                this.collectibles.splice(i, 1);
            } else if (item.position.z > this.playerPos.z + 15) {
                // Behind player, recycle
                this.scene.remove(item);
                this.collectibles.splice(i, 1);
            }
        }
    }

    activatePowerup(type) {
        window.sounds.playPowerup();
        const p = this.activePowerups[type];
        if (p) {
            p.active = true;
            p.timer = p.maxTimer;
        }

        if (type === 'jetpack') {
            if (this.player.jetpack) this.player.jetpack.visible = true;
        }

        if (window.ui) {
            window.ui.showToast(`🔥 ${type.toUpperCase()} ACTIVATED!`);
        }
    }

    checkCollisions() {
        if (this.activePowerups.jetpack.active) return; // Jetpack flies over everything

        const pX = this.playerPos.x;
        const pY = this.playerPos.y;
        const pZ = this.playerPos.z;

        // Player collision bounds
        const playerHeight = this.isSliding ? 0.65 : 1.7;
        const playerRadius = 0.42;

        // 1. Train collisions
        for (let train of this.trains) {
            const dx = Math.abs(pX - train.position.x);
            const dz = Math.abs(pZ - train.position.z);

            // Inside horizontal bounds of train
            if (dx < (train.collider.width / 2 + playerRadius * 0.7) && dz < (train.collider.length / 2)) {
                // If player is on top, they run safely!
                if (pY >= train.collider.height - 0.2) {
                    continue;
                }

                // If train has ramp and player hits the ramp end, let them slide up onto roof!
                if (train.hasRamp && pZ > train.position.z + train.collider.length / 2 - 2.5) {
                    this.velocityY = 10; // Launch up onto train
                    window.sounds.playJump();
                    continue;
                }

                // Crash into train!
                this.handleCrash();
                return;
            }
        }

        // 2. Obstacle collisions (Barriers)
        for (let ob of this.obstacles) {
            const dx = Math.abs(pX - ob.position.x);
            const dz = Math.abs(pZ - ob.position.z);

            if (dx < ob.collider.width / 2 && dz < ob.collider.depth / 2 + 0.3) {
                if (ob.obstacleType === 'low') {
                    // Low barrier: Must jump over it (pY must be > collider.height)
                    if (pY < ob.collider.height) {
                        this.handleCrash();
                        return;
                    }
                } else if (ob.obstacleType === 'high') {
                    // High barrier: Must slide under it
                    if (!this.isSliding && pY + playerHeight > ob.collider.minHeight) {
                        this.handleCrash();
                        return;
                    }
                }
            }
        }
    }

    handleCrash() {
        // If Hoverboard is active, it saves the player!
        if (this.activePowerups.hoverboard.active) {
            this.activePowerups.hoverboard.active = false;
            this.activePowerups.hoverboard.timer = 0;
            if (this.player.hoverboard) this.player.hoverboard.visible = false;

            window.sounds.playCrash();
            this.particles.createCrashExplosion(this.player.position);
            if (window.inputManager) window.inputManager.vibrate([60, 50, 60]);

            // Stumble recovery: bounce player backward slightly and clear obstacles nearby
            this.playerPos.z += 5;
            this.velocityY = 8;
            this.clearNearbyObstacles(this.playerPos.z, 20);

            if (window.ui) {
                window.ui.showToast('🛹 HOVERBOARD SAVED YOU!');
                window.ui.updatePowerupBar('hoverboard', 0);
            }
            return;
        }

        // Game Over!
        this.isRunning = false;
        window.sounds.stopMusic();
        window.sounds.playCrash();
        this.particles.createCrashExplosion(this.player.position);
        if (window.inputManager) window.inputManager.vibrate([100, 80, 150]);

        if (window.ui) {
            window.ui.showGameOver(this.score, this.coins, Math.floor(this.distance));
        }
    }

    clearNearbyObstacles(centerZ, range) {
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            if (Math.abs(this.obstacles[i].position.z - centerZ) < range) {
                this.scene.remove(this.obstacles[i]);
                this.obstacles.splice(i, 1);
            }
        }
        for (let i = this.trains.length - 1; i >= 0; i--) {
            if (Math.abs(this.trains[i].position.z - centerZ) < range) {
                this.scene.remove(this.trains[i]);
                this.trains.splice(i, 1);
            }
        }
    }

    updatePlayerAnimations(delta) {
        if (!this.player) return;

        // Position sync
        this.player.position.copy(this.playerPos);

        const p = this.player;

        // Lean torso into lane switch
        const laneOffset = this.targetLaneX - this.playerPos.x;
        p.rotation.z = -laneOffset * 0.12;

        // Ground-pinned shadow update
        if (p.shadow) {
            p.shadow.position.y = -this.playerPos.y + this.groundY + 0.03;
            const heightDiff = Math.max(0, this.playerPos.y - this.groundY);
            const heightRatio = Math.max(0.2, 1 - heightDiff * 0.18);
            p.shadow.scale.set(heightRatio, heightRatio, 1);
            if (p.shadow.material) {
                p.shadow.material.opacity = 0.35 * heightRatio;
            }
        }

        if (this.isSliding) {
            // Squashed slide pose
            if (p.bodyContainer) {
                p.bodyContainer.scale.set(1.2, 0.45, 1.2);
                p.bodyContainer.rotation.x = -0.5;
            }
            if (p.leftLegPivot) p.leftLegPivot.rotation.x = -1.2;
            if (p.rightLegPivot) p.rightLegPivot.rotation.x = 1.0;
        } else if (!this.isGrounded) {
            // Jumping pose
            if (p.bodyContainer) {
                p.bodyContainer.scale.lerp(new THREE.Vector3(1, 1, 1), 10 * delta);
                p.bodyContainer.rotation.x = 0;
            }
            if (p.leftArmPivot) p.leftArmPivot.rotation.x = -2.2;
            if (p.rightArmPivot) p.rightArmPivot.rotation.x = -2.2;
            if (p.leftLegPivot) p.leftLegPivot.rotation.x = 0.8;
            if (p.rightLegPivot) p.rightLegPivot.rotation.x = 0.8;
        } else {
            // Normal Running sprint cycle
            if (p.bodyContainer) {
                p.bodyContainer.scale.lerp(new THREE.Vector3(1, 1, 1), 12 * delta);
                p.bodyContainer.rotation.x = 0.12; // Slight forward sprint lean
            }

            const sprintFreq = this.speed * 0.6;
            this.runCycle += delta * sprintFreq;

            const armSwing = Math.sin(this.runCycle) * 0.9;
            const legSwing = Math.sin(this.runCycle) * 1.0;

            if (p.leftArmPivot) p.leftArmPivot.rotation.x = armSwing;
            if (p.rightArmPivot) p.rightArmPivot.rotation.x = -armSwing;
            if (p.leftLegPivot) p.leftLegPivot.rotation.x = -legSwing;
            if (p.rightLegPivot) p.rightLegPivot.rotation.x = legSwing;

            // Subtle vertical bounce
            if (p.bodyContainer) {
                p.bodyContainer.position.y = Math.abs(Math.sin(this.runCycle * 2)) * 0.1;
            }
        }
    }

    updateCamera(delta) {
        // Camera smoothly follows player with dynamic look-ahead
        const targetCamX = this.playerPos.x * 0.45;
        const targetCamY = this.playerPos.y + (this.activePowerups.jetpack.active ? 4.5 : 3.8);
        const targetCamZ = this.playerPos.z + 5.2;

        this.camera.position.x += (targetCamX - this.camera.position.x) * 10 * delta;
        this.camera.position.y += (targetCamY - this.camera.position.y) * 8 * delta;
        this.camera.position.z = targetCamZ;

        this.camera.lookAt(
            this.playerPos.x * 0.2,
            this.playerPos.y + 1.6,
            this.playerPos.z - 16
        );
    }

    updateTracks() {
        // Recycle track chunks behind player
        for (let i = this.trackChunks.length - 1; i >= 0; i--) {
            const chunk = this.trackChunks[i];
            if (chunk.position.z > this.playerPos.z + this.chunkLength * 1.5) {
                this.scene.remove(chunk);
                this.trackChunks.splice(i, 1);
            }
        }

        // Keep 6 chunks ahead of player
        while (this.nextChunkZ > this.playerPos.z - this.chunkLength * 6) {
            this.spawnTrackChunk(false);
        }

        // Clean up distant obstacles & trains behind player
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            if (this.obstacles[i].position.z > this.playerPos.z + 20) {
                this.scene.remove(this.obstacles[i]);
                this.obstacles.splice(i, 1);
            }
        }
        for (let i = this.trains.length - 1; i >= 0; i--) {
            if (this.trains[i].position.z > this.playerPos.z + 30) {
                this.scene.remove(this.trains[i]);
                this.trains.splice(i, 1);
            }
        }
    }
}

window.MetroGame = MetroGame;
