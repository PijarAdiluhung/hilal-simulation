<script setup>
import { ref, computed } from 'vue'

// --- CONFIGURATION ---
const CONFIG = {
  HORIZON_Y: 72, // Percent from top
  VISUAL_SCALE: 20, // 1 degree = 20 units (vh/%)
  SUN_SIZE: 50, // px
  MOON_SCALE: 0.8,
}

const solarProgress = ref(5)
const SUNMOON_GAP = ref(5)
const AZIMUTH_GAP = ref(4)
const moonRotation = computed(() => {
  // We calculate the angle between the moon and the sun
  const angleRad = Math.atan2(SUNMOON_GAP.value, AZIMUTH_GAP.value)

  // Convert radians to degrees
  const angleDeg = angleRad * (180 / Math.PI)

  return angleDeg
})

// --- POSITIONING LOGIC ---
// Now vertical (%) and horizontal (vh) use the same CONFIG.VISUAL_SCALE
const getVerticalPos = (altitude) => CONFIG.HORIZON_Y - altitude * CONFIG.VISUAL_SCALE

const sunY = computed(() => getVerticalPos(solarProgress.value))
const moonY = computed(() => getVerticalPos(solarProgress.value + SUNMOON_GAP.value))
const lunarAltitude = computed(() => solarProgress.value + SUNMOON_GAP.value)

const elongation = computed(() => {
  return Math.sqrt(Math.pow(SUNMOON_GAP.value, 2) + Math.pow(AZIMUTH_GAP.value, 2))
})

// --- SKY STATES ---
const SUNSET_TIMING = {
  riseStart: 5,
  peakStart: 2,
  peakEnd: -2,
  fadeEnd: -7,
}

const dayOpacity = computed(() => {
  if (solarProgress.value > 0.5) return 1
  return Math.max(0, (solarProgress.value + 0.25) / 0.75)
})

const sunsetOpacity = computed(() => {
  const p = solarProgress.value
  const { riseStart, peakStart, peakEnd, fadeEnd } = SUNSET_TIMING

  // 1. Outside the range
  if (p >= riseStart || p <= fadeEnd) return 0

  // 2. The Peak Plateau (Full Opacity)
  if (p <= peakStart && p >= peakEnd) return 1

  // 3. The Fade-In Ramp (Descending from 5 to 2)
  if (p < riseStart && p > peakStart) {
    return (riseStart - p) / (riseStart - peakStart)
  }

  // 4. The Fade-Out Ramp (Descending from -2 to -7)
  if (p < peakEnd && p > fadeEnd) {
    return (p - fadeEnd) / (peakEnd - fadeEnd)
  }

  return 0
})

const nightOpacity = computed(() => {
  if (solarProgress.value < -0.25) return 1
  if (solarProgress.value < 0.5) return 1 - (solarProgress.value + 0.25) / 0.75
  return 0
})

const syafaqOpacity = computed(() => {
  const p = solarProgress.value;
  
  // Syafaq appears as the sun dips below the horizon
  if (p > 0.5 || p < -12) return 0;
  
  let intensity = 0;
  
  // Fade in as sun sets (0 to -3)
  if (p <= 0.5 && p > -3) {
    intensity = (0.5 - p) / 3.5;
  } 
  // Peak intensity plateau (-3 to -7)
  else if (p <= -3 && p >= -7) {
    intensity = 1;
  }
  // Fade out into deep night (-7 to -12)
  else if (p < -7 && p >= -12) {
    intensity = (12 + p) / 5;
  }

  // Cap at 0.5 for a realistic, subtle haze
  return intensity * 0.5;
});

const moonOpacity = computed(() => {
  // 1. Check if the sun is low enough (-3°) and elongation is sufficient (6.4°)
  if (solarProgress.value > -3 || elongation.value < 6.4) {
    return 0
  }

  // 2. If conditions are met, calculate a fade-in effect
  const darknessFactor = Math.abs(solarProgress.value + 3) * 0.1

  // We cap the opacity at 1 (or 0.9 for a softer look)
  return Math.min(darknessFactor, 0.7)
})

