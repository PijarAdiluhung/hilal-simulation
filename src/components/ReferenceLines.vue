<script setup>
import { computed } from 'vue'

const props = defineProps({
  sunPos: Object,
  moonPos: Object,
  horizonY: Number,
  tilt: Number,
  cssVh: Number,
  visualScale: Number,
  longOffset: Number,
  latOffset: Number,
  elongation: Number,
})

const toRad = (deg) => deg * (Math.PI / 180)

// Convert raw coordinates to screen pixels using CSS-matched vh
const toPixels = (rawX, rawY) => {
  const vh = props.cssVh || window.innerHeight / 100
  const centerX = window.innerWidth / 2
  const centerY = (props.horizonY / 100) * vh * 100
  return {
    x: centerX + rawX * vh,
    y: centerY + rawY * vh,
  }
}

// Sun and Moon pixel positions
const sunPixels = computed(() => {
  if (!props.sunPos) return { x: 0, y: 0 }
  return toPixels(props.sunPos.rawX, props.sunPos.rawY)
})

const moonPixels = computed(() => {
  if (!props.moonPos) return { x: 0, y: 0 }
  return toPixels(props.moonPos.rawX, props.moonPos.rawY)
})

// Ecliptic line through the Sun
const eclipticLinePixels = computed(() => {
  const angle = toRad(props.tilt)
  const len = 500
  const vh = props.cssVh || window.innerHeight / 100
  const sun = sunPixels.value
  return {
    x1: sun.x - Math.cos(angle) * len * vh,
    y1: sun.y - Math.sin(angle) * len * vh,
    x2: sun.x + Math.cos(angle) * len * vh,
    y2: sun.y + Math.sin(angle) * len * vh,
  }
})

// Projected point: foot of perpendicular from Moon onto ecliptic through Sun
const projectedPointPixels = computed(() => {
  if (!props.sunPos || !props.moonPos) return { x: 0, y: 0 }

  const angle = toRad(props.tilt - 90)
  const dx = props.moonPos.rawX - props.sunPos.rawX
  const dy = props.moonPos.rawY - props.sunPos.rawY
  const mag = dx * Math.cos(angle) + dy * Math.sin(angle)

  return toPixels(
    props.sunPos.rawX + Math.cos(angle) * mag,
    props.sunPos.rawY + Math.sin(angle) * mag,
  )
})

// Foot of perpendicular from Moon onto ecliptic through origin (raw coords)
const projectedRaw = computed(() => {
  if (!props.moonPos) return { x: 0, y: 0 }
  const angle = toRad(props.tilt - 90)
  const dot = props.moonPos.rawX * Math.cos(angle) + props.moonPos.rawY * Math.sin(angle)
  return {
    x: Math.cos(angle) * dot,
    y: Math.sin(angle) * dot,
  }
})

// Label pixel positions
const labels = computed(() => {
  const longMidX = (projectedRaw.value.x + props.moonPos.rawX) / 2
  const longMidY = (projectedRaw.value.y + props.moonPos.rawY) / 2
  const latMidX = (props.sunPos.rawX + projectedRaw.value.x) / 2
  const latMidY = (props.sunPos.rawY + projectedRaw.value.y) / 2
  const elongMidX = (props.sunPos.rawX + props.moonPos.rawX) / 2
  const elongMidY = (props.sunPos.rawY + props.moonPos.rawY) / 2

  return {
    long: { ...toPixels(longMidX, longMidY), val: props.longOffset?.toFixed(1) },
    lat: { ...toPixels(latMidX, latMidY), val: props.latOffset?.toFixed(1) },
    elong: { ...toPixels(elongMidX, elongMidY), val: props.elongation?.toFixed(1) },
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
