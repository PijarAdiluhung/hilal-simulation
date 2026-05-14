<script setup>
// This component ONLY cares about the numeric stats
defineProps({
  altitude: { type: Number, required: true },
  elongation: { type: Number, required: true }
})
</script>

<template>
  <div class="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex gap-8 px-8 py-4 bg-black/30 backdrop-blur-md rounded-2xl border border-white/5 shadow-2xl">
    
    <!-- Altitude Stat -->
    <div class="flex flex-col items-center">
      <span class="text-[9px] text-white/30 font-bold tracking-[0.2em] uppercase mb-1 whitespace-nowrap">
        Alt. at Sunset (0°)
      </span>
      <div class="flex items-baseline gap-1">
        <span class="text-white font-medium text-2xl tabular-nums">
          {{ altitude.toFixed(1) }}°
        </span>
      </div>
    </div>

    <!-- Vertical Divider -->
    <div class="w-px h-10 bg-white/10 self-center"></div>

    <!-- Elongation Stat -->
    <div class="flex flex-col items-center">
      <span class="text-[9px] text-white/30 font-bold tracking-[0.2em] uppercase mb-1">
        Elongation
      </span>
      <div class="flex items-baseline gap-1">
        <span class="text-white font-medium text-2xl tabular-nums">
          {{ elongation.toFixed(1) }}°
        </span>
      </div>
    </div>

  </div>
</template>