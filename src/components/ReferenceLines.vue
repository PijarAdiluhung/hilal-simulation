<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  sunPos: Object,
  moonPos: Object,
  horizonY: Number,
  tilt: Number,
  longOffset: Number,
  latOffset: Number,
  elongation: Number,
})

const windowWidth = ref(window.innerWidth)
const windowHeight = ref(window.innerHeight)

const toRad = (deg) => deg * (Math.PI / 180)

const onResize = () => {
  windowWidth.value = window.innerWidth
  windowHeight.value = window.innerHeight
}

onMounted(() => window.addEventListener('resize', onResize))
onUnmounted(() => window.removeEventListener('resize', onResize))

const centerX = computed(() => windowWidth.value / 2)
const centerY = computed(() => (props.horizonY / 100) * windowHeight.value)
const vh = computed(() => windowHeight.value / 100)

const toPx = (rawX, rawY) => ({
  x: centerX.value + rawX * vh.value,
  y: centerY.value + rawY * vh.value,
})

const sunPx = computed(() => toPx(props.sunPos.rawX, props.sunPos.rawY))
const moonPx = computed(() => toPx(props.moonPos.rawX, props.moonPos.rawY))

const eclipticLine = computed(() => {
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

const projectedPoint = computed(() => {
  const angle = toRad(props.tilt - 90)
  const dx = props.moonPos.rawX - props.sunPos.rawX
  const dy = props.moonPos.rawY - props.sunPos.rawY
  const mag = dx * Math.cos(angle) + dy * Math.sin(angle)
  const projRawX = props.sunPos.rawX + Math.cos(angle) * mag
  const projRawY = props.sunPos.rawY + Math.sin(angle) * mag
  return toPx(projRawX, projRawY)
})

const labels = computed(() => ({
  long: {
    x: (projectedPoint.value.x + moonPx.value.x) / 2,
    y: (projectedPoint.value.y + moonPx.value.y) / 2,
    val: props.longOffset?.toFixed(1),
  },
  lat: {
    x: (sunPx.value.x + projectedPoint.value.x) / 2,
    y: (sunPx.value.y + projectedPoint.value.y) / 2,
    val: props.latOffset?.toFixed(1),
  },
  elong: {
    x: (sunPx.value.x + moonPx.value.x) / 2,
    y: (sunPx.value.y + moonPx.value.y) / 2,
    val: props.elongation?.toFixed(1),
  },
}))
</script>

<template>
  <svg class="absolute inset-0 w-full h-full pointer-events-none z-0">
    <!-- 1. Ecliptic Plane (The dashed line) -->
    <line
      :x1="eclipticLine.x1"
      :y1="eclipticLine.y1"
      :x2="eclipticLine.x2"
      :y2="eclipticLine.y2"
      stroke="rgba(255, 255, 255, 0.15)"
      stroke-width="1"
      stroke-dasharray="8 4"
    />

    <!-- 2. Lunar Longitude (Distance ALONG the ecliptic) -->
    <line
      :x1="sunPx.x"
      :y1="sunPx.y"
      :x2="projectedPoint.x"
      :y2="projectedPoint.y"
      stroke="rgba(255, 255, 255, 0.3)"
      stroke-width="1"
    />

    <!-- 3. Lunar Latitude (Distance PERPENDICULAR to the ecliptic) -->
    <line
      :x1="projectedPoint.x"
      :y1="projectedPoint.y"
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
      <!-- Longitude (λ) -->
      <text
        class="fill-sky-400"
        :x="projectedPoint.x"
        :y="projectedPoint.y"
        dx="10"
        dy="-10"
      >
        λ {{ props.longOffset?.toFixed(1) }}°
      </text>

      <!-- Latitude (β) -->
      <text
        class="fill-white/80"
        :x="labels.lat.x"
        :y="labels.lat.y"
        dy="-10"
        text-anchor="middle"
      >
        β {{ props.latOffset?.toFixed(1) }}°
      </text>

      <!-- Elongation -->
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