// Add this computed property to calculate "Sighting Difficulty"
const moonFilter = computed(() => {
  // If moon is near horizon (e.g., altitude < 5°) and Syafaq is active
  const proximityToHorizon = Math.max(0, 5 - lunarAltitude.value);
  const blurAmount = proximityToHorizon * syafaqOpacity.value * 0.5;
  const contrastAmount = 100 - (proximityToHorizon * syafaqOpacity.value * 10);
  
  return `blur(${blurAmount}px) contrast(${contrastAmount}%)`;
});

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

    <!-- Syafaq (Atmospheric Glare Layer) -->
    <div
      class="absolute inset-0 z-[5] transition-opacity duration-700 pointer-events-none"
      :style="{
        opacity: syafaqOpacity,
        background: `radial-gradient(circle at 50% ${CONFIG.HORIZON_Y}%, rgba(255, 160, 60, 0.6) 0%, rgba(255, 80, 0, 0.2) 40%, transparent 60%)`,
      }"
    ></div>

    <!-- Celestial Bodies -->
    <div class="absolute inset-0 z-10">
      <!-- Sun -->
      <div
        class="absolute left-1/2 -translate-x-1/2 rounded-full bg-yellow-50 blur-[1px] shadow-[0_0_60px_20px_rgba(255,252,231,0.5)] transition-all duration-300"
        :style="{
          top: sunY + '%',
          width: CONFIG.SUN_SIZE + 'px',
          height: CONFIG.SUN_SIZE + 'px',
        }"
      ></div>

      <!-- Moon -->
      <div
        class="absolute left-1/2 transition-all duration-300"
        :style="{
          top: moonY + '%',
          opacity: moonOpacity,
          filter: moonFilter,
          transform: `translateX(calc(-50% + ${AZIMUTH_GAP * -CONFIG.VISUAL_SCALE}vh)) 
                scale(${CONFIG.MOON_SCALE}) 
                rotate(${moonRotation}deg)`,
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
      class="absolute top-5 left-1/2 -translate-x-1/2 z-20 w-60 bg-black/40 backdrop-blur-xl p-3 rounded-xl border border-white/10 shadow-2xl"
    >
      <div
        class="flex justify-between text-white/40 text-[10px] mb-2 font-bold tracking-widest uppercase"
      >
        <span>Night</span>
        <span>Day</span>
      </div>

      <input
        v-model.number="solarProgress"
        type="range"
        min="-10"
        max="5"
        step="0.1"
        class="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-white"
      />

      <!-- Update the text display -->
      <div class="mt-4 flex flex-col items-center">
        <span class="text-[10px] text-white/40 font-bold tracking-widest uppercase"
          >Solar Altitude</span
        >
        <span class="text-white font-light text-4xl tracking-tighter tabular-nums">
          {{ solarProgress.toFixed(1) }}°
        </span>
      </div>
    </div>

    <!-- Bottom Stats -->
    <div
      class="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex gap-8 px-8 py-4 bg-black/30 backdrop-blur-md rounded-2xl border border-white/5 shadow-2xl"
    >
      <div class="flex flex-col items-center">
        <span
          class="text-[9px] text-white/30 font-bold tracking-[0.2em] uppercase mb-1 whitespace-nowrap"
          >Lunar Altitude</span
        >
        <div class="flex items-baseline gap-1">
          <span class="text-white font-medium text-2xl tabular-nums"
            >{{ lunarAltitude.toFixed(1) }}°</span
          >
        </div>
      </div>

      <!-- Vertical Divider -->
      <div class="w-px h-10 bg-white/10 self-center"></div>

      <div class="flex flex-col items-center">
        <span class="text-[9px] text-white/30 font-bold tracking-[0.2em] uppercase mb-1"
          >Elongation</span
        >
        <div class="flex items-baseline gap-1">
          <span class="text-white font-medium text-2xl tabular-nums"
            >{{ elongation.toFixed(1) }}°</span
          >
        </div>
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
