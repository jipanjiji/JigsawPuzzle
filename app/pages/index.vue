<template>
  <div class="relative min-h-screen flex items-center justify-center overflow-hidden p-6 font-layout">
    <!-- Background -->
    <div class="absolute inset-0 z-0">
      <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px] animate-pulse"></div>
      <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[100px] animate-pulse" style="animation-delay: 2s;"></div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="relative z-50 text-white flex flex-col items-center gap-4">
       <div class="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
       <p class="font-black text-xs uppercase tracking-[0.3em] animate-pulse">Loading...</p>
    </div>

    <!-- Main Container -->
    <div v-else class="relative z-10 w-full max-w-5xl">
      
      <!-- Auth Screen -->
      <div v-if="!user" class="max-w-md mx-auto animate-in fade-in zoom-in-95 duration-500">
        <div class="text-center mb-8">
            <h1 class="text-5xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent uppercase tracking-tighter">Jigsaw Rush</h1>
            <p class="text-slate-400 font-black uppercase text-[10px] tracking-[0.3em]">Multiplayer Puzzle Game</p>
        </div>

        <div class="glass rounded-[2.5rem] p-8 border border-white/10 shadow-2xl">
          <div class="flex p-1 bg-surface/50 rounded-2xl mb-8 border border-white/5">
             <button @click="authState = 'login'" :class="authState === 'login' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-white'" class="flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all">Login</button>
             <button @click="authState = 'signup'" :class="authState === 'signup' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-white'" class="flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all">Sign Up</button>
             <button @click="authState = 'guest'" :class="authState === 'guest' ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-slate-400 hover:text-white'" class="flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Guest</button>
          </div>

          <form @submit.prevent="handleAuth" class="space-y-4">
            <div v-if="authState === 'guest' || authState === 'signup'">
              <label class="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-1 tracking-[0.2em]">Display Name</label>
              <input v-model="authForm.displayName" type="text" placeholder="e.g. John Doe" class="w-full bg-surface/50 border border-white/5 rounded-2xl px-5 py-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium" :required="authState === 'guest' || authState === 'signup'" />
            </div>
            
            <div v-if="authState !== 'guest'">
              <label class="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-1 tracking-[0.2em]">Username</label>
              <input v-model="authForm.username" type="text" placeholder="username" class="w-full bg-surface/50 border border-white/5 rounded-2xl px-5 py-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium uppercase" :required="authState !== 'guest'" />
            </div>

            <div v-if="authState !== 'guest'">
              <label class="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-1 tracking-[0.2em]">Password</label>
              <input v-model="authForm.password" type="password" placeholder="••••••••" class="w-full bg-surface/50 border border-white/5 rounded-2xl px-5 py-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium" :required="authState !== 'guest'" />
            </div>

            <div v-if="authState === 'signup'">
              <label class="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-1 tracking-[0.2em]">Confirm Password</label>
              <input v-model="authForm.confirmPassword" type="password" placeholder="••••••••" class="w-full bg-surface/50 border border-white/5 rounded-2xl px-5 py-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium" :required="authState === 'signup'" />
            </div>

            <button type="submit" :disabled="isAuthLoading" :class="authState === 'guest' ? 'bg-accent shadow-accent/30' : 'bg-primary shadow-primary/30'" class="w-full hover:opacity-90 text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] transition-all shadow-xl disabled:opacity-50 mt-6 text-sm">
               {{ isAuthLoading ? 'Please wait...' : (authState === 'login' ? 'Login' : (authState === 'signup' ? 'Create Account' : 'Join as Guest')) }}
            </button>
            <p v-if="authError" class="text-red-400 text-[10px] font-bold text-center mt-4 border border-red-400/20 bg-red-400/5 py-2 rounded-lg">{{ authError }}</p>
          </form>
        </div>
      </div>

      <!-- Dashboard -->
      <div v-else class="flex flex-col gap-6 animate-in fade-in duration-700">
          <!-- Top Nav -->
          <div class="glass p-4 rounded-[2rem] border border-white/10 flex items-center justify-between px-8 shadow-2xl">
              <div class="flex items-center gap-8">
                  <h1 @click="activeTab = 'arena'" class="cursor-pointer text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent uppercase tracking-tighter">Jigsaw Rush</h1>
                  <nav class="flex gap-2">
                      <button @click="activeTab = 'arena'" :class="activeTab === 'arena' ? 'bg-primary/20 text-primary border-primary/30 shadow-lg shadow-primary/5' : 'text-slate-400 border-transparent hover:bg-white/5'" class="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all">Arena</button>
                      <button @click="activeTab = 'profile'" :class="activeTab === 'profile' ? 'bg-primary/20 text-primary border-primary/30 shadow-lg shadow-primary/5' : 'text-slate-400 border-transparent hover:bg-white/5'" class="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all">Profile</button>
                      <button @click="activeTab = 'leaderboard'" :class="activeTab === 'leaderboard' ? 'bg-primary/20 text-primary border-primary/30 shadow-lg shadow-primary/5' : 'text-slate-400 border-transparent hover:bg-white/5'" class="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all">Leaderboard</button>
                  </nav>
              </div>

              <div class="flex items-center gap-6">
                  <div class="flex items-center gap-3 bg-yellow-400/10 px-5 py-2.5 rounded-2xl border border-yellow-400/20 shadow-inner">
                      <span class="text-xl">🏆</span>
                      <div class="flex flex-col leading-tight">
                          <span class="text-[9px] font-black text-yellow-400 uppercase tracking-tighter">Trophies</span>
                          <span class="text-xl font-black text-white tabular-nums">{{ user.trophies || 0 }}</span>
                      </div>
                  </div>
                  <button @click="isLogoutModalOpen = true" class="px-6 py-4 rounded-2xl border border-white/5 bg-surface/50 hover:bg-red-500/10 hover:border-red-500/30 text-slate-400 hover:text-red-400 transition-all flex items-center gap-3 group shadow-lg">
                      <span class="text-[10px] font-black uppercase tracking-widest hidden sm:block">Logout</span>
                      <svg class="group-hover:translate-x-1 transition-transform" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                  </button>
              </div>
          </div>

          <!-- Tab Content -->
          <div v-if="activeTab === 'arena'">
              <ArenaView 
                v-if="!currentRoomId"
                :user="user" 
                :isLoading="isActionLoading"
                @create="handleCreateRoom"
                @join="handleJoinRoom"
              />
              <div v-else-if="!roomState" class="glass p-20 rounded-[3rem] border border-white/10 flex flex-col items-center justify-center gap-6 animate-pulse">
                <div class="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p class="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Loading room...</p>
              </div>
              <LobbyView 
                v-else
                :currentRoomId="currentRoomId"
                :roomState="roomState"
                :userId="user.uid"
                :isHost="isHost"
                :isReady="isReady"
                :allReady="allReady"
                @leave="leaveRoom"
                @toggleReady="toggleReady(currentRoomId, $event)"
                @start="handleStartGame"
                @setImageUrl="setImageUrl(currentRoomId, $event)"
                @setGridSize="setGridSize(currentRoomId, $event)"
                @updateName="updateRoomName(currentRoomId, $event)"
                @toggleVisibility="toggleVisibility(currentRoomId, $event)"
                @kickPlayer="handleKickPlayer"
              />
          </div>

          <div v-else-if="activeTab === 'profile'">
              <div v-if="user.isAnonymous" class="glass p-20 rounded-[3rem] border border-white/10 flex flex-col items-center justify-center text-center gap-8 animate-in zoom-in-95 duration-500">
                  <div class="w-24 h-24 bg-accent/20 rounded-[2rem] flex items-center justify-center text-accent shadow-inner ring-1 ring-accent/20">
                      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
                  </div>
                  <div>
                      <h3 class="text-3xl font-black text-white uppercase tracking-tighter mb-4">Guest Profile</h3>
                      <p class="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] max-w-xs leading-relaxed">Sign up to unlock permanent history, trophies, and profile customization!</p>
                  </div>
                  <button @click="handleLogout" class="px-12 py-5 bg-primary hover:bg-primaryHover text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all shadow-xl shadow-primary/30 active:scale-95">
                      Register Now
                  </button>
              </div>
              <ProfileView 
                v-else
                :user="user"
                :isLoading="isActionLoading"
                @updateDisplayName="handleUpdateName"
              />
          </div>

          <div v-else-if="activeTab === 'leaderboard'">
              <div v-if="user.isAnonymous" class="glass p-20 rounded-[3rem] border border-white/10 flex flex-col items-center justify-center text-center gap-8 animate-in zoom-in-95 duration-500">
                  <div class="w-24 h-24 bg-yellow-500/20 rounded-[2rem] flex items-center justify-center text-yellow-500 shadow-inner ring-1 ring-yellow-500/20">
                    <span class="text-5xl">🏆</span>
                  </div>
                  <div>
                      <h3 class="text-3xl font-black text-white uppercase tracking-tighter mb-4">Global Rankings</h3>
                      <p class="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] max-w-xs leading-relaxed">Join the competition! Create an account to see your rank and compete with others.</p>
                  </div>
                  <button @click="handleLogout" class="px-12 py-5 bg-primary hover:bg-primaryHover text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all shadow-xl shadow-primary/30 active:scale-95">
                      Get Started
                  </button>
              </div>
              <GlobalView 
                v-else
                :data="leaderboardData"
                :filter="leaderboardFilter"
                :isLoading="isLeaderboardLoading"
                :currentUser="user"
                @updateFilter="leaderboardFilter = $event"
              />
          </div>
      </div>
      
      <!-- Logout Modal -->
      <Teleport to="body">
          <div v-if="isLogoutModalOpen" class="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
             <div class="glass max-w-sm w-full p-10 rounded-[3rem] border border-white/10 shadow-2xl text-center animate-in zoom-in-95 duration-300">
                 <div class="w-20 h-20 bg-red-500/20 rounded-3xl flex items-center justify-center text-red-500 mx-auto mb-8 shadow-inner ring-1 ring-red-500/30">
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                 </div>
                 <h3 class="text-2xl font-black text-white mb-3 tracking-tight uppercase">Logout?</h3>
                 <p class="text-slate-400 text-sm font-medium mb-10 leading-relaxed uppercase text-[10px] tracking-widest">Are you sure you want to logout?</p>
                 
                 <div class="grid grid-cols-2 gap-4">
                    <button @click="isLogoutModalOpen = false" class="py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-400 transition-all border border-white/5">Cancel</button>
                    <button @click="handleLogout" class="py-4 bg-red-500 hover:bg-red-600 rounded-2xl text-xs font-black uppercase tracking-widest text-white transition-all shadow-lg shadow-red-500/30">Logout</button>
                 </div>
             </div>
          </div>
      </Teleport>

      <!-- Notifications -->
      <Teleport to="body">
          <div v-if="notification" class="fixed bottom-10 left-1/2 -translate-x-1/2 z-[300] animate-in slide-in-from-bottom-10 duration-500">
              <div class="glass px-8 py-4 rounded-2xl border border-red-500/30 flex items-center gap-4 shadow-2xl shadow-red-500/20">
                  <div class="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-500">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                  </div>
                  <span class="text-xs font-black text-white uppercase tracking-widest">{{ notification }}</span>
              </div>
          </div>
      </Teleport>

    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { useAuth } from '~/composables/useAuth';
