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
const SUNMOON_GAP = ref(9)
const AZIMUTH_GAP = ref(0)
const celestialTilt = ref(90)

// Helper to convert degrees to radians
const toRad = (deg) => deg * (Math.PI / 180)

const moonRotation = computed(() => {
  // 1. Get the geometric angle between Sun and Moon based on your gaps
  const angleRad = Math.atan2(SUNMOON_GAP.value, AZIMUTH_GAP.value)
  const angleDeg = angleRad * (180 / Math.PI)

  // 2. Adjust for the celestial tilt. 
  // We subtract 90 because when tilt is 90 (vertical), 
  // the moon's "down" is the sun.
  const tiltAdjustment = celestialTilt.value - 90

  return angleDeg + tiltAdjustment
})

// --- NEW POSITIONING LOGIC ---
const getPosition = (altitude, azimuthOffset = 0) => {
  // 1. Center of rotation (The point on the horizon)
  const centerX = 50 // %
  const centerY = CONFIG.HORIZON_Y // %

  // 2. Adjust angle so 90° is vertical
  // In screen space, 0° is usually horizontal right.
  // We want 90° to be "straight up".
  const angleRad = toRad(celestialTilt.value - 90)

  // 3. Calculate raw offsets based on your scale
  const rawX = azimuthOffset * CONFIG.VISUAL_SCALE // vh units
  const rawY = -altitude * CONFIG.VISUAL_SCALE // % units (negative because up is smaller Y)

  // 4. Apply Rotation Matrix
  const rotatedX = rawX * Math.cos(angleRad) - rawY * Math.sin(angleRad)
  const rotatedY = rawX * Math.sin(angleRad) + rawY * Math.cos(angleRad)

  return {
    left: `calc(${centerX}% + ${rotatedX}vh)`,
    top: `${centerY + rotatedY}%`,
  }
}

const sunPos = computed(() => getPosition(solarProgress.value, 0))
const moonPos = computed(() => getPosition(lunarAltitude.value, AZIMUTH_GAP.value))

const lunarAltitude = computed(() => solarProgress.value + SUNMOON_GAP.value)

const elongation = computed(() => {
  return Math.sqrt(Math.pow(SUNMOON_GAP.value, 2) + Math.pow(AZIMUTH_GAP.value, 2))
})

// --- SKY STATES ---
const SUNSET_TIMING = {
  riseStart: 5,
  peakStart: 2,
  peakEnd: -2,
  fadeEnd: -9,
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
  const p = solarProgress.value

  // Syafaq appears as the sun dips below the horizon
  if (p > 0.5 || p < -15) return 0

  let intensity = 0

  // Fade in as sun sets (0 to -3)
  if (p <= 0.5 && p > -3) {
    intensity = (0.5 - p) / 3.5
  }
  // Peak intensity plateau (-3 to -7)
  else if (p <= -3 && p >= -7) {
    intensity = 1
  }
  // Fade out into deep night (-7 to -12)
  else if (p < -7 && p >= -15) {
    intensity = (15 + p) / 5
  }

  // Cap at 0.5 for a realistic, subtle haze
  return intensity * 0.5
})

const moonOpacity = computed(() => {
  // 1. Check if the sun is low enough (-3°) and elongation is sufficient (6.4°)
  if (solarProgress.value > -3 || elongation.value < 6.4) {
    return 0
  }

  // 2. If conditions are met, calculate a fade-in effect
  const darknessFactor = Math.abs(solarProgress.value + 3) * 0.04

  // We cap the opacity at 1 (or 0.9 for a softer look)
  return Math.min(darknessFactor, 0.7)
})

// Add this computed property to calculate "Sighting Difficulty"
const moonFilter = computed(() => {
  // If moon is near horizon (e.g., altitude < 5°) and Syafaq is active
  const proximityToHorizon = Math.max(0, 5 - lunarAltitude.value)
  const blurAmount = proximityToHorizon * syafaqOpacity.value * 1.4
  const contrastAmount = 100 - proximityToHorizon * syafaqOpacity.value * 10

  return `blur(${blurAmount}px) contrast(${contrastAmount}%)`
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

    <!-- Syafaq (Atmospheric Glare Layer) -->
    <div
      class="absolute inset-0 z-5 transition-opacity duration-700 pointer-events-none"
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
          left: sunPos.left,
          top: sunPos.top,
          width: CONFIG.SUN_SIZE + 'px',
          height: CONFIG.SUN_SIZE + 'px',
        }"
      ></div>

      <!-- Moon -->
      <div
        class="absolute left-1/2 transition-all duration-300"
        :style="{
          left: moonPos.left,
          top: moonPos.top,
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

    <!-- Control Panel -->
    <div
      class="absolute top-6 left-1/2 -translate-x-1/2 z-20 w-72 bg-black/60 backdrop-blur-2xl p-5 rounded-3xl border border-white/10 shadow-2xl flex flex-col gap-4"
    >
      <!-- Slider 1: Sun -->
      <div class="flex flex-col gap-2 -mt-1">
        <div class="flex justify-between items-center">
          <span class="text-[9px] text-white/40 font-bold tracking-widest uppercase"
            >Solar Altitude</span
          >
          <span class="text-white font-mono text-sm">{{ solarProgress.toFixed(1) }}°</span>
        </div>
        <input
          v-model.number="solarProgress"
          type="range"
          min="-12"
          max="10"
          step="0.1"
          class="custom-slider"
        />
      </div>

      <!-- Slider 2: Sun-Moon Gap -->
      <div class="flex flex-col gap-2">
        <div class="flex justify-between items-center">
          <span class="text-[9px] text-white/40 font-bold tracking-widest uppercase"
            >Sun-Moon Gap</span
          >
          <span class="text-white font-mono text-sm">{{ SUNMOON_GAP.toFixed(1) }}°</span>
        </div>
        <input
          v-model.number="SUNMOON_GAP"
          type="range"
          min="0"
          max="9"
          step="0.1"
          class="custom-slider"
        />
      </div>

      <!-- Slider 3: Azimuth -->
      <div class="flex flex-col gap-2">
        <div class="flex justify-between items-center">
          <span class="text-[9px] text-white/40 font-bold tracking-widest uppercase"
            >Azimuth Gap</span
          >
          <span class="text-white font-mono text-sm">{{ AZIMUTH_GAP.toFixed(1) }}°</span>
        </div>
        <input
          v-model.number="AZIMUTH_GAP"
          type="range"
          min="-5.2"
          max="5.2"
          step="0.1"
          class="custom-slider"
        />
      </div>

      <!-- Slider 4: Tilt -->
      <div class="flex flex-col gap-2">
        <div class="flex justify-between items-center">
          <span class="text-[9px] text-white/40 font-bold tracking-widest uppercase"
            >Ecliptic Tilt</span
          >
          <span class="text-white font-mono text-sm">{{ celestialTilt }}°</span>
        </div>
        <input
          v-model.number="celestialTilt"
          type="range"
          min="10"
          max="170"
          step="1"
          class="custom-slider"
        />
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
