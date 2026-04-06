<template>
  <div class="relative min-h-screen flex items-center justify-center overflow-hidden p-6">
    <!-- Animated background elements -->
    <div class="absolute inset-0 z-0">
      <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px] animate-pulse"></div>
      <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[100px] animate-pulse" style="animation-delay: 2s;"></div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="relative z-50 text-white flex flex-col items-center gap-4">
       <div class="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
       <p class="font-medium animate-pulse">Syncing User Senses...</p>
    </div>

    <!-- Main Container -->
    <div v-else class="relative z-10 w-full max-w-4xl">
      
      <!-- AUTH SCREEN (Login / Sign Up) -->
      <div v-if="!user" class="max-w-md mx-auto">
        <div class="text-center mb-8">
            <h1 class="text-4xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Speed Race</h1>
            <p class="text-slate-400">Join the ultimate puzzle competition.</p>
        </div>

        <div class="glass rounded-3xl p-8 border border-white/10 shadow-2xl">
          <!-- Toggle Tabs -->
          <div class="flex p-1 bg-surface/50 rounded-xl mb-8">
             <button @click="authState = 'login'" :class="authState === 'login' ? 'bg-primary text-white' : 'text-slate-400 hover:text-white'" class="flex-1 py-2 rounded-lg text-sm font-bold transition-all">Login</button>
             <button @click="authState = 'signup'" :class="authState === 'signup' ? 'bg-primary text-white' : 'text-slate-400 hover:text-white'" class="flex-1 py-2 rounded-lg text-sm font-bold transition-all">Sign Up</button>
          </div>

          <form @submit.prevent="handleAuth" class="space-y-4">
            <div v-if="authState === 'signup'">
              <label class="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Display Name</label>
              <input v-model="authForm.displayName" type="text" placeholder="e.g. Alvin" class="w-full bg-surface/50 border border-white/5 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" required />
            </div>
            
            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Username</label>
              <input v-model="authForm.username" type="text" placeholder="username" class="w-full bg-surface/50 border border-white/5 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" required />
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Password</label>
              <input v-model="authForm.password" type="password" placeholder="••••••••" class="w-full bg-surface/50 border border-white/5 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" required />
            </div>

            <div v-if="authState === 'signup'">
              <label class="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Confirm Password</label>
              <input v-model="authForm.confirmPassword" type="password" placeholder="••••••••" class="w-full bg-surface/50 border border-white/5 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" required />
            </div>

            <button type="submit" :disabled="isAuthLoading" class="w-full bg-primary hover:bg-primaryHover text-white py-4 rounded-xl font-bold transition-all shadow-lg shadow-primary/30 disabled:opacity-50 mt-4">
               {{ isAuthLoading ? 'Processing...' : (authState === 'login' ? 'Login' : 'Create Account') }}
            </button>
            <p v-if="authError" class="text-red-400 text-xs text-center mt-2">{{ authError }}</p>
          </form>
        </div>
      </div>

      <!-- LOBBY SCREEN (Authenticated) -->
      <div v-else>
          <!-- Header with Profile -->
          <div class="flex items-center justify-between mb-12">
            <div class="flex items-center gap-4">
                    <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-2xl font-black text-white shadow-lg">
                        {{ (user.displayName || user.username || 'P').charAt(0).toUpperCase() }}
                    </div>
                    <div>
                        <h1 class="text-2xl font-black text-white">Hi, {{ user.displayName || user.username }}!</h1>
                    <p class="text-slate-400 text-sm">Ready to race today?</p>
                </div>
            </div>
            <button @click="logout" class="px-6 py-2 rounded-xl border border-white/5 bg-surface/50 hover:bg-red-500/10 hover:border-red-500/30 text-slate-400 hover:text-red-400 transition-all text-sm font-bold">
                Logout Account
            </button>
          </div>

          <!-- Room Logic -->
          <div v-if="!currentRoomId" class="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            <!-- Create Room Card -->
            <div class="glass rounded-3xl p-8 transform transition-all duration-300 hover:scale-[1.02] hover:shadow-primary/10">
              <div class="flex items-center gap-4 mb-6">
                <div class="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary font-bold text-xl">1</div>
                <h2 class="text-2xl font-bold">Create Arena</h2>
              </div>
              <p class="text-slate-400 text-sm mb-6">Start a new match and wait for your opponent.</p>
              <button @click="handleCreateRoom" :disabled="isActionLoading" class="w-full bg-primary hover:bg-primaryHover text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-primary/25 disabled:opacity-50">
                Generate Room Code
              </button>
            </div>

            <!-- Join Room Card -->
            <div class="glass rounded-3xl p-8 transform transition-all duration-300 hover:scale-[1.02] hover:shadow-accent/10">
              <div class="flex items-center gap-4 mb-6">
                <div class="w-12 h-12 rounded-2xl bg-accent/20 flex items-center justify-center text-accent font-bold text-xl">2</div>
                <h2 class="text-2xl font-bold">Join Arena</h2>
              </div>
              <div class="space-y-4">
                <input v-model="joinCode" @input="joinCode = joinCode.toUpperCase()" type="text" placeholder="ROOM CODE" class="w-full bg-surface/50 border border-white/5 rounded-xl px-4 py-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-accent/50 text-center font-mono text-2xl tracking-[0.5em]" />
                <button @click="handleJoinRoom" :disabled="!joinCode || joinCode.length < 5 || isActionLoading" class="w-full bg-accent hover:bg-purple-600 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-accent/25 disabled:opacity-50">
                   Join Match
                </button>
              </div>
              <p v-if="actionError" class="text-red-400 text-xs text-center mt-4">{{ actionError }}</p>
            </div>

          </div>

          <!-- Inside Room Lobby -->
          <div v-else-if="roomState" class="glass rounded-3xl p-8 max-w-2xl mx-auto shadow-2xl relative overflow-hidden">
            <div class="relative z-10">
                <div class="flex items-center justify-between mb-8">
                  <div class="bg-surface/80 p-4 rounded-2xl border border-white/10">
                      <p class="text-xs font-bold text-slate-500 uppercase mb-1">Room Code</p>
                      <div class="flex items-center gap-4">
                          <span class="text-3xl font-mono font-black text-primary tracking-widest">{{ currentRoomId }}</span>
                          <button @click="copyCode" class="p-2 hover:bg-white/5 rounded-lg transition-all text-slate-400 hover:text-white flex items-center gap-2">
                            <span v-if="isCopied" class="text-[10px] font-bold text-green-400 uppercase tracking-widest animate-pulse">Copied!</span>
                            <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                          </button>
                      </div>
                  </div>
                  <button @click="handleLeave" class="text-red-400 hover:text-red-300 font-bold text-sm bg-red-400/5 px-4 py-2 rounded-xl border border-red-400/10">Leave Room</button>
                </div>

                <!-- Settings (Host) -->
                <div class="mb-8 p-4 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                  <div class="flex items-center justify-between">
                      <h3 class="font-bold text-slate-300 flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                          Match Settings
                      </h3>
                      <span v-if="!isHost" class="text-[10px] bg-white/10 px-2 py-0.5 rounded-full uppercase tracking-widest text-slate-400">Read Only</span>
                  </div>
                  
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                      <!-- Image Preview -->
                      <div class="w-full h-32 rounded-2xl bg-surface/50 border border-white/5 overflow-hidden group relative">
                          <img v-if="tempImageUrl" :src="tempImageUrl" class="w-full h-full object-cover transition-transform group-hover:scale-110" @error="handleImgError" />
                          <div v-else class="w-full h-full flex items-center justify-center text-slate-600 text-[10px] text-center px-4 uppercase font-bold">No Image Selected</div>
                          <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-2">
                              <span class="text-[8px] font-bold text-white/70 uppercase tracking-widest">Preview</span>
                          </div>
                      </div>

                      <div class="md:col-span-2 space-y-4">
                          <div>
                            <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Image Theme URL</label>
                            <input :disabled="!isHost" v-model="tempImageUrl" type="text" class="w-full bg-background/50 border border-white/5 rounded-xl px-3 py-2 text-xs text-white disabled:opacity-50" placeholder="https://..." />
                          </div>
                          <div>
                            <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Difficulty (Grid)</label>
                            <select :disabled="!isHost" v-model="tempGridSize" class="w-full bg-background/50 border border-white/5 rounded-xl px-3 py-2 text-xs text-white disabled:opacity-50">
                                <option :value="2">2x2 (Practice)</option>
                                <option :value="4">4x4 (Normal)</option>
                                <option :value="6">6x6 (Hard)</option>
                                <option :value="8">8x8 (Expert)</option>
                                <option :value="10">10x10 (Insane)</option>
                            </select>
                          </div>
                      </div>
                  </div>
                  <button v-if="isHost" @click="handleSaveSettings" 
                          class="w-full py-2 transition-all text-xs font-bold uppercase tracking-widest rounded-xl border"
                          :class="isSaved ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-primary/20 text-primary border-primary/30 hover:bg-primary/30'">
                    {{ isSaved ? '✓ Settings Applied' : 'Apply Settings' }}
                  </button>
                </div>

                <!-- Players List -->
                <div class="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                  <div v-for="(player, pId) in roomState.players" :key="pId" 
                       class="p-4 rounded-2xl bg-surface/40 border flex flex-col items-center gap-2 transition-all relative overflow-hidden"
                       :class="player.isReady ? 'border-green-500/50 bg-green-500/5 shadow-[0_0_15px_rgba(34,197,94,0.1)]' : 'border-white/5'">
                    
                    <div class="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border border-white/10 relative">
                        <span class="text-lg font-black text-white/50">{{ player.name?.[0]?.toUpperCase() }}</span>
                        <!-- Status Badge -->
                        <div class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-background"
                             :class="player.isReady ? 'bg-green-500' : 'bg-yellow-500'">
                           <span class="text-[8px] font-black text-white">{{ player.isReady ? '✓' : '...' }}</span>
                        </div>
                    </div>

                    <div class="text-center">
                      <p class="text-xs font-bold text-white truncate max-w-[100px]">{{ player.name }}</p>
                      <p class="text-[10px] font-medium" :class="player.isReady ? 'text-green-400' : 'text-slate-500'">
                        {{ player.isReady ? 'READY' : 'WAITING' }}
                      </p>
                    </div>

                    <div v-if="pId === user.uid" class="absolute bottom-0 inset-x-0 h-1 bg-primary"></div>
                  </div>

                  <!-- Extra Slots (Up to 6) -->
                  <div v-if="Object.keys(roomState.players).length < 6" class="p-4 rounded-2xl bg-surface/20 border border-dashed border-white/10 flex flex-col items-center justify-center gap-2 opacity-50">
                      <div class="w-10 h-10 rounded-full border-2 border-dashed border-slate-600 flex items-center justify-center">
                          <span class="text-slate-600 animate-pulse">+</span>
                      </div>
                      <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Inviting more...</span>
                  </div>
                </div>

                <!-- Controls -->
                <div class="flex gap-4 pt-4 border-t border-white/5">
                   <button @click="toggleMyReady" class="flex-1 py-4 rounded-xl font-black transition-all uppercase tracking-widest"
                           :class="myPlayerState?.isReady ? 'bg-surface border border-white/10 text-white' : 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-600/30'">
                     {{ myPlayerState?.isReady ? 'Unready' : 'Ready Up' }}
                   </button>
                   
                   <button v-if="isHost" @click="handleStartGame" :disabled="!canStartGame" 
                           class="flex-[2] py-4 rounded-xl font-black transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest"
                           :class="canStartGame ? 'bg-gradient-to-r from-primary to-accent hover:shadow-primary/50 text-white shadow-xl' : 'bg-surface/50 border border-slate-800 text-slate-600'">
                     Begin Match
                   </button>
                </div>
            </div>
          </div>
      </div>
      
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '~/composables/useAuth';
import { useGameRoom } from '~/composables/useGameRoom';

