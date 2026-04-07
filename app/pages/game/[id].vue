<template>
  <div class="h-screen w-screen flex flex-col bg-background text-white overflow-hidden relative">
    
    <!-- Navbar / Stats -->
    <div class="absolute top-0 w-full h-20 glass flex items-center justify-between px-8 z-10 border-b border-white/5 shadow-xl">
       <div class="font-bold text-2xl text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent uppercase tracking-tighter">Jigsaw Rush Arena</div>
       
       <!-- Instructions (added for zoom/pan) -->
       <div class="hidden lg:flex items-center gap-4 text-xs text-white/50 bg-white/5 px-4 py-2 rounded-full">
           <div class="flex items-center gap-1"><kbd class="bg-white/10 px-2 py-0.5 rounded">Scroll</kbd> Zoom</div>
           <div class="flex items-center gap-1"><kbd class="bg-white/10 px-2 py-0.5 rounded">Right Click</kbd> Pan Board</div>
       </div>

       <div class="hidden lg:flex items-center gap-6 bg-white/5 px-6 py-2.5 rounded-2xl border border-white/10 shadow-inner">
           <div class="flex items-center gap-2 text-slate-400 font-medium">
               <span class="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
               {{ roomState?.players ? Object.keys(roomState.players).length : 0 }} Players Online
           </div>
       </div>

       <!-- Back Button -->
       <button @click="backToLobby" class="px-6 py-2 bg-surface/80 border border-white/10 hover:border-red-400 hover:text-red-400 rounded-xl transition-all text-sm font-medium">
           Quit Match
       </button>
    </div>

    <!-- Center Game Area -->
    <div @contextmenu.prevent class="flex-1 w-full bg-[#0a0f18] mt-20 relative overflow-hidden" id="game-area">
        <!-- Sidebar Leaderboard -->
        <div v-if="roomState" class="absolute top-8 right-8 w-64 flex flex-col gap-4 z-40 bg-background/40 backdrop-blur-xl p-5 rounded-[2rem] border border-white/10 shadow-2xl">
            <div class="flex justify-between items-center px-1">
                <h3 class="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Rankings</h3>
                <span class="text-[10px] font-bold text-primary px-2 py-0.5 rounded-full bg-primary/10">LIVE</span>
            </div>
            
            <div class="flex flex-col gap-2.5">
                <div v-for="(player, idx) in sortedLeaderboard" :key="player.id" 
                     class="flex flex-col gap-1.5 p-3 rounded-2xl transition-all border"
                     :class="player.id === currentPlayerId ? 'bg-primary/20 border-primary/30 shadow-lg shadow-primary/5 scale-[1.02]' : 'bg-white/5 border-white/5'">
                    <div class="flex justify-between items-center px-0.5">
                        <div class="flex items-center gap-2">
                            <span class="text-[10px] font-black w-4 text-slate-500">#{{ idx + 1 }}</span>
                            <span class="text-xs font-bold truncate max-w-[100px] flex items-center gap-1.5" :class="player.id === currentPlayerId ? 'text-primary' : 'text-slate-300'">
                                {{ player.name }}
                                <span v-if="player.username?.toLowerCase() === 'alvin'" class="bg-gradient-to-r from-yellow-400 to-amber-600 text-black text-[6px] px-1 py-0.5 rounded-md font-black uppercase tracking-tighter shadow-sm shadow-yellow-400/20">Dev</span>
                            </span>
                        </div>
                        <span class="font-mono text-[11px] font-black" :class="player.progress >= 100 ? 'text-green-400' : 'text-slate-400'">
                            {{ Math.round(player.progress) }}%
                        </span>
                    </div>
                    <div class="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                        <div class="h-full transition-all duration-700 ease-out" 
                             :class="player.id === currentPlayerId ? 'bg-gradient-to-r from-primary to-accent' : 'bg-slate-600'"
                             :style="`width: ${player.progress}%`"></div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Konva uses this internal div, isolated from Vue reactivity DOM additions -->
        <div id="konva-container" ref="containerRef" class="absolute inset-0"></div>

       <!-- Game Over Overlay -->
       <div v-if="matchFinished" class="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-xl">
           <div class="glass p-12 rounded-3xl text-center max-w-md w-full border border-white/20 shadow-2xl">
               <h2 class="animate-bounce text-5xl font-black mb-1 text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                   GAME OVER
               </h2>
               <div class="mb-8">
                   <p class="text-slate-400 text-[10px] uppercase tracking-[0.4em] font-bold">Final Results</p>
               </div>

               <div class="space-y-3 mb-10 text-left">
                   <div v-for="(player, idx) in sortedLeaderboard.slice(0, 3)" :key="player.id"
                        class="flex items-center justify-between p-4 rounded-2xl border"
                        :class="idx === 0 ? 'bg-yellow-400/10 border-yellow-400/20 ring-1 ring-yellow-400/20' : 'bg-white/5 border-white/5'">
                       <div class="flex items-center gap-4">
                           <div class="w-10 h-10 rounded-full flex items-center justify-center font-black text-xl" 
                                :class="idx === 0 ? 'bg-yellow-400 text-black' : idx === 1 ? 'bg-slate-300 text-black' : 'bg-amber-600 text-white'">
                               {{ idx + 1 }}
                           </div>
                           <div class="flex flex-col">
                               <span class="font-black text-sm" :class="idx === 0 ? 'text-white' : 'text-slate-300'">{{ player.name }}</span>
                               <span class="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{{ idx === 0 ? 'Winner' : 'Runner Up' }}</span>
                           </div>
                       </div>
                       <span class="font-mono font-black text-lg" :class="idx === 0 ? 'text-yellow-400' : 'text-slate-500'">{{ Math.round(player.progress) }}%</span>
                   </div>
               </div>

               <p class="text-slate-400 text-xs mb-8 italic">Better luck next time, puzzles await!</p>
               <button @click="backToLobby" class="w-full bg-primary hover:bg-primaryHover text-white py-4 rounded-xl font-bold transition-all shadow-lg shadow-primary/30">
                   Back to Lobby
               </button>
           </div>
       </div>
    </div>
    
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useGameRoom } from '~/composables/useGameRoom';
import { useAuth } from '~/composables/useAuth';

