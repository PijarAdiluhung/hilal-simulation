<script setup>
import { computed } from 'vue'

const props = defineProps({
  sunPos: Object,
  moonPos: Object,
  horizonY: Number,
  tilt: Number, // Pass the tilt ref here!
  zoom: Number
})

const toRad = (deg) => deg * (Math.PI / 180)

// Calculate two points very far apart to represent the "Infinite" Ecliptic line
const eclipticLine = computed(() => {
  // We subtract 90 because 90° tilt = vertical (0° or 180° in standard math rotation)
  const angle = toRad(props.tilt - 90)
  const length = 200 // Long enough to cover screen
  
  return {
    x1: `calc(${props.sunPos.left} - ${Math.cos(angle) * length}vh)`,
    y1: `calc(${props.sunPos.top} - ${Math.sin(angle) * length}%)`,
    x2: `calc(${props.sunPos.left} + ${Math.cos(angle) * length}vh)`,
    y2: `calc(${props.sunPos.top} + ${Math.sin(angle) * length}%)`,
  }
})
</script>

<template>
  <svg class="absolute inset-0 w-full h-full pointer-events-none z-0">
    <!-- Corrected Ecliptic Plane -->
    <line 
      :x1="eclipticLine.x1" :y1="eclipticLine.y1"
      :x2="eclipticLine.x2" :y2="eclipticLine.y2"
      stroke="rgba(255, 255, 255, 0.15)"
      stroke-width="1"
      stroke-dasharray="8 4"
    />

    <!-- Lunar Longitude (Distance along the ecliptic) -->
    <line 
      :x1="sunPos.left" :y1="sunPos.top"
      :x2="moonPos.left" :y2="sunPos.top"
      stroke="rgba(255, 255, 255, 0.3)"
      stroke-width="1"
    />

    <!-- Lunar Latitude (Distance above/below the ecliptic) -->
    <line 
      :x1="moonPos.left" :y1="sunPos.top"
      :x2="moonPos.left" :y2="moonPos.top"
      stroke="rgba(56, 189, 248, 0.5)"
      stroke-width="1.5"
      stroke-dasharray="2 2"
    />

    <!-- Elongation (The direct hypotenuse/vector) -->
    <line 
      :x1="sunPos.left" :y1="sunPos.top"
      :x2="moonPos.left" :y2="moonPos.top"
      stroke="rgba(251, 191, 36, 0.4)"
      stroke-width="2"
    />
  </svg>
</template>