import { useGameRoom } from '~/composables/useGameRoom';
import { useRouter } from 'vue-router';

// Components
import ArenaView from '~/components/Arena/ArenaView.vue';
import LobbyView from '~/components/Arena/LobbyView.vue';
import ProfileView from '~/components/Profile/ProfileView.vue';
import GlobalView from '~/components/Leaderboard/GlobalView.vue';

// State
const router = useRouter();
const { user, loading, signUp, login, loginAsGuest, logout, updateDisplayName } = useAuth();
const { 
  currentRoomId, 
  roomState, 
  createRoom, 
  joinRoom, 
  toggleReady, 
  setImageUrl, 
  setGridSize, 
  startGame, 
  leaveRoom,
  updateRoomName,
  toggleVisibility,
  getRoomIdByHash,
  kickPlayer,
  kickedFromRoom
} = useGameRoom();

const activeTab = ref('arena');
const authState = ref('login');
const authForm = reactive({
  username: '',
  password: '',
  displayName: '',
  confirmPassword: ''
});

const isAuthLoading = ref(false);
const isActionLoading = ref(false);
const authError = ref(null);
const isLogoutModalOpen = ref(false);
const notification = ref(null);

const leaderboardData = ref([]);
const leaderboardFilter = ref('trophies');
const isLeaderboardLoading = ref(false);

