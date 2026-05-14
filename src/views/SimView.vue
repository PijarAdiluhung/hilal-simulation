<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useCelestialMath } from '../composables/useCelestialMath'

// Components 
import SkyBackground from '../components/SkyBackground.vue'
import CelestialBody from '../components/CelestialBody.vue'
import GuidingAids from '../components/GuidingAids.vue'
import ReferenceLines from '../components/ReferenceLines.vue'
import ControlPanel from '../components/ControlPanel.vue'
import StatsOverlay from '../components/StatsOverlay.vue'

// Initialize our logic engine
const {
  timeOffset,
  longOffset,
  latOffset,
  celestialTilt,
  zoom,
  CONFIG,
  // Computed values from the math engine
  sunPos,
  moonPos,
  moonRotation,
  moonOpacity,
  moonFilter,
  solarProgress,
  moonBounds,
  lunarAltitude,
  altitudeAtSunset,
  elongation,
  groundBrightness,
  updateWindowRatio,
} = useCelestialMath()

const isCollapsed = ref(true)
const showGuidingAids = ref(false)
const showPlanes = ref(false)

// Handle window resizing for the coordinate system
onMounted(() => {
  window.addEventListener('resize', updateWindowRatio)
  updateWindowRatio()
})

onUnmounted(() => {
  window.removeEventListener('resize', updateWindowRatio)
})
</script>

<template>
  <div
    class="relative w-full h-screen overflow-hidden flex flex-col font-sans select-none bg-black"
  >
    <!-- 1. The Sky Layers (Atmosphere) -->
    <SkyBackground :progress="solarProgress" :zoom="zoom" :horizon-y="CONFIG.HORIZON_Y" />

    <!-- 2. The Celestial Layer -->
    <div class="absolute inset-0 z-10 pointer-events-none">
      <!-- Sun -->
      <CelestialBody type="sun" :pos="sunPos" :size="50 / zoom" />

      <!-- Moon -->
      <CelestialBody
        type="moon"
        :pos="moonPos"
        :size="50 / zoom"
        :rotation="moonRotation"
        :opacity="moonOpacity"
        :filter="moonFilter"
      />

      <!-- Directional Helpers -->
      <GuidingAids
        v-if="showGuidingAids"
        :moon-pos="moonPos"
        :moon-bounds="moonBounds"
        :lunar-altitude="lunarAltitude"
        :horizon-y="CONFIG.HORIZON_Y"
        :size="50 / zoom + 20"
      />

      <!-- Reference Lines -->
      <ReferenceLines
        v-if="showPlanes"
        :sun-pos="sunPos"
        :moon-pos="moonPos"
        :tilt="celestialTilt"
        :horizon-y="CONFIG.HORIZON_Y"
        :zoom="zoom"
      />
    </div>

    <!-- 3. The Ground -->
    <div
      class="absolute bottom-0 w-full z-10 border-t border-white/5 bg-neutral-900 transition-all duration-700"
      :style="{
        top: CONFIG.HORIZON_Y + '%',
        filter: groundBrightness,
      }"
    ></div>

    <!-- 4. UI Controls -->
    <ControlPanel
      v-model:is-collapsed="isCollapsed"
      v-model:time-offset="timeOffset"
      v-model:long="longOffset"
      v-model:lat="latOffset"
      v-model:tilt="celestialTilt"
      v-model:zoom="zoom"
      v-model:show-aids="showGuidingAids"
      v-model:show-planes="showPlanes"
    />

    <!-- 5. Bottom Data Readout -->
    <StatsOverlay :altitude="altitudeAtSunset" :elongation="elongation" />
  </div>
</template>

<style>
/* Global slider styles for the app */
.custom-slider {
  appearance: none;
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  outline: none;
}

.custom-slider::-webkit-slider-thumb {
  appearance: none;
  width: 14px;
  height: 14px;
  background: white;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.4);
  transition: transform 0.1s ease-in-out;
}

.custom-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}
</style>