const route = useRoute();
const router = useRouter();
const { user } = useAuth();
const { roomState, currentPlayerId, listenToRoom, currentRoomId, updateProgress, setPiecesSetup, leaveRoom, completeMatch } = useGameRoom();

const containerRef = ref(null);

// Konva variables
let Konva = null;

const myProgress = computed(() => {
   if (!roomState.value || !currentPlayerId.value) return 0;
   const me = roomState.value.players[currentPlayerId.value];
   return me ? me.progress : 0;
});

const myName = computed(() => {
   if (!roomState.value || !currentPlayerId.value) return 'Player';
   return roomState.value.players[currentPlayerId.value]?.name || 'Player';
});

const opponentsData = computed(() => {
   if (!roomState.value || !currentPlayerId.value) return [];
   return Object.entries(roomState.value.players)
     .filter(([id]) => id !== currentPlayerId.value)
     .map(([id, p]) => ({ id, ...p }));
});

const sortedLeaderboard = computed(() => {
   if (!roomState.value) return [];
   return Object.entries(roomState.value.players)
     .map(([id, p]) => ({ id, ...p }))
     .sort((a, b) => b.progress - a.progress || a.name.localeCompare(b.name));
});

const matchFinished = computed(() => {
   if (!roomState.value) return false;
   return Object.values(roomState.value.players).some((p) => p.progress >= 100);
});

const isWinner = computed(() => {
   if (!roomState.value) return false;
   return myProgress.value >= 100;
});

const { recordMatchResult } = useAuth();
const hasRecordedResult = ref(false);

watch(matchFinished, async (isDone) => {
    if (isDone && !hasRecordedResult.value && currentPlayerId.value) {
        const myRank = sortedLeaderboard.value.findIndex(p => p.id === currentPlayerId.value) + 1;
        if (myRank > 0) {
            // ALL-IN-ONE RECORDING: Updates rank, history, trophies, winner, and status atomically
            await recordMatchResult(myRank, route.params.id);
            hasRecordedResult.value = true;
        }
    }
});

const backToLobby = async () => {
    await leaveRoom();
    router.push('/');
}

const isHost = computed(() => {
   return roomState.value?.host === currentPlayerId.value;
});

let stage = null;
let layer = null;
let boardLayer = null;

