import { ref, onMounted } from 'vue';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { ref as dbRef, set, get, child } from 'firebase/database';

export const useAuth = () => {
  const { $auth, $db } = useNuxtApp();
  const user = ref<any>(null);
  const loading = ref(true);

  // Helper alias to wrap username to email
  const formatEmail = (username: string) => `${username.toLowerCase().trim()}@jigsaw.com`;

  const signUp = async (username: string, password: string, displayName: string) => {
    try {
      const email = formatEmail(username);
      
      // 1. Create the official Firebase Auth account
      const userCredential = await createUserWithEmailAndPassword($auth as any, email, password);
      const authUser = userCredential.user;

      // 2. Update Display Name in Auth
      await updateProfile(authUser, { displayName });

      // 3. Save profile data to Realtime Database (including password as requested)
      const userData = {
        uid: authUser.uid,
        username: username.toLowerCase().trim(),
        displayName: displayName,
        password: password, // Stored in DB as requested for 'friends sharing'
        createdAt: Date.now()
      };

      await set(dbRef($db as any, `users/${authUser.uid}`), userData);
      
      // Update local state immediately for better UX
      user.value = userData;

      return authUser;
    } catch (error: any) {
      console.error(error);
      throw new Error(error.message);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      const email = formatEmail(username);
      const userCredential = await signInWithEmailAndPassword($auth as any, email, password);
      return userCredential.user;
    } catch (error: any) {
      console.error(error);
      throw new Error(error.message);
    }
  };

  const logout = async () => {
    try {
      await signOut($auth as any);
      user.value = null;
    } catch (error: any) {
      console.error(error);
    }
  };

  // Sync session with Firebase Auth lifecycle
  onMounted(() => {
    onAuthStateChanged($auth as any, async (authUser) => {
      if (authUser) {
        // Fetch extra data from DB
        const userSnap = await get(child(dbRef($db as any), `users/${authUser.uid}`));
        if (userSnap.exists()) {
           user.value = userSnap.val();
        } else {
           // Fallback to auth data
           user.value = {
             uid: authUser.uid,
             displayName: authUser.displayName,
             username: authUser.email?.split('@')[0]
           };
        }
      } else {
        user.value = null;
      }
      loading.value = false;
    });
  });

  return {
    user,
    loading,
    signUp,
    login,
    logout
  };
};
