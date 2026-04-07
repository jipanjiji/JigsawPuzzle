<template>
  <div class="transition-all duration-500">
    <!-- Action Cards -->
    <div v-if="!activeSubView" class="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4 duration-500">
      
      <!-- Create Room Card -->
      <div class="glass rounded-[2.5rem] p-10 transform transition-all duration-300 hover:scale-[1.02] hover:shadow-primary/10 flex flex-col border border-white/10 group">
        <div class="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center text-primary mb-8 shadow-inner ring-1 ring-primary/20 group-hover:rotate-6 transition-transform">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
        </div>
        <h2 class="text-4xl font-black mb-3 uppercase tracking-tight text-white">Create Room</h2>
        <p class="text-slate-400 text-sm mb-10 font-medium leading-relaxed">Start any arena and invite your friends to play together.</p>
        
        <div class="space-y-6 mb-10">
          <div>
            <label class="block text-[9px] font-black text-slate-500 uppercase mb-3 ml-2 tracking-widest">Room Name</label>
            <input v-model="createForm.name" type="text" :placeholder="`${user.displayName || user.username}'s Room`" class="w-full bg-surface/50 border border-white/5 rounded-2xl px-5 py-4 text-white text-xs placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium" />
          </div>

          <div class="flex p-1 bg-surface/50 rounded-2xl border border-white/5">
            <button @click="createForm.visibility = 'public'" :class="createForm.visibility === 'public' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-white'" class="flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
              Public
            </button>
            <button @click="createForm.visibility = 'private'" :class="createForm.visibility === 'private' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-white'" class="flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              Private
            </button>
          </div>
        </div>

        <div class="mt-auto">
          <button @click="handleCreate" :disabled="isLoading" class="w-full bg-primary hover:bg-primaryHover text-white font-black py-5 rounded-2xl transition-all shadow-lg shadow-primary/25 disabled:opacity-50 flex items-center justify-center gap-3 text-sm uppercase tracking-widest">
            <span>{{ isLoading ? 'Launching...' : 'Create Room' }}</span>
            <svg v-if="!isLoading" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
          </button>
        </div>
      </div>

      <!-- Join Room Card -->
      <div class="glass rounded-[2.5rem] p-10 transform transition-all duration-300 hover:scale-[1.02] hover:shadow-accent/10 border border-white/10 group flex flex-col">
        <div class="w-16 h-16 rounded-2xl bg-accent/20 flex items-center justify-center text-accent mb-8 shadow-inner ring-1 ring-accent/20 group-hover:-rotate-6 transition-transform">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>
        </div>
        <h2 class="text-4xl font-black mb-3 uppercase tracking-tight text-white">Join Room</h2>
        <p class="text-slate-400 text-sm mb-10 font-medium leading-relaxed">Enter a room code or browse public rooms to join others.</p>
        
        <div class="space-y-6 mt-auto">
          <input v-model="joinCode" type="text" placeholder="ROOM CODE" class="w-full bg-surface/50 border-2 border-white/5 rounded-2xl px-6 py-5 text-center text-2xl font-black tracking-[0.3em] text-white placeholder-slate-700 focus:outline-none focus:border-accent/40 transition-all uppercase" />
          <div class="grid grid-cols-2 gap-4">
             <button @click="activeSubView = 'browser'" class="flex-1 bg-white/5 hover:bg-white/10 text-slate-400 font-black py-5 rounded-2xl transition-all border border-white/5 text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                Browse Public
             </button>
             <button @click="handleJoin" :disabled="isLoading || joinCode.length < 4" class="flex-1 bg-accent hover:bg-accentHover text-white font-black py-5 rounded-2xl transition-all shadow-lg shadow-accent/25 disabled:opacity-50 text-[10px] uppercase tracking-widest">
                Join Room
             </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Public Arena Browser -->
    <div v-else class="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div class="glass p-10 rounded-[3rem] border border-white/10 shadow-2xl">
            <div class="flex flex-col md:flex-row items-center justify-between mb-10 gap-6">
                <div class="flex items-center gap-6">
                    <button @click="activeSubView = null" class="w-12 h-12 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all border border-white/5 group">
                        <svg class="group-hover:-translate-x-1 transition-transform" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                    </button>
                    <div>
                        <h2 class="text-3xl font-black text-white uppercase tracking-tight">Public Rooms</h2>
                        <p class="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Status: Online</p>
                    </div>
                </div>

                <div class="relative w-full md:w-80">
                    <input v-model="searchQuery" type="text" placeholder="Search by name or code..." class="w-full bg-surface/50 border border-white/10 rounded-2xl px-6 py-4 text-xs text-white placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium pl-12" />
                    <svg class="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                </div>
            </div>

            <div v-if="isFetching" class="py-20 flex flex-col items-center gap-6 opacity-40">
                <div class="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p class="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Loading...</p>
            </div>

            <div v-else-if="filteredRooms.length === 0" class="py-20 flex flex-col items-center justify-center text-slate-700 gap-6 opacity-30">
                <div class="w-20 h-20 rounded-[2rem] border-4 border-dashed border-slate-800 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M16 16s-1.5-2-4-2-4 2-4 2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>
                </div>
                <p class="font-black tracking-[0.3em] text-[10px] uppercase">No active public rooms found</p>
            </div>

            <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <div v-for="room in filteredRooms" :key="room.id" class="glass-light p-6 rounded-[2rem] border border-white/10 hover:border-primary/40 transition-all hover:scale-[1.02] flex flex-col gap-4 group">
                    <div class="flex items-start justify-between">
                        <div class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                            <span class="text-xl font-black">{{ (room.name || 'A')[0].toUpperCase() }}</span>
                        </div>
                        <div class="flex flex-col items-end">
                            <span class="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Room Code</span>
                            <span class="text-xs font-mono font-black text-slate-300">{{ room.id }}</span>
                        </div>
                    </div>
                    
                    <div>
                        <h3 class="text-lg font-black text-white tracking-tight truncate">{{ room.name }}</h3>
                        <div class="flex items-center gap-3 mt-2">
                             <div class="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/5 border border-white/5">
                                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="text-slate-500"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                                <span class="text-[10px] font-black text-slate-400 capitalize">{{ Object.keys(room.players || {}).length }}/6 Player{{ Object.keys(room.players || {}).length > 1 ? 's' : '' }}</span>
                             </div>
                             <div class="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/5 border border-white/5">
                                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="text-slate-500"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>
                                <span class="text-[10px] font-black text-slate-400">{{ room.settings?.gridSize }}x{{ room.settings?.gridSize }} Complex</span>
                             </div>
                        </div>
                    </div>

                    <button @click="handleJoinBrowser(room.id)" :disabled="isLoading" class="w-full py-4 bg-white/5 hover:bg-primary hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/5 transition-all mt-2 group-hover:shadow-lg group-hover:shadow-primary/20">
                        Join Room
                    </button>
                </div>
            </div>
        </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import { useGameRoom } from '~/composables/useGameRoom';

