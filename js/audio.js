// Procedural Web Audio API sound generator & music engine
class SoundSystem {
    constructor() {
        this.ctx = null;
        this.sfxMuted = false;
        this.musicMuted = false;
        this.volume = 0.7;
        this.musicGain = null;
        this.sfxGain = null;
        this.isPlayingMusic = false;
        this.musicInterval = null;
        this.coinCombo = 0;
        this.lastCoinTime = 0;
        this.grindOsc = null;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
            
            this.sfxGain = this.ctx.createGain();
            this.sfxGain.gain.value = this.sfxMuted ? 0 : this.volume;
            this.sfxGain.connect(this.ctx.destination);

            this.musicGain = this.ctx.createGain();
            this.musicGain.gain.value = this.musicMuted ? 0 : this.volume * 0.35;
            this.musicGain.connect(this.ctx.destination);
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    setSFXMute(muted) {
        this.sfxMuted = muted;
        if (this.sfxGain) {
            this.sfxGain.gain.value = muted ? 0 : this.volume;
        }
    }

    setMusicMute(muted) {
        this.musicMuted = muted;
        if (this.musicGain) {
            this.musicGain.gain.value = muted ? 0 : this.volume * 0.35;
        }
    }

    setMasterVolume(val) {
        this.volume = Math.max(0, Math.min(1, val));
        if (this.sfxGain && !this.sfxMuted) this.sfxGain.gain.value = this.volume;
        if (this.musicGain && !this.musicMuted) this.musicGain.gain.value = this.volume * 0.35;
    }

    // Sound Effects
    playCoin() {
        if (!this.ctx || this.sfxMuted) return;
        const now = this.ctx.currentTime;
        if (now - this.lastCoinTime < 0.4) {
            this.coinCombo = Math.min(this.coinCombo + 1, 10);
        } else {
            this.coinCombo = 0;
        }
        this.lastCoinTime = now;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';

        const baseFreq = 987.77; // B5
        const scale = [1, 1.122, 1.259, 1.498, 1.681, 1.887, 2.0];
        const pitchMultiplier = scale[this.coinCombo % scale.length];

        osc.frequency.setValueAtTime(baseFreq * pitchMultiplier, now);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * pitchMultiplier * 1.5, now + 0.12);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.15);
    }

    playJump() {
        if (!this.ctx || this.sfxMuted) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(650, now + 0.18);

        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.2);
    }

    playSlide() {
        if (!this.ctx || this.sfxMuted) return;
        const now = this.ctx.currentTime;
        
        // White noise burst filtered for whoosh/skid
        const bufferSize = this.ctx.sampleRate * 0.22;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1400, now);
        filter.frequency.exponentialRampToValueAtTime(400, now + 0.2);
        filter.Q.value = 3.0;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);

        noise.start(now);
    }

    playGrind(active) {
        if (!this.ctx || this.sfxMuted) return;
        const now = this.ctx.currentTime;

        if (active && !this.grindOsc) {
            this.grindOsc = this.ctx.createOscillator();
            this.grindGain = this.ctx.createGain();
            this.grindOsc.type = 'sawtooth';
            this.grindOsc.frequency.setValueAtTime(320, now);

            this.grindGain.gain.setValueAtTime(0.12, now);
            this.grindOsc.connect(this.grindGain);
            this.grindGain.connect(this.sfxGain);
            this.grindOsc.start(now);
        } else if (!active && this.grindOsc) {
            try {
                this.grindGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
                this.grindOsc.stop(now + 0.06);
            } catch (e) {}
            this.grindOsc = null;
            this.grindGain = null;
        }
    }

    playPowerup() {
        if (!this.ctx || this.sfxMuted) return;
        const now = this.ctx.currentTime;
        const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.07);

            gain.gain.setValueAtTime(0.25, now + idx * 0.07);
            gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.07 + 0.18);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(now + idx * 0.07);
            osc.stop(now + idx * 0.07 + 0.2);
        });
    }

    playTrainHorn() {
        if (!this.ctx || this.sfxMuted) return;
        const now = this.ctx.currentTime;
        // Dual-tone classic metro horn
        [311.13, 370.0].forEach(freq => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, now);
            osc.frequency.linearRampToValueAtTime(freq * 0.94, now + 0.4);

            gain.gain.setValueAtTime(0.22, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(now);
            osc.stop(now + 0.45);
        });
    }

    playCrash() {
        if (!this.ctx || this.sfxMuted) return;
        const now = this.ctx.currentTime;

        // Low thud
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.35);

        gain.gain.setValueAtTime(0.6, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.4);

        // Noise crash
        const bufferSize = this.ctx.sampleRate * 0.35;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.08));
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const nGain = this.ctx.createGain();
        nGain.gain.setValueAtTime(0.5, now);
        nGain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        noise.connect(nGain);
        nGain.connect(this.sfxGain);
        noise.start(now);
    }

    playDevilGrowl() {
        if (!this.ctx || this.sfxMuted) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(95, now);
        osc.frequency.exponentialRampToValueAtTime(35, now + 0.6);

        gain.gain.setValueAtTime(0.45, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.65);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.65);
    }

    playStageFanfare() {
        if (!this.ctx || this.sfxMuted) return;
        const now = this.ctx.currentTime;
        const notes = [330, 440, 554.37, 659.25, 880];
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.08);

            gain.gain.setValueAtTime(0.3, now + idx * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.08 + 0.3);

            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(now + idx * 0.08);
            osc.stop(now + idx * 0.08 + 0.32);
        });
    }

    playClockTick() {
        if (!this.ctx || this.sfxMuted) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(1200, now);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.04);
    }

    playShatter() {
        if (!this.ctx || this.sfxMuted) return;
        const now = this.ctx.currentTime;
        const bufferSize = this.ctx.sampleRate * 0.2;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 800;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.45, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        noise.start(now);
    }

    playWheelClick() {
        if (!this.ctx || this.sfxMuted) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800 + Math.random() * 200, now);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.03);
    }

    // Dynamic Upbeat Chiptune/Synth BGM
    startMusic() {
        if (this.isPlayingMusic || !this.ctx) return;
        this.isPlayingMusic = true;

        const bpm = 132;
        const stepTime = 60 / bpm / 4; // 16th note
        let step = 0;

        // Bassline & chord patterns
        const bassNotes = [110, 110, 130.81, 146.83, 110, 110, 164.81, 146.83];
        const melodyNotes = [
            440, 0, 523.25, 587.33, 659.25, 0, 587.33, 523.25,
            440, 659.25, 0, 587.33, 523.25, 0, 440, 392
        ];

        this.musicInterval = setInterval(() => {
            if (this.musicMuted || !this.ctx || this.ctx.state !== 'running') return;
            const now = this.ctx.currentTime;

            // Drum beat: Kick on 0, 4, 8, 12
            if (step % 4 === 0) {
                const kick = this.ctx.createOscillator();
                const kGain = this.ctx.createGain();
                kick.frequency.setValueAtTime(130, now);
                kick.frequency.exponentialRampToValueAtTime(40, now + 0.08);
                kGain.gain.setValueAtTime(0.35, now);
                kGain.gain.exponentialRampToValueAtTime(0.01, now + 0.09);
                kick.connect(kGain);
                kGain.connect(this.musicGain);
                kick.start(now);
                kick.stop(now + 0.09);
            }

            // Snare / clap on 4, 12
            if (step % 8 === 4) {
                const snareFilter = this.ctx.createBiquadFilter();
                snareFilter.type = 'highpass';
                snareFilter.frequency.value = 1000;
                const bufferSize = this.ctx.sampleRate * 0.08;
                const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
                const noise = this.ctx.createBufferSource();
                noise.buffer = buffer;
                const sGain = this.ctx.createGain();
                sGain.gain.setValueAtTime(0.25, now);
                sGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
                noise.connect(snareFilter);
                snareFilter.connect(sGain);
                sGain.connect(this.musicGain);
                noise.start(now);
            }

            // Bassline
            if (step % 2 === 0) {
                const bNote = bassNotes[(Math.floor(step / 2)) % bassNotes.length];
                const bass = this.ctx.createOscillator();
                const bGain = this.ctx.createGain();
                bass.type = 'sawtooth';
                bass.frequency.setValueAtTime(bNote, now);
                bGain.gain.setValueAtTime(0.18, now);
                bGain.gain.exponentialRampToValueAtTime(0.01, now + stepTime * 1.8);
                bass.connect(bGain);
                bGain.connect(this.musicGain);
                bass.start(now);
                bass.stop(now + stepTime * 1.8);
            }

            // Melody
            const mNote = melodyNotes[step % melodyNotes.length];
            if (mNote > 0) {
                const mel = this.ctx.createOscillator();
                const mGain = this.ctx.createGain();
                mel.type = 'square';
                mel.frequency.setValueAtTime(mNote, now);
                mGain.gain.setValueAtTime(0.12, now);
                mGain.gain.exponentialRampToValueAtTime(0.01, now + stepTime * 1.5);
                mel.connect(mGain);
                mGain.connect(this.musicGain);
                mel.start(now);
                mel.stop(now + stepTime * 1.5);
            }

            step = (step + 1) % 64;
        }, stepTime * 1000);
    }

    stopMusic() {
        this.isPlayingMusic = false;
        if (this.musicInterval) {
            clearInterval(this.musicInterval);
            this.musicInterval = null;
        }
    }
}

window.sounds = new SoundSystem();
