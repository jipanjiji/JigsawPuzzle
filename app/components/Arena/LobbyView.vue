<template>
  <div v-if="roomState" class="glass rounded-[3.5rem] p-12 border border-white/10 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-500">
    <!-- Room Info -->
    <div class="flex flex-col items-center mb-12 text-center">
        <div class="flex flex-col items-center gap-4 mb-8">
            <template v-if="isHost && isEditingName">
                <input v-model="editRoomName" @blur="handleUpdateRoomName" @keyup.enter="handleUpdateRoomName" type="text" class="text-4xl font-black bg-white/5 border border-primary/30 rounded-2xl px-6 py-2 text-center text-white focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all uppercase tracking-tight shadow-xl shadow-primary/10" autofocus />
            </template>
            <template v-else>
                <div class="flex items-center gap-4 group">
                    <h2 class="text-4xl md:text-5xl font-black text-white uppercase tracking-tight drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                        {{ roomState.name || 'UNNAMED ROOM' }}
                    </h2>
                    <button v-if="isHost" @click="isEditingName = true" class="p-2 rounded-xl bg-white/5 hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="text-slate-400"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <div :class="roomState.visibility === 'public' ? 'bg-primary/20 text-primary border-primary/20' : 'bg-red-500/20 text-red-500 border-red-500/20'" class="px-3 py-1 rounded-lg border text-[8px] font-black uppercase tracking-[0.2em] shadow-sm">
                        {{ roomState.visibility }}
                    </div>
                </div>
            </template>
        </div>

        <div class="flex flex-col md:flex-row gap-4 items-center">
            <div class="flex flex-col items-center">
                <div class="px-4 py-1.5 rounded-full bg-white/5 border border-white/5 text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">Room Code</div>
                <h3 class="text-3xl font-black text-white tracking-[0.3em] flex items-center gap-3">
                    {{ currentRoomId }}
                    <button @click="copyText(currentRoomId, 'code')" class="relative p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all group overflow-hidden">
                        <transition name="fade-scale" mode="out-in">
                            <svg v-if="copiedType !== 'code'" key="copy" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-slate-400">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </svg>
                            <svg v-else key="check" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" class="text-green-500">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        </transition>
                    </button>
                </h3>
            </div>
            
            <div class="hidden md:block w-px h-12 bg-white/10 mx-4"></div>

            <div class="flex flex-col items-center">
                <div class="px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-[9px] font-black text-accent uppercase tracking-[0.3em] mb-4">Invite Link</div>
                <button @click="copyInviteLink" :class="copiedType === 'invite' ? 'bg-green-500/20 border-green-500/30' : 'bg-white/5 border-white/10'" class="relative group hover:bg-white/10 border px-6 py-2.5 rounded-2xl flex items-center gap-3 transition-all active:scale-95 min-w-[140px] justify-center">
                    <span class="text-xs font-black tracking-[0.1em] uppercase transition-all" :class="copiedType === 'invite' ? 'text-green-500' : 'text-slate-400'">
                        {{ copiedType === 'invite' ? 'Copied ✓' : 'Copy Link' }}
                    </span>
                    <svg v-if="copiedType !== 'invite'" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="text-accent group-hover:rotate-12 transition-transform"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                </button>
            </div>
        </div>
    </div>

    <!-- Visibility Toggle -->
    <div v-if="isHost" class="flex justify-center gap-4 mb-12 animate-in slide-in-from-top-2 duration-500">
        <button @click="toggleVisibility" :class="roomState.visibility === 'public' ? 'bg-primary/20 text-primary border-primary/30' : 'bg-surface border-white/5 text-slate-400'" class="px-6 py-3 rounded-2xl border text-[9px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3 shadow-inner">
            <div class="w-2 h-2 rounded-full" :class="roomState.visibility === 'public' ? 'bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]' : 'bg-slate-600'"></div>
            Room: {{ roomState.visibility.toUpperCase() }}
        </button>
    </div>

    <!-- Puzzle Settings -->
    <div v-if="roomState.status === 'waiting'" class="space-y-8 mb-16">
       <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <!-- Grid Size -->
           <div class="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 shadow-inner">
                <label class="text-[10px] font-black text-slate-500 uppercase block mb-6 tracking-widest">Puzzle Grid Size</label>
                <div class="flex flex-wrap gap-2">
                    <template v-if="isHost">
                        <button v-for="size in [2, 4, 6, 8, 10]" :key="size" @click="$emit('setGridSize', size)" :class="roomState.settings.gridSize === size ? 'bg-primary text-white border-primary shadow-xl shadow-primary/20' : 'bg-surface border-white/10 text-slate-400 hover:border-primary/50'" class="flex-1 min-w-[60px] py-4 rounded-2xl font-black text-xs border-2 transition-all active:scale-95">
                            {{ size }}x{{ size }}
                        </button>
                    </template>
                    <template v-else>
                        <div class="w-full bg-primary/10 text-primary border border-primary/20 py-4 rounded-2xl font-black text-xl text-center letter tracking-tight">
                            {{ roomState.settings.gridSize }}x{{ roomState.settings.gridSize }} <span class="text-[9px] font-black ml-2 opacity-50 uppercase">(Locked by Host)</span>
                        </div>
                    </template>
                </div>

                <!-- Trophy Warning -->
                <div v-if="roomState.settings.gridSize === 2" class="mt-4 flex items-center justify-center gap-2 py-2 px-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl animate-pulse">
                    <span class="text-lg">⚠️</span>
                    <span class="text-[9px] font-black text-yellow-500 uppercase tracking-widest">Practice Mode: 2x2 wins do not award trophies</span>
                </div>
           </div>

           <!-- Image Select -->
           <div class="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 shadow-inner flex flex-col justify-center">
               <label class="text-[10px] font-black text-slate-500 uppercase block mb-6 tracking-widest">Puzzle Image URL</label>
               <div v-if="isHost" class="flex flex-col sm:flex-row gap-3">
                   <input v-model="internalImageUrl" type="text" placeholder="https://..." class="flex-1 bg-surface border-2 border-white/5 rounded-2xl px-6 py-4 text-[11px] text-white placeholder-slate-700 focus:outline-none focus:border-primary/40 transition-all font-medium" />
                   <button @click="$emit('setImageUrl', internalImageUrl)" class="px-8 py-4 bg-primary hover:bg-primaryHover text-white rounded-2xl font-black text-[9px] uppercase tracking-widest shadow-lg shadow-primary/25 active:scale-95 transition-all whitespace-nowrap">
                       Set Image
                   </button>
               </div>
               <div v-else class="py-2 flex items-center justify-center">
                   <div class="inline-flex items-center gap-3 px-8 py-4 bg-primary/5 border border-primary/10 rounded-2xl shadow-inner">
                       <div class="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></div>
                       <span class="text-[10px] font-black text-primary/80 uppercase tracking-widest">Waiting for host to set image...</span>
                   </div>
               </div>
           </div>
       </div>

       <!-- Preview -->
       <div class="bg-white/5 p-4 rounded-[3rem] border border-white/10 shadow-inner relative group cursor-pointer overflow-hidden h-72" @click="isFullImageOpen = true">
           <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-8 border-[8px] border-transparent rounded-[2.5rem]">
               <span class="bg-white/10 backdrop-blur-md px-8 py-3 rounded-full text-[10px] font-black text-white uppercase tracking-[0.4em] border border-white/20 shadow-2xl">Preview Image</span>
           </div>
           <div class="w-full h-full overflow-hidden rounded-[2.5rem]">
               <img :src="roomState.settings.imageUrl" 
                    class="w-full h-[160%] object-cover opacity-60 group-hover:opacity-100 transition-all duration-1000 animate-pan-vertical" 
                    alt="Current Target" 
                    @error="$event.target.src='https://placehold.co/1200x800/101519/4a5568?text=SCANNING+TARGET...'" />
           </div>
       </div>
    </div>

    <!-- Expansion Modal -->
    <div v-if="isFullImageOpen" class="fixed inset-0 z-[200] flex items-center justify-center p-8 bg-black/95 backdrop-blur-3xl animate-in fade-in duration-500" @click="isFullImageOpen = false">
       <div class="relative max-w-6xl w-full max-h-full flex items-center justify-center pointer-events-none">
           <img :src="roomState.settings.imageUrl" class="max-w-full max-h-full object-contain rounded-[2.5rem] shadow-[0_0_100px_rgba(0,0,0,0.5)] pointer-events-auto border-4 border-white/10" />
           <button class="absolute -top-6 -right-6 w-16 h-16 bg-white text-black rounded-full flex items-center justify-center text-4xl font-black shadow-2xl hover:scale-110 active:scale-95 transition-all pointer-events-auto ring-8 ring-white/10">×</button>
       </div>
    </div>

    <!-- Players List -->
    <div class="mb-16">
        <div class="flex justify-between items-center mb-10 px-8">
            <div class="flex items-center gap-3">
                <div class="w-2 h-2 rounded-full bg-accent animate-pulse"></div>
                <span class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Players: {{ Object.keys(roomState.players).length }}/6</span>
            </div>
        </div>

        <div class="grid grid-cols-2 lg:grid-cols-3 gap-8">
          <div v-for="player in sortedPlayers" :key="player.id" 
               class="p-10 rounded-[3rem] bg-surface/30 border border-white/10 flex flex-col items-center gap-6 transition-all relative group hover:bg-white/5">
            
            <!-- Avatar with Status Dot -->
            <div class="relative w-28 h-28 rounded-full bg-gradient-to-tr from-primary to-accent p-1.5 shadow-2xl group-hover:scale-105 transition-transform duration-500">
                <div class="w-full h-full rounded-full bg-surface-dark flex items-center justify-center border-4 border-background overflow-hidden relative shadow-inner">
                    <span class="text-4xl font-black text-white drop-shadow-2xl">{{ player.name?.[0]?.toUpperCase() }}</span>
                </div>
                <!-- Status Dot -->
                <div class="absolute -bottom-1 -right-1 w-10 h-10 rounded-full flex items-center justify-center border-4 border-background shadow-2xl z-20"
                     :class="player.isReady ? 'bg-green-500 shadow-green-500/30' : 'bg-yellow-500 shadow-yellow-500/30'">
                   <span class="text-sm font-black text-white">{{ player.isReady ? '✓' : '...' }}</span>
                </div>
            </div>

            <div class="text-center">
              <p class="text-lg font-black text-white truncate max-w-[160px] tracking-tight flex items-center justify-center gap-2">
                {{ player.name }}
                <span v-if="player.username?.toLowerCase() === 'alvin'" class="bg-gradient-to-r from-yellow-400 to-amber-600 text-black text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter shadow-xl shadow-yellow-400/20 ring-1 ring-white/20">Dev</span>
              </p>
              <div class="flex flex-col items-center mt-3 gap-1">
                <span class="text-[10px] font-bold text-slate-600 lowercase tracking-wider opacity-60">@{{ player.username }}</span>
                <p class="text-[9px] font-black tracking-[0.3em] uppercase mt-1" :class="player.isReady ? 'text-green-500' : 'text-slate-500'">
                  {{ player.isReady ? 'Ready' : 'Waiting...' }}
                </p>
              </div>
            </div>

            <!-- Host Actions -->
            <div v-if="isHost && player.id !== userId" class="absolute bottom-4 opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100 z-30">
                <button @click="$emit('kickPlayer', player.id)" class="px-6 py-2 bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/30 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-90">
                    Kick Player
                </button>
            </div>

            <!-- Floating Tags -->
            <div class="absolute top-4 inset-x-0 flex justify-center gap-2 px-4 pointer-events-none">
                <div v-if="player.id === userId" class="px-3 py-1 bg-primary/20 backdrop-blur-md border border-primary/30 text-[8px] font-black tracking-widest text-primary rounded-full uppercase shadow-lg shadow-primary/10">You</div>
                <div v-if="roomState.host === player.id" class="px-3 py-1 bg-yellow-500/20 backdrop-blur-md border border-yellow-500/30 text-yellow-500 text-[8px] font-black tracking-widest rounded-full uppercase shadow-lg shadow-yellow-500/10">Host</div>
            </div>
          </div>

          <div v-if="Object.keys(roomState.players).length < 6" class="p-10 rounded-[3rem] bg-white/[0.02] border-2 border-dashed border-white/5 flex flex-col items-center justify-center gap-6 opacity-20 group">
              <div class="w-20 h-20 rounded-full border-4 border-dashed border-slate-700 flex items-center justify-center group-hover:border-slate-500 transition-colors">
                  <span class="text-slate-700 text-4xl font-black">+</span>
              </div>
              <span class="text-[9px] font-black text-slate-700 uppercase tracking-[0.4em]">Waiting for players</span>
          </div>
        </div>
    </div>

    <!-- Status Bar -->
    <div class="flex flex-col md:flex-row gap-8 justify-between items-center pt-12 border-t border-white/10">
        <button @click="$emit('leave')" class="group flex items-center gap-3 text-slate-500 hover:text-red-500 text-[10px] font-black uppercase tracking-[0.3em] py-4 px-10 transition-all active:scale-95">
            <svg class="group-hover:-translate-x-2 transition-transform" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            Leave Room
        </button>
        
        <div class="flex gap-6">
            <button @click="$emit('toggleReady', !isReady)" :class="isReady ? 'bg-green-500/10 text-green-500 border-green-500/30' : 'bg-surface border-white/10 text-slate-500 hover:border-primary/50'" class="px-12 py-6 rounded-3xl font-black text-[10px] uppercase tracking-[0.4em] border-2 transition-all active:scale-95 shadow-xl">
                {{ isReady ? 'Not Ready' : 'Ready' }}
            </button>
            <button v-if="isHost" @click="$emit('start')" :disabled="!allReady" class="group relative bg-primary hover:bg-primaryHover text-white px-16 py-6 rounded-3xl font-black text-[10px] uppercase tracking-[0.4em] shadow-[0_20px_50px_rgba(var(--primary-rgb),0.3)] disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-95 animate-pulse-slow">
                <span>Start Game 🚀</span>
                <div class="absolute -inset-1 bg-primary blur-xl opacity-0 group-hover:opacity-30 transition-opacity"></div>
            </button>
        </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  currentRoomId: String,
  roomState: Object,
  userId: String,
  isHost: Boolean,
  isReady: Boolean,
  allReady: Boolean
});