let GRID_SIZE = 4;
let pieceWidth = 0;
let pieceHeight = 0;
let pieces = [];
let totalLocked = 0;

// === ALGORITMA BEZIER CURVE JIGSAW === //
const drawPiecePath = (ctx, pw, ph, tabs) => {
    let t = tabs.top;
    let r = tabs.right;
    let b = tabs.bottom;
    let l = tabs.left;

    let ts = t === 1 ? -1 : 1; 
    let rs = r === 1 ? 1 : -1;
    let bs = b === 1 ? 1 : -1;
    let ls = l === 1 ? -1 : 1;

    let cw = pw / 2, ch = ph / 2;
    let wV = pw * 0.15; // Tab Width
    let hV = ph * 0.22; // Tab Height Outward
    let wH = ph * 0.15; 
    let hH = pw * 0.22; 

    ctx.moveTo(0, 0);

    // Top
    if (t === 0) {
        ctx.lineTo(pw, 0);
    } else {
        ctx.lineTo(cw - wV, 0);
        ctx.bezierCurveTo(cw - wV, ts * hV, cw + wV, ts * hV, cw + wV, 0);
        ctx.lineTo(pw, 0);
    }

    // Right
    if (r === 0) {
        ctx.lineTo(pw, ph);
    } else {
        ctx.lineTo(pw, ch - wH);
        ctx.bezierCurveTo(pw + rs * hH, ch - wH, pw + rs * hH, ch + wH, pw, ch + wH);
        ctx.lineTo(pw, ph);
    }

    // Bottom
    if (b === 0) {
        ctx.lineTo(0, ph);
    } else {
        ctx.lineTo(cw + wV, ph);
        ctx.bezierCurveTo(cw + wV, ph + bs * hV, cw - wV, ph + bs * hV, cw - wV, ph);
        ctx.lineTo(0, ph);
    }

    // Left
    if (l === 0) {
        ctx.lineTo(0, 0);
    } else {
        ctx.lineTo(0, ch + wH);
        ctx.bezierCurveTo(ls * hH, ch + wH, ls * hH, ch - wH, 0, ch - wH);
        ctx.lineTo(0, 0);
    }
}

