import { ref, computed, onMounted, onUnmounted } from 'vue'

export function useCelestialMath() {
  // --- STATE ---
  const windowRatio = ref(1)
  const cssVh = ref(0) // Will be set on mount to match CSS 1vh
  const timeOffset = ref(20) // Minutes relative to sunset
  const longOffset = ref(7) // Degrees between Sun and Moon
  const latOffset = ref(0.5) // Degrees of vertical offset
  const celestialTilt = ref(90) // Degrees (90 = vertical path)
  const zoom = ref(1)

  // --- CONSTANTS ---
  const CONFIG = {
    HORIZON_Y: 80, // Percent from top of screen
    MOON_RATIO: 1.0,
    DEG_TO_PX: 20, // Base scale: 1 degree = 20vh units
    SUN_SPEED: 0.25, // Earth rotates 0.25 degrees per minute
    VISIBILITY_LIMIT: 6.3, // Minimum elongation for moon visibility
    TWILIGHT_THRESHOLD: -2.9, // Sun depth needed for moon to appear
  }

  // --- HELPER MATH ---
  const toRad = (deg) => deg * (Math.PI / 180)
  const toDeg = (rad) => rad * (180 / Math.PI)

  // Persistent hidden element to measure CSS vh
  const vhMeasureEl = ref(null)

  const measureCSSVh = () => {
    if (!vhMeasureEl.value) return
    cssVh.value = vhMeasureEl.value.offsetHeight / 100
  }

  const updateWindowRatio = () => {
    windowRatio.value = window.innerWidth / window.innerHeight
    measureCSSVh()
  }

  onMounted(() => {
    const el = document.createElement('div')
    el.style.cssText =
      'position:fixed;top:0;left:0;width:1px;height:100vh;pointer-events:none;visibility:hidden;z-index:-9999'
    document.body.appendChild(el)
    vhMeasureEl.value = el
    measureCSSVh()

    window.addEventListener('resize', updateWindowRatio)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateWindowRatio)
    }
  })

  onUnmounted(() => {
    window.removeEventListener('resize', updateWindowRatio)
    if (window.visualViewport) {
      window.visualViewport.removeEventListener('resize', updateWindowRatio)
    }
    if (vhMeasureEl.value && vhMeasureEl.value.parentNode) {
      vhMeasureEl.value.parentNode.removeChild(vhMeasureEl.value)
    }
  })

  // --- COMPUTED LOGIC ---

  // Convert minutes to degrees (4 mins = 1 degree)
  const solarProgress = computed(() => -(timeOffset.value * CONFIG.SUN_SPEED))

  const visualScale = computed(() => CONFIG.DEG_TO_PX / zoom.value)

  /**
   * Core positioning engine using a 2D Rotation Matrix
   */
  const getPosition = (altitude, latitudeOffset = 0) => {
    const centerX = 50
    const centerY = CONFIG.HORIZON_Y

    // Shift by 90 so that a tilt of 90° results in a vertical movement
    const tiltRad = toRad(celestialTilt.value - 90)

    const localX = latitudeOffset * visualScale.value
    const localY = -altitude * visualScale.value

    // Rotation Matrix: x' = x cosθ - y sinθ | y' = x sinθ + y cosθ
    const rotatedX = localX * Math.cos(tiltRad) - localY * Math.sin(tiltRad)
    const rotatedY = localX * Math.sin(tiltRad) + localY * Math.cos(tiltRad)

    return {
      left: `calc(${centerX}% + ${rotatedX}vh)`,
      top: `${centerY + rotatedY}%`,
      rawX: rotatedX,
      rawY: rotatedY,
    }
  }

  const sunPos = computed(() => getPosition(solarProgress.value, 0))

  const moonPos = computed(() =>
    getPosition(solarProgress.value + longOffset.value, latOffset.value),
  )

  const moonRotation = computed(() => {
    const s = sunPos.value
    const m = moonPos.value
    // Points the moon's "bright side" directly at the sun's coordinates
    return toDeg(Math.atan2(s.rawY - m.rawY, s.rawX - m.rawX))
  })

  const lunarAltitude = computed(() => solarProgress.value + longOffset.value)

  const elongation = computed(() => {
    return Math.sqrt(Math.pow(longOffset.value, 2) + Math.pow(latOffset.value, 2))
  })

  const altitudeAtSunset = computed(() => {
    const tiltRad = toRad(celestialTilt.value)
    return longOffset.value * Math.sin(tiltRad)
  })

  // --- VISUAL COMPUTATIONS ---
  const moonOpacity = computed(() => {
    // Hide moon if sun is too high OR if moon is too close to sun
    if (
      solarProgress.value > CONFIG.TWILIGHT_THRESHOLD ||
      elongation.value < CONFIG.VISIBILITY_LIMIT
    ) {
      return 0
    }
    const fadeFactor = 0.1 / zoom.value
    const depthBelowThreshold = Math.abs(solarProgress.value - CONFIG.TWILIGHT_THRESHOLD)
    return Math.min(depthBelowThreshold * fadeFactor, 1)
  })

  const moonFilter = computed(() => {
    const proximityToHorizon = Math.max(0, 5 - lunarAltitude.value)
    const blurAmount = proximityToHorizon * (0.5 / zoom.value)
    const contrastValue = 100 - proximityToHorizon * 5
    return `blur(${blurAmount}px) contrast(${contrastValue}%)`
  })

  const moonBounds = computed(() => {
    const horizontalOffsetPct = moonPos.value.rawX / windowRatio.value
    const currentXPos = 50 + horizontalOffsetPct
    const currentYPos = CONFIG.HORIZON_Y + moonPos.value.rawY

    return {
      isTooTop: currentYPos < 0,
      isTooBottom: currentYPos > CONFIG.HORIZON_Y,
      isTooLeft: currentXPos < 0,
      isTooRight: currentXPos > 100,
      x: currentXPos,
      y: currentYPos,
    }
  })

  const spaceOpacity = computed(() => {
    const e = elongation.value
    if (e < 6) return 0

    if (e <= 12) {
      // Normalizes 6-12 range to a 0.0 - 1.0 value
      const t = (e - 6) / (12 - 6)
      // Linear interpolation: start + t * (end - start)
      return 0.1 + t * (0.8 - 0.1)
    }

    return 0.8
  })

  const groundBrightness = computed(() => {
    // If sun is above -0.25 degrees, it's full daylight brightness
    const brightness = solarProgress.value > -0.25 ? 100 : 15
    return `brightness(${Math.max(brightness, 15)}%)`
  })

  return {
    timeOffset,
    longOffset,
    latOffset,
    celestialTilt,
    zoom,
    windowRatio,
    cssVh,
    CONFIG,
    solarProgress,
    sunPos,
    moonPos,
    moonRotation,
    moonOpacity,
    moonFilter,
    spaceOpacity,
    moonBounds,
    lunarAltitude,
    elongation,
    altitudeAtSunset,
    groundBrightness,
    updateWindowRatio,
  }
}