const router = useRouter();
const { user, loading, login, signUp, logout } = useAuth();
const { currentRoomId, roomState, createRoom, joinRoom, leaveRoom, toggleReady, setImageUrl, setGridSize, startGame, listenToRoom } = useGameRoom();

// UI States
const authState = ref('login');
const isAuthLoading = ref(false);
const authError = ref('');

const authForm = reactive({
    username: '',
    password: '',
    confirmPassword: '',
    displayName: ''
});

const isActionLoading = ref(false);
const actionError = ref('');
const joinCode = ref('');
const tempImageUrl = ref('');
const tempGridSize = ref(4);
const isCopied = ref(false);
const isSaved = ref(false);

// SYNC IMAGE & SIZE FROM DATABASE
watch(roomState, (val) => {
  if (val) {
     if (val.status === 'playing') {
        router.push(`/game/${currentRoomId.value}`);
     }
     if (val.settings?.imageUrl && tempImageUrl.value === '') {
        tempImageUrl.value = val.settings.imageUrl;
     }
     if (val.settings?.gridSize && !isHost.value) {
        tempGridSize.value = val.settings.gridSize;
     }
  }
}, { deep: true });

const isHost = computed(() => {
   if (!roomState.value || !user.value) return false;
   return roomState.value.host === user.value.uid;
});

