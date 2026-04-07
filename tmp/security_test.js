import { initializeApp } from "firebase/app";
import { getDatabase, ref, get, child } from "firebase/database";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCVuh2Qjwqy5Ns2kfW6ObGrOFNdS7u-0xA",
  authDomain: "jigsaw-puzzle-b223e.firebaseapp.com",
  databaseURL: "https://jigsaw-puzzle-b223e-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "jigsaw-puzzle-b223e",
  storageBucket: "jigsaw-puzzle-b223e.firebasestorage.app",
  messagingSenderId: "1090769353450",
  appId: "1:1090769353450:web:078af344d83bf1973ff593"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

async function verifyHardening(email, password) {
    console.log(`--- VERIFIKASI KEAMANAN FIREBASE (HARDENED - ESM) ---`);
    
    try {
        console.log(`\n[0] Mencoba LOGIN...`);
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log(`✅ LOGIN BERHASIL! UID: ${user.uid}`);

        // 1. Tes Baca Root (Harus GAGAL)
        console.log("\n[1] Mencoba membaca ROOT (Seluruh Database)...");
        try {
            await get(ref(db));
            console.log("🔥 MASIH BAHAYA: Root masih bisa dibaca!");
        } catch (e) {
            console.log("✅ BERHASIL: Akses Root DITOLAK (Permission Denied).");
        }

        // 2. Tes Baca Node USERS (Harus GAGAL)
        console.log("\n[2] Mencoba membaca folder /users (Seluruh User)...");
        try {
            await get(child(ref(db), "users"));
            console.log("🔥 MASIH BAHAYA: Daftar user masih bisa dikuras!");
        } catch (e) {
            console.log("✅ BERHASIL: Folder /users DITOLAK (Permission Denied).");
        }

        // 3. Tes Baca Leaderboards (Harus BERHASIL)
        console.log("\n[3] Mencoba membaca folder /leaderboards (Data Publik)...");
        try {
            const snap = await get(child(ref(db), "leaderboards"));
            if (snap.exists()) {
                console.log("✅ BERHASIL: Leaderboard bisa dibaca (Sesuai Harapan).");
                console.log("📍 Jumlah data publik ditemukan:", Object.keys(snap.val()).length);
            }
        } catch (e) {
            console.log("❌ ERROR: Leaderboard tidak bisa dibaca!", e.message);
        }

        // 4. Tes Baca Profil Sendiri (Harus BERHASIL)
        console.log(`\n[4] Mencoba membaca profil sendiri (/users/${user.uid})...`);
        try {
            const snap = await get(child(ref(db), `users/${user.uid}`));
            if (snap.exists()) {
                console.log("✅ BERHASIL: Profil sendiri bisa dibaca.");
            }
        } catch (e) {
            console.log("❌ ERROR: Profil sendiri tidak bisa dibaca!", e.message);
        }

    } catch (error) {
        console.error("❌ ERROR LOGIN:", error.message);
    }

    console.log("\n--- VERIFIKASI SELESAI ---");
    process.exit();
}

verifyHardening("test@jigsaw.com", "123456");
