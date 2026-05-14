<script setup>
defineProps({
  isCollapsed: Boolean,
  timeOffset: Number,
  long: Number,
  lat: Number,
  tilt: Number,
  zoom: Number,
  showAids: Boolean,
  showPlanes: Boolean,
})

const emit = defineEmits([
  'update:isCollapsed',
  'update:timeOffset',
  'update:long',
  'update:lat',
  'update:tilt',
  'update:zoom',
  'update:showAids',
  'update:showPlanes',
])
</script>

<template>
  <div
    class="absolute top-3 left-1/2 -translate-x-1/2 z-20 w-72 bg-black/70 backdrop-blur-2xl p-4 rounded-2xl border border-white/10 shadow-2xl transition-all duration-300"
  >
    <!-- Header / Toggle -->
    <div class="flex justify-between items-center -mt-2 mb-3">
      <span class="text-[10px] text-white/60 font-black tracking-[0.2em] uppercase"
        >Sim Controls</span
      >
      <button
        @click="emit('update:isCollapsed', !isCollapsed)"
        class="text-white/40 hover:text-white transition-colors p-1"
      >
        <svg
          v-if="isCollapsed"
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
        <svg
          v-else
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="m18 15-6-6-6 6" />
        </svg>
      </button>
    </div>

    <!-- Main Slider: Time Offset (Always Visible) -->
    <div class="flex flex-col gap-3">
      <div class="flex justify-between items-end">
        <span class="text-xs text-white/80 font-medium">
          {{ timeOffset <= 0 ? 'Before Sunset' : 'After Sunset' }}
        </span>
        <span class="text-white font-mono text-sm leading-none">
          {{ timeOffset === 0 ? 'Sunset' : Math.abs(timeOffset) + 'm' }}
        </span>
      </div>
      <input
        :value="timeOffset"
        @input="emit('update:timeOffset', Number($event.target.value))"
        type="range"
        min="-20"
        max="60"
        step="1"
        class="custom-slider"
      />
    </div>

    <!-- Collapsible Section -->
    <div v-if="!isCollapsed" class="flex flex-col gap-4 mt-6 pt-4 border-t border-white/10">
      <!-- Ecliptic Longitude Offset -->
      <div class="flex flex-col gap-2">
        <div class="flex justify-between items-center">
          <span class="text-[9px] text-white/40 font-bold uppercase tracking-widest"
            >Lunar Ecliptic Longitude</span
          >
          <span class="text-white font-mono text-xs">{{ long.toFixed(1) }}°</span>
        </div>
        <input
          :value="long"
          @input="emit('update:long', Number($event.target.value))"
          type="range"
          min="0"
          max="12"
          step="0.1"
          class="custom-slider"
        />
      </div>

      <!-- Ecliptic Latitude Offset -->
      <div class="flex flex-col gap-2">
        <div class="flex justify-between items-center">
          <span class="text-[9px] text-white/40 font-bold uppercase tracking-widest"
            >Lunar Ecliptic Latitude</span
          >
          <span class="text-white font-mono text-xs">{{ lat.toFixed(1) }}°</span>
        </div>
        <input
          :value="lat"
          @input="emit('update:lat', Number($event.target.value))"
          type="range"
          min="-5.2"
          max="5.2"
          step="0.1"
          class="custom-slider"
        />
      </div>

      <!-- Ecliptic Tilt -->
      <div class="flex flex-col gap-2">
        <div class="flex justify-between items-center">
          <span class="text-[9px] text-white/40 font-bold uppercase tracking-widest"
            >Ecliptic Tilt</span
          >
          <span class="text-white font-mono text-xs">{{ tilt }}°</span>
        </div>
        <input
          :value="tilt"
          @input="emit('update:tilt', Number($event.target.value))"
          type="range"
          min="15"
          max="165"
          step="1"
          class="custom-slider"
        />
      </div>

      <!-- Zoom Level -->
      <div class="flex flex-col gap-2">
        <div class="flex justify-between items-center">
          <span class="text-[9px] text-white/40 font-bold uppercase tracking-widest">Zoom</span>
          <span class="text-white font-mono text-xs">{{ (1 / zoom).toFixed(2) }}x</span>
        </div>
        <input
          :value="zoom"
          @input="emit('update:zoom', Number($event.target.value))"
          type="range"
          min="1"
          max="4"
          step="0.1"
          class="custom-slider"
        />
      </div>

      <!-- Guiding Aids Toggle -->
      <div class="flex items-center justify-between pt-4 mt-2 border-t border-white/10">
        <span class="text-[9px] text-white/40 font-bold uppercase tracking-widest"
          >Guiding Aids</span
        >
        <button
          @click="emit('update:showAids', !showAids)"
          :class="showAids ? 'bg-amber-500' : 'bg-white/10'"
          class="w-8 h-4 rounded-full relative transition-colors duration-200"
        >
          <div
            :class="showAids ? 'translate-x-4' : 'translate-x-0'"
            class="absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform"
          ></div>
        </button>
      </div>

      <!-- Planes Toggle -->
      <div class="flex items-center justify-between">
        <span class="text-[9px] text-white/40 font-bold uppercase tracking-widest"
          >Show Planes</span
        >
        <button
          @click="emit('update:showPlanes', !showPlanes)"
          :class="showPlanes ? 'bg-cyan-500' : 'bg-white/10'"
          class="w-8 h-4 rounded-full relative transition-colors duration-200"
        >
          <div
            :class="showPlanes ? 'translate-x-4' : 'translate-x-0'"
            class="absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform"
          ></div>
        </button>
      </div>
    </div>
  </div>
</template>
