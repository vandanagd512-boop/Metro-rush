// Procedural 3D cartoon models: Character rig, Metro trains, Barriers, Coins, Power-ups
class ModelFactory {
    constructor() {
        // Shared materials for vibrant cartoon shading
        this.materials = {
            skin: new THREE.MeshLambertMaterial({ color: 0xffcc99 }),
            redHoodie: new THREE.MeshLambertMaterial({ color: 0xff3b30 }),
            blueJeans: new THREE.MeshLambertMaterial({ color: 0x1d3557 }),
            yellowCap: new THREE.MeshLambertMaterial({ color: 0xffcc00 }),
            whiteSneaker: new THREE.MeshLambertMaterial({ color: 0xf1faee }),
            blackSole: new THREE.MeshLambertMaterial({ color: 0x222222 }),
            cyanGlow: new THREE.MeshBasicMaterial({ color: 0x00f0ff }),
            neonPink: new THREE.MeshBasicMaterial({ color: 0xff007f }),
            goldCoin: new THREE.MeshLambertMaterial({ color: 0xffc300, emissive: 0x332200 }),
            trackSteel: new THREE.MeshLambertMaterial({ color: 0x778da9 }),
            trackTies: new THREE.MeshLambertMaterial({ color: 0x415a77 }),
            groundGravel: new THREE.MeshLambertMaterial({ color: 0x24242e }),
            hazardYellow: new THREE.MeshLambertMaterial({ color: 0xffd166 }),
            hazardDark: new THREE.MeshLambertMaterial({ color: 0x1b1b1b }),
            trainBodyRed: new THREE.MeshLambertMaterial({ color: 0xe63946 }),
            trainBodyTeal: new THREE.MeshLambertMaterial({ color: 0x2a9d8f }),
            trainRoof: new THREE.MeshLambertMaterial({ color: 0x457b9d }),
            trainWindow: new THREE.MeshBasicMaterial({ color: 0xa8dadc }),
            headlightOn: new THREE.MeshBasicMaterial({ color: 0xffffe0 }),
            boardBase: new THREE.MeshLambertMaterial({ color: 0x111111 }),
            boardGlow: new THREE.MeshBasicMaterial({ color: 0x00f0ff }),
            devilRed: new THREE.MeshLambertMaterial({ color: 0xd90429 }),
            devilDark: new THREE.MeshLambertMaterial({ color: 0x590d22 }),
            devilHorns: new THREE.MeshLambertMaterial({ color: 0x1a1a1a }),
            devilEyes: new THREE.MeshBasicMaterial({ color: 0xffea00 }),
            devilTrident: new THREE.MeshLambertMaterial({ color: 0xffb703 }),
            clockCyan: new THREE.MeshBasicMaterial({ color: 0x00f5d4 }),
            blastFlame: new THREE.MeshBasicMaterial({ color: 0xff5400 }),
            mysteryGold: new THREE.MeshLambertMaterial({ color: 0xffd166 }),
            mysteryRibbon: new THREE.MeshBasicMaterial({ color: 0xf72585 })
        };
    }