const emit = defineEmits(['leave', 'toggleReady', 'start', 'setImageUrl', 'setGridSize', 'updateName', 'toggleVisibility', 'kickPlayer']);

const internalImageUrl = ref(props.roomState?.settings?.imageUrl || '');
const isFullImageOpen = ref(false);
const isEditingName = ref(false);
const editRoomName = ref(props.roomState?.name || '');
const copiedType = ref(null); // 'code' | 'invite'

const sortedPlayers = computed(() => {
  if (!props.roomState?.players) return [];
  
  return Object.entries(props.roomState.players)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => {
      // 1. Host first
      if (a.id === props.roomState.host) return -1;
      if (b.id === props.roomState.host) return 1;
      
      // 2. "You" second
      if (a.id === props.userId) return -1;
      if (b.id === props.userId) return 1;
      
      return 0;
    });
});

watch(() => props.roomState?.settings?.imageUrl, (newVal) => {
    internalImageUrl.value = newVal;
});

const handleUpdateRoomName = () => {
    if (editRoomName.value && editRoomName.value !== props.roomState.name) {
        emit('updateName', editRoomName.value);
    }
    isEditingName.value = false;
};

const toggleVisibility = () => {
    const nextValue = props.roomState.visibility === 'public' ? 'private' : 'public';
    emit('toggleVisibility', nextValue);
};

const copyText = (text, type) => {
    navigator.clipboard.writeText(text || '');
    copiedType.value = type;
    setTimeout(() => {
        copiedType.value = null;
    }, 2000);
};

const copyInviteLink = () => {
    const link = `${window.location.origin}/join/${props.roomState.inviteHash}`;
    copyText(link, 'invite');
};
</script>

<style scoped>
.animate-pan-vertical {
  animation: pan-vertical 30s ease-in-out infinite;
}

@keyframes pan-vertical {
  0% { transform: translateY(0%); }
  50% { transform: translateY(-30%); }
  100% { transform: translateY(0%); }
}

.animate-pulse-slow {
    animation: pulse-slow 3s infinite;
}

@keyframes pulse-slow {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.9; transform: scale(1.02); }
}

/* Transitions */
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.fade-scale-enter-from {
  opacity: 0;
  transform: scale(0.5);
}

.fade-scale-leave-to {
  opacity: 0;
  transform: scale(1.2);
}
</style>
