<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const windowRatio = ref(1)

const updateRatio = () => {
  windowRatio.value = window.innerWidth / window.innerHeight
}

onMounted(() => {
  updateRatio()
  window.addEventListener('resize', updateRatio)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateRatio)
})

// --- CONFIGURATION ---
const isCollapsed = ref(true)
const showGuidingAids = ref(false)
const zoom = ref(1) // 1 = Default, 4 = Zoomed out

const CONFIG = {
  HORIZON_Y: 80, // Percent from top
  MOON_RATIO: 1.0,
}

const timeOffset = ref(20) // Minutes relative to sunset (Positive = After, Negative = Before)
const solarProgress = computed(() => -(timeOffset.value / 4))

const SUNMOON_GAP = ref(7)
const LUNAR_INCLINATION = ref(0.5)
const celestialTilt = ref(90)

const visualScale = computed(() => 20 / zoom.value) // 1 degree = 20 units (vh/%)
const sunSize = computed(() => 50 / zoom.value) // px
const moonSize = computed(() => sunSize.value * CONFIG.MOON_RATIO)

const toRad = (deg) => deg * (Math.PI / 180)

// --- NEW POSITIONING LOGIC ---
const getPosition = (altitude, inclinationOffset = 0) => {
  const centerX = 50 // %
  const centerY = CONFIG.HORIZON_Y // %

  // 1. Convert our tilt to Radians
  // We subtract 90 because we want 90° to be vertical (up/down)
  const tiltRad = toRad(celestialTilt.value - 90)

  // 2. The "Local" coordinates (relative to the sun's path)
  // localX is the sideways distance (inclination)
  // localY is the altitude distance
  const localX = inclinationOffset * visualScale.value
  const localY = -altitude * visualScale.value

  // 3. Apply Rotation Matrix to the coordinates
  // This swings the localX and localY based on the tilt
  const rotatedX = localX * Math.cos(tiltRad) - localY * Math.sin(tiltRad)
  const rotatedY = localX * Math.sin(tiltRad) + localY * Math.cos(tiltRad)

  return {
    left: `calc(${centerX}% + ${rotatedX}vh)`,
    top: `${centerY + rotatedY}%`,
  }
}

// IMPORTANT: We must calculate the Moon relative to the Sun's progress
const moonPos = computed(() => {
  // Use the solarProgress as the base, and add the gap
  // This ensures they stay locked to the same tilted "track"
  return getPosition(solarProgress.value + SUNMOON_GAP.value, LUNAR_INCLINATION.value)
})

const sunPos = computed(() => {
  // Sun has 0 inclination offset relative to its own path
  return getPosition(solarProgress.value, 0)
})

const moonRotation = computed(() => {
  // 1. Get the screen positions as raw numbers
  // We need to strip the 'vh', '%' and 'calc' to get clean coordinates
  // A simpler way is to re-run the logic or use the raw rotated values:

  const tiltRad = toRad(celestialTilt.value - 90)

  // Sun local position
  const sX = 0
  const sY = -solarProgress.value * visualScale.value
  const sunRotX = sX * Math.cos(tiltRad) - sY * Math.sin(tiltRad)
  const sunRotY = sX * Math.sin(tiltRad) + sY * Math.cos(tiltRad)

  // Moon local position
  const mX = LUNAR_INCLINATION.value * visualScale.value
  const mY = -(solarProgress.value + SUNMOON_GAP.value) * visualScale.value
  const moonRotX = mX * Math.cos(tiltRad) - mY * Math.sin(tiltRad)
  const moonRotY = mX * Math.sin(tiltRad) + mY * Math.cos(tiltRad)

  // 2. Calculate the delta between them
  const deltaX = sunRotX - moonRotX
  const deltaY = sunRotY - moonRotY

  // 3. Calculate the angle (atan2 is perfect for this)
  const angleRad = Math.atan2(deltaY, deltaX)
  const angleDeg = angleRad * (180 / Math.PI)

  return angleDeg
})

const lunarAltitude = computed(() => solarProgress.value + SUNMOON_GAP.value)

