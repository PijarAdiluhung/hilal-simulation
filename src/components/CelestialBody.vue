<script setup>
import { computed } from 'vue'

const props = defineProps({
  type: {
    type: String,
    validator: (value) => ['sun', 'moon'].includes(value),
    required: true
  },
  pos: {
    type: Object,
    required: true // Expects { left, top }
  },
  size: {
    type: Number,
    required: true
  },
  rotation: {
    type: Number,
    default: 0
  },
  opacity: {
    type: Number,
    default: 1
  },
  filter: {
    type: String,
    default: 'none'
  }
})

const bodyStyle = computed(() => ({
  left: props.pos.left,
  top: props.pos.top,
  width: `${props.size}px`,
  height: `${props.size}px`,
  opacity: props.opacity,
  filter: props.filter,
  transform: `translate(-50%, -50%) rotate(${props.rotation}deg)`,
}))
</script>

<template>
  <!-- Sun Rendering -->
  <div
    v-if="type === 'sun'"
    class="absolute rounded-full bg-yellow-50 blur-[1px] shadow-[0_0_60px_20px_rgba(255,252,231,0.5)] transition-all duration-300"
    :style="bodyStyle"
  ></div>

  <!-- Moon Rendering -->
  <div
    v-else-if="type === 'moon'"
    class="absolute transition-all duration-300"
    :style="bodyStyle"
  >
    <div class="relative w-full h-full">
      <svg viewBox="0 0 80 80" class="fill-white/90 w-full h-full">
        <!-- The Hilal (Crescent) Path -->
        <path d="M 40,0 A 40,40 0 1,1 40,80 A 32,37 0 1,0 40,0 Z" />
      </svg>
    </div>
  </div>
</template>