// Watch for Kicks
watch(kickedFromRoom, (roomName) => {
    if (roomName) {
        notification.value = `You have been kicked from the room: ${roomName}`;
        setTimeout(() => {
            notification.value = null;
            kickedFromRoom.value = null;
        }, 5000);
    }
});

// Computed
const isReady = computed(() => {
  if (!roomState.value || !user.value) return false;
  return roomState.value.players?.[user.value.uid]?.isReady || false;
});

const isHost = computed(() => {
  if (!roomState.value || !user.value) return false;
  return roomState.value.host === user.value.uid;
});

const allReady = computed(() => {
  if (!roomState.value || !roomState.value.players) return false;
  const players = Object.values(roomState.value.players);
  if (players.length < 2) return false;
  return players.every(p => p.isReady);
});

const handleLogout = async () => {
    isLogoutModalOpen.value = false;
    await logout();
};

const handleAuth = async () => {
  isAuthLoading.value = true;
  authError.value = null;
  try {
    if (authState.value === 'signup') {
      if (authForm.password !== authForm.confirmPassword) {
        throw new Error('Passwords do not match');
      }
      await signUp(authForm.username, authForm.password, authForm.displayName);
    } else if (authState.value === 'guest') {
      if (!authForm.displayName) {
        throw new Error('Please enter a display name');
      }
      await loginAsGuest(authForm.displayName);
    } else {
      await login(authForm.username, authForm.password);
    }
  } catch (error) {
    authError.value = error.message;
  } finally {
    isAuthLoading.value = false;
  }
};

