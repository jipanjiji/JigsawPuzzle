import { ref, computed, watch, onMounted } from 'vue';
import { ref as dbRef, set, get, child, update, onValue, off, remove } from 'firebase/database';
import { useAuth } from './useAuth';

export const useGameRoom = () => {
  const { $db } = useNuxtApp();
  const { user } = useAuth();
  
  const currentRoomId = ref<string | null>(null);
  const roomState = ref<any>(null);
  
  // Use Firebase UID as the primary key for players
  const currentPlayerId = computed(() => user.value?.uid || null);

  const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const checkUserInRoom = async (uid: string) => {
    const dbRoot = dbRef($db as any);
    const userSnapshot = await get(child(dbRoot, `users/${uid}/currentRoomId`));
    return userSnapshot.val();
  };

  // Sync Room with current User UID Session
  watch(currentPlayerId, async (newId) => {
    if (newId) {
       const roomId = await checkUserInRoom(newId);
       if (roomId) {
          currentRoomId.value = roomId;
          listenToRoom(roomId);
       }
    } else {
       currentRoomId.value = null;
       roomState.value = null;
    }
  }, { immediate: true });

  const createRoom = async (playerName: string) => {
    if (!currentPlayerId.value) throw new Error('Please login first');
    
    // 1-Match Limit Check
    const activeRoom = await checkUserInRoom(currentPlayerId.value);
    if (activeRoom) {
       const dbRoot = dbRef($db as any);
       const roomSnapshot = await get(child(dbRoot, `rooms/${activeRoom}`));
       if (roomSnapshot.exists()) {
          throw new Error(`You are already in an active room: ${activeRoom}`);
       } else {
          // Clean up stale room ID
          await update(dbRef($db as any), { [`users/${currentPlayerId.value}/currentRoomId`]: null });
       }
    }

    const roomId = generateRoomCode();
    const dbRoot = dbRef($db as any);
    
    const updates: any = {};
    updates[`rooms/${roomId}`] = {
      status: 'waiting',
      host: currentPlayerId.value,
      players: {
        [currentPlayerId.value!]: {
          name: playerName,
          isReady: false,
          progress: 0
        }
      },
      settings: {
        imageUrl: 'https://cdn.grid.id/crop/0x0:0x0/780x800/photo/bobofoto/original/3708_foto-pinterestcom.jpg',
        gridSize: 4
      }
    };
    updates[`users/${currentPlayerId.value}/currentRoomId`] = roomId;

    await update(dbRoot, updates);

    currentRoomId.value = roomId;
    listenToRoom(roomId);
    return roomId;
  };

  const joinRoom = async (roomId: string, playerName: string) => {
    if (!currentPlayerId.value) throw new Error('Please login first');
    
    // 1-Match Limit Check
    const activeRoom = await checkUserInRoom(currentPlayerId.value);
    roomId = roomId.toUpperCase();
    
    if (activeRoom && activeRoom !== roomId) {
       const dbRoot = dbRef($db as any);
       const roomSnapshot = await get(child(dbRoot, `rooms/${activeRoom}`));
       if (roomSnapshot.exists()) {
          throw new Error(`You are already in another active room: ${activeRoom}`);
       } else {
          // Clean up stale room ID
          await update(dbRef($db as any), { [`users/${currentPlayerId.value}/currentRoomId`]: null });
       }
    }

    const dbRoot = dbRef($db as any);
    const roomSnapshot = await get(child(dbRoot, `rooms/${roomId}`));
    
    if (!roomSnapshot.exists()) {
      throw new Error('Room not found');
    }
    
    const data = roomSnapshot.val();
    if (data.status !== 'waiting' && !data.players?.[currentPlayerId.value]) {
      throw new Error('Game already started or finished');
    }
    
    const playersCount = Object.keys(data.players || {}).length;
    if (playersCount >= 2 && !data.players[currentPlayerId.value!]) {
      throw new Error('Room is full');
    }

    const updates: any = {};
    updates[`rooms/${roomId}/players/${currentPlayerId.value}`] = {
      name: playerName,
      isReady: false,
      progress: 0
    };
    updates[`users/${currentPlayerId.value}/currentRoomId`] = roomId;
    
    await update(dbRoot, updates);
    
    currentRoomId.value = roomId;
    listenToRoom(roomId);
    return roomId;
  };

  const listenToRoom = (roomId: string) => {
    const roomRef = dbRef($db as any, `rooms/${roomId}`);
    onValue(roomRef, (snapshot) => {
      if (snapshot.exists()) {
        roomState.value = snapshot.val();
      } else {
        roomState.value = null;
        currentRoomId.value = null;
        if (currentPlayerId.value) {
           update(dbRef($db as any), { [`users/${currentPlayerId.value}/currentRoomId`]: null });
        }
      }
    });
  };

  const leaveRoom = async () => {
    if (currentRoomId.value && currentPlayerId.value) {
      const roomId = currentRoomId.value;
      const uid = currentPlayerId.value;
      const dbRoot = dbRef($db as any);

      const roomRef = dbRef($db as any, `rooms/${roomId}`);
      off(roomRef);
      
      const updates: any = {};
      updates[`rooms/${roomId}/players/${uid}`] = null;
      updates[`users/${uid}/currentRoomId`] = null;

      await update(dbRoot, updates);

      currentRoomId.value = null;
      roomState.value = null;
    }
  };

  const toggleReady = async (roomId: string, isReady: boolean) => {
    if (!currentPlayerId.value) return;
    const dbRoot = dbRef($db as any);
    const updates: any = {};
    updates[`rooms/${roomId}/players/${currentPlayerId.value}/isReady`] = isReady;
    await update(dbRoot, updates);
  };
  
  const setImageUrl = async (roomId: string, url: string) => {
     const dbRoot = dbRef($db as any);
     const updates: any = {};
     updates[`rooms/${roomId}/settings/imageUrl`] = url;
     await update(dbRoot, updates);
  }

  const setGridSize = async (roomId: string, size: number) => {
     const dbRoot = dbRef($db as any);
     const updates: any = {};
     updates[`rooms/${roomId}/settings/gridSize`] = size;
     await update(dbRoot, updates);
  }

  const startGame = async (roomId: string) => {
    const dbRoot = dbRef($db as any);
    const updates: any = {};
    updates[`rooms/${roomId}/status`] = 'playing';
    await update(dbRoot, updates);
  };

  const setPiecesSetup = async (roomId: string, scramble: any[], pattern: any[]) => {
    const dbRoot = dbRef($db as any);
    const updates: any = {};
    updates[`rooms/${roomId}/scramble`] = scramble;
    updates[`rooms/${roomId}/puzzlePattern`] = pattern;
    await update(dbRoot, updates);
  };

  const updateProgress = async (roomId: string, progress: number) => {
    if (!currentPlayerId.value) return;
    const dbRoot = dbRef($db as any);
    const updates: any = {};
    updates[`rooms/${roomId}/players/${currentPlayerId.value}/progress`] = progress;
    await update(dbRoot, updates);
  };

  return {
    currentRoomId,
    currentPlayerId,
    roomState,
    createRoom,
    joinRoom,
    listenToRoom,
    leaveRoom,
    toggleReady,
    setImageUrl,
    setGridSize,
    startGame,
    setPiecesSetup,
    updateProgress,
  };
};
