# 🚇 Metro Rush: Skyrail Surge

A vibrant, 3D cross-platform endless runner game inspired by Subway Surfers and Metro Rush, built with modern WebGL (Three.js) and responsive mobile-first touch architecture.

---

## 🎮 How to Play

### 📱 On Mobile (Phones & Tablets)
* **Swipe Left / Right:** Switch between Left, Middle, and Right lanes.
* **Swipe Up:** Jump over low track barriers and hurdles.
* **Swipe Down:** Slide / Duck under overhead signs, beams, and dive down quickly when in mid-air.
* **Double Tap (or Tap 🛹 Button):** Activate your **Hoverboard** for an extra-life shield!
* **Touch Feedback:** Features dynamic glowing swipe-trail ribbons and haptic vibration feedback.
* **Virtual D-Pad:** Accessible on-screen directional buttons available in the bottom-right corner.

### 💻 On Desktop
* **Arrow Left / A:** Move Left
* **Arrow Right / D:** Move Right
* **Arrow Up / W:** Jump
* **Arrow Down / S:** Slide / Duck
* **Spacebar:** Activate Hoverboard
* **P / Escape:** Pause / Resume game

---

## 🌟 Unique Creative Differentiators (Beyond standard Metro Rush)

1. **⚡ Dynamic Rail Grinding:**
   * Grinding on the central electrified power rail or train roof edges triggers electric spark cascades and bonus combo multipliers!
2. **🚆 Multi-Tier Express Trains & Rooftop Ramps:**
   * Stationary trains feature climbable angled ramps so you can seamlessly run up onto train roofs.
   * Moving oncoming express trains with Doppler audio horns.
3. **🚀 Cartoon Arcade Power-Ups:**
   * 🧲 **Coin Magnet:** High-radius magnetic pull drawing all nearby coins to you.
   * 🚀 **Jetpack:** Launches you high above the subway into a sky-high coin highway.
   * 👟 **Super Sneakers:** Super bouncy jump force to leap clear over entire trains.
   * ✖️ **2X Multiplier:** Doubles all score increments.
   * 🛹 **Hoverboard:** Protects against fatal crashes by absorbing the impact and triggering a recovery bounce.
4. **🛍️ Character Locker & Shop:**
   * Unlock and switch characters:
     * **Dash:** The classic street runner (Red hoodie & denim).
     * **Nova:** Cyberpunk speedster with glowing cyan visor and neon trims.
     * **Spark:** Rooftop racer with orange street gear and purple headphones.
5. **🎵 Procedural Audio & Music Engine:**
   * Built entirely using the browser's Web Audio API — zero audio file loading delays, 100% offline-ready, with dynamic pitch-shifting coin pickups, cartoon whooshes, train horns, and an upbeat arcade synth-bass background track.
6. **💾 Persistent Progress:**
   * High score, total coin wallet, and unlocked characters are automatically saved via `localStorage`.

---

## 🚀 Running the Game

To play in your browser or on your phone over Wi-Fi:

```bash
node server.js
```

Then open:
* **Desktop:** `http://localhost:3000`
* **Mobile Phone:** `http://<YOUR_LOCAL_IP>:3000` (shown in terminal output)