const altitudeAtSunset = computed(() => {
  // When solarProgress is 0, the moon's position along the path is just the GAP.
  // To get the vertical altitude relative to the horizon at that moment:
  const tiltRad = toRad(celestialTilt.value)

  // vertical_component = path_distance * sin(tilt)
  return SUNMOON_GAP.value * Math.sin(tiltRad)
})

const elongation = computed(() => {
  return Math.sqrt(Math.pow(SUNMOON_GAP.value, 2) + Math.pow(LUNAR_INCLINATION.value, 2))
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
  // 1. Check if the sun is low enough (-3°) and elongation is sufficient (6.2°)
  if (solarProgress.value > -3 || elongation.value < 6.2) {
    return 0
  }

  // 2. If conditions are met, calculate a fade-in effect
  const multiplier = 0.1 / zoom.value
  const darknessFactor = Math.abs(solarProgress.value + 3) * multiplier

  // We cap the opacity at 0.9 for a softer look
  return Math.min(darknessFactor, 1)
})

// Add this computed property to calculate "Sighting Difficulty"
const moonFilter = computed(() => {
  // If moon is near horizon (e.g., altitude < 5°) and Syafaq is active
  const proximityToHorizon = Math.max(0, 5 - lunarAltitude.value)
  const blurMultiplier = 1.6 / (zoom.value * 1.2)
  const blurAmount = proximityToHorizon * syafaqOpacity.value * blurMultiplier
  const contrastAmount = 100 - proximityToHorizon * syafaqOpacity.value * 10

  return `blur(${blurAmount}px) contrast(${contrastAmount}%)`
})

// Determine if the Moon is currently outside the visible screen
const moonOffScreen = computed(() => {
  const x = parseFloat(moonPos.value.left) // This is a bit dirty because of 'calc'
  // Better: Re-calculate raw X/Y for the moon to check boundaries
  const tiltRad = toRad(celestialTilt.value - 90)
  const localX = LUNAR_INCLINATION.value * visualScale.value
  const localY = -(solarProgress.value + SUNMOON_GAP.value) * visualScale.value

  const rotatedX = localX * Math.cos(tiltRad) - localY * Math.sin(tiltRad)
  const rotatedY = localX * Math.sin(tiltRad) + localY * Math.cos(tiltRad)

  const screenX = 50 + rotatedX * (100 / 100) // Approximation of %
  const screenY = CONFIG.HORIZON_Y + rotatedY

  return screenY < 0 || screenX < 0 || screenX > 100
})

