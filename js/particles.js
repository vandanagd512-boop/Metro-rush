// High performance particle engine for cartoon effects (dust, sparks, coin bursts, jetpack flames)
class ParticleSystem {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
        
        // Reusable geometries & materials for performance
        this.sparkGeo = new THREE.BoxGeometry(0.08, 0.08, 0.16);
        this.dustGeo = new THREE.DodecahedronGeometry(0.18, 1);
        this.coinStarGeo = new THREE.OctahedronGeometry(0.14, 0);

        this.goldMat = new THREE.MeshBasicMaterial({ color: 0xffd700 });
        this.sparkMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
        this.dustMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 });
        this.fireMat = new THREE.MeshBasicMaterial({ color: 0xff3b30 });
        this.purpleMat = new THREE.MeshBasicMaterial({ color: 0xaf52de });
        this.rainGeo = new THREE.BoxGeometry(0.04, 0.7, 0.04);
        this.rainMat = new THREE.MeshBasicMaterial({ color: 0x80d9ff, transparent: true, opacity: 0.65 });
        this.devilFlameMat = new THREE.MeshBasicMaterial({ color: 0xff1e00 });
    }

    createDevilFlames(pos) {
        for (let i = 0; i < 2; i++) {
            const mesh = new THREE.Mesh(this.dustGeo, this.devilFlameMat);
            mesh.position.set(
                pos.x + (Math.random() - 0.5) * 0.5,
                pos.y + 0.1,
                pos.z + (Math.random() - 0.5) * 0.4
            );
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 1.5,
                2 + Math.random() * 2,
                4 + Math.random() * 3
            );
            this.scene.add(mesh);
            this.particles.push({
                mesh,
                velocity,
                gravity: 0,
                rotationSpeed: new THREE.Vector3(4, 4, 4),
                scaleDecay: 0.86,
                life: 0.35,
                maxLife: 0.35
            });
        }
    }

    createBlastWave(pos) {
        const count = 20;
        for (let i = 0; i < count; i++) {
            const mesh = new THREE.Mesh(this.dustGeo, this.fireMat);
            mesh.position.copy(pos);
            const angle = (i / count) * Math.PI * 2;
            const speed = 8 + Math.random() * 6;
            const velocity = new THREE.Vector3(
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                (Math.random() - 0.5) * 6
            );
            this.scene.add(mesh);
            this.particles.push({
                mesh,
                velocity,
                gravity: -6,
                rotationSpeed: new THREE.Vector3(6, 6, 6),
                scaleDecay: 0.9,
                life: 0.6,
                maxLife: 0.6
            });
        }
    }

    createRainStreak(centerPos) {
        for (let i = 0; i < 4; i++) {
            const mesh = new THREE.Mesh(this.rainGeo, this.rainMat);
            mesh.position.set(
                centerPos.x + (Math.random() - 0.5) * 18,
                centerPos.y + 6 + Math.random() * 4,
                centerPos.z - 5 - Math.random() * 25
            );
            mesh.rotation.x = -0.25; // Slanted rain
            const velocity = new THREE.Vector3(0, -32, 10);
            this.scene.add(mesh);
            this.particles.push({
                mesh,
                velocity,
                gravity: 0,
                rotationSpeed: new THREE.Vector3(0, 0, 0),
                scaleDecay: 0.98,
                life: 0.3,
                maxLife: 0.3
            });
        }
    }

    createCoinBurst(pos) {
        const count = 12;
        for (let i = 0; i < count; i++) {
            const mesh = new THREE.Mesh(this.coinStarGeo, this.goldMat.clone());
            mesh.position.copy(pos);
            mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
            
            const angle = (i / count) * Math.PI * 2;
            const speed = 4 + Math.random() * 4;
            const velocity = new THREE.Vector3(
                Math.cos(angle) * speed,
                Math.sin(angle) * speed + 3,
                (Math.random() - 0.5) * 4
            );

            this.scene.add(mesh);
            this.particles.push({
                mesh,
                velocity,
                gravity: -16,
                rotationSpeed: new THREE.Vector3(5, 5, 5),
                scaleDecay: 0.93,
                life: 1.0,
                maxLife: 1.0
            });
        }
    }

    createDustPuff(pos, color = 0xffffff) {
        const count = 7;
        for (let i = 0; i < count; i++) {
            const mat = this.dustMat.clone();
            mat.color.setHex(color);
            const mesh = new THREE.Mesh(this.dustGeo, mat);
            mesh.position.set(
                pos.x + (Math.random() - 0.5) * 0.6,
                pos.y + 0.1,
                pos.z + (Math.random() - 0.5) * 0.6
            );

            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 3,
                1.5 + Math.random() * 2,
                (Math.random() - 0.5) * 3 + 2
            );

            this.scene.add(mesh);
            this.particles.push({
                mesh,
                velocity,
                gravity: -2,
                rotationSpeed: new THREE.Vector3(2, 2, 0),
                scaleDecay: 0.92,
                life: 0.6,
                maxLife: 0.6
            });
        }
    }

    createGrindSparks(pos) {
        const count = 4;
        for (let i = 0; i < count; i++) {
            const mesh = new THREE.Mesh(this.sparkGeo, this.sparkMat);
            mesh.position.set(
                pos.x + (Math.random() - 0.5) * 0.4,
                pos.y + 0.1,
                pos.z
            );

            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 4,
                2 + Math.random() * 3,
                8 + Math.random() * 6 // Shoot backwards
            );

            this.scene.add(mesh);
            this.particles.push({
                mesh,
                velocity,
                gravity: -18,
                rotationSpeed: new THREE.Vector3(8, 8, 8),
                scaleDecay: 0.88,
                life: 0.35,
                maxLife: 0.35
            });
        }
    }

    createJetpackFlame(pos) {
        for (let i = 0; i < 3; i++) {
            const mat = Math.random() > 0.4 ? this.fireMat : this.purpleMat;
            const mesh = new THREE.Mesh(this.dustGeo, mat.clone());
            mesh.position.set(
                pos.x + (Math.random() - 0.5) * 0.3,
                pos.y - 0.4,
                pos.z + 0.3
            );

            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 1.5,
                -6 - Math.random() * 4,
                10 + Math.random() * 5
            );

            this.scene.add(mesh);
            this.particles.push({
                mesh,
                velocity,
                gravity: 0,
                rotationSpeed: new THREE.Vector3(3, 3, 3),
                scaleDecay: 0.85,
                life: 0.3,
                maxLife: 0.3
            });
        }
    }

    createCrashExplosion(pos) {
        const count = 30;
        const colors = [0xff3b30, 0xff9500, 0xffcc00, 0x00f0ff, 0xffffff];
        for (let i = 0; i < count; i++) {
            const mat = new THREE.MeshBasicMaterial({ color: colors[i % colors.length] });
            const mesh = new THREE.Mesh(this.dustGeo, mat);
            mesh.position.copy(pos);

            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            const speed = 6 + Math.random() * 10;
            const velocity = new THREE.Vector3(
                Math.sin(phi) * Math.cos(theta) * speed,
                Math.cos(phi) * speed + 3,
                Math.sin(phi) * Math.sin(theta) * speed
            );

            this.scene.add(mesh);
            this.particles.push({
                mesh,
                velocity,
                gravity: -18,
                rotationSpeed: new THREE.Vector3(10, 10, 10),
                scaleDecay: 0.95,
                life: 1.2,
                maxLife: 1.2
            });
        }
    }

    update(delta) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= delta;

            if (p.life <= 0) {
                this.scene.remove(p.mesh);
                if (p.mesh.geometry && !p.mesh.geometry.isShared) {
                    // avoid leaking non-shared
                }
                this.particles.splice(i, 1);
                continue;
            }

            p.velocity.y += p.gravity * delta;
            p.mesh.position.addScaledVector(p.velocity, delta);
            p.mesh.rotation.x += p.rotationSpeed.x * delta;
            p.mesh.rotation.y += p.rotationSpeed.y * delta;
            p.mesh.rotation.z += p.rotationSpeed.z * delta;

            p.mesh.scale.multiplyScalar(p.scaleDecay);
            if (p.mesh.material.transparent) {
                p.mesh.material.opacity = (p.life / p.maxLife) * 0.8;
            }
        }
    }

    clear() {
        for (let p of this.particles) {
            this.scene.remove(p.mesh);
        }
        this.particles = [];
    }
}

window.ParticleSystem = ParticleSystem;
