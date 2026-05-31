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

// 1. Calculate the Ecliptic Line using raw offsets
const eclipticLine = computed(() => {
  // Use the same tilt logic as getPosition: (tilt - 90)
  const angle = toRad(props.tilt)
  const length = 500 // Large enough to span screen

  return {
    // We start from the sun's position and move along the tilt angle
    x1: `calc(${props.sunPos.left} - ${Math.cos(angle) * length}vh)`,
    y1: `calc(${props.sunPos.top} - ${Math.sin(angle) * length}vh)`,
    x2: `calc(${props.sunPos.left} + ${Math.cos(angle) * length}vh)`,
    y2: `calc(${props.sunPos.top} + ${Math.sin(angle) * length}vh)`,
  }
})

// 2. The Projection (The "Ghost" point on the ecliptic)
const projectedPoint = computed(() => {
  const angle = toRad(props.tilt - 90)

  // Use rawX/rawY which are already unitless numbers relative to the center
  const dx = props.moonPos.rawX - props.sunPos.rawX
  const dy = props.moonPos.rawY - props.sunPos.rawY

  // Vector Projection: Dot product of (Moon-Sun) and (Ecliptic Unit Vector)
  const mag = dx * Math.cos(angle) + dy * Math.sin(angle)

  // Calculate the projected point relative to the Sun
  const projRawX = props.sunPos.rawX + Math.cos(angle) * mag
  const projRawY = props.sunPos.rawY + Math.sin(angle) * mag

  return {
    // Convert back to the UI coordinate system
    x: `calc(50% + ${projRawX}vh)`,
    y: `${props.horizonY + projRawY}%`,
  }
})

// A centralized utility that handles screen dimension and midpoint math
const getDimensions = () => {
  const vh = window.innerHeight / 100
  const centerX = window.innerWidth / 2
  const centerY = (props.horizonY / 100) * window.innerHeight
  return { vh, centerX, centerY }
}

// 1. Convert any Raw X/Y coordinate object to absolute screen Pixels
const getPixelCoords = (rawX, rawY) => {
  const { vh, centerX, centerY } = getDimensions()
  return {
    x: centerX + rawX * vh,
    y: centerY + rawY * vh,
  }
}

// 2. Compute the exact pixel spots for your Sun and Moon
const sunPixels = computed(() => {
  if (!props.sunPos) return { x: 0, y: 0 }
  return getPixelCoords(props.sunPos.rawX, props.sunPos.rawY)
})

const moonPixels = computed(() => {
  if (!props.moonPos) return { x: 0, y: 0 }
  return getPixelCoords(props.moonPos.rawX, props.moonPos.rawY)
})

// 3. Ecliptic Line Pixels
const eclipticLinePixels = computed(() => {
  const { vh } = getDimensions()
  const angle = toRad(props.tilt)
  const length = 500 // Spans safely past edge boundaries

  const sun = sunPixels.value

  return {
    x1: sun.x - Math.cos(angle) * length * vh,
    y1: sun.y - Math.sin(angle) * length * vh,
    x2: sun.x + Math.cos(angle) * length * vh,
    y2: sun.y + Math.sin(angle) * length * vh,
  }
})

// 4. Projected Point Pixels (The Ghost Point)
const projectedPointPixels = computed(() => {
  if (!props.sunPos || !props.moonPos) return { x: 0, y: 0 }

  const angle = toRad(props.tilt - 90)
  const dx = props.moonPos.rawX - props.sunPos.rawX
  const dy = props.moonPos.rawY - props.sunPos.rawY

  const mag = dx * Math.cos(angle) + dy * Math.sin(angle)

  const projRawX = props.sunPos.rawX + Math.cos(angle) * mag
  const projRawY = props.sunPos.rawY + Math.sin(angle) * mag

  return getPixelCoords(projRawX, projRawY)
})

const projectedRaw = computed(() => {
  if (!props.moonPos) return { x: 0, y: 0 }
  const angle = toRad(props.tilt - 90)
  // Vector projection of Moon onto the Ecliptic line
  const dotProduct = props.moonPos.rawX * Math.cos(angle) + props.moonPos.rawY * Math.sin(angle)
  return {
    x: Math.cos(angle) * dotProduct,
    y: Math.sin(angle) * dotProduct,
  }
})

// Calculate pixel coordinates for labels
const labels = computed(() => {
  const vh = window.innerHeight / 100
  const centerX = window.innerWidth / 2
  const centerY = (props.horizonY / 100) * window.innerHeight

  const getPx = (rawX, rawY) => ({
    x: centerX + rawX * vh,
    y: centerY + rawY * vh,
  })

  return {
    // BLUE DASHED LINE (Now labeled as Longitude)
    long: {
      ...getPx(
        (projectedRaw.value.x + props.moonPos.rawX) / 2,
        (projectedRaw.value.y + props.moonPos.rawY) / 2,
      ),
      val: props.longOffset?.toFixed(1),
    },

    // WHITE LINE (Now labeled as Latitude)
    lat: {
      ...getPx(
        (props.sunPos.rawX + projectedRaw.value.x) / 2,
        (props.sunPos.rawY + projectedRaw.value.y) / 2,
      ),
      val: props.latOffset?.toFixed(1),
    },

    elong: {
      ...getPx(
        (props.sunPos.rawX + props.moonPos.rawX) / 2,
        (props.sunPos.rawY + props.moonPos.rawY) / 2,
      ),
      val: props.elongation?.toFixed(1),
    },
  }
})
</script>

<template>
  <svg class="absolute inset-0 w-full h-full pointer-events-none z-0">
    <line
      :x1="eclipticLinePixels.x1"
      :y1="eclipticLinePixels.y1"
      :x2="eclipticLinePixels.x2"
      :y2="eclipticLinePixels.y2"
      stroke="rgba(255, 255, 255, 0.15)"
      stroke-width="1"
      stroke-dasharray="8 4"
    />

    <line
      :x1="sunPixels.x"
      :y1="sunPixels.y"
      :x2="projectedPointPixels.x"
      :y2="projectedPointPixels.y"
      stroke="rgba(255, 255, 255, 0.3)"
      stroke-width="1"
    />

    <line
      :x1="projectedPointPixels.x"
      :y1="projectedPointPixels.y"
      :x2="moonPixels.x"
      :y2="moonPixels.y"
      stroke="rgba(56, 189, 248, 0.5)"
      stroke-width="1.5"
      stroke-dasharray="2 2"
    />

    <line
      :x1="sunPixels.x"
      :y1="sunPixels.y"
      :x2="moonPixels.x"
      :y2="moonPixels.y"
      stroke="rgba(251, 191, 36, 0.4)"
      stroke-width="2"
    />

    <!-- Labels Group -->
    <g v-if="props.sunPos && props.moonPos" class="fill-white text-[12px] font-bold select-none">
      <text class="fill-sky-400" :x="labels.long.x" :y="labels.long.y" dx="10" dy="-10">
        λ {{ props.longOffset?.toFixed(1) }}°
      </text>

      <text class="fill-white/80" :x="labels.lat.x" :y="labels.lat.y" dy="-10" text-anchor="middle">
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