    // Creates an articulated cartoon runner character with pivot joints
    createCharacter(characterId = 'dash') {
        const root = new THREE.Group();
        root.name = 'character';

        // Palette overrides based on chosen character
        let hoodieColor = 0xff3b30;
        let pantsColor = 0x1d3557;
        let capColor = 0xffcc00;

        if (characterId === 'nova') {
            hoodieColor = 0x00f0ff;
            pantsColor = 0x22223b;
            capColor = 0xff007f;
        } else if (characterId === 'spark') {
            hoodieColor = 0xf77f00;
            pantsColor = 0x003049;
            capColor = 0x3a86ff;
        }

        const hoodieMat = new THREE.MeshLambertMaterial({ color: hoodieColor });
        const pantsMat = new THREE.MeshLambertMaterial({ color: pantsColor });
        const capMat = new THREE.MeshLambertMaterial({ color: capColor });

        // Base container (handles squash/stretch)
        const bodyContainer = new THREE.Group();
        root.add(bodyContainer);
        root.bodyContainer = bodyContainer;

        // Torso
        const torsoGeo = new THREE.BoxGeometry(0.55, 0.7, 0.35);
        const torso = new THREE.Mesh(torsoGeo, hoodieMat);
        torso.position.y = 1.05;
        torso.castShadow = true;
        bodyContainer.add(torso);
        root.torso = torso;

        // Neck & Head
        const headPivot = new THREE.Group();
        headPivot.position.set(0, 1.45, 0);
        bodyContainer.add(headPivot);
        root.headPivot = headPivot;

        const headGeo = new THREE.BoxGeometry(0.42, 0.42, 0.4);
        const head = new THREE.Mesh(headGeo, this.materials.skin);
        head.position.y = 0.22;
        head.castShadow = true;
        headPivot.add(head);

        // Cap / Hat (Backwards style with visor)
        const capGeo = new THREE.BoxGeometry(0.44, 0.16, 0.44);
        const cap = new THREE.Mesh(capGeo, capMat);
        cap.position.set(0, 0.22, 0);
        head.add(cap);

        const brimGeo = new THREE.BoxGeometry(0.38, 0.04, 0.22);
        const brim = new THREE.Mesh(brimGeo, capMat);
        brim.position.set(0, 0.16, 0.3); // Facing backward
        head.add(brim);

        // Headphones on cap
        const phoneGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.08, 8);
        const phoneL = new THREE.Mesh(phoneGeo, this.materials.blackSole);
        phoneL.rotation.z = Math.PI / 2;
        phoneL.position.set(-0.24, 0.1, 0);
        head.add(phoneL);

        const phoneR = phoneL.clone();
        phoneR.position.x = 0.24;
        head.add(phoneR);

        // Arms
        const armGeo = new THREE.BoxGeometry(0.16, 0.55, 0.16);

        // Left Arm
        const leftArmPivot = new THREE.Group();
        leftArmPivot.position.set(-0.36, 1.35, 0);
        bodyContainer.add(leftArmPivot);
        root.leftArmPivot = leftArmPivot;

        const leftArm = new THREE.Mesh(armGeo, hoodieMat);
        leftArm.position.y = -0.25;
        leftArmPivot.add(leftArm);

        // Right Arm
        const rightArmPivot = new THREE.Group();
        rightArmPivot.position.set(0.36, 1.35, 0);
        bodyContainer.add(rightArmPivot);
        root.rightArmPivot = rightArmPivot;

        const rightArm = new THREE.Mesh(armGeo, hoodieMat);
        rightArm.position.y = -0.25;
        rightArmPivot.add(rightArm);

        // Legs
        const legGeo = new THREE.BoxGeometry(0.2, 0.6, 0.2);
        const shoeGeo = new THREE.BoxGeometry(0.22, 0.16, 0.36);

        // Left Leg
        const leftLegPivot = new THREE.Group();
        leftLegPivot.position.set(-0.16, 0.72, 0);
        bodyContainer.add(leftLegPivot);
        root.leftLegPivot = leftLegPivot;

        const leftLeg = new THREE.Mesh(legGeo, pantsMat);
        leftLeg.position.y = -0.3;
        leftLegPivot.add(leftLeg);

        const leftShoe = new THREE.Mesh(shoeGeo, this.materials.whiteSneaker);
        leftShoe.position.set(0, -0.25, 0.08);
        leftLeg.add(leftShoe);

        // Right Leg
        const rightLegPivot = new THREE.Group();
        rightLegPivot.position.set(0.16, 0.72, 0);
        bodyContainer.add(rightLegPivot);
        root.rightLegPivot = rightLegPivot;

        const rightLeg = new THREE.Mesh(legGeo, pantsMat);
        rightLeg.position.y = -0.3;
        rightLegPivot.add(rightLeg);

        const rightShoe = new THREE.Mesh(shoeGeo, this.materials.whiteSneaker);
        rightShoe.position.set(0, -0.25, 0.08);
        rightLeg.add(rightShoe);

        // Hoverboard model attached under feet (hidden until active)
        const hoverboard = this.createHoverboard();
        hoverboard.position.set(0, 0.06, 0);
        hoverboard.visible = false;
        root.add(hoverboard);
        root.hoverboard = hoverboard;

