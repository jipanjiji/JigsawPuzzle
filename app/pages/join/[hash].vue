<template>
  <div class="relative min-h-screen flex items-center justify-center overflow-hidden p-6 font-layout">
    <!-- Background -->
    <div class="absolute inset-0 z-0">
      <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px] animate-pulse"></div>
      <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[100px] animate-pulse" style="animation-delay: 2s;"></div>
    </div>

    <div class="relative z-10 w-full max-w-md">
      <div class="glass p-12 rounded-[3.5rem] border border-white/10 shadow-2xl text-center">
        <!-- Icon -->
        <div class="w-24 h-24 bg-primary/20 rounded-[2rem] flex items-center justify-center text-primary mx-auto mb-10 shadow-inner ring-1 ring-primary/20">
          <svg v-if="status === 'loading'" class="animate-spin" xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>
          <svg v-else-if="status === 'error'" xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-red-500"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-green-500"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </div>

        <h2 class="text-3xl font-black text-white uppercase tracking-tight mb-4">
          {{ status === 'loading' ? 'Joining Room' : (status === 'error' ? 'Error' : 'Joining...') }}
        </h2>
        
        <p class="text-slate-400 text-sm font-medium uppercase tracking-widest leading-loose">
          {{ message }}
        </p>

        <div v-if="status === 'error'" class="mt-12">
            <button @click="router.push('/')" class="w-full bg-surface border border-white/10 hover:border-primary text-white py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all active:scale-95">
                Go to Login Page
            </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuth } from '~/composables/useAuth';
import { useGameRoom } from '~/composables/useGameRoom';

const route = useRoute();
const router = useRouter();
const { user, loading: authLoading } = useAuth();
const { getRoomIdByHash, joinRoom } = useGameRoom();

const status = ref('loading');
const message = ref('Please wait...');
const hash = route.params.hash;

const initJoin = async () => {
    // Wait until auth is done loading
    if (authLoading.value) return;

    if (!hash) {
        status.value = 'error';
        message.value = 'Invalid link';
        return;
    }

    try {
        // Resolve Hash to Room ID
        const roomId = await getRoomIdByHash(hash);
        
        if (!roomId) {
            status.value = 'error';
            message.value = 'This link has expired or is invalid';
            return;
        }

        // Check if user is logged in
        if (!user.value) {
            // Save hash to cookie for post-login auto-join
            const inviteHash = useCookie('invite_hash', { maxAge: 3600 });
            inviteHash.value = hash;
            
            status.value = 'error';
            message.value = 'Please login first to join this room';
            setTimeout(() => router.push('/'), 2000);
            return;
        }

        // Join the room
        message.value = 'Joining...';
        await joinRoom(roomId, user.value.displayName || user.value.username);
        
        status.value = 'success';
        message.value = 'Welcome to the room!';
        
        setTimeout(() => router.push('/'), 1500);

    } catch (err) {
        status.value = 'error';
        message.value = err.message || 'Something went wrong';
    }
};

onMounted(() => {
    initJoin();
});

// Re-run init when auth determines state
watch(authLoading, (loading) => {
    if (!loading) initJoin();
});
</script>

<style scoped>
.glass {
  background: rgba(10, 15, 25, 0.7);
  backdrop-filter: blur(24px);
}
</style>
