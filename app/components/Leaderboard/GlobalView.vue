<template>
  <div class="flex flex-col gap-10 animate-in slide-in-from-bottom-4 duration-700">
      <!-- Leaderboard Header & Tabs -->
      <div class="glass p-10 rounded-[3rem] border border-white/10 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden group">
          <div class="absolute top-0 right-0 w-64 h-64 bg-yellow-500/5 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-yellow-500/10 transition-colors duration-1000"></div>
          
          <div class="flex flex-col gap-1 relative z-10">
              <h2 class="text-4xl font-black text-white uppercase tracking-tight drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">Leaderboard</h2>
              <div class="flex items-center gap-3">
                <div class="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse shadow-[0_0_8px_rgba(234,179,8,0.5)]"></div>
                <p class="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">Status: Online</p>
              </div>
          </div>

          <div class="flex p-2 bg-surface/50 rounded-2xl border border-white/10 shadow-inner relative z-10 backdrop-blur-md">
              <button @click="$emit('updateFilter', 'trophies')" :class="filter === 'trophies' ? 'bg-primary text-white shadow-xl shadow-primary/30 ring-1 ring-white/10' : 'text-slate-400 hover:text-white'" class="px-8 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2">
                🏆 Trophies
              </button>
              <button @click="$emit('updateFilter', 'races')" :class="filter === 'races' ? 'bg-primary text-white shadow-xl shadow-primary/30 ring-1 ring-white/10' : 'text-slate-400 hover:text-white'" class="px-8 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2">
                🏁 Games
              </button>
          </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="p-40 flex flex-col items-center gap-10 glass rounded-[4rem] border border-white/10 shadow-2xl">
          <div class="relative">
              <div class="w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <div class="absolute inset-0 border-4 border-accent/20 rounded-full"></div>
          </div>
          <p class="text-[11px] font-black text-primary uppercase tracking-[0.6em] animate-pulse">Loading...</p>
      </div>

      <div v-else class="space-y-16 pb-12">
          <!-- Top 3 Podium (Visual) -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-12 items-end max-w-5xl mx-auto px-6 pt-10">
              <!-- 2nd Place -->
              <div v-if="sortedData[1]" class="order-2 md:order-1 flex flex-col items-center gap-6 animate-in slide-in-from-bottom-8 duration-1000" style="animation-delay: 200ms;">
                  <div class="relative group">
                      <div class="absolute -inset-6 bg-slate-400/10 rounded-full blur-3xl group-hover:bg-slate-400/20 transition-all duration-1000"></div>
                      <div class="w-28 h-28 rounded-full bg-gradient-to-tr from-slate-400 to-slate-600 p-1.5 shadow-2xl relative z-10 overflow-hidden ring-4 ring-white/5">
                          <div class="w-full h-full rounded-full bg-surface-dark flex items-center justify-center border-4 border-background/20 relative shadow-inner">
                              <span class="text-4xl font-black text-white drop-shadow-lg">{{ sortedData[1].displayName[0].toUpperCase() }}</span>
                          </div>
                      </div>
                      <div class="absolute -top-3 -right-3 w-12 h-12 bg-slate-400 rounded-full flex items-center justify-center border-4 border-background z-20 shadow-2xl ring-1 ring-white/20">
                          <span class="text-lg font-black text-background">2</span>
                      </div>
                  </div>
                  <div class="text-center group">
                      <p class="text-lg font-black text-white truncate max-w-[150px] mb-2 leading-tight tracking-tight capitalize group-hover:text-primary transition-colors">
                        {{ sortedData[1].displayName }}
                        <span v-if="sortedData[1].username?.toLowerCase() === 'alvin'" class="inline-block bg-gradient-to-r from-yellow-400 to-amber-600 text-black text-[7px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-tighter shadow-xl ml-1">Dev</span>
                      </p>
                      <p class="text-[10px] font-black text-slate-500 uppercase tracking-widest">{{ filter === 'trophies' ? sortedData[1].trophies + ' Trophies' : sortedData[1].raceCount + ' Games Played' }}</p>
                  </div>
                  <div class="w-full h-28 bg-gradient-to-t from-slate-400/2 to-slate-400/15 rounded-t-[3rem] border-t-2 border-x border-slate-400/20 flex flex-col items-center justify-center backdrop-blur-md shadow-[0_-15px_50px_rgba(148,163,184,0.05)]">
                      <span class="text-slate-400 text-[9px] font-black uppercase tracking-[0.4em] mb-1">2nd Place</span>
                      <div class="w-12 h-0.5 bg-slate-400/30 rounded-full"></div>
                  </div>
              </div>

              <!-- 1st Place (Center & Tallest) -->
              <div v-if="sortedData[0]" class="order-1 md:order-2 flex flex-col items-center gap-8 animate-in slide-in-from-bottom-12 duration-1000">
                  <div class="relative group">
                      <div class="absolute -inset-10 bg-yellow-500/20 rounded-full blur-[60px] group-hover:bg-yellow-500/30 transition-all duration-1000 animate-pulse"></div>
                      <div class="w-36 h-36 rounded-full bg-gradient-to-tr from-yellow-400 to-amber-600 p-2 shadow-[0_0_50px_rgba(234,179,8,0.3)] relative z-10 scale-110 overflow-hidden ring-4 ring-yellow-500/30">
                          <div class="w-full h-full rounded-full bg-surface-dark flex items-center justify-center border-4 border-background/20 relative shadow-inner">
                              <span class="text-5xl font-black text-white drop-shadow-[0_0_20px_rgba(234,179,8,0.6)]">{{ sortedData[0].displayName[0].toUpperCase() }}</span>
                          </div>
                      </div>
                      <div class="absolute -top-4 -right-4 w-14 h-14 bg-yellow-500 rounded-full flex items-center justify-center border-4 border-background z-20 shadow-[0_0_30px_rgba(234,179,8,0.4)] ring-2 ring-white/10">
                          <span class="text-2xl font-black text-background">1</span>
                      </div>
                      <!-- Animated Crown -->
                      <div class="absolute -top-16 left-1/2 -translate-x-1/2 text-5xl animate-bounce filter drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]" style="animation-duration: 2.5s;">👑</div>
                  </div>
                  <div class="text-center group">
                      <p class="text-2xl font-black text-white uppercase tracking-tight mb-2 flex items-center justify-center gap-3">
                        {{ sortedData[0].displayName }}
                        <span v-if="sortedData[0].username?.toLowerCase() === 'alvin'" class="bg-gradient-to-r from-yellow-400 to-amber-600 text-black text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter shadow-2xl ring-1 ring-white/20">Dev</span>
                      </p>
                      <div class="flex items-center justify-center gap-4">
                        <div class="h-px w-8 bg-yellow-500/30"></div>
                        <p class="text-[12px] font-black text-yellow-500 uppercase tracking-[0.3em]">{{ filter === 'trophies' ? sortedData[0].trophies + ' Trophies' : sortedData[0].raceCount + ' Games Played' }}</p>
                        <div class="h-px w-8 bg-yellow-500/30"></div>
                      </div>
                  </div>
                  <div class="w-full h-40 bg-gradient-to-t from-yellow-500/5 to-yellow-500/30 rounded-t-[4rem] border-t-4 border-x-2 border-yellow-500/40 flex flex-col items-center justify-center shadow-[0_-20px_60px_rgba(234,179,8,0.15)] backdrop-blur-xl relative group-hover:scale-[1.02] transition-transform duration-700">
                      <span class="text-yellow-500 text-[10px] font-black uppercase tracking-[0.5em] mb-2 drop-shadow-sm">1st Place</span>
                      <div class="flex gap-1">
                        <div v-for="i in 3" :key="i" class="w-1.5 h-1.5 rounded-full bg-yellow-500/40 animate-pulse" :style="{ animationDelay: i*200 + 'ms' }"></div>
                      </div>
                  </div>
              </div>

              <!-- 3rd Place -->
              <div v-if="sortedData[2]" class="order-3 flex flex-col items-center gap-6 animate-in slide-in-from-bottom-8 duration-1000" style="animation-delay: 400ms;">
                  <div class="relative group">
                      <div class="absolute -inset-6 bg-orange-600/10 rounded-full blur-3xl group-hover:bg-orange-600/20 transition-all duration-1000"></div>
                      <div class="w-28 h-28 rounded-full bg-gradient-to-tr from-orange-500 to-orange-700 p-1.5 shadow-2xl relative z-10 overflow-hidden ring-4 ring-white/5">
                          <div class="w-full h-full rounded-full bg-surface-dark flex items-center justify-center border-4 border-background/20 relative shadow-inner">
                              <span class="text-4xl font-black text-white drop-shadow-lg">{{ sortedData[2].displayName[0].toUpperCase() }}</span>
                          </div>
                      </div>
                      <div class="absolute -top-3 -right-3 w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center border-4 border-background z-20 shadow-2xl ring-1 ring-white/20">
                          <span class="text-lg font-black text-background">3</span>
                      </div>
                  </div>
                  <div class="text-center group">
                      <p class="text-lg font-black text-white truncate max-w-[150px] mb-2 leading-tight tracking-tight capitalize group-hover:text-primary transition-colors">
                        {{ sortedData[2].displayName }}
                        <span v-if="sortedData[2].username?.toLowerCase() === 'alvin'" class="inline-block bg-gradient-to-r from-yellow-400 to-amber-600 text-black text-[7px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-tighter shadow-xl ml-1">Dev</span>
                      </p>
                      <p class="text-[10px] font-black text-slate-500 uppercase tracking-widest">{{ filter === 'trophies' ? sortedData[2].trophies + ' Trophies' : sortedData[2].raceCount + ' Games Played' }}</p>
                  </div>
                  <div class="w-full h-24 bg-gradient-to-t from-orange-600/2 to-orange-600/15 rounded-t-[3rem] border-t-2 border-x border-orange-600/20 flex flex-col items-center justify-center backdrop-blur-md shadow-[0_-15px_50px_rgba(234,88,12,0.05)]">
                      <span class="text-orange-500 text-[9px] font-black uppercase tracking-[0.4em] mb-1">3rd Place</span>
                      <div class="w-12 h-0.5 bg-orange-600/30 rounded-full"></div>
                  </div>
              </div>
          </div>

          <!-- All Players Table -->
          <div class="glass rounded-[3.5rem] border border-white/10 overflow-hidden shadow-2xl ring-1 ring-inset ring-white/5 mx-auto max-w-6xl">
            <!-- Table Header -->
            <div class="grid grid-cols-[100px_1fr_160px] px-12 py-8 border-b border-white/5 bg-white/[0.04]">
                <span class="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Rank</span>
                <span class="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Player</span>
                <span class="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] text-right">Stats</span>
            </div>

            <!-- Table Body -->
            <div class="max-h-[700px] overflow-y-auto no-scrollbar">
                <div v-for="(player, index) in sortedData" :key="player.uid" 
                     class="grid grid-cols-[100px_1fr_160px] px-12 py-8 items-center border-b border-white/[0.03] last:border-0 transition-all hover:bg-white/[0.03] group"
                     :class="player.uid === currentUser?.uid ? 'bg-primary/[0.03] ring-1 ring-inset ring-primary/20' : ''">
                    
                    <span class="text-2xl font-black tabular-nums transition-all group-hover:scale-110 group-hover:translate-x-1" 
                          :class="index < 3 ? 'text-white' : 'text-slate-700'">
                      #{{ index + 1 }}
                    </span>
                    
                    <div class="flex items-center gap-6">
                        <div class="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary to-accent p-1 shadow-xl group-hover:border-primary/40 transition-colors shadow-inner">
                            <div class="w-full h-full rounded-2xl bg-surface-dark flex items-center justify-center border-2 border-background/20 relative shadow-inner overflow-hidden">
                                <span class="text-xl font-black text-white group-hover:scale-110 transition-transform">{{ player.displayName[0].toUpperCase() }}</span>
                            </div>
                        </div>
                        <div class="flex flex-col">
                            <span class="text-lg font-black text-white tracking-tight flex items-center gap-3">
                                {{ player.displayName }}
                                <span v-if="player.username?.toLowerCase() === 'alvin'" class="bg-gradient-to-r from-yellow-400 to-amber-600 text-black text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter shadow-2xl ring-1 ring-white/20">Dev</span>
                                <span v-if="player.uid === currentUser?.uid" class="bg-primary/20 text-primary text-[8px] px-2.5 py-1 rounded-md uppercase font-black tracking-widest ring-1 ring-primary/30 shadow-lg shadow-primary/10">You</span>
                            </span>
                            <span class="text-[10px] font-bold text-slate-600 lowercase tracking-wider opacity-60 group-hover:opacity-100 group-hover:text-primary transition-all">@{{ player.username }}</span>
                        </div>
                    </div>

                    <div class="text-right flex flex-col items-end gap-1">
                        <div class="flex items-baseline gap-2">
                             <span class="text-2xl font-black text-white tabular-nums drop-shadow-lg group-hover:text-primary transition-all">{{ filter === 'trophies' ? player.trophies : player.raceCount }}</span>
                             <span class="text-[9px] font-black text-slate-700 uppercase tracking-tighter group-hover:text-slate-500 transition-colors">{{ filter === 'trophies' ? 'Trophy' : 'Games' }}</span>
                        </div>
                        <div class="w-8 h-1 bg-white/5 rounded-full overflow-hidden">
                           <div class="h-full bg-primary/40 rounded-full group-hover:bg-primary transition-all" :style="{ width: Math.min(100, (filter === 'trophies' ? player.trophies : player.raceCount) / 10) + '%' }"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Sticky Bottom: User Position -->
            <div v-if="currentUser && sortedData.length > 0" class="border-t-2 border-primary/40 bg-primary/20 shadow-[0_-20px_50px_rgba(var(--primary-rgb),0.2)] px-12 py-8 items-center grid grid-cols-[100px_1fr_160px] backdrop-blur-2xl relative z-30">
                <div class="flex flex-col">
                  <span class="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-1">Your Rank</span>
                  <span class="text-3xl font-black text-white tabular-nums drop-shadow-[0_0_15px_rgba(var(--primary-rgb),0.4)]">
                      #{{ userRank || '?' }}
                  </span>
                </div>
                
                <div class="flex items-center gap-6">
                    <div class="w-16 h-16 rounded-[1.5rem] bg-gradient-to-tr from-primary to-accent p-0.5 shadow-2xl relative">
                        <div class="absolute inset-0 bg-primary/30 blur-xl animate-pulse"></div>
                        <div class="w-full h-full rounded-[1.4rem] bg-surface border border-white/20 flex items-center justify-center relative z-10 shadow-inner">
                            <span class="text-2xl font-black text-white">{{ (currentUser.displayName || currentUser.username || 'P')[0].toUpperCase() }}</span>
                        </div>
                    </div>
                    <div class="flex flex-col">
                        <span class="text-xl font-black text-white tracking-tight flex items-center gap-3">
                            {{ currentUser.displayName }}
                            <span v-if="currentUser.username?.toLowerCase() === 'alvin'" class="bg-gradient-to-r from-yellow-400 to-amber-600 text-black text-[9px] px-2 py-1 rounded-full font-black uppercase tracking-tighter shadow-2xl shadow-yellow-400/20 ring-1 ring-white/20">Dev</span>
                        </span>
                        <div class="flex items-center gap-2 mt-1">
                          <span class="text-[11px] font-bold text-slate-500 lowercase tracking-wider">@{{ currentUser.username }}</span>
                          <div class="w-1 h-1 rounded-full bg-primary/50"></div>
                          <span class="text-[9px] font-black text-primary uppercase tracking-widest">Online</span>
                        </div>
                    </div>
                </div>

                <div class="text-right">
                    <div class="flex flex-col items-end leading-none">
                        <div class="flex items-baseline gap-2 mb-2">
                             <span class="text-3xl font-black text-white tabular-nums drop-shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]">{{ filter === 'trophies' ? (currentUser.trophies || 0) : Object.keys(currentUser.history || {}).length }}</span>
                             <span class="text-[10px] font-black text-primary uppercase tracking-tighter">{{ filter === 'trophies' ? 'Trophy' : 'Games' }}</span>
                        </div>
                        <div class="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden shadow-inner border border-white/5">
                           <div class="h-full bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)] rounded-full animate-pulse" :style="{ width: Math.min(100, (filter === 'trophies' ? (currentUser.trophies || 0) : Object.keys(currentUser.history || {}).length) / 10) + '%' }"></div>
                        </div>
                    </div>
                </div>
            </div>
          </div>
      </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  data: Array,
  filter: String,
  isLoading: Boolean,
  currentUser: Object
});

defineEmits(['updateFilter']);

const sortedData = computed(() => {
  return [...props.data].sort((a, b) => {
    if (props.filter === 'trophies') {
      return b.trophies - a.trophies || b.raceCount - a.raceCount;
    }
    return b.raceCount - a.raceCount || b.trophies - a.trophies;
  });
});

const userRank = computed(() => {
  if (!props.currentUser) return null;
  const index = sortedData.value.findIndex(p => p.uid === props.currentUser.uid);
  return index !== -1 ? index + 1 : null;
});
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
