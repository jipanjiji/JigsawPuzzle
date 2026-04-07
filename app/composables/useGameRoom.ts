import { ref, computed, watch, onMounted } from 'vue';
import { ref as dbRef, set, get, child, update, onValue, off, remove, query, orderByChild, equalTo, onDisconnect } from 'firebase/database';
import { useAuth } from './useAuth';

export const useGameRoom = () => {
  const { $db } = useNuxtApp();
  const { user } = useAuth();

  const currentRoomId = ref<string | null>(null);
  const roomState = ref<any>(null);
  const kickedFromRoom = ref<string | null>(null);

  // Use Firebase UID as the primary key for players
  const currentPlayerId = computed(() => user.value?.uid || null);
  const userNode = computed(() => user.value?.isAnonymous ? 'guests' : 'users');

  const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const generateSecureHash = () => {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15) + 
           Date.now().toString(36);
  };

  const checkUserInRoom = async (uid: string) => {
    const dbRoot = dbRef($db as any);
    const userSnapshot = await get(child(dbRoot, `${userNode.value}/${uid}/currentRoomId`));
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

  const createRoom = async (playerName: string, visibility: 'public' | 'private' = 'public', customName?: string) => {
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
        await update(dbRef($db as any), { [`${userNode.value}/${currentPlayerId.value}/currentRoomId`]: null });
      }
    }

    const roomId = generateRoomCode();
    const inviteHash = generateSecureHash();
    const dbRoot = dbRef($db as any);

    const updates: any = {};
    updates[`rooms/${roomId}`] = {
      status: 'waiting',
      host: currentPlayerId.value,
      name: customName || `${playerName}'s Room`,
      visibility: visibility,
      inviteHash: inviteHash,
      players: {
        [currentPlayerId.value!]: {
          name: playerName,
          username: user.value?.username || '',
          isReady: false,
          progress: 0
        }
      },
      settings: {
        imageUrl: 'https://cdn.grid.id/crop/0x0:0x0/780x800/photo/bobofoto/original/3708_foto-pinterestcom.jpg',
        gridSize: 4
      }
    };
    updates[`${userNode.value}/${currentPlayerId.value}/currentRoomId`] = roomId;
    updates[`invites/${inviteHash}`] = roomId;

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
        await update(dbRef($db as any), { [`${userNode.value}/${currentPlayerId.value}/currentRoomId`]: null });
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
    if (playersCount >= 6 && !data.players[currentPlayerId.value!]) {
      throw new Error('Room is full (Max 6 Players)');
    }

    const updates: any = {};
    updates[`rooms/${roomId}/players/${currentPlayerId.value}`] = {
      name: playerName,
      username: user.value?.username || '',
      isReady: false,
      progress: 0
    };
    updates[`${userNode.value}/${currentPlayerId.value}/currentRoomId`] = roomId;

    await update(dbRoot, updates);

    currentRoomId.value = roomId;
    listenToRoom(roomId);
    return roomId;
  };

  const listenToRoom = (roomId: string) => {
    const uid = currentPlayerId.value;
    if (!uid) return;

    const roomRef = dbRef($db as any, `rooms/${roomId}`);
    onValue(roomRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        
        // Check if I was kicked
        if (data.players && !data.players[uid]) {
            kickedFromRoom.value = data.name || roomId;
            roomState.value = null;
            currentRoomId.value = null;
            update(dbRef($db as any), { [`${userNode.value}/${uid}/currentRoomId`]: null });
            return;
        }

        roomState.value = data;

        // Set up Disconnect Handlers
        const playerPresenceRef = dbRef($db as any, `rooms/${roomId}/players/${uid}`);
        const userStatusRef = dbRef($db as any, `${userNode.value}/${uid}/currentRoomId`);
        
        onDisconnect(playerPresenceRef).remove();
        onDisconnect(userStatusRef).set(null);

        // If host, onDisconnect deletes the room
        if (data.host === uid) {
          onDisconnect(roomRef).remove();
          if (data.inviteHash) {
            onDisconnect(dbRef($db as any, `invites/${data.inviteHash}`)).remove();
          }
        }
      } else {
        roomState.value = null;
        currentRoomId.value = null;
        update(dbRef($db as any), { [`${userNode.value}/${uid}/currentRoomId`]: null });
      }
    });
  };

  const leaveRoom = async () => {
    if (currentRoomId.value && currentPlayerId.value) {
      const roomId = currentRoomId.value;
      const uid = currentPlayerId.value;
      const dbRoot = dbRef($db as any);

      // Cancel Disconnect Handlers
      const roomRef = dbRef($db as any, `rooms/${roomId}`);
      const inviteHash = roomState.value?.inviteHash;
      const isHost = roomState.value?.host === uid;

      onDisconnect(dbRef($db as any, `rooms/${roomId}/players/${uid}`)).cancel();
      onDisconnect(dbRef($db as any, `${userNode.value}/${uid}/currentRoomId`)).cancel();
      if (isHost) {
        onDisconnect(roomRef).cancel();
        if (inviteHash) {
          onDisconnect(dbRef($db as any, `invites/${inviteHash}`)).cancel();
        }
      }

      off(roomRef);

      const updates: any = {};
      if (isHost) {
        // If host leaves, delete the entire room
        updates[`rooms/${roomId}`] = null;
        if (inviteHash) updates[`invites/${inviteHash}`] = null;
      } else {
        updates[`rooms/${roomId}/players/${uid}`] = null;
      }
      updates[`${userNode.value}/${uid}/currentRoomId`] = null;

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

  const updateRoomName = async (roomId: string, name: string) => {
    const dbRoot = dbRef($db as any);
    await update(dbRoot, { [`rooms/${roomId}/name`]: name });
  };

  const toggleVisibility = async (roomId: string, visibility: 'public' | 'private') => {
    const dbRoot = dbRef($db as any);
    await update(dbRoot, { [`rooms/${roomId}/visibility`]: visibility });
  };

  const getPublicRooms = async () => {
    const roomsRef = dbRef($db as any, 'rooms');
    const publicQuery = query(
      roomsRef,
      orderByChild('visibility'),
      equalTo('public')
    );
    const snapshot = await get(publicQuery);
    if (!snapshot.exists()) return [];
    
    return Object.entries(snapshot.val())
      .map(([id, data]: [string, any]) => ({ id, ...data }))
      .filter(room => room.status === 'waiting');
  };

  const subscribeToPublicRooms = (callback: (rooms: any[]) => void) => {
    const roomsRef = dbRef($db as any, 'rooms');
    const publicQuery = query(
      roomsRef,
      orderByChild('visibility'),
      equalTo('public')
    );

    const listener = onValue(publicQuery, (snapshot) => {
      if (!snapshot.exists()) {
        callback([]);
        return;
      }
      const rooms = Object.entries(snapshot.val())
        .map(([id, data]: [string, any]) => ({ id, ...data }))
        .filter(room => room.status === 'waiting');
      callback(rooms);
    });

    return () => off(publicQuery, 'value', listener);
  };

  const getRoomIdByHash = async (hash: string) => {
    const dbRoot = dbRef($db as any);
    const snap = await get(child(dbRoot, `invites/${hash}`));
    return snap.exists() ? snap.val() : null;
  };

  const kickPlayer = async (roomId: string, playerUid: string) => {
    const dbRoot = dbRef($db as any);
    const updates: any = {};
    updates[`rooms/${roomId}/players/${playerUid}`] = null;
    await update(dbRoot, updates);
  };

  const completeMatch = async (roomId: string, winnerUid: string) => {
    const dbRoot = dbRef($db as any);
    const updates: any = {};
    updates[`rooms/${roomId}/status`] = 'finished';
    updates[`rooms/${roomId}/winner`] = winnerUid;
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
    updateRoomName,
    toggleVisibility,
    getPublicRooms,
    subscribeToPublicRooms,
    getRoomIdByHash,
    kickPlayer,
    completeMatch,
    kickedFromRoom,
  };
};