        // Jetpack attached to back (hidden until active)
        const jetpack = this.createJetpackMesh();
        jetpack.position.set(0, 1.1, -0.28);
        jetpack.visible = false;
        root.add(jetpack);
        root.jetpack = jetpack;

        // Shadow circle
        const shadowGeo = new THREE.CircleGeometry(0.45, 16);
        const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35 });
        const shadow = new THREE.Mesh(shadowGeo, shadowMat);
        shadow.rotation.x = -Math.PI / 2;
        shadow.position.y = 0.02;
        root.add(shadow);
        root.shadow = shadow;

        return root;
    }

    createHoverboard(boardType = 'neon') {
        const board = new THREE.Group();
        board.name = 'hoverboard';
        board.boardType = boardType;

        let trimColor = 0x00f0ff;
        if (boardType === 'firestorm') trimColor = 0xff3b30;
        else if (boardType === 'glider') trimColor = 0xaf52de;
        else if (boardType === 'bouncer') trimColor = 0x06d6a0;

        const glowMat = new THREE.MeshBasicMaterial({ color: trimColor });

        // Main deck
        const deckGeo = new THREE.BoxGeometry(0.75, 0.07, 1.55);
        const deck = new THREE.Mesh(deckGeo, this.materials.boardBase);
        board.add(deck);

        // Glowing trim edges
        const trimL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.08, 1.57), glowMat);
        trimL.position.x = -0.38;
        board.add(trimL);

        const trimR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.08, 1.57), glowMat);
        trimR.position.x = 0.38;
        board.add(trimR);

        // Twin bottom hover thrusters
        const thrusterGeo = new THREE.CylinderGeometry(0.14, 0.1, 0.1, 8);
        const thrusterFront = new THREE.Mesh(thrusterGeo, glowMat);
        thrusterFront.position.set(0, -0.06, 0.45);
        board.add(thrusterFront);

        const thrusterBack = thrusterFront.clone();
        thrusterBack.position.z = -0.45;
        board.add(thrusterBack);

        // Specialty details: Glider wings or fire exhaust
        if (boardType === 'glider') {
            const wingGeo = new THREE.BoxGeometry(0.5, 0.02, 0.6);
            const wingL = new THREE.Mesh(wingGeo, glowMat);
            wingL.position.set(-0.6, 0, 0);
            board.add(wingL);

            const wingR = wingL.clone();
            wingR.position.x = 0.6;
            board.add(wingR);
        } else if (boardType === 'firestorm') {
            const noseGeo = new THREE.ConeGeometry(0.35, 0.5, 4);
            const nose = new THREE.Mesh(noseGeo, glowMat);
            nose.rotation.x = -Math.PI / 2;
            nose.position.set(0, 0, -0.95);
            board.add(nose);
        }

        return board;
    }

    // Creates the menacing 3D cartoon Devil chaser
    createDevil() {
        const devil = new THREE.Group();
        devil.name = 'devil_chaser';

        const bodyContainer = new THREE.Group();
        devil.add(bodyContainer);
        devil.bodyContainer = bodyContainer;

        // Torso
        const torsoGeo = new THREE.BoxGeometry(0.75, 0.85, 0.45);
        const torso = new THREE.Mesh(torsoGeo, this.materials.devilRed);
        torso.position.y = 1.15;
        bodyContainer.add(torso);

        // Head
        const headPivot = new THREE.Group();
        headPivot.position.set(0, 1.6, 0);
        bodyContainer.add(headPivot);
        devil.headPivot = headPivot;

        const headGeo = new THREE.BoxGeometry(0.55, 0.55, 0.48);
        const head = new THREE.Mesh(headGeo, this.materials.devilRed);
        head.position.y = 0.28;
        headPivot.add(head);

        // Horns
        const hornGeo = new THREE.ConeGeometry(0.12, 0.45, 6);
        const hornL = new THREE.Mesh(hornGeo, this.materials.devilHorns);
        hornL.rotation.set(-0.2, 0, -0.35);
        hornL.position.set(-0.24, 0.65, 0.05);
        head.add(hornL);

        const hornR = new THREE.Mesh(hornGeo, this.materials.devilHorns);
        hornR.rotation.set(-0.2, 0, 0.35);
        hornR.position.set(0.24, 0.65, 0.05);
        head.add(hornR);

        // Glowing Eyes
        const eyeGeo = new THREE.BoxGeometry(0.12, 0.08, 0.04);
        const eyeL = new THREE.Mesh(eyeGeo, this.materials.devilEyes);
        eyeL.position.set(-0.15, 0.32, -0.25);
        head.add(eyeL);

        const eyeR = eyeL.clone();
        eyeR.position.x = 0.15;
        head.add(eyeR);

        // Devil Wings (Flapping pivot joints)
        const wingShape = new THREE.BufferGeometry();
        const wingGeo = new THREE.BoxGeometry(0.7, 0.5, 0.04);

        const wingPivotL = new THREE.Group();
        wingPivotL.position.set(-0.35, 1.45, 0.22);
        bodyContainer.add(wingPivotL);
        devil.wingPivotL = wingPivotL;

        const wingL = new THREE.Mesh(wingGeo, this.materials.devilDark);
        wingL.position.set(-0.35, 0.2, 0);
        wingPivotL.add(wingL);

        const wingPivotR = new THREE.Group();
        wingPivotR.position.set(0.35, 1.45, 0.22);
        bodyContainer.add(wingPivotR);
        devil.wingPivotR = wingPivotR;

        const wingR = new THREE.Mesh(wingGeo, this.materials.devilDark);
        wingR.position.set(0.35, 0.2, 0);
        wingPivotR.add(wingR);

        // Right Arm holding Golden Trident / Pitchfork
        const armGeo = new THREE.BoxGeometry(0.18, 0.65, 0.18);
        const rightArmPivot = new THREE.Group();
        rightArmPivot.position.set(0.48, 1.4, 0);
        bodyContainer.add(rightArmPivot);
        devil.rightArmPivot = rightArmPivot;

        const rightArm = new THREE.Mesh(armGeo, this.materials.devilRed);
        rightArm.position.y = -0.3;
        rightArmPivot.add(rightArm);

        // Trident shaft
        const shaftGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.8, 8);
        const shaft = new THREE.Mesh(shaftGeo, this.materials.devilTrident);
        shaft.rotation.x = Math.PI / 4;
        shaft.position.set(0.1, -0.2, -0.4);
        rightArmPivot.add(shaft);

        // Trident prongs
        const prongGeo = new THREE.ConeGeometry(0.06, 0.35, 6);
        const prongCenter = new THREE.Mesh(prongGeo, this.materials.devilTrident);
        prongCenter.position.set(0, 0.9, 0);
        shaft.add(prongCenter);

        const prongLeft = new THREE.Mesh(prongGeo, this.materials.devilTrident);
        prongLeft.position.set(-0.16, 0.8, 0);
        shaft.add(prongLeft);

        const prongRight = new THREE.Mesh(prongGeo, this.materials.devilTrident);
        prongRight.position.set(0.16, 0.8, 0);
        shaft.add(prongRight);

        // Left Arm
        const leftArmPivot = new THREE.Group();
        leftArmPivot.position.set(-0.48, 1.4, 0);
        bodyContainer.add(leftArmPivot);
        devil.leftArmPivot = leftArmPivot;

        const leftArm = new THREE.Mesh(armGeo, this.materials.devilRed);
        leftArm.position.y = -0.3;
        leftArmPivot.add(leftArm);

        // Devil Tail
        const tailPivot = new THREE.Group();
        tailPivot.position.set(0, 0.85, 0.22);
        bodyContainer.add(tailPivot);
        devil.tailPivot = tailPivot;

        const tailGeo = new THREE.CylinderGeometry(0.05, 0.03, 0.8, 6);
        const tail = new THREE.Mesh(tailGeo, this.materials.devilRed);
        tail.rotation.x = -Math.PI / 3;
        tail.position.set(0, 0.2, 0.35);
        tailPivot.add(tail);

        const spadeGeo = new THREE.ConeGeometry(0.12, 0.25, 4);
        const spade = new THREE.Mesh(spadeGeo, this.materials.devilDark);
        spade.rotation.x = -Math.PI / 2;
        spade.position.set(0, 0.45, 0.7);
        tailPivot.add(spade);

        // Shadow circle
        const shadowGeo = new THREE.CircleGeometry(0.55, 16);
        const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.45 });
        const shadow = new THREE.Mesh(shadowGeo, shadowMat);
        shadow.rotation.x = -Math.PI / 2;
        shadow.position.y = 0.02;
        devil.add(shadow);
        devil.shadow = shadow;

        return devil;
    }

    createJetpackMesh() {
        const jet = new THREE.Group();
        const tankGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.6, 8);
        const metalMat = new THREE.MeshLambertMaterial({ color: 0x8d99ae });

        const tankL = new THREE.Mesh(tankGeo, metalMat);
        tankL.position.x = -0.16;
        jet.add(tankL);

        const tankR = new THREE.Mesh(tankGeo, metalMat);
        tankR.position.x = 0.16;
        jet.add(tankR);

        // Nozzles
        const nozzleGeo = new THREE.ConeGeometry(0.1, 0.2, 8);
        const nozzleMat = new THREE.MeshBasicMaterial({ color: 0xff3b30 });

        const nozL = new THREE.Mesh(nozzleGeo, nozzleMat);
        nozL.rotation.x = Math.PI;
        nozL.position.set(-0.16, -0.35, 0);
        jet.add(nozL);

        const nozR = nozL.clone();
        nozR.position.x = 0.16;
        jet.add(nozR);

        return jet;
    }

    // Metro Train Car
    createTrain(colorType = 'red', hasRamp = false) {
        const train = new THREE.Group();
        train.name = 'train';
        train.isTrain = true;

        const length = 18;
        const width = 2.1;
        const height = 2.7;

        const bodyMat = colorType === 'red' ? this.materials.trainBodyRed : this.materials.trainBodyTeal;

        // Main Car Body
        const bodyGeo = new THREE.BoxGeometry(width, height, length);
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = height / 2 + 0.3;
        body.castShadow = true;
        train.add(body);

        // Roof Top Platform
        const roofGeo = new THREE.BoxGeometry(width * 0.95, 0.15, length);
        const roof = new THREE.Mesh(roofGeo, this.materials.trainRoof);
        roof.position.y = height + 0.35;
        train.add(roof);

        // Windows on sides
        const windowGeo = new THREE.BoxGeometry(width + 0.05, 0.7, 1.2);
        for (let z = -length / 2 + 2.5; z < length / 2 - 2; z += 2.4) {
            const win = new THREE.Mesh(windowGeo, this.materials.trainWindow);
            win.position.set(0, height * 0.65, z);
            train.add(win);
        }

        // Front Headlights
        const lightGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.1, 8);
        const headL = new THREE.Mesh(lightGeo, this.materials.headlightOn);
        headL.rotation.x = Math.PI / 2;
        headL.position.set(-0.6, 0.9, -length / 2 - 0.02);
        train.add(headL);

        const headR = headL.clone();
        headR.position.x = 0.6;
        train.add(headR);

        // Optional Climb Ramp at rear/front of stationary train
        if (hasRamp) {
            const rampGeo = new THREE.BoxGeometry(width * 0.85, 0.15, 4.0);
            const ramp = new THREE.Mesh(rampGeo, this.materials.hazardYellow);
            ramp.rotation.x = 0.65; // Slope up to roof
            ramp.position.set(0, 1.4, length / 2 + 1.4);
            train.add(ramp);
            train.hasRamp = true;
        }

        // Bounding box dimensions for collision
        train.collider = {
            width: width * 0.92,
            height: height + 0.3,
            length: length + (hasRamp ? 3.0 : 0)
        };

        return train;
    }

    // Hurdle / Low Barrier (Jump over)
    createLowBarrier() {
        const barrier = new THREE.Group();
        barrier.name = 'barrier_low';
        barrier.obstacleType = 'low';

        // Posts
        const postGeo = new THREE.CylinderGeometry(0.12, 0.12, 1.0, 8);
        const postL = new THREE.Mesh(postGeo, this.materials.hazardDark);
        postL.position.set(-1.0, 0.5, 0);
        barrier.add(postL);

        const postR = postL.clone();
        postR.position.x = 1.0;
        barrier.add(postR);

        // Crossbar
        const barGeo = new THREE.BoxGeometry(2.2, 0.35, 0.15);
        const bar = new THREE.Mesh(barGeo, this.materials.hazardYellow);
        bar.position.set(0, 0.75, 0);
        barrier.add(bar);

        barrier.collider = { width: 2.1, height: 1.0, depth: 0.4 };
        return barrier;
    }

    // High Sign / Beam (Slide under)
    createHighBarrier() {
        const barrier = new THREE.Group();
        barrier.name = 'barrier_high';
        barrier.obstacleType = 'high';

        // Tall side arches
        const postGeo = new THREE.CylinderGeometry(0.12, 0.12, 3.2, 8);
        const postL = new THREE.Mesh(postGeo, this.materials.hazardDark);
        postL.position.set(-1.1, 1.6, 0);
        barrier.add(postL);

        const postR = postL.clone();
        postR.position.x = 1.1;
        barrier.add(postR);

        // Overhead sign / block
        const signGeo = new THREE.BoxGeometry(2.3, 1.4, 0.25);
        const sign = new THREE.Mesh(signGeo, this.materials.hazardYellow);
        sign.position.set(0, 2.3, 0);
        barrier.add(sign);

        // Glowing neon arrow or warning strip
        const glowGeo = new THREE.BoxGeometry(1.8, 0.25, 0.27);
        const glow = new THREE.Mesh(glowGeo, this.materials.cyanGlow);
        glow.position.set(0, 1.85, 0);
        barrier.add(glow);

        barrier.collider = { width: 2.1, minHeight: 1.3, maxHeight: 3.1, depth: 0.4 };
        return barrier;
    }

    // Collectible 3D Gold Coin
    createCoin() {
        const coin = new THREE.Group();
        coin.name = 'coin';
        coin.isCoin = true;

        const coinGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.1, 16);
        const mesh = new THREE.Mesh(coinGeo, this.materials.goldCoin);
        mesh.rotation.x = Math.PI / 2;
        mesh.castShadow = true;
        coin.add(mesh);

        // Inner star detail
        const starGeo = new THREE.OctahedronGeometry(0.2, 0);
        const star = new THREE.Mesh(starGeo, this.materials.cyanGlow);
        star.scale.set(1, 1, 0.4);
        coin.add(star);

        return coin;
    }

    // Collectible Power-Up Icon
    createPowerup(type = 'magnet') {
        const powerup = new THREE.Group();
        powerup.name = `powerup_${type}`;
        powerup.powerupType = type;

        let bubbleColor = 0xffcc00;
        if (type === 'magnet') bubbleColor = 0xff0055;
        else if (type === 'jetpack') bubbleColor = 0x00f0ff;
        else if (type === 'slowmo') bubbleColor = 0x00f5d4;
        else if (type === 'blast') bubbleColor = 0xff5400;
        else if (type === 'mystery') bubbleColor = 0xffd166;

        // Glowing outer protective bubble
        const bubbleGeo = new THREE.SphereGeometry(0.65, 16, 16);
        const bubbleMat = new THREE.MeshBasicMaterial({
            color: bubbleColor,
            transparent: true,
            opacity: 0.45,
            wireframe: true
        });
        const bubble = new THREE.Mesh(bubbleGeo, bubbleMat);
        powerup.add(bubble);

        let icon;
        if (type === 'magnet') {
            // U-shaped magnet
            const magnetGeo = new THREE.TorusGeometry(0.28, 0.09, 8, 16, Math.PI);
            icon = new THREE.Mesh(magnetGeo, new THREE.MeshLambertMaterial({ color: 0xff3b30 }));
            icon.rotation.z = Math.PI;
        } else if (type === 'jetpack') {
            icon = this.createJetpackMesh();
            icon.scale.set(0.65, 0.65, 0.65);
        } else if (type === 'multiplier') {
            // "2X" icon badge
            const starGeo = new THREE.DodecahedronGeometry(0.3, 0);
            icon = new THREE.Mesh(starGeo, new THREE.MeshBasicMaterial({ color: 0xffcc00 }));
        } else if (type === 'slowmo') {
            // Chrono Clock / Stopwatch
            const clockGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 16);
            icon = new THREE.Mesh(clockGeo, this.materials.clockCyan);
            icon.rotation.x = Math.PI / 2;
        } else if (type === 'blast') {
            // Spiky shockwave battery
            const blastGeo = new THREE.OctahedronGeometry(0.35, 1);
            icon = new THREE.Mesh(blastGeo, this.materials.blastFlame);
        } else if (type === 'mystery') {
            // Mystery gift box with ribbon
            const box = new THREE.Group();
            const boxGeo = new THREE.BoxGeometry(0.48, 0.48, 0.48);
            const boxMesh = new THREE.Mesh(boxGeo, this.materials.mysteryGold);
            box.add(boxMesh);

            const ribbonGeo = new THREE.BoxGeometry(0.5, 0.5, 0.12);
            const ribbonMesh = new THREE.Mesh(ribbonGeo, this.materials.mysteryRibbon);
            box.add(ribbonMesh);
            icon = box;
        } else {
            // Super sneakers
            const shoeGeo = new THREE.BoxGeometry(0.35, 0.2, 0.5);
            icon = new THREE.Mesh(shoeGeo, new THREE.MeshLambertMaterial({ color: 0x3a86ff }));
        }

        powerup.add(icon);
        powerup.icon = icon;
        return powerup;
    }

    // Track chunk (3 lanes, rails, ties, and side scenery)
    createTrackChunk(chunkLength = 60) {
        const chunk = new THREE.Group();
        chunk.name = 'track_chunk';

        // Ground / Gravel Bed
        const groundGeo = new THREE.PlaneGeometry(12, chunkLength);
        const ground = new THREE.Mesh(groundGeo, this.materials.groundGravel);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        chunk.add(ground);

        // 3 Track lanes at x = -2.5, 0, 2.5
        const laneXs = [-2.5, 0, 2.5];
        const railGeo = new THREE.BoxGeometry(0.08, 0.12, chunkLength);

        laneXs.forEach(lx => {
            // Left & right steel rails of the lane
            const railL = new THREE.Mesh(railGeo, this.materials.trackSteel);
            railL.position.set(lx - 0.55, 0.08, 0);
            chunk.add(railL);

            const railR = new THREE.Mesh(railGeo, this.materials.trackSteel);
            railR.position.set(lx + 0.55, 0.08, 0);
            chunk.add(railR);
        });

        // Middle Electrified Power Rail (Center lane grind rail!)
        const powerRailGeo = new THREE.BoxGeometry(0.12, 0.18, chunkLength);
        const powerRail = new THREE.Mesh(powerRailGeo, this.materials.cyanGlow);
        powerRail.position.set(0, 0.12, 0);
        chunk.add(powerRail);

        // Ties / Sleepers along tracks
        const tieGeo = new THREE.BoxGeometry(7.5, 0.08, 0.35);
        for (let z = -chunkLength / 2; z < chunkLength / 2; z += 2.2) {
            const tie = new THREE.Mesh(tieGeo, this.materials.trackTies);
            tie.position.set(0, 0.04, z);
            chunk.add(tie);
        }

        // Side Walls / Metro Tunnels / City Skyline Pillars
        const wallGeo = new THREE.BoxGeometry(0.8, 6.0, chunkLength);
        const wallL = new THREE.Mesh(wallGeo, this.materials.trackTies);
        wallL.position.set(-6.5, 3.0, 0);
        chunk.add(wallL);

        const wallR = new THREE.Mesh(wallGeo, this.materials.trackTies);
        wallR.position.set(6.5, 3.0, 0);
        chunk.add(wallR);

        // Overhead gantry arches every 25 units
        const archGeo = new THREE.BoxGeometry(13.8, 0.3, 0.3);
        for (let z = -chunkLength / 2 + 10; z < chunkLength / 2; z += 24) {
            const arch = new THREE.Mesh(archGeo, this.materials.hazardDark);
            arch.position.set(0, 5.0, z);
            chunk.add(arch);

            // Hanging signal lights
            const sigGeo = new THREE.BoxGeometry(0.3, 0.6, 0.2);
            const sig = new THREE.Mesh(sigGeo, this.materials.neonPink);
            sig.position.set(0, 4.5, z);
            chunk.add(sig);
        }

        return chunk;
    }
}

window.ModelFactory = ModelFactory;