const drawBoard = (img) => {
   if(!containerRef.value) return;

   // Update variables from room state!
   GRID_SIZE = roomState.value?.settings?.gridSize || 4;

   const container = containerRef.value;
   const width = container.clientWidth;
   const height = container.clientHeight;

   stage = new Konva.Stage({
      container: 'konva-container',
      width: width,
      height: height,
   });

   // RIGHT CLICK PANNING
   let isPanning = false;
   let lastPos = { x: 0, y: 0 };
   
   stage.on('mousedown', (e) => {
       if (e.evt.button === 2) { // Right Click
           isPanning = true;
           lastPos = stage.getPointerPosition();
           container.style.cursor = 'grabbing';
       }
   });

   stage.on('mousemove', (e) => {
       if (!isPanning) return;
       const pos = stage.getPointerPosition();
       const newPos = {
           x: stage.x() + pos.x - lastPos.x,
           y: stage.y() + pos.y - lastPos.y
       };
       stage.position(newPos);
       stage.batchDraw();
       lastPos = pos;
   });

   stage.on('mouseup mouseleave', (e) => {
       if (isPanning) {
           isPanning = false;
           container.style.cursor = 'default';
       }
   });

   // ZOOMING MECHANISM
   stage.on('wheel', (e) => {
      e.evt.preventDefault();
      const scaleBy = 1.1;
      const oldScale = stage.scaleX();

      const pointer = stage.getPointerPosition();
      const mousePointTo = {
        x: (pointer.x - stage.x()) / oldScale,
        y: (pointer.y - stage.y()) / oldScale,
      };

      let newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
      newScale = Math.max(0.4, Math.min(newScale, 3)); // Clamp 40% to 300%

      stage.scale({ x: newScale, y: newScale });

      const newPos = {
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      };
      stage.position(newPos);
      stage.batchDraw();
   });

   boardLayer = new Konva.Layer();
   layer = new Konva.Layer();
   stage.add(boardLayer);
   stage.add(layer);

   // Calculate scaling to perfectly fit inside screen
   const maxWidth = width * 0.55;
   const maxHeight = height * 0.75;
   
   const scaleX = maxWidth / img.width;
   const scaleY = maxHeight / img.height;
   const scale = Math.min(scaleX, scaleY);
   
   const scaledWidth = img.width * scale;
   const scaledHeight = img.height * scale;

   const boardX = (width - scaledWidth) / 2;
   const boardY = (height - scaledHeight) / 2;

   pieceWidth = scaledWidth / GRID_SIZE;
   pieceHeight = scaledHeight / GRID_SIZE;

   // 1. Draw Grid Outline (Magnet Board)
   for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
         const gridBox = new Konva.Rect({
            x: boardX + (c * pieceWidth),
            y: boardY + (r * pieceHeight),
            width: pieceWidth,
            height: pieceHeight,
            stroke: 'rgba(255,255,255,0.1)',
            strokeWidth: 2,
            dash: [5, 5]
         });
         boardLayer.add(gridBox);
      }
   }

   // 2. Generate and Sync Pattern + Scramble (HOST ONLY)
   if (isHost.value && (!roomState.value.scramble || !roomState.value.puzzlePattern)) {
      const scrambleArray = [];
      for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
         let rx, ry;
         if (Math.random() > 0.5) {
            rx = Math.random() * Math.max(10, boardX - pieceWidth - 20) + 10;
         } else {
            rx = boardX + scaledWidth + 20 + Math.random() * Math.max(10, width - boardX - scaledWidth - pieceWidth - 20);
         }
         ry = Math.random() * Math.max(10, height - pieceHeight - 20) + 10;
         scrambleArray.push({ x: rx, y: ry });
      }

      // Generate Jigsaw Logic (Top, Right, Bottom, Left)
      const hEdges = [];
      for (let r = 0; r < GRID_SIZE; r++) {
         const row = [];
         for (let c = 0; c < GRID_SIZE - 1; c++) row.push(Math.random() > 0.5 ? 1 : -1); 
         hEdges.push(row);
      }
      const vEdges = [];
      for (let r = 0; r < GRID_SIZE - 1; r++) {
         const row = [];
         for (let c = 0; c < GRID_SIZE; c++) row.push(Math.random() > 0.5 ? 1 : -1);
         vEdges.push(row);
      }

      const patternArray = [];
      for (let r = 0; r < GRID_SIZE; r++) {
         for (let c = 0; c < GRID_SIZE; c++) {
            const t = r === 0 ? 0 : -vEdges[r-1][c];
            const b = r === GRID_SIZE - 1 ? 0 : vEdges[r][c];
            const l = c === 0 ? 0 : -hEdges[r][c-1];
            const ri = c === GRID_SIZE - 1 ? 0 : hEdges[r][c];
            patternArray.push({ top: t, right: ri, bottom: b, left: l });
         }
      }

      // Push to Firebase
      setPiecesSetup(route.params.id, scrambleArray, patternArray);
   }

   // 3. Listener / Rendering Trigger
   let rendered = false;
   watch(() => roomState.value, (val) => {
       if (val?.scramble && val?.puzzlePattern && !rendered && pieces.length === 0) {
           rendered = true;
           renderPieces(img, scale, boardX, boardY, val.scramble, val.puzzlePattern);
       }
   }, { immediate: true, deep: true });
}

