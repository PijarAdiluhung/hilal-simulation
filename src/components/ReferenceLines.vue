<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'

const props = defineProps({
  sunPos: Object,      // Expected: { left: string/px, top: string/px, rawX: number, rawY: number }
  moonPos: Object,     // Expected: { left: string/px, top: string/px, rawX: number, rawY: number }
  horizonY: Number,    // Percentage (e.g., 50)
  tilt: Number,        // Degrees
  zoom: Number,
  visualScale: Number,
  longOffset: Number,
  latOffset: Number,
  elongation: Number,
})

// Track window dimensions responsively for coordinate conversions
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1920)
const windowHeight = ref(typeof window !== 'undefined' ? window.innerHeight : 1080)

const updateDimensions = () => {
  windowWidth.value = window.innerWidth
  windowHeight.value = window.innerHeight
}

onMounted(() => {
  window.addEventListener('resize', updateDimensions)
})
onUnmounted(() => {
  window.removeEventListener('resize', updateDimensions)
})

const toRad = (deg) => deg * (Math.PI / 180)

// Helper to convert your relative vh/horizon units into absolute pixels
// This bypasses the need for iOS to evaluate complex CSS calc() strings
const getAbsolutePx = (rawX, rawY) => {
  const vh = windowHeight.value / 100
  const centerX = windowWidth.value / 2
  const centerY = (props.horizonY / 100) * windowHeight.value

  return {
    x: centerX + rawX * vh,
    y: centerY + rawY * vh,
  }
}

// 1. Absolute pixel coordinates for the celestial bodies
const sunCoords = computed(() => getAbsolutePx(props.sunPos.rawX, props.sunPos.rawY))
const moonCoords = computed(() => getAbsolutePx(props.moonPos.rawX, props.moonPos.rawY))

// 2. Calculate the Ecliptic Line
const eclipticLine = computed(() => {
  const angle = toRad(props.tilt)
  // Large enough to span the screen in pixels
  const length = Math.max(windowWidth.value, windowHeight.value) * 1.5 

  return {
    x1: sunCoords.value.x - Math.cos(angle) * length,
    y1: sunCoords.value.y - Math.sin(angle) * length,
    x2: sunCoords.value.x + Math.cos(angle) * length,
    y2: sunCoords.value.y + Math.sin(angle) * length,
  }
})

// 3. Vector Projection (The "Ghost" point on the ecliptic)
const projectedRaw = computed(() => {
  if (!props.moonPos) return { x: 0, y: 0 }
  // Notice the shift back to props.tilt instead of tilt-90 depending on your coordinate intent. 
  // Adjusted to point along the ecliptic axis
  const angle = toRad(props.tilt)
  
  const dx = props.moonPos.rawX - props.sunPos.rawX
  const dy = props.moonPos.rawY - props.sunPos.rawY

  // Dot product of (Moon-Sun) vector against Ecliptic direction vector
  const dotProduct = dx * Math.cos(angle) + dy * Math.sin(angle)
  
  return {
    x: props.sunPos.rawX + Math.cos(angle) * dotProduct,
    y: props.sunPos.rawY + Math.sin(angle) * dotProduct,
  }
})

// Convert projected point to absolute pixels
const projectedCoords = computed(() => getAbsolutePx(projectedRaw.value.x, projectedRaw.value.y))

// 4. Midpoints for Labels calculated purely in pixels
const labels = computed(() => {
  return {
    // Distance along ecliptic line (Sun to ProjectPoint)
    long: {
      x: (sunCoords.value.x + projectedCoords.value.x) / 2,
      y: (sunCoords.value.y + projectedCoords.value.y) / 2,
    },
    // Distance perpendicular to ecliptic line (ProjectPoint to Moon)
    lat: {
      x: (projectedCoords.value.x + moonCoords.value.x) / 2,
      y: (projectedCoords.value.y + moonCoords.value.y) / 2,
    },
    // Direct line (Sun to Moon)
    elong: {
      x: (sunCoords.value.x + moonCoords.value.x) / 2,
      y: (sunCoords.value.y + moonCoords.value.y) / 2,
    },
  }
})
</script>

<template>
  <svg class="absolute inset-0 w-full h-full pointer-events-none z-0">
    <line
      :x1="eclipticLine.x1"
      :y1="eclipticLine.y1"
      :x2="eclipticLine.x2"
      :y2="eclipticLine.y2"
      stroke="rgba(255, 255, 255, 0.15)"
      stroke-width="1"
      stroke-dasharray="8 4"
    />

    <line
      :x1="sunCoords.x"
      :y1="sunCoords.y"
      :x2="projectedCoords.x"
      :y2="projectedCoords.y"
      stroke="rgba(255, 255, 255, 0.3)"
      stroke-width="1"
    />

    <line
      :x1="projectedCoords.x"
      :y1="projectedCoords.y"
      :x2="moonCoords.x"
      :y2="moonCoords.y"
      stroke="rgba(56, 189, 248, 0.5)"
      stroke-width="1.5"
      stroke-dasharray="2 2"
    />

    <line
      :x1="sunCoords.x"
      :y1="sunCoords.y"
      :x2="moonCoords.x"
      :y2="moonCoords.y"
      stroke="rgba(251, 191, 36, 0.4)"
      stroke-width="2"
    />

    <g v-if="props.sunPos && props.moonPos" class="fill-white text-[12px] font-bold select-none">
      <text
        class="fill-white/80"
        :x="labels.long.x"
        :y="labels.long.y"
        dy="-10"
        text-anchor="middle"
      >
        λ {{ props.longOffset?.toFixed(1) }}°
      </text>

      <text
        class="fill-sky-400"
        :x="labels.lat.x"
        :y="labels.lat.y"
        dx="10"
        dy="-10"
      >
        β {{ props.latOffset?.toFixed(1) }}°
      </text>

      <text
        class="fill-amber-400"
        :x="labels.elong.x"
        :y="labels.elong.y"
        dx="-10"
        dy="-10"
        text-anchor="end"
      >
        {{ props.elongation?.toFixed(1) }}°
      </text>
    </g>
  </svg>
</template>