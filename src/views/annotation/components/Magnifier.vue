<template>
  <Teleport to="body">
    <div v-show="visible">
      <!-- Magnifier Icon at mouse cursor -->
      <div 
        class="magnifier-icon"
        :style="{
          left: x + 10 + 'px',
          top: y + 10 + 'px'
        }"
      >
        <svg viewBox="0 0 1041 1024" width="40" height="40">
          <path d="M391.107542 781.159727a390.560231 390.560231 0 1 1 276.75182-115.48824 390.770209 390.770209 0 0 1-276.75182 115.48824v-41.995723a348.14455 348.14455 0 0 0 246.409909-594.44947 348.249539 348.249539 0 1 0-246.409909 594.44947z" fill="#F8C44F" p-id="10756"></path>
          <path d="M666.01155 775.227832l125.388732-125.388733L1010.177005 868.615822 884.788273 994.004554z" fill="#F8C44F" p-id="10758"></path>
          <path d="M930.437624 869.770705l-96.800143-96.800144zM818.833988 787.753056l29.701476-29.690977 96.800143 96.800144-29.690976 29.701475zM680.269098 760.896791l96.789644-96.821141 47.444669 47.43417-96.789644 96.821141z" fill="#FFFFFF" p-id="10759"></path>
          <path d="M727.703268 838.063933l-77.062153-77.167142 126.512118-125.987171 77.062153 77.062153z m-17.743193-77.062153l17.743193 17.638204 67.088169-67.088169L777.153233 693.598644z" fill="#282D33" p-id="10760"></path>
          <path d="M1019.363569 906.201995a96.905133 96.905133 0 0 1-96.905132 96.800143l-23.202638-23.307627q48.505061-48.295082 96.800144-96.800143z" fill="#FFFFFF" p-id="10761"></path>
          <path d="M913.639335 1024l-44.200499-44.305489 125.987171-125.987171L1040.361431 897.487882v8.714113a118.112973 118.112973 0 0 1-118.007984 117.798005z m15.11846-44.305489l1.784819 1.784819A75.697292 75.697292 0 0 0 997.630782 914.076193l-1.784818-1.784818zM650.452134 714.208045l29.690977-29.701476 40.536372 40.525874-29.690977 29.711974zM674.368699 637.744331l29.690976-29.690977 52.484156 52.494655-29.701475 29.690977z" fill="#282D33" p-id="10762"></path>
        </svg>
      </div>

      <!-- Magnifier Lens Box -->
      <div 
        class="magnifier-lens"
        :style="{ 
          left: lensPos.left + 'px', 
          top: lensPos.top + 'px',
          width: (size || 300) + 'px',
          height: (size || 300) + 'px'
        }"
      >
        <canvas ref="canvasRef" :width="size || 300" :height="size || 300" class="magnifier-canvas"></canvas>
        <div class="crosshair"></div>
        <div class="info-tag">x{{ zoomLevel || 2 }}</div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue'
import type { Annotation } from '../../../types'
import { useMouse, useWindowSize } from '@vueuse/core'