const myPlayerState = computed(() => {
   if (!roomState.value || !user.value) return null;
   return roomState.value.players[user.value.uid];
});

const canStartGame = computed(() => {
   if (!roomState.value) return false;
   const players = Object.values(roomState.value.players);
   if (players.length < 2) return false;
   return players.every(p => p.isReady);
});

// AUTH HANDLERS
const handleAuth = async () => {
    authError.value = '';
    isAuthLoading.value = true;
    try {
        if (authState.value === 'login') {
            await login(authForm.username, authForm.password);
        } else {
            if (authForm.password !== authForm.confirmPassword) {
                throw new Error("Passwords do not match");
            }
            await signUp(authForm.username, authForm.password, authForm.displayName);
        }
    } catch (e) {
        authError.value = e.message;
    } finally {
        isAuthLoading.value = false;
    }
};

// GAME HANDLERS
const handleCreateRoom = async () => {
   actionError.value = '';
   isActionLoading.value = true;
   try {
      const playerName = user.value.displayName || user.value.username || 'Player';
      await createRoom(playerName);
   } catch (e) {
      actionError.value = e.message;
   } finally {
      isActionLoading.value = false;
   }
};

const handleJoinRoom = async () => {
   actionError.value = '';
   isActionLoading.value = true;
   try {
      const playerName = user.value.displayName || user.value.username || 'Player';
      await joinRoom(joinCode.value, playerName);
   } catch (e) {
      actionError.value = e.message;
   } finally {
      isActionLoading.value = false;
   }
};

const handleSaveSettings = async () => {
    if (!isHost.value) return;
    await setImageUrl(currentRoomId.value, tempImageUrl.value);
    await setGridSize(currentRoomId.value, Number(tempGridSize.value));
    isSaved.value = true;
    setTimeout(() => isSaved.value = false, 1000);
};

const handleLeave = () => leaveRoom();

const toggleMyReady = () => {
   if (!currentRoomId.value) return;
   toggleReady(currentRoomId.value, !myPlayerState.value?.isReady);
};

const handleStartGame = async () => {
   try {
      await startGame(currentRoomId.value);
   } catch (e) {
      console.error(e);
   }
};

const copyCode = () => {
   navigator.clipboard.writeText(currentRoomId.value);
   isCopied.value = true;
   setTimeout(() => isCopied.value = false, 1000);
};

const handleImgError = (e) => {
   e.target.src = 'https://via.placeholder.com/400x400?text=Invalid+Image+URL';
};
</script>

<style scoped>
.glass {
  background: rgba(30, 41, 59, 0.7);
  backdrop-filter: blur(20px);
}
</style>
