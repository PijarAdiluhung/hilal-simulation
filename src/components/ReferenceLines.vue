<script setup>
import { computed } from 'vue'

const props = defineProps({
  sunPos: Object,
  moonPos: Object,
  horizonY: Number,
  tilt: Number,
  zoom: Number,
  visualScale: Number,
  longOffset: Number,
  latOffset: Number,
  elongation: Number,
})

const toRad = (deg) => deg * (Math.PI / 180)

// Define a static virtual grid for our SVG workspace (e.g., 1000x1000 units)
const SVG_SIZE = 1000
const CENTER = SVG_SIZE / 2

// Helper to convert your raw relative coordinates to our virtual grid units
const getVirtualCoords = (rawX, rawY) => {
  // Your raw coordinates are already relative to a center point multiplied by vh.
  // We mirror that logic safely inside our virtual grid.
  return {
    x: CENTER + (rawX * 10), // Scale factor matching your layout density
    y: (props.horizonY / 100) * SVG_SIZE + (rawY * 10)
  }
}

const sunV = computed(() => props.sunPos ? getVirtualCoords(props.sunPos.rawX, props.sunPos.rawY) : { x: CENTER, y: CENTER })
const moonV = computed(() => props.moonPos ? getVirtualCoords(props.moonPos.rawX, props.moonPos.rawY) : { x: CENTER, y: CENTER })

// 1. Calculate Ecliptic Line on the virtual grid
const eclipticLine = computed(() => {
  const angle = toRad(props.tilt)
  const length = SVG_SIZE * 2 // Long enough to span our grid boundary

  return {
    x1: sunV.value.x - Math.cos(angle) * length,
    y1: sunV.value.y - Math.sin(angle) * length,
    x2: sunV.value.x + Math.cos(angle) * length,
    y2: sunV.value.y + Math.sin(angle) * length,
  }
})

// 2. Projected Point on the virtual grid
const projectedPoint = computed(() => {
  const angle = toRad(props.tilt - 90)
  const dx = props.moonPos.rawX - props.sunPos.rawX
  const dy = props.moonPos.rawY - props.sunPos.rawY
  const mag = dx * Math.cos(angle) + dy * Math.sin(angle)

  const projRawX = props.sunPos.rawX + Math.cos(angle) * mag
  const projRawY = props.sunPos.rawY + Math.sin(angle) * mag

  return getVirtualCoords(projRawX, projRawY)
})

// 3. Simple midpoints for text placement on the virtual grid
const midpoints = computed(() => ({
  long: {
    x: (projectedPoint.value.x + moonV.value.x) / 2,
    y: (projectedPoint.value.y + moonV.value.y) / 2,
  },
  lat: {
    x: (sunV.value.x + projectedPoint.value.x) / 2,
    y: (sunV.value.y + projectedPoint.value.y) / 2,
  },
  elong: {
    x: (sunV.value.x + moonV.value.x) / 2,
    y: (sunV.value.y + moonV.value.y) / 2,
  }
}))
</script>

<template>
  <svg 
    :viewBox="`0 0 ${SVG_SIZE} ${SVG_SIZE}`"
    preserveAspectRatio="xMidYMid slice"
    class="absolute inset-0 w-full h-full pointer-events-none z-0"
  >
    <g v-if="props.sunPos && props.moonPos">
      
      <line
        :x1="eclipticLine.x1"
        :y1="eclipticLine.y1"
        :x2="eclipticLine.x2"
        :y2="eclipticLine.y2"
        stroke="rgba(255, 255, 255, 0.15)"
        stroke-width="2"
        stroke-dasharray="16 8"
      />

      <line
        :x1="sunV.x"
        :y1="sunV.y"
        :x2="projectedPoint.x"
        :y2="projectedPoint.y"
        stroke="rgba(255, 255, 255, 0.3)"
        stroke-width="2"
      />

      <line
        :x1="projectedPoint.x"
        :y1="projectedPoint.y"
        :x2="moonV.x"
        :y2="moonV.y"
        stroke="rgba(56, 189, 248, 0.5)"
        stroke-width="3"
        stroke-dasharray="4 4"
      />

      <line
        :x1="sunV.x"
        :y1="sunV.y"
        :x2="moonV.x"
        :y2="moonV.y"
        stroke="rgba(251, 191, 36, 0.4)"
        stroke-width="4"
      />

      <g class="fill-white text-[24px] font-bold select-none">
        
        <text
          class="fill-sky-400"
          :x="midpoints.long.x"
          :y="midpoints.long.y"
          dx="20"
          dy="-20"
        >
          λ {{ props.longOffset?.toFixed(1) }}°
        </text>

        <text
          class="fill-white/80"
          :x="midpoints.lat.x"
          :y="midpoints.lat.y"
          dy="-20"
          text-anchor="middle"
        >
          β {{ props.latOffset?.toFixed(1) }}°
        </text>

        <text
          class="fill-amber-400"
          :x="midpoints.elong.x"
          :y="midpoints.elong.y"
          dx="-20"
          dy="-20"
          text-anchor="end"
        >
          {{ props.elongation?.toFixed(1) }}°
        </text>
      </g>
      
    </g>
  </svg>
</template>
