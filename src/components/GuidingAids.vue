<script setup>
defineProps({
  moonPos: Object,
  moonBounds: Object,
  lunarAltitude: Number,
  horizonY: Number,
  size: Number
})
</script>

<template>
  <div class="absolute inset-0 pointer-events-none">
    <!-- 1. Tracking Box on Moon -->
    <div
      class="absolute border-2 border-amber-400/50 transition-all duration-300"
      :style="{
        left: moonPos.left,
        top: moonPos.top,
        width: size + 'px',
        height: size + 'px',
        transform: 'translate(-50%, -50%)',
        opacity: moonBounds.y < 0 || moonBounds.x < 0 || moonBounds.x > 100 ? 0 : 1,
      }"
    >
      <div class="absolute -top-5 left-0 text-[10px] text-amber-400 font-mono font-bold">
        HILAL
      </div>
    </div>

    <!-- 2. Top Indicator -->
    <div
      v-if="moonBounds.isTooTop && lunarAltitude > 0"
      class="absolute top-2 -translate-x-1/2 flex flex-col items-center animate-pulse z-50"
      :style="{ left: Math.max(5, Math.min(95, moonBounds.x)) + '%' }"
    >
      <div class="w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-b-12 border-b-amber-400"></div>
    </div>

    <!-- 3. Bottom Indicator (Stops at Horizon) -->
    <div
      v-if="moonBounds.isTooBottom"
      class="absolute flex flex-col items-center animate-pulse z-50 -translate-x-1/2"
      :style="{
        left: Math.max(5, Math.min(95, moonBounds.x)) + '%',
        top: `calc(${horizonY}% - 20px)`,
      }"
    >
      <div class="w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-12 border-t-amber-400"></div>
    </div>

    <!-- 4. Left Indicator -->
    <div
      v-if="moonBounds.isTooLeft"
      class="absolute left-4 -translate-y-1/2 flex items-center animate-pulse z-50"
      :style="{
        top: Math.max(5, Math.min(horizonY - 5, moonBounds.y)) + '%',
      }"
    >
      <div class="w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-12 border-r-amber-400"></div>
    </div>

    <!-- 5. Right Indicator -->
    <div
      v-if="moonBounds.isTooRight"
      class="absolute right-4 -translate-y-1/2 flex items-center animate-pulse z-50"
      :style="{
        top: Math.max(5, Math.min(horizonY - 5, moonBounds.y)) + '%',
      }"
    >
      <div class="w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-l-12 border-l-amber-400"></div>
    </div>
  </div>
</template>