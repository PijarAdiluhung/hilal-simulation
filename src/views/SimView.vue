<script setup>
import { ref, computed } from 'vue'

const solarProgress = ref(0) // 0 to 110

// Variables for the Hilal
const ELONGATION_GAP = 30
const MOON_SIZE = 1.2

const sunY = computed(() => 10 + solarProgress.value * 1)
const moonY = computed(() => sunY.value - ELONGATION_GAP)

// SKY LOGIC
const dayOpacity = computed(() => (solarProgress.value < 30 ? 1 : 0))
const sunsetOpacity = computed(() => {
  if (solarProgress.value <= 25) return 0
  if (solarProgress.value <= 70) return 1 // Peak sunset brightness

  // As it moves from 70 to 100, calculate a value from 1 down to 0
  // Formula: 1 - (progress - start) / (end - start)
  const fadeOut = 1 - (solarProgress.value - 55) / (100 - 55)
  return Math.max(0, fadeOut)
})
const nightOpacity = computed(() => (solarProgress.value >= 70 ? 1 : 0))

// MOON VISIBILITY LOGIC
const moonOpacity = computed(() => {
  // Start appearing early but very faint, then ramp up as Sun sets
  if (solarProgress.value < 40) return 0.05
  if (solarProgress.value < 90) return 0.05 + (solarProgress.value - 70) * 0.01
  return 0.5 // Max visibility after sunset
})

const groundBrightness = computed(() => `brightness(${Math.max(110 - solarProgress.value, 15)}%)`)
</script>

<template>
  <div class="relative w-full h-screen overflow-hidden flex flex-col font-sans select-none">
    <!-- 1. Night Sky (Base Layer) -->
    <div
      class="absolute inset-0 bg-linear-to-t from-indigo-950 to-black transition-opacity duration-1000"
      :style="{ opacity: nightOpacity }"
    ></div>

    <!-- 2. Sunset Sky (Middle Layer) -->
    <div
      class="absolute inset-0 bg-linear-to-b from-orange-500 via-rose-400 to-amber-200 transition-opacity duration-1000"
      :style="{ opacity: sunsetOpacity }"
    ></div>

    <!-- 3. Day Sky (Top Layer) -->
    <div
      class="absolute inset-0 bg-linear-to-b from-sky-400 to-sky-200 transition-opacity duration-1000"
      :style="{ opacity: dayOpacity }"
    ></div>

    <div>
      <!-- Sun -->
      <div
        class="absolute left-1/2 -translate-x-1/2 w-32 h-32 rounded-full bg-yellow-50 blur-[2px] shadow-[0_0_80px_30px_rgba(255,252,231,0.7)]"
        :style="{ top: sunY + '%' }"
      ></div>

      <!-- The Crescent  -->
      <div
        class="absolute left-1/2 transition-all duration-300"
        :style="{
          top: moonY + '%',
          opacity: moonOpacity,
          transform: `translateX(-90px) scale(${MOON_SIZE}) rotate(79deg)`,
        }"
      >
        <div class="relative w-20 h-20">
          <div
            class="absolute inset-0 bg-white/90 rounded-full"
            style="clip-path: path('M 40,0 A 40,40 0 1,1 40,80 A 32,37 0 1,0 40,0 Z')"
          ></div>
        </div>
      </div>
    </div>

    <!-- Ground -->
    <div
      class="absolute bottom-0 w-full h-[25vh] bg-neutral-900 z-10 border-t border-white/5"
      :style="{ filter: groundBrightness }"
    ></div>

    <!-- Interface -->
    <div
      class="absolute top-12 left-1/2 -translate-x-1/2 z-20 w-80 bg-black/40 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-2xl"
    >
      <div
        class="flex justify-between text-white/40 text-[10px] mb-4 font-bold tracking-widest uppercase"
      >
        <span>Daylight</span>
        <span>Sunset</span>
        <span>Night</span>
      </div>

      <input
        v-model="solarProgress"
        type="range"
        min="0"
        max="110"
        step="0.1"
        class="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-white"
      />

      <div class="mt-6 flex flex-col items-center">
        <span class="text-[10px] text-white/40 font-bold tracking-widest uppercase"
          >Simulated Altitude</span
        >
        <span class="text-white font-light text-4xl tracking-tighter tabular-nums">
          {{ (80 - solarProgress).toFixed(1) }}°
        </span>
      </div>
    </div>
  </div>
</template>

<style>
/* Remove standard slider thumb styling for Tailwind accent */
input[type='range']::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  background: white;
  border-radius: 50%;
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
}
</style>
