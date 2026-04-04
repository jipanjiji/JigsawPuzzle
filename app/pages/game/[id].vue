<template>
  <div class="h-screen w-screen flex flex-col bg-background text-white overflow-hidden relative">
    
    <!-- Navbar / Stats -->
    <div class="absolute top-0 w-full h-20 glass flex items-center justify-between px-8 z-10 border-b border-white/5 shadow-xl">
       <div class="font-bold text-2xl text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Speed Race Arena</div>
       
       <!-- Instructions (added for zoom/pan) -->
       <div class="hidden lg:flex items-center gap-4 text-xs text-white/50 bg-white/5 px-4 py-2 rounded-full">
           <div class="flex items-center gap-1"><kbd class="bg-white/10 px-2 py-0.5 rounded">Scroll</kbd> Zoom</div>
           <div class="flex items-center gap-1"><kbd class="bg-white/10 px-2 py-0.5 rounded">Right Click</kbd> Pan Board</div>
       </div>

       <div class="flex gap-8 items-center w-1/3">
           <!-- Player 1 Progress -->
           <div class="flex-1 flex flex-col gap-2">
               <div class="flex justify-between text-sm mb-1">
                   <span class="text-primary font-medium">{{ myName }} ( You )</span>
                   <span class="font-mono text-green-400 font-bold">{{ Math.round(myProgress) }}%</span>
               </div>
               <div class="h-2 w-full bg-surface rounded-full overflow-hidden border border-white/5">
                   <div class="h-full bg-green-500 rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(34,197,94,0.5)]" :style="`width: ${Math.round(myProgress)}%`"></div>
               </div>
           </div>
           
           <div class="text-2xl font-black text-slate-700 italic">VS</div>

           <!-- Player 2 Progress -->
           <div class="flex-1 flex flex-col gap-2">
               <div class="flex justify-between text-sm mb-1">
                   <span class="text-accent font-medium">{{ opponentName }} ( Opponent )</span>
                   <span class="font-mono text-red-400 font-bold">{{ Math.round(opponentProgress) }}%</span>
               </div>
               <div class="h-2 w-full bg-surface rounded-full overflow-hidden border border-white/5">
                   <div class="h-full bg-red-500 rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(239,68,68,0.5)]" :style="`width: ${Math.round(opponentProgress)}%`"></div>
               </div>
           </div>
       </div>

       <!-- Back Button -->
       <button @click="backToLobby" class="px-6 py-2 bg-surface/80 border border-white/10 hover:border-red-400 hover:text-red-400 rounded-xl transition-all text-sm font-medium">
           Quit Match
       </button>
    </div>

    <!-- Center Game Area -->
    <div @contextmenu.prevent class="flex-1 w-full bg-[#0a0f18] mt-20 relative overflow-hidden" id="game-area">
       <!-- Konva uses this internal div, isolated from Vue reactivity DOM additions -->
       <div id="konva-container" ref="containerRef" class="absolute inset-0"></div>

       <!-- Game Over Overlay -->
       <div v-if="matchFinished" class="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-xl">
           <div class="glass p-12 rounded-3xl text-center max-w-md w-full border border-white/20 shadow-2xl">
               <h2 class="animate-bounce text-5xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r" :class="isWinner ? 'from-green-400 to-emerald-600' : 'from-red-400 to-rose-600'">
                   {{ isWinner ? 'YOU WIN!' : 'YOU LOSE!' }}
               </h2>
               <p class="text-slate-300 mb-8">{{ isWinner ? 'Absolutely phenomenal speed!' : 'Better luck next time, your opponent was faster.' }}</p>
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
const { roomState, currentPlayerId, listenToRoom, currentRoomId, updateProgress, setPiecesSetup, leaveRoom } = useGameRoom();

const containerRef = ref(null);

// Konva variables
let Konva = null;

const myProgress = computed(() => {
   if (!roomState.value || !currentPlayerId.value) return 0;
   const me = roomState.value.players[currentPlayerId.value];
   return me ? me.progress : 0;
});

const opponentProgress = computed(() => {
   if (!roomState.value || !currentPlayerId.value) return 0;
   const opponents = Object.keys(roomState.value.players).filter(id => id !== currentPlayerId.value);
   if (opponents.length === 0) return 0;
   return roomState.value.players[opponents[0]].progress || 0;
});

const myName = computed(() => {
   if (!roomState.value || !currentPlayerId.value) return 'Player';
   return roomState.value.players[currentPlayerId.value]?.name || 'Player';
});

const opponentName = computed(() => {
   if (!roomState.value || !currentPlayerId.value) return 'Waiting...';
   const opponents = Object.keys(roomState.value.players).filter(id => id !== currentPlayerId.value);
   if (opponents.length === 0) return 'Waiting...';
   return roomState.value.players[opponents[0]]?.name || 'Waiting...';
});

const matchFinished = computed(() => {
   return myProgress.value >= 100 || opponentProgress.value >= 100;
});

const isWinner = computed(() => {
   return myProgress.value >= 100;
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