const moonBounds = computed(() => {
  const tiltRad = toRad(celestialTilt.value - 90)
  const localX = LUNAR_INCLINATION.value * visualScale.value
  const localY = -(solarProgress.value + SUNMOON_GAP.value) * visualScale.value

  const rotatedX = localX * Math.cos(tiltRad) - localY * Math.sin(tiltRad)
  const rotatedY = localX * Math.sin(tiltRad) + localY * Math.cos(tiltRad)

  // 1. Convert rotatedX (which is in vh) to a horizontal percentage
  // Since 100vh = (100 / windowRatio) vw
  // The center is 50%. The offset in %-width is:
  const horizontalOffsetPct = rotatedX / windowRatio.value
  const currentXPos = 50 + horizontalOffsetPct

  // 2. Vertical position is already in % (relative to horizon)
  const currentYPos = CONFIG.HORIZON_Y + rotatedY

  const groundTop = CONFIG.HORIZON_Y

  return {
    isTooTop: currentYPos < 0,
    isTooBottom: currentYPos > groundTop,
    isTooLeft: currentXPos < 0,
    isTooRight: currentXPos > 100,
    y: currentYPos,
    x: currentXPos,
    groundTop: groundTop,
  }
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
        opacity: syafaqOpacity * 0.6,
        background: `radial-gradient(
      circle at 50% ${CONFIG.HORIZON_Y + 3}%, 
      rgba(255, 160, 60, 0.6) 0%, 
      rgba(255, 80, 0, 0.2) ${40 / zoom}%, 
      transparent ${70 / zoom}%
    )`,
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
          width: sunSize + 'px',
          height: sunSize + 'px',
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
          transform: `translate(-50%, -50%) rotate(${moonRotation}deg)`, // Removed scale
          width: moonSize + 'px',
          height: moonSize + 'px',
        }"
      >
        <div class="relative w-full h-full">
          <!-- Changed from fixed w-20 h-20 -->
          <svg viewBox="0 0 80 80" class="fill-white/90 w-full h-full">
            <path d="M 40,0 A 40,40 0 1,1 40,80 A 32,37 0 1,0 40,0 Z" />
          </svg>
        </div>
      </div>
      <!-- Tracking Box on Moon -->
      <div
        v-if="showGuidingAids"
        class="absolute border-2 border-amber-400/50 pointer-events-none transition-all duration-300"
        :style="{
          left: moonPos.left,
          top: moonPos.top,
          width: moonSize + 20 + 'px',
          height: moonSize + 20 + 'px',
          transform: 'translate(-50%, -50%)',
          opacity: moonOffScreen ? 0 : 1,
        }"
      >
        <div class="absolute -top-5 left-0 text-[10px] text-amber-400 font-mono font-bold">
          HILAL
        </div>
      </div>

      <!-- Top Indicator -->
      <div
        v-if="showGuidingAids && moonBounds.isTooTop && lunarAltitude > 0"
        class="absolute top-2 -translate-x-1/2 flex flex-col items-center animate-pulse z-50"
        :style="{ left: Math.max(5, Math.min(95, moonBounds.x)) + '%' }"
      >
        <div
          class="w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-b-12 border-b-amber-400"
        ></div>
      </div>

      <!-- Bottom Indicator (Stops at Horizon/Ground) -->
      <div
        v-if="showGuidingAids && moonBounds.isTooBottom"
        class="absolute flex flex-col items-center animate-pulse z-50 -translate-x-1/2"
        :style="{
          left: Math.max(5, Math.min(95, moonBounds.x)) + '%',
          top: `calc(${CONFIG.HORIZON_Y}% - 20px)`,
        }"
      >
        <div
          class="w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-12 border-t-amber-400"
        ></div>
      </div>

      <!-- 3. Left Indicator (Tracks Y - Capped above horizon) -->
      <div
        v-if="showGuidingAids && moonBounds.isTooLeft"
        class="absolute left-4 -translate-y-1/2 flex items-center animate-pulse z-50"
        :style="{
          /* Min 5% from top, Max (Horizon - 4%) to avoid the bottom indicator */
          top: Math.max(5, Math.min(CONFIG.HORIZON_Y - 5, moonBounds.y)) + '%',
        }"
      >
        <div
          class="w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-12 border-r-amber-400"
        ></div>
      </div>

      <!-- 4. Right Indicator (Tracks Y - Capped above horizon) -->
      <div
        v-if="showGuidingAids && moonBounds.isTooRight"
        class="absolute right-4 -translate-y-1/2 flex items-center animate-pulse z-50"
        :style="{
          /* Min 5% from top, Max (Horizon - 4%) to avoid the bottom indicator */
          top: Math.max(5, Math.min(CONFIG.HORIZON_Y - 5, moonBounds.y)) + '%',
        }"
      >
        <div
          class="w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-l-12 border-l-amber-400"
        ></div>
      </div>
    </div>

    <!-- Ground -->
    <div
      class="absolute bottom-0 w-full z-10 border-t border-white/5 bg-neutral-900"
      :style="{
        top: CONFIG.HORIZON_Y + '%',
        filter: groundBrightness,
      }"
    ></div>

    <!-- Collapsible Control Panel -->
    <div
      class="absolute top-3 left-1/2 -translate-x-1/2 z-20 w-72 bg-black/70 backdrop-blur-2xl p-4 rounded-2xl border border-white/10 shadow-2xl transition-all duration-300 ease-in-out"
    >
      <!-- Header / Toggle -->
      <div class="flex justify-between items-center -mt-2 mb-3">
        <span class="text-[10px] text-white/60 font-black tracking-[0.2em] uppercase"
          >Sim Controls</span
        >
        <button
          @click="isCollapsed = !isCollapsed"
          class="text-white/40 hover:text-white transition-colors p-1"
        >
          <svg
            v-if="isCollapsed"
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
          <svg
            v-else
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="m18 15-6-6-6 6" />
          </svg>
        </button>
      </div>

      <!-- Always Visible: Solar Altitude -->
      <div class="flex flex-col gap-3">
        <div class="flex justify-between items-end">
          <span class="text-xs text-white/80 font-medium">
            {{ timeOffset <= 0 ? 'Before Sunset' : 'After Sunset' }}
          </span>
          <span class="text-white font-mono text-sm leading-none">
            {{ timeOffset === 0 ? 'Sunset' : Math.abs(timeOffset) + 'm' }}
          </span>
        </div>
        <input
          v-model.number="timeOffset"
          type="range"
          min="-20"
          max="60"
          step="1"
          class="custom-slider"
        />
      </div>

      <!-- Collapsible Section -->
      <div
        v-if="!isCollapsed"
        class="flex flex-col gap-4 mt-4 pt-4 border-t border-white/10 overflow-hidden"
      >
        <div class="flex flex-col gap-2">
          <div class="flex justify-between items-center">
            <span class="text-[9px] text-white/40 font-bold uppercase tracking-widest"
              >Sun-Moon Gap</span
            >
            <span class="text-white font-mono text-xs">{{ SUNMOON_GAP.toFixed(1) }}°</span>
          </div>
          <input
            v-model.number="SUNMOON_GAP"
            type="range"
            min="0"
            max="12"
            step="0.1"
            class="custom-slider"
          />
        </div>

        <div class="flex flex-col gap-2">
          <div class="flex justify-between items-center">
            <span class="text-[9px] text-white/40 font-bold uppercase tracking-widest"
              >Lunar Inclination</span
            >
            <span class="text-white font-mono text-xs">{{ LUNAR_INCLINATION.toFixed(1) }}°</span>
          </div>
          <input
            v-model.number="LUNAR_INCLINATION"
            type="range"
            min="-5.2"
            max="5.2"
            step="0.1"
            class="custom-slider"
          />
        </div>

        <div class="flex flex-col gap-2">
          <div class="flex justify-between items-center">
            <span class="text-[9px] text-white/40 font-bold uppercase tracking-widest"
              >Ecliptic Tilt</span
            >
            <span class="text-white font-mono text-xs">{{ celestialTilt }}°</span>
          </div>
          <input
            v-model.number="celestialTilt"
            type="range"
            min="15"
            max="165"
            step="1"
            class="custom-slider"
          />
        </div>

        <div class="flex flex-col gap-2 pt-2 border-t border-white/15">
          <div class="flex justify-between items-center">
            <span class="text-[9px] text-white/40 font-bold uppercase tracking-widest"
              >Zoom Level</span
            >
            <span class="text-white font-mono text-xs">{{ (1 / zoom).toFixed(2) }}x</span>
          </div>
          <input
            v-model.number="zoom"
            type="range"
            min="1"
            max="4"
            step="0.1"
            class="custom-slider"
          />
        </div>

        <div class="flex items-center justify-between">
          <span class="text-[9px] text-white/40 font-bold uppercase tracking-widest"
            >Guiding Aids</span
          >
          <button
            @click="showGuidingAids = !showGuidingAids"
            :class="showGuidingAids ? 'bg-amber-500' : 'bg-white/10'"
            class="w-8 h-4 rounded-full relative transition-colors duration-200"
          >
            <div
              :class="showGuidingAids ? 'translate-x-4' : 'translate-x-0'"
              class="absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform"
            ></div>
          </button>
        </div>
      </div>
    </div>

    <!-- Bottom Stats -->
    <div
      class="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex gap-8 px-8 py-4 bg-black/30 backdrop-blur-md rounded-2xl border border-white/5 shadow-2xl"
    >
      <div class="flex flex-col items-center">
        <span
          class="text-[9px] text-white/30 font-bold tracking-[0.2em] uppercase mb-1 whitespace-nowrap"
        >
          Alt. at Sunset (0°)
        </span>
        <div class="flex items-baseline gap-1">
          <span class="text-white font-medium text-2xl tabular-nums">
            {{ altitudeAtSunset.toFixed(1) }}°
          </span>
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
input[type='range']::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  background: white;
  border-radius: 50%;
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
}
</style>
