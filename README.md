# 🧩 Jigsaw Arena: Multiplayer Puzzle Race

**Jigsaw Arena** is a high-performance, real-time multiplayer jigsaw puzzle competition platform. Experience the thrill of racing against others to complete stunning puzzles in a premium, hacker-themed interface.

![Jigsaw Arena Banner](https://placehold.co/1200x400/0a0a0a/6366f1?text=Jigsaw+Arena+Multiplayer)

---

## ✨ Features
- **Real-Time Multiplayer**: Race against friends or global players with sub-second synchronization.
- **Dynamic Difficulty**: Choose from 2x2 (Practice) up to 10x10 (Pro) challenges.
- **Hardened Security**: Multi-layered anti-cheat system with server-side validation.
- **Global Leaderboard**: Track your trophies and climb the ranks of competitive puzzle solvers.
- **Match History**: A full history of your previous victories, ranks, and performance.
- **Responsive Design**: Play seamlessly on desktop or mobile device.

---

## 🛡️ Security & Anti-Cheat
We take competitive integrity seriously. Jigsaw Arena implements a **"Proof of Win"** verification system:
- **Trophy Validation**: Trophies are only awarded for completed matches (4x4 grid or larger).
- **Atomic Wins**: The recording of the winner, the trophy increment, and the room closure happen in a single atomic database update to prevent spoofing.
- **Integrity Checks**: Validates player progress (100% required) and unique Room IDs to prevent replay attacks.
- **Git Hardened**: Sensitive configuration (like database rules) is excluded from version control.

---

## 🚀 Tech Stack
- **Framework**: [Nuxt 3](https://nuxt.com/) (Vue 3, Vite)
- **Database**: [Firebase Realtime Database](https://firebase.google.com/products/realtime-database)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Authentication**: Firebase Auth (Anonymous & Email Support)
- **Animations**: Framer Motion inspired Vue transitions & Tailwind utility animations.

---

## 🛠️ Setup & Local Development

### 1. Requirements
Make sure you have [Node.js](https://nodejs.org/) installed (LTS recommended).

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/jipanjiji/JigsawPuzzle.git

# Install dependencies
npm install
```

### 3. Environment Config
Create a `.env` file in the root directory and add your Firebase credentials:
```env
NUXT_PUBLIC_FIREBASE_API_KEY=YOUR_API_KEY
NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN=YOUR_AUTH_DOMAIN
NUXT_PUBLIC_FIREBASE_DATABASE_URL=YOUR_DATABASE_URL
# ... other Firebase config
```

### 4. Development Server
Start the dev server on `http://localhost:3000`:
```bash
npm run dev
```

### 5. Production Build
```bash
npm run build
npm run preview
```

---

## 📂 Project Structure
- `app/components/` - Reusable UI components (Arena, Leaderboard, Profile).
- `app/composables/` - Core logic for Auth, Game Rooms, and Real-time sync.
- `app/pages/` - Application routing and page layouts.
- `database.rules.json` - Hardened security rules for the Firebase Realtime Database.

---

## 📜 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

Developed with ❤️ by **Alvin**. 🧩✨
