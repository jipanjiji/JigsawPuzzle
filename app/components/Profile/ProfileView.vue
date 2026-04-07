<template>
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-4 duration-500">
      <!-- User Profile Card -->
      <div class="lg:col-span-1 flex flex-col gap-6">
          <div class="glass p-10 rounded-[3rem] border border-white/10 flex flex-col items-center text-center relative overflow-hidden group shadow-2xl">
              <div class="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-3xl -mr-24 -mt-24 group-hover:bg-primary/20 transition-all duration-1000"></div>
              
              <div class="w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-primary to-accent p-1 shadow-2xl mb-8 transform hover:rotate-6 transition-transform">
                  <div class="w-full h-full rounded-[2.3rem] bg-surface-dark flex items-center justify-center border-4 border-background overflow-hidden relative shadow-inner">
                      <span class="text-6xl font-black text-white">{{ (user.displayName || user.username || 'P').charAt(0).toUpperCase() }}</span>
                  </div>
              </div>
              
              <h2 class="text-3xl font-black text-white mb-2 leading-tight flex items-center justify-center gap-3">
                  {{ user.displayName }}
                  <span v-if="user.username?.toLowerCase() === 'alvin'" class="bg-gradient-to-r from-yellow-400 to-amber-600 text-black text-[9px] px-2 py-1 rounded-full font-black uppercase tracking-widest shadow-xl shadow-yellow-400/20 ring-1 ring-white/20">Dev</span>
              </h2>
              <p class="text-primary font-black tracking-[0.15em] mb-10 flex items-baseline justify-center gap-0.5">
                  <span class="text-xl">@</span>
                  <span class="text-xs">{{ user.username?.toLowerCase() }}</span>
              </p>

              <div class="w-full space-y-6 pt-10 border-t border-white/5">
                  <div class="text-left">
                      <label class="text-[9px] font-black text-slate-600 uppercase mb-4 block ml-2 tracking-widest">Change Name</label>
                      <div class="flex flex-col gap-3">
                          <input v-model="internalDisplayName" type="text" class="w-full bg-surface/50 border border-white/10 rounded-2xl px-6 py-4 text-xs text-white focus:outline-none focus:ring-2 ring-primary/40 transition-all font-medium placeholder-slate-700 shadow-inner" placeholder="Enter new display name..." />
                          <button @click="handleUpdateName" :disabled="isLoading" class="w-full py-4 bg-primary rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-primaryHover transition-all disabled:opacity-50 shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
                              {{ saveSuccess ? 'Name Updated ✓' : (isLoading ? 'Updating...' : 'Update Name') }}
                          </button>
                      </div>
                  </div>
              </div>
          </div>

          <!-- Quick Stats -->
          <div class="glass p-6 rounded-[2.5rem] border border-white/10 shadow-2xl">
              <div class="grid grid-cols-2 gap-4">
                  <div class="bg-white/5 p-6 rounded-3xl border border-white/5 text-center flex flex-col items-center justify-center shadow-inner group hover:bg-white/10 transition-all">
                      <span class="text-3xl mb-3 group-hover:scale-125 transition-transform duration-500">🏁</span>
                      <span class="text-[9px] font-black text-slate-600 uppercase tracking-tighter mb-1">Games Played</span>
                      <span class="text-4xl font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)] tabular-nums">{{ historyCount }}</span>
                  </div>
                  <div class="bg-white/5 p-6 rounded-3xl border border-white/5 text-center flex flex-col items-center justify-center shadow-inner group hover:bg-white/10 transition-all">
                      <span class="text-3xl mb-3 group-hover:scale-125 transition-transform duration-500">🏆</span>
                      <span class="text-[9px] font-black text-slate-600 uppercase tracking-tighter mb-1">Trophies</span>
                      <span class="text-4xl font-black text-white drop-shadow-[0_0_10px_rgba(255,190,0,0.3)] tabular-nums">{{ user.trophies || 0 }}</span>
                  </div>
              </div>
          </div>
      </div>

      <!-- Match History -->
      <div class="lg:col-span-2 flex flex-col h-full min-h-[600px]">
        <div class="glass p-10 rounded-[4rem] border border-white/10 flex-1 flex flex-col shadow-2xl">
            <div class="flex justify-between items-center mb-12 px-4">
                <div>
                    <h2 class="text-3xl font-black text-white uppercase tracking-tight">Match History</h2>
                    <p class="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1">Status: Online</p>
                </div>
                <div class="flex items-center gap-3 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-2xl shadow-inner">
                    <div class="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                    <span class="text-[9px] font-black text-green-500 uppercase tracking-widest">Connected</span>
                </div>
            </div>

            <div v-if="!user.history || historyCount === 0" class="flex-1 flex flex-col items-center justify-center text-slate-700 gap-8 opacity-20">
                <div class="w-24 h-24 rounded-[2.5rem] border-4 border-dashed border-slate-800 flex items-center justify-center animate-pulse">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="8" y1="12" x2="16" y2="12"></line></svg>
                </div>
                <p class="font-black tracking-[0.5em] text-[10px] uppercase">No games played yet</p>
            </div>

            <div v-else class="space-y-4 overflow-y-auto pr-2 no-scrollbar">
                <div v-for="h in sortedHistory" :key="h.timestamp" class="group bg-white/5 p-8 rounded-[3rem] border border-white/5 flex items-center justify-between hover:bg-white/10 hover:border-primary/30 transition-all hover:scale-[1.01] shadow-lg">
                    <div class="flex items-center gap-10">
                        <div class="w-16 h-16 rounded-[1.5rem] flex items-center justify-center font-black text-3xl shadow-2xl transition-all group-hover:scale-110 group-hover:rotate-6 ring-2 ring-white/5 shadow-inner" 
                             :class="h.rank === 1 ? 'bg-gradient-to-tr from-yellow-400 to-amber-600 text-black shadow-yellow-500/30 ring-yellow-400/30' : h.rank === 2 ? 'bg-slate-300 text-black shadow-slate-400/20' : h.rank === 3 ? 'bg-amber-700 text-white shadow-amber-900/40' : 'bg-surface text-slate-600'">
                            {{ h.rank }}
                        </div>
                        <div class="flex flex-col">
                            <span class="text-white font-black uppercase text-xs tracking-[0.2em] mb-2 group-hover:text-primary transition-colors">{{ h.rank === 1 ? 'Victory' : 'Finished' }}</span>
                            <div class="flex items-center gap-3">
                                <span class="bg-white/5 px-3 py-1 rounded-lg text-[9px] font-black text-slate-500 uppercase tracking-widest border border-white/5 group-hover:bg-slate-500/10 transition-colors">{{ h.date }}</span>
                                <span class="bg-white/5 px-3 py-1 rounded-lg text-[9px] font-black text-slate-500 uppercase tracking-widest border border-white/5 group-hover:bg-slate-500/10 transition-colors">{{ h.time }}</span>
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center gap-8 text-right">
                        <div class="flex flex-col items-end">
                            <span class="text-[9px] font-black text-slate-700 uppercase tracking-widest mb-1.5 opacity-60">Room ID</span>
                            <span class="text-xs font-mono font-black text-slate-400 tabular-nums bg-white/5 px-3 py-1.5 rounded-xl border border-white/5 group-hover:text-white transition-colors">{{ h.roomId }}</span>
                        </div>
                        <div class="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-2xl transition-all group-hover:bg-primary/20 group-hover:scale-110 shadow-inner group-hover:shadow-primary/10">
                            {{ h.rank === 1 ? '🏆' : '🏁' }}
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  user: Object,
  isLoading: Boolean
});

const emit = defineEmits(['updateDisplayName']);

const internalDisplayName = ref(props.user.displayName || '');
const saveSuccess = ref(false);

const historyCount = computed(() => Object.keys(props.user.history || {}).length);

const sortedHistory = computed(() => {
  if (!props.user.history) return [];
  return Object.values(props.user.history).sort((a, b) => b.timestamp - a.timestamp);
});

const handleUpdateName = async () => {
    if (!internalDisplayName.value || internalDisplayName.value === props.user.displayName) return;
    emit('updateDisplayName', internalDisplayName.value);
    saveSuccess.value = true;
    setTimeout(() => {
        saveSuccess.value = false;
    }, 3000);
};
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
