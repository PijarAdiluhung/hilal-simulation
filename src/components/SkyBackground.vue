<script setup>
import { computed } from 'vue'

const props = defineProps({
  progress: { type: Number, required: true },
  zoom: { type: Number, default: 1 },
  horizonY: { type: Number, default: 80 }
})

const SUNSET_TIMING = {
  riseStart: 5,
  peakStart: 2,
  peakEnd: -2,
  fadeEnd: -9,
}

const dayOpacity = computed(() => {
  if (props.progress > 0.5) return 1
  return Math.max(0, (props.progress + 0.25) / 0.75)
})

const sunsetOpacity = computed(() => {
  const p = props.progress
  const { riseStart, peakStart, peakEnd, fadeEnd } = SUNSET_TIMING

  if (p >= riseStart || p <= fadeEnd) return 0
  if (p <= peakStart && p >= peakEnd) return 1

  if (p < riseStart && p > peakStart) {
    return (riseStart - p) / (riseStart - peakStart)
  }
  if (p < peakEnd && p > fadeEnd) {
    return (p - fadeEnd) / (peakEnd - fadeEnd)
  }
  return 0
})

const nightOpacity = computed(() => {
  if (props.progress < -0.25) return 1
  if (props.progress < 0.5) return 1 - (props.progress + 0.25) / 0.75
  return 0
})

const syafaqOpacity = computed(() => {
  const p = props.progress
  if (p > 0.5 || p < -15) return 0

  let intensity = 0
  if (p <= 0.5 && p > -3) intensity = (0.5 - p) / 3.5
  else if (p <= -3 && p >= -7) intensity = 1
  else if (p < -7 && p >= -15) intensity = (15 + p) / 5

  return intensity * 0.5
})
</script>

<template>
  <div class="absolute inset-0 pointer-events-none">
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

    <!-- Sunset Sky -->
    <div
      class="absolute inset-0 bg-linear-to-b from-orange-500 via-rose-400 to-amber-200 transition-opacity duration-1000"
      :style="{ opacity: sunsetOpacity }"
    ></div>

    <!-- Syafaq (Atmospheric Glare) -->
    <div
      class="absolute inset-0 z-5 transition-opacity duration-700"
      :style="{
        opacity: syafaqOpacity * 0.6,
        background: `radial-gradient(
          circle at 50% ${horizonY + 3}%, 
          rgba(255, 160, 60, 0.6) 0%, 
          rgba(255, 80, 0, 0.2) ${40 / zoom}%, 
          transparent ${70 / zoom}%
        )`,
      }"
    ></div>
  </div>
</template>