const props = defineProps<{
  visible: boolean
  size?: number
  zoomLevel?: number
  image: HTMLImageElement | null
  annotations: Annotation[]
  stageConfig: { x: number, y: number, scale: number }
  container: HTMLElement | null
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
// Use client coordinates explicitly to match getBoundingClientRect
const { x, y } = useMouse({ type: 'client' })
const { width: winW, height: winH } = useWindowSize()

const lensPos = computed(() => {
    const size = props.size || 300
    const iconOffset = 10 // From template
    const iconSize = 40
    
    // Icon Bounds
    const iconLeft = x.value + iconOffset
    const iconTop = y.value + iconOffset
    const iconRight = iconLeft + iconSize
    const iconBottom = iconTop + iconSize
    
    // Default: Box top-left touches Icon bottom-right
    let left = iconRight
    let top = iconBottom
    
    // Check Right Edge
    if (left + size > winW.value) {
        // Flip to Left of Icon (Box right touches Icon left)
        const leftCandidate = iconLeft - size
        if (leftCandidate >= 0) {
            left = leftCandidate
        } else {
            // Clamp to Right Edge
            left = winW.value - size
        }
    }
    
    // Check Bottom Edge
    if (top + size > winH.value) {
        // Flip to Top of Icon (Box bottom touches Icon top)
        const topCandidate = iconTop - size
        if (topCandidate >= 0) {
            top = topCandidate
        } else {
            // Clamp to Bottom Edge
            top = winH.value - size
        }
    }
    
    return { left, top }
})

const render = () => {
    if (!props.visible || !canvasRef.value || !props.image || !props.container) return

    const ctx = canvasRef.value.getContext('2d')
    if (!ctx) return
    
    const rect = props.container.getBoundingClientRect()

    const width = props.size || 300
    const height = props.size || 300
    const zoom = props.zoomLevel || 2

    // Clear
    ctx.clearRect(0, 0, width, height)
    ctx.fillStyle = '#f0f0f0'
    ctx.fillRect(0, 0, width, height)

    // Calculate mouse position relative to image
    // Mouse client X/Y -> Container relative -> Stage relative -> Image relative
    // Container relative
    // Adjust for icon offset so the magnifier captures what's under the icon's glass
    // Icon is at (x+10, y+10), Glass center is roughly +10px inside icon (24px size)
    // So we shift capture point by ~20px relative to mouse cursor
    const cursorOffset = 20 
    const relX = x.value + cursorOffset - rect.left
    const relY = y.value + cursorOffset - rect.top

    // Stage transform: stageX + imageX * scale = relX
    // imageX = (relX - stageX) / scale
    // BUT wait, relX is relative to the stage container top-left.
    // The Konva stage itself might be panned (props.stageConfig.x/y).
    // So the point on the image is:
    const imgX = (relX - props.stageConfig.x) / props.stageConfig.scale
    const imgY = (relY - props.stageConfig.y) / props.stageConfig.scale

    // Source Rectangle (in image coordinates)
    // We want to show 'width / zoom' amount of image pixels
    const srcW = width / zoom
    const srcH = height / zoom
    const srcX = imgX - srcW / 2
    const srcY = imgY - srcH / 2

    // Draw Image
    // ctx.drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
    // Disable smoothing for pixel art feel if needed, or keep it for smoothness
    ctx.imageSmoothingEnabled = false 
    
    try {
        ctx.drawImage(
            props.image,
            srcX, srcY, srcW, srcH,
            0, 0, width, height
        )
    } catch (e) {
        // Ignore out of bounds errors
    }

    // Draw Annotations
    // We need to transform annotation coordinates to magnifier canvas coordinates
    // MagX = (AnnX - srcX) * zoom
    // MagY = (AnnY - srcY) * zoom
    
    ctx.save()
    // Clip to canvas area
    ctx.beginPath()
    ctx.rect(0, 0, width, height)
    ctx.clip()

    props.annotations.forEach(ann => {
        ctx.strokeStyle = ann.color
        ctx.lineWidth = 2
        ctx.fillStyle = 'rgba(0,0,0,0)' // Transparent fill

        if (ann.type === 'rect' && ann.rect) {
            const rx = (ann.rect.x - srcX) * zoom
            const ry = (ann.rect.y - srcY) * zoom
            const rw = ann.rect.width * zoom
            const rh = ann.rect.height * zoom
            
            ctx.strokeRect(rx, ry, rw, rh)
        } else if (ann.type === 'circle' && ann.rect) {
            const cx = (ann.rect.x - srcX) * zoom
            const cy = (ann.rect.y - srcY) * zoom
            const r = (ann.radius || 0) * zoom
            
            ctx.beginPath()
            ctx.arc(cx, cy, r, 0, Math.PI * 2)
            ctx.stroke()
        } else if ((ann.type === 'polygon' || ann.type === 'triangle') && ann.points) {
            const points = ann.points
            if (points.length >= 2) {
                ctx.beginPath()
                const startX = ((points[0] ?? 0) - srcX) * zoom
                const startY = ((points[1] ?? 0) - srcY) * zoom
                ctx.moveTo(startX, startY)
                
                for (let i = 2; i < points.length; i += 2) {
                    const px = ((points[i] ?? 0) - srcX) * zoom
                    const py = ((points[i + 1] ?? 0) - srcY) * zoom
                    ctx.lineTo(px, py)
                }
                ctx.closePath()
                ctx.stroke()
                
                // Draw vertices
                ctx.fillStyle = '#fff'
                for (let i = 0; i < points.length; i += 2) {
                     const px = ((points[i] ?? 0) - srcX) * zoom
                     const py = ((points[i + 1] ?? 0) - srcY) * zoom
                     // Simple small square for vertex
                     ctx.fillRect(px - 2, py - 2, 4, 4)
                     ctx.strokeRect(px - 2, py - 2, 4, 4)
                }
            }
        }
    })
    
    ctx.restore()
}

let animId: number
const loop = () => {
    if (props.visible) {
        render()
        animId = requestAnimationFrame(loop)
    }
}

watch(() => props.visible, (val) => {
    if (val) {
        loop()
    } else {
        cancelAnimationFrame(animId)
    }
})

onUnmounted(() => {
    cancelAnimationFrame(animId)
})
</script>

<style scoped>
.magnifier-icon {
  position: fixed;
  z-index: 10000;
  pointer-events: none;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
}

.magnifier-lens {
  position: fixed;
  z-index: 9999;
  border: 2px solid #1890ff;
  border-radius: 4px;
  overflow: hidden;
  pointer-events: none;
  background: white;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  /* cursor: zoom-in;  Remove cursor style as it's separate now */
}
.magnifier-canvas {
    display: block;
}
.crosshair {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 20px;
    height: 20px;
    transform: translate(-50%, -50%);
    pointer-events: none;
}
.crosshair::before, .crosshair::after {
    content: '';
    position: absolute;
    background: rgba(24, 144, 255, 0.8);
}
.crosshair::before { top: 9px; left: 0; width: 100%; height: 2px; }
.crosshair::after { left: 9px; top: 0; height: 100%; width: 2px; }

.info-tag {
    position: absolute;
    bottom: 2px;
    right: 2px;
    background: rgba(0,0,0,0.6);
    color: white;
    font-size: 10px;
    padding: 1px 4px;
    border-radius: 2px;
}
</style>