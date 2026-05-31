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
  const angle = toRad(props.tilt)
  const length = 500
  return {
    x1: `calc(${props.sunPos.left} - ${Math.cos(angle) * length}vh)`,
    y1: `calc(${props.sunPos.top} - ${Math.sin(angle) * length}vh)`,
    x2: `calc(${props.sunPos.left} + ${Math.cos(angle) * length}vh)`,
    y2: `calc(${props.sunPos.top} + ${Math.sin(angle) * length}vh)`,
  }
})

// 2. The Projection (The "Ghost" point on the ecliptic)
const projectedPoint = computed(() => {
  const angle = toRad(props.tilt - 90)
  const dx = props.moonPos.rawX - props.sunPos.rawX
  const dy = props.moonPos.rawY - props.sunPos.rawY
  const mag = dx * Math.cos(angle) + dy * Math.sin(angle)
  const projRawX = props.sunPos.rawX + Math.cos(angle) * mag
  const projRawY = props.sunPos.rawY + Math.sin(angle) * mag
  return {
    x: `calc(50% + ${projRawX}vh)`,
    y: `${props.horizonY + projRawY}%`,
  }
})

const projectedRaw = computed(() => {
  if (!props.moonPos) return { x: 0, y: 0 }
  const angle = toRad(props.tilt - 90)
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
    long: {
      ...getPx(
        (projectedRaw.value.x + props.moonPos.rawX) / 2,
        (projectedRaw.value.y + props.moonPos.rawY) / 2,
      ),
      val: props.longOffset?.toFixed(1),
    },
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

// --- Pixel equivalents for SVG <line> attributes (Safari doesn't support calc() in SVG attributes) ---

const vh = computed(() => window.innerHeight / 100)

const toPx = (rawX, rawY) => ({
  x: window.innerWidth / 2 + rawX * vh.value,
  y: ((props.horizonY + rawY) / 100) * window.innerHeight,
})

const sunPx = computed(() => toPx(props.sunPos.rawX, props.sunPos.rawY))
const moonPx = computed(() => toPx(props.moonPos.rawX, props.moonPos.rawY))

const eclipticLinePx = computed(() => {
  const angle = toRad(props.tilt)
  const length = 500
  const dx = Math.cos(angle) * length * vh.value
  const dy = Math.sin(angle) * length * vh.value
  return {
    x1: sunPx.value.x - dx,
    y1: sunPx.value.y - dy,
    x2: sunPx.value.x + dx,
    y2: sunPx.value.y + dy,
  }
})

const projectedPointPx = computed(() => {
  const angle = toRad(props.tilt - 90)
  const dx = props.moonPos.rawX - props.sunPos.rawX
  const dy = props.moonPos.rawY - props.sunPos.rawY
  const mag = dx * Math.cos(angle) + dy * Math.sin(angle)
  const projRawX = props.sunPos.rawX + Math.cos(angle) * mag
  const projRawY = props.sunPos.rawY + Math.sin(angle) * mag
  return toPx(projRawX, projRawY)
})
</script>

<template>
  <svg class="absolute inset-0 w-full h-full pointer-events-none z-0">
    <!-- 1. Ecliptic Plane (The dashed line) -->
    <line
      :x1="eclipticLinePx.x1"
      :y1="eclipticLinePx.y1"
      :x2="eclipticLinePx.x2"
      :y2="eclipticLinePx.y2"
      stroke="rgba(255, 255, 255, 0.15)"
      stroke-width="1"
      stroke-dasharray="8 4"
    />

    <!-- 2. Lunar Longitude (Distance ALONG the ecliptic) -->
    <line
      :x1="sunPx.x"
      :y1="sunPx.y"
      :x2="projectedPointPx.x"
      :y2="projectedPointPx.y"
      stroke="rgba(255, 255, 255, 0.3)"
      stroke-width="1"
    />

    <!-- 3. Lunar Latitude (Distance PERPENDICULAR to the ecliptic) -->
    <line
      :x1="projectedPointPx.x"
      :y1="projectedPointPx.y"
      :x2="moonPx.x"
      :y2="moonPx.y"
      stroke="rgba(56, 189, 248, 0.5)"
      stroke-width="1.5"
      stroke-dasharray="2 2"
    />

    <!-- 4. Elongation (Direct hypotenuse) -->
    <line
      :x1="sunPx.x"
      :y1="sunPx.y"
      :x2="moonPx.x"
      :y2="moonPx.y"
      stroke="rgba(251, 191, 36, 0.4)"
      stroke-width="2"
    />

    <!-- Labels Group -->
    <g v-if="props.sunPos && props.moonPos" class="fill-white text-[12px] font-bold select-none">
      <!-- Longitude (λ) - Anchored to the projected point -->
      <text
        class="fill-sky-400"
        :style="{ transform: `translate(${projectedPoint.x}, ${projectedPoint.y})` }"
        dx="10"
        dy="-10"
      >
        λ {{ props.longOffset?.toFixed(1) }}°
      </text>

      <!-- Latitude (β) - Anchored to the midpoint of the white line -->
      <text
        class="fill-white/80"
        :style="{
          transform: `translate(calc((${sunPos.left} + ${projectedPoint.x}) / 2), calc((${sunPos.top} + ${projectedPoint.y}) / 2))`,
        }"
        dy="-10"
        text-anchor="middle"
      >
        β {{ props.latOffset?.toFixed(1) }}°
      </text>

      <!-- Elongation - Anchored to the midpoint of the yellow line -->
      <text
        class="fill-amber-400"
        :style="{
          transform: `translate(calc((${sunPos.left} + ${moonPos.left}) / 2), calc((${sunPos.top} + ${moonPos.top}) / 2))`,
        }"
        dx="-10"
        dy="-10"
        text-anchor="end"
      >
        {{ props.elongation?.toFixed(1) }}°
      </text>
    </g>
  </svg>
</template>