const props = defineProps({
  user: Object,
  isLoading: Boolean
});

const emit = defineEmits(['create', 'join']);

const { subscribeToPublicRooms } = useGameRoom();

const activeSubView = ref(null); // null | 'browser'
const joinCode = ref('');
const searchQuery = ref('');
const publicRooms = ref([]);
const isFetching = ref(false);
let unsubscribe = null;

const createForm = reactive({
  name: '',
  visibility: 'public'
});

const filteredRooms = computed(() => {
  if (!searchQuery.value) return publicRooms.value;
  const query = searchQuery.value.toLowerCase();
  return publicRooms.value.filter(room => 
    room.name?.toLowerCase().includes(query) || 
    room.id?.toLowerCase().includes(query)
  );
});

const handleCreate = () => {
  emit('create', { 
    visibility: createForm.visibility, 
    name: createForm.name || `${props.user.displayName || props.user.username}'s Room` 
  });
};

const handleJoin = () => {
  if (joinCode.value.length < 4) return;
  emit('join', joinCode.value);
};

const handleJoinBrowser = (id) => {
  emit('join', id);
};

onMounted(() => {
    isFetching.value = true;
    unsubscribe = subscribeToPublicRooms((rooms) => {
        publicRooms.value = rooms;
        isFetching.value = false;
    });
});

onUnmounted(() => {
    if (unsubscribe) unsubscribe();
});
</script>

<style scoped>
.glass-light {
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(10px);
}
</style>
