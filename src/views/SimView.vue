<script setup>
import { ref, computed } from 'vue'

const solarProgress = ref(5) // Starting a bit above the sunset start

// Constants for positioning
const ELONGATION_GAP = 3
const sunSize = ref(50)
const moonScale = ref(0.8)

const getPosition = (altitude) => {
  const horizonY = 72 // The horizon line percentage
  // Each degree now moves the sun more significantly to account for the smaller range
  return horizonY - altitude * 20
}

const sunY = computed(() => getPosition(solarProgress.value))
const moonY = computed(() => getPosition(solarProgress.value + ELONGATION_GAP))

// SKY LOGIC
const dayOpacity = computed(() => {
  // Day sky fades out as we approach the 0.25° mark
  if (solarProgress.value > 0.5) return 1
  return Math.max(0, (solarProgress.value + 0.25) / 0.75)
})

const sunsetOpacity = computed(() => {
  const alt = solarProgress.value

  // Start fading in sunset colors earlier (e.g., 5°) so it's not a jump
  if (alt > 5) return 0
  if (alt > 0.25) return (5 - alt) / 4.75

  // Peak intensity right at the horizon window
  if (alt <= 0.25 && alt >= -0.25) return 1

  // Fade out into deep night after the sun is fully down
  if (alt > -5) return (alt + 5) / 4.75
  return 0
})

const nightOpacity = computed(() => {
  // Night sky fully takes over once sun disk is down (-0.25°)
  if (solarProgress.value < -0.25) return 1
  if (solarProgress.value < 0.5) return 1 - (solarProgress.value + 0.25) / 0.75
  return 0
})

// MOON VISIBILITY
const moonOpacity = computed(() => {
  if (solarProgress.value > -1) return 0
  const visibility = Math.abs(solarProgress.value - -1) * 0.1
  return Math.min(visibility, 0.8)
})

const groundBrightness = computed(() => {
  // Ground darkens as the sun crosses the -0.25° threshold
  const brightness = solarProgress.value > -0.25 ? 100 : 15
  return `brightness(${Math.max(brightness, 15)}%)`
})
</script>

<template>
  <div class="relative w-full h-screen overflow-hidden flex flex-col font-sans select-none">
    <!-- Day Sky -->
    <div
      class="absolute inset-0 bg-linear-to-b from-sky-400 to-sky-200 transition-opacity duration-1000"
      :style="{ opacity: dayOpacity }"
    ></div>

    <!-- Night Sky -->
    <div
      class="absolute inset-0 bg-linear-to-t from-indigo-950 to-black transition-opacity duration-1000"
      :style="{ opacity: nightOpacity }"
    ></div>

    <!-- Sunset Sky (Changing Layer) -->
    <div
      class="absolute inset-0 bg-linear-to-b from-orange-500 via-rose-400 to-amber-200 transition-opacity duration-1000"
      :style="{ opacity: sunsetOpacity }"
    ></div>

    <div>
      <!-- Sun -->
      <div
        class="absolute left-1/2 -translate-x-1/2 rounded-full bg-yellow-50 blur-[1px] shadow-[0_0_60px_20px_rgba(255,252,231,0.5)] transition-all duration-300"
        :style="{
          top: sunY + '%',
          width: sunSize + 'px',
          height: sunSize + 'px',
        }"
      ></div>

      <!-- The Crescent -->
      <div
        class="absolute left-1/2 transition-all duration-300"
        :style="{
          top: moonY + '%',
          opacity: moonOpacity,
          transform: `translateX(-90px) scale(${moonScale}) rotate(65deg)`,
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
      class="absolute top-5 left-1/2 -translate-x-1/2 z-20 w-80 bg-black/40 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-2xl"
    >
      <div
        class="flex justify-between text-white/40 text-[10px] mb-4 font-bold tracking-widest uppercase"
      >
        <span>Night</span>
        <span>Day</span>
      </div>

      <input
        v-model.number="solarProgress"
        type="range"
        min="-7"
        max="5"
        step="0.1"
        class="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-white"
      />

      <!-- Update the text display -->
      <div class="mt-6 flex flex-col items-center">
        <span class="text-[10px] text-white/40 font-bold tracking-widest uppercase"
          >Solar Altitude</span
        >
        <span class="text-white font-light text-4xl tracking-tighter tabular-nums">
          {{ solarProgress.toFixed(1) }}°
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
