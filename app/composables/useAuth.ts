import { ref, onMounted } from 'vue';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { ref as dbRef, set, get, child, update, serverTimestamp } from 'firebase/database';

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

      // 3. Save private profile data
      const userData = {
        uid: authUser.uid,
        username: username.toLowerCase().trim(),
        displayName: displayName,
        password: password, // Stored in DB as requested for 'friends sharing'
        createdAt: Date.now(),
        trophies: 0,
        history: {}
      };

      // 4. Save public leaderboard data
      const publicData = {
        uid: authUser.uid,
        username: username.toLowerCase().trim(),
        displayName: displayName,
        trophies: 0,
        raceCount: 0,
        lastMatchAt: serverTimestamp()
      };

      const updates: any = {};
      updates[`users/${authUser.uid}`] = userData;
      updates[`leaderboards/${authUser.uid}`] = publicData;

      await update(dbRef($db as any), updates);

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

  const loginAsGuest = async (displayName: string) => {
    try {
      const userCredential = await signInAnonymously($auth as any);
      await updateProfile(userCredential.user, { displayName });
      
      // Separate Guests from Real Users in the DB
      const userData = {
        uid: userCredential.user.uid,
        displayName: displayName,
        isAnonymous: true,
        createdAt: Date.now()
      };
      
      await set(dbRef($db as any, `guests/${userCredential.user.uid}`), userData);
      user.value = userData;
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

  const updateDisplayName = async (newName: string) => {
    if (!user.value) return;
    try {
      const { $auth, $db } = useNuxtApp();
      // 1. Update Auth Profile
      await updateProfile($auth.currentUser!, { displayName: newName });
      // 2. Update Database (Both Private and Public)
      await update(dbRef($db as any), {
        [`users/${user.value.uid}/displayName`]: newName,
        [`leaderboards/${user.value.uid}/displayName`]: newName
      });
      // 3. Update local state
      user.value.displayName = newName;
    } catch (error: any) {
      console.error(error);
      throw new Error(error.message);
    }
  };

  const recordMatchResult = async (rank: number, roomId: string) => {
    if (!user.value || user.value.isAnonymous) return;
    try {
      const { $db } = useNuxtApp();
      const uid = user.value.uid;
      const historyId = Date.now().toString();

      const matchData = {
        rank,
        roomId,
        timestamp: Date.now(),
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString()
      };

      const updates: any = {};
      updates[`users/${uid}/history/${historyId}`] = matchData;

      // Increment public race count & add Cooldown Timestamp
      const currentRaceCount = user.value.raceCount || (user.value.history ? Object.keys(user.value.history).length : 0);
      updates[`leaderboards/${uid}/raceCount`] = currentRaceCount + 1;
      updates[`leaderboards/${uid}/lastMatchAt`] = serverTimestamp();

      // If Rank 1, add trophy AND mark winner atomically
      if (rank === 1) {
        const currentTrophies = user.value.trophies || 0;
        const newTrophies = currentTrophies + 1;
        
        // PRIVATE DATA (with Proof)
        updates[`users/${uid}/trophies`] = newTrophies;
        updates[`users/${uid}/recentRoomId`] = roomId;
        
        // PUBLIC LEADERBOARD (with Proof)
        updates[`leaderboards/${uid}/trophies`] = newTrophies;
        updates[`leaderboards/${uid}/recentRoomId`] = roomId;
        
        // ATOMIC WINNER RECORDING (Critical for Rules Validation)
        updates[`rooms/${roomId}/winner`] = uid;
        updates[`rooms/${roomId}/status`] = 'finished';
        
        user.value.trophies = newTrophies;
      }

      await update(dbRef($db as any), updates);

      // Local sync
      if (!user.value.history) user.value.history = {};
      user.value.history[historyId] = matchData;

    } catch (error) {
      console.error('Failed to record match:', error);
    }
  };

  const getGlobalLeaderboard = async () => {
    try {
      const { $db } = useNuxtApp();
      // Only fetch from the PUBLIC node now
      const leaderboardSnap = await get(dbRef($db as any, 'leaderboards'));
      if (!leaderboardSnap.exists()) return [];

      const leaderboardData = leaderboardSnap.val();
      const rawUsers = Object.values(leaderboardData)
        .map((u: any) => ({
          uid: u.uid || u.id,
          displayName: u.displayName,
          username: u.username,
          trophies: u.trophies || 0,
          raceCount: u.raceCount || 0
        }));

      // Deduplicate by username to avoid multiple entries from the same user (cleanup)
      const uniqueUsers: any[] = [];
      const seenUsernames = new Set();

      // Sort first to ensure we keep the highest performer if duplicates exist
      rawUsers.sort((a, b) => b.trophies - a.trophies);

      for (const user of rawUsers) {
        if (user.username && !seenUsernames.has(user.username)) {
          seenUsernames.add(user.username);
          uniqueUsers.push(user);
        }
      }

      return uniqueUsers;
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
      return [];
    }
  };

  // Sync session with Firebase Auth lifecycle
  onMounted(() => {
    onAuthStateChanged($auth as any, async (authUser) => {
      if (authUser) {
        // Fetch from the correct node based on auth type
        const node = authUser.isAnonymous ? 'guests' : 'users';
        const userSnap = await get(child(dbRef($db as any), `${node}/${authUser.uid}`));
        
        if (userSnap.exists()) {
          const data = userSnap.val();
          user.value = {
            ...data,
            trophies: data.trophies || 0,
            history: data.history || {},
            isAnonymous: authUser.isAnonymous
          };

          // SILENT MIGRATION: If public leaderboard entry is missing for a real user, create it
          if (!authUser.isAnonymous) {
             const leaderboardSnap = await get(child(dbRef($db as any), `leaderboards/${authUser.uid}`));
             if (!leaderboardSnap.exists()) {
                await set(dbRef($db as any, `leaderboards/${authUser.uid}`), {
                   uid: authUser.uid,
                   displayName: data.displayName || authUser.displayName,
                   username: data.username || authUser.email?.split('@')[0],
                   trophies: data.trophies || 0,
                   raceCount: data.history ? Object.keys(data.history).length : 0,
                   lastMatchAt: serverTimestamp()
                });
             }
          }
        } else {
          user.value = {
            uid: authUser.uid,
            displayName: authUser.displayName,
            username: authUser.email?.split('@')[0] || 'guest_' + authUser.uid.slice(0, 5),
            trophies: 0,
            history: {},
            isAnonymous: authUser.isAnonymous
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
    loginAsGuest,
    logout,
    updateDisplayName,
    recordMatchResult,
    getGlobalLeaderboard
  };
};