const handleCreateRoom = async ({ visibility, name }) => {
  isActionLoading.value = true;
  try {
    await createRoom(user.value.displayName || user.value.username, visibility, name);
  } catch (error) {
    alert(error.message);
  } finally {
    isActionLoading.value = false;
  }
};

const handleJoinRoom = async (code) => {
  isActionLoading.value = true;
  try {
    await joinRoom(code, user.value.displayName || user.value.username);
  } catch (error) {
    alert(error.message);
  } finally {
    isActionLoading.value = false;
  }
};

const handleUpdateName = async (newName) => {
    isActionLoading.value = true;
    try {
        await updateDisplayName(newName);
    } catch (e) {
        alert(e.message);
    } finally {
        isActionLoading.value = false;
    }
};

const handleKickPlayer = async (pId) => {
    if (!currentRoomId.value) return;
    try {
        await kickPlayer(currentRoomId.value, pId);
    } catch (e) {
        alert(e.message);
    }
};

const handleStartGame = async () => {
  if (!currentRoomId.value) return;
  try {
    await startGame(currentRoomId.value);
  } catch (error) {
    alert(error.message);
  }
};

// Redirects
watch(() => roomState.value?.status, (status) => {
  if (status === 'playing' && currentRoomId.value) {
    router.push(`/game/${currentRoomId.value}`);
  }
});

// Invites
const processInvite = async () => {
    const inviteHash = useCookie('invite_hash');
    if (inviteHash.value && user.value) {
        isActionLoading.value = true;
        try {
            const roomId = await getRoomIdByHash(inviteHash.value);
            if (roomId) {
                await joinRoom(roomId, user.value.displayName || user.value.username);
            }
        } finally {
            inviteHash.value = null;
            isActionLoading.value = false;
        }
    }
};

watch(user, (newUser) => {
    if (newUser) processInvite();
}, { immediate: true });

// Leaderboard
const fetchLeaderboard = async () => {
    if (isLeaderboardLoading.value) return;
    isLeaderboardLoading.value = true;
    try {
        const { getGlobalLeaderboard } = useAuth();
        leaderboardData.value = await getGlobalLeaderboard();
    } catch (err) {
        console.error('Leaderboard Fetch Error:', err);
    } finally {
        isLeaderboardLoading.value = false;
    }
};

watch(activeTab, (newTab) => {
    if (newTab === 'leaderboard') fetchLeaderboard();
}, { immediate: true });
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@100;300;400;600;700;900&display=swap');

.font-layout {
  font-family: 'Outfit', sans-serif;
}

.glass {
  background: rgba(10, 15, 25, 0.7);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
}

.bg-surface {
  background: rgba(20, 30, 45, 0.4);
}

.bg-surface-dark {
  background: rgba(5, 10, 15, 0.8);
}

/* Animations */
@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes zoom-in { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
@keyframes slide-in-from-bottom { from { transform: translateY(2rem); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
@keyframes slide-in-from-top { from { transform: translateY(-1rem); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

.animate-in { animation: var(--tw-duration, 300ms) cubic-bezier(0.4, 0, 0.2, 1); }
.fade-in { animation-name: fade-in; }
.zoom-in-95 { animation-name: zoom-in; --tw-scale: 0.95; }
.slide-in-from-bottom-4 { animation-name: slide-in-from-bottom; }
.slide-in-from-top-2 { animation-name: slide-in-from-top; }

.duration-300 { --tw-duration: 300ms; }
.duration-500 { --tw-duration: 500ms; }
.duration-700 { --tw-duration: 700ms; }
</style>
