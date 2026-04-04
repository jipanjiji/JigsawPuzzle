import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';

export default defineNuxtPlugin((nuxtApp) => {
  const firebaseConfig = {
    apiKey: "AIzaSyCVuh2Qjwqy5Ns2kfW6ObGrOFNdS7u-0xA",
    authDomain: "jigsaw-puzzle-b223e.firebaseapp.com",
    databaseURL: "https://jigsaw-puzzle-b223e-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "jigsaw-puzzle-b223e",
    storageBucket: "jigsaw-puzzle-b223e.firebasestorage.app",
    messagingSenderId: "1090769353450",
    appId: "1:1090769353450:web:078af344d83bf1973ff593"
  };

  const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  const db = getDatabase(app);
  const auth = getAuth(app);

  return {
    provide: {
      db,
      auth
    },
  };
});