const renderPieces = (img, scale, boardX, boardY, scrambleData, patternData) => {
   let index = 0;
   for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
         const correctX = boardX + (c * pieceWidth);
         const correctY = boardY + (r * pieceHeight);
         const scX = scrambleData[index].x;
         const scY = scrambleData[index].y;

         // Image pattern offset calculation
         const cropX = c * (img.width / GRID_SIZE);
         const cropY = r * (img.height / GRID_SIZE);

         const currentIndex = r * GRID_SIZE + c;

         // MIGHTY BEZIER SHAPE 🧩
         const shape = new Konva.Shape({
            x: scX,
            y: scY,
            draggable: true,
            sceneFunc: (context, shapeObj) => {
                context.beginPath();
                drawPiecePath(context, pieceWidth, pieceHeight, patternData[currentIndex]);
                context.closePath();
                context.fillStrokeShape(shapeObj);
            },
            fillPatternImage: img,
            fillPatternOffset: { x: cropX, y: cropY },
            fillPatternScale: { x: scale, y: scale },
            
            // Optimization: Remove shadowBlur on Custom Shape to prevent rendering delay
            stroke: 'rgba(255,255,255,0.4)',
            strokeWidth: 2,
            hitStrokeWidth: 0,
            perfectDrawEnabled: false, // Boosts performance when drawing complex paths
         });

         // Custom Variables
         shape.setAttr('correctCoord', { x: correctX, y: correctY });
         shape.setAttr('gridRow', r);
         shape.setAttr('gridCol', c);
         shape.setAttr('isLocked', false);
         shape.setAttr('initialDragX', scX);
         shape.setAttr('initialDragY', scY);

         // Drag Events
         shape.on('dragstart', (e) => {
             if (shape.getAttr('isLocked')) {
                 shape.stopDrag();
                 return;
             }
             shape.moveToTop();
             layer.batchDraw();
             shape.setAttr('initialDragX', shape.x());
             shape.setAttr('initialDragY', shape.y());
         });

         shape.on('dragend', (e) => {
             const cx = shape.x();
             const cy = shape.y();

             // Snap calculations
             let closestC = Math.round((cx - boardX) / pieceWidth);
             let closestR = Math.round((cy - boardY) / pieceHeight);
             
             if (closestC >= -1 && closestC <= GRID_SIZE && closestR >= -1 && closestR <= GRID_SIZE) {
                 closestC = Math.max(0, Math.min(GRID_SIZE - 1, closestC));
                 closestR = Math.max(0, Math.min(GRID_SIZE - 1, closestR));
                 
                 const snapX = boardX + (closestC * pieceWidth);
                 const snapY = boardY + (closestR * pieceHeight);
                 
                 const dist = Math.sqrt(Math.pow(snapX - cx, 2) + Math.pow(snapY - cy, 2));

                 if (dist < pieceWidth * 0.4) {
                     shape.position({ x: snapX, y: snapY }); // Visual Snap Target
                     
                     if (closestC === c && closestR === r) {
                         // CORRECT 🧩✅
                         shape.stroke('#4ade80');
                         shape.strokeWidth(5);
                         shape.setAttr('isLocked', true);
                         shape.draggable(false);
                         shape.moveToBottom(); // Drop below floating pieces
                         layer.batchDraw();
                         
                         setTimeout(() => {
                             shape.stroke('rgba(255,255,255,0.1)'); // Seamless border when locked
                             shape.strokeWidth(1);
                             layer.batchDraw();
                         }, 1000);
                         
                         totalLocked++;
                         const percentage = (totalLocked / (GRID_SIZE * GRID_SIZE)) * 100;
                         updateProgress(route.params.id, percentage);
                         
                     } else {
                         // INCORRECT ❌
                         shape.stroke('#ef4444');
                         shape.strokeWidth(6);
                         shape.draggable(false); // disable temporary drag spam
                         layer.batchDraw();
                         
                         setTimeout(() => {
                             shape.stroke('rgba(255,255,255,0.4)');
                             shape.strokeWidth(2);
                             shape.draggable(true);
                             shape.to({
                                 x: shape.getAttr('initialDragX'),
                                 y: shape.getAttr('initialDragY'),
                                 duration: 0.3,
                                 easing: Konva.Easings.EaseInOut
                             });
                         }, 1000);
                     }
                 } else {
                     layer.batchDraw();
                 }
             } else {
                 layer.batchDraw();
             }
         });

         layer.add(shape);
         pieces.push(shape);
         index++;
      }
   }
   layer.batchDraw();
}

onMounted(async () => {
   // Dynamically load Konva on client
   const KonvaModule = await import('konva');
   Konva = KonvaModule.default || KonvaModule;

   const roomId = route.params.id;
   listenToRoom(roomId);
   
   await nextTick();
   
   let initDone = false;
   watch([roomState, user], ([val, u]) => {
       if (val && u && !initDone) {
           initDone = true;
           const imgUrl = val.settings.imageUrl;
           const imgObj = new window.Image();
           imgObj.src = `/api/proxy?url=${encodeURIComponent(imgUrl)}`;
           imgObj.crossOrigin = 'Anonymous';
           imgObj.onload = () => {
               drawBoard(imgObj);
           }
       }
   }, { immediate: true });
});

onBeforeUnmount(() => {
    if (stage) {
        stage.destroy();
    }
});
</script>
