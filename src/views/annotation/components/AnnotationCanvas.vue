<template>
  <div ref="wrapperRef" class="canvas-wrapper w-full h-full bg-gray-100 overflow-auto relative" @contextmenu.prevent>
    <v-stage
      ref="stageRef"
      :config="stageConfig"
      @mousedown="handleStageMouseDown"
      @mousemove="handleStageMouseMove"
      @mouseup="handleStageMouseUp"
    >
      <v-layer>
        <v-group :config="groupConfig">
            <v-image v-if="imageObj" :config="{ image: imageObj }" />
          
          <!-- Existing Annotations -->
          <template v-for="ann in sortedAnnotations" :key="ann.id">
            <v-rect
              v-if="ann.type === 'rect' && ann.rect"
              :config="{
                id: ann.id,
                x: ann.rect.x,
                y: ann.rect.y,
                width: ann.rect.width,
                height: ann.rect.height,
                hitStrokeWidth: 10 / groupConfig.scaleX,
                stroke: selectedAnnotationId === ann.id ? 'transparent' : ann.color, // Hide rect stroke when selected (editing vertices)
                strokeWidth: 2 / groupConfig.scaleX,
                draggable: true,
                name: ann.id,
                dragBoundFunc: getDragBoundFunc(ann),
                listening: !isDrawing && !showMagnifier // Allow selection if not strictly drawing
              }"
              @mousedown="handleSelect($event, ann.id)"
              @dragstart="handleShapeDragStart($event, ann.id)"
              @dragmove="handleShapeDragMove($event, ann.id)"
              @dragend="handleDragEnd($event, ann.id)"
              @contextmenu="handleContextMenu($event, ann.id)"
            />
            
            <v-circle
              v-if="ann.type === 'circle' && ann.rect"
              :config="{
                id: ann.id,
                x: ann.rect.x,
                y: ann.rect.y,
                radius: ann.radius,
                hitStrokeWidth: 10 / groupConfig.scaleX,
                stroke: selectedAnnotationId === ann.id ? 'transparent' : ann.color, // Hide original stroke when selected (using overlay)
                strokeWidth: 2 / groupConfig.scaleX,
                draggable: true,
                name: ann.id,
                dragBoundFunc: getDragBoundFunc(ann),
                listening: !isDrawing && !showMagnifier // Allow selection if not strictly drawing
              }"
               @mousedown="handleSelect($event, ann.id)"
               @dragstart="handleShapeDragStart($event, ann.id)"
               @dragmove="handleShapeDragMove($event, ann.id)"
               @dragend="handleDragEnd($event, ann.id)"
               @contextmenu="handleContextMenu($event, ann.id)"
            />

            <v-line
               v-if="(ann.type === 'triangle' || ann.type === 'polygon') && ann.points"
               :config="{
                 id: ann.id,
                 points: ann.points,
                closed: true,
                hitStrokeWidth: 10 / groupConfig.scaleX,
                stroke: selectedAnnotationId === ann.id ? 'transparent' : ann.color, // Hide original line when selected (using overlay)
                strokeWidth: 2 / groupConfig.scaleX,
                 draggable: true,
                 name: ann.id,
                 dragBoundFunc: getDragBoundFunc(ann),
                 listening: !isDrawing && !showMagnifier // Allow selection if not strictly drawing
               }"
               @mousedown="handleSelect($event, ann.id)"
               @dragstart="handleShapeDragStart($event, ann.id)"
               @dragmove="handleShapeDragMove($event, ann.id)"
               @dragend="handleDragEnd($event, ann.id)"
               @contextmenu="handleContextMenu($event, ann.id)"
            />
            
            <!-- Anchors for Selected Polygon/Triangle/Rect -->
            <template v-if="selectedAnnotationId === ann.id && (ann.type === 'polygon' || ann.type === 'triangle' || ann.type === 'rect' || ann.type === 'circle')">
                <!-- Draw polygon lines for Rect/Polygon/Triangle editing -->
                <v-line
                   v-if="ann.type !== 'circle'"
                   :config="{
                     name: `preview-${ann.id}`,
                     points: getPreviewPoints(ann),
                     closed: true,
                     stroke: ann.color,
                     strokeWidth: 3 / groupConfig.scaleX,
                     hitStrokeWidth: 10 / groupConfig.scaleX,
                     shadowColor: ann.color,
                     shadowBlur: 5,
                     shadowOpacity: 0.8,
                     listening: !showMagnifier && ann.type !== 'rect',
                     draggable: ann.type !== 'rect',
                     dragBoundFunc: getDragBoundFunc(ann)
                   }"
                   @dragstart="handleShapeDragStart($event, ann.id)"
                   @dragmove="handleShapeDragMove($event, ann.id)"
                   @dragend="handleDragEnd($event, ann.id)"
                   @mousedown="handleSelect($event, ann.id)"
                   @contextmenu="handleContextMenu($event, ann.id)"
                   @dblclick="handleLineDblClick($event, ann.id)"
                />

                <!-- Draw circle outline for Circle editing -->
                <v-circle
                   v-if="ann.type === 'circle' && ann.rect"
                   :config="{
                     ...getDisplayCircle(ann),
                     stroke: ann.color,
                     strokeWidth: 3 / groupConfig.scaleX,
                     shadowColor: ann.color,
                     shadowBlur: 5,
                     shadowOpacity: 0.8,
                     listening: false,
                     fill: 'transparent'
                   }"
                />

                <!-- Vertices -->
                <v-circle
                    v-for="(point, index) in getPointPairs(getDisplayPoints(ann))"
                    :key="`${ann.id}-anchor-${index}`"
                    :config="{
                        x: point.x,
                        y: point.y,
                        radius: 5 / groupConfig.scaleX,
                        fill: '#fff',
                        stroke: ann.color,
                        strokeWidth: 2 / groupConfig.scaleX,
                        draggable: true,
                        dragBoundFunc: getAnchorDragBoundFunc(),
                        listening: !showMagnifier
                    }"
                    @dragstart="handleAnchorDragStart($event, ann.id)"
                    @dragmove="handleAnchorDragMove($event, ann.id, index)"
                    @dragend="handleAnchorDragEnd($event, ann.id, index)"
                    @mousedown="handleStopPropagation"
                    @contextmenu="handleVertexRightClick($event, ann.id, index)"
                    @dblclick="handleVertexDblClick($event, ann.id, index)"
                />
                
                <!-- Midpoints (Removed) -->
            </template>
          </template>

          <!-- Drawing Preview -->
          <template v-if="isDrawing">
            <v-rect v-if="currentTool === 'rect' && drawingShape.rect" 
                :config="{ ...drawingShape.rect, stroke: 'red', strokeWidth: 2 / groupConfig.scaleX }" />
            
            <v-circle v-if="currentTool === 'circle' && drawingShape.circle" 
                :config="{ ...drawingShape.circle, stroke: 'red', strokeWidth: 2 / groupConfig.scaleX }" />
            
            <v-line v-if="(currentTool === 'triangle' || currentTool === 'polygon') && drawingShape.points" 
                :config="{ 
                    points: drawingShape.points, 
                    closed: currentTool === 'triangle', 
                    stroke: 'red', 
                    strokeWidth: 2 / groupConfig.scaleX,
                    dash: [4, 4] 
                }" />
            
            <!-- Polygon/Triangle Start Point Highlight (for closing) -->
            <template v-if="(currentTool === 'polygon' || currentTool === 'triangle') && drawingShape.points">
                <!-- Draw points for polygon/triangle -->
                <v-circle 
                    v-for="(point, index) in getPointPairs(drawingShape.points)"
                    :key="`drawing-point-${index}`"
                    :config="{
                        x: point.x,
                        y: point.y,
                        radius: 3 / groupConfig.scaleX,
                        fill: 'white',
                        stroke: 'red',
                        strokeWidth: 1 / groupConfig.scaleX
                    }"
                />
                
                <!-- Start Point Highlight -->
                <v-circle 
                    v-if="currentTool === 'polygon' && drawingShape.points.length >= 6"
                    :config="{
                        x: drawingShape.points[0],
                        y: drawingShape.points[1],
                        radius: 8 / groupConfig.scaleX,
                        stroke: 'red',
                        strokeWidth: 2 / groupConfig.scaleX,
                        fill: isHoveringStartPoint ? 'rgba(255, 0, 0, 0.5)' : 'transparent',
                        shadowColor: 'black',
                        shadowBlur: 2,
                        shadowOpacity: 0.3
                    }"
                />
            </template>
          </template>

          <!-- Alignment Lines -->
          <v-line
             v-for="(line, i) in alignmentLines"
             :key="`alignment-${i}`"
             :config="line"
          />

          <v-transformer ref="transformerRef" :config="{ keepRatio: true, ignoreStroke: true }" />
        </v-group>
      </v-layer>
    </v-stage>

    <Magnifier
        :visible="showMagnifier"
        :image="imageObj"
        :annotations="sortedAnnotations"
        :stage-config="magnifierConfig"
        :container="wrapperRef"
        :zoom-level="store.magnifierZoom"
        :size="store.magnifierSize"
    />

    <ContextMenu
        v-model:visible="showContextMenu"
        :x="contextMenuX"
        :y="contextMenuY"
        :labels="availableLabels"
        :current-label-name="currentContextLabelName"
        @select="handleMenuSelect"
        @close="closeContextMenu"
    />
  </div>
</template>

<script lang="ts">
export default {
  name: 'AnnotationCanvas'
}
</script>

<script setup lang="ts">
import { ref, watch, onMounted, nextTick, computed, onUnmounted, h } from 'vue'
import { useI18n } from 'vue-i18n'
import { useEditorStore } from '../../../stores/editor'
import { useLabelStore } from '../../../stores/labelStore'
import { useAlignment } from '../composables/useAlignment'
import { storeToRefs } from 'pinia'
import type { Annotation, LabelSet, LabelItem } from '../../../types'
import { useMessage, NInput } from 'naive-ui'
import ContextMenu from './ContextMenu.vue'
import Magnifier from './Magnifier.vue'
import { useElementBounding, useMagicKeys } from '@vueuse/core'

defineOptions({
  name: 'AnnotationCanvas'
})

const props = defineProps<{
    activeLabelSet: LabelSet | null
}>()

const { t } = useI18n()
const store = useEditorStore()
const labelStore = useLabelStore()
const message = useMessage()
const { currentImage, currentAnnotations, selectedAnnotationId, currentTool, currentLabelId } = storeToRefs(store)
const { labelSets } = storeToRefs(labelStore)
const { alignmentLines, snapNode, snapPoint, clearLines } = useAlignment()

const sortedAnnotations = computed(() => {
    if (!currentAnnotations.value) return []
    const annotations = [...currentAnnotations.value]
    if (selectedAnnotationId.value) {
        const selectedIndex = annotations.findIndex(a => a.id === selectedAnnotationId.value)
        if (selectedIndex !== -1) {
            const [selected] = annotations.splice(selectedIndex, 1)
            if (selected) {
                annotations.push(selected)
            }
        }
    }
    return annotations
})

const wrapperRef = ref<HTMLDivElement | null>(null)
const stageRef = ref(null)
const transformerRef = ref(null)

const { z } = useMagicKeys()
const showMagnifier = ref(false)
const wrapperBounding = useElementBounding(wrapperRef)

if (z) {
    watch(z, (pressed) => {
        // Disable if typing
        const activeEl = document.activeElement
        if (activeEl instanceof HTMLInputElement || activeEl instanceof HTMLTextAreaElement) {
            showMagnifier.value = false
            return
        }
        showMagnifier.value = pressed
        
        // Hide/Show default cursor
        if (pressed) {
            document.body.style.cursor = 'none'
        } else {
            document.body.style.cursor = ''
        }
    })
}

const contextMenuRef = ref<HTMLDivElement | null>(null)

// Context Menu State
const showContextMenu = ref(false)
const contextMenuX = ref(0)
const contextMenuY = ref(0)
const contextMenuAnnotationId = ref<string | null>(null)

// Computed for current label name
const currentContextLabelName = computed(() => {
    if (!contextMenuAnnotationId.value) return ''
    const ann = currentAnnotations.value.find(a => a.id === contextMenuAnnotationId.value)
    if (!ann) return ''
    
    for(const set of labelSets.value) {
        const l = set.labels.find(lbl => lbl.id === ann.labelId)
        if (l) return l.name
    }
    return ''
})

// Get available labels for context menu
const availableLabels = computed(() => {
    let targetSet: LabelSet | null | undefined = props.activeLabelSet
    
    if (!targetSet) {
        if (contextMenuAnnotationId.value) {
             const ann = currentAnnotations.value.find(a => a.id === contextMenuAnnotationId.value)
             if (ann) {
                targetSet = labelSets.value.find(set => set.labels.some(l => l.id === ann.labelId))
             }
        }
        
        if (!targetSet && currentLabelId.value) {
            targetSet = labelSets.value.find(set => set.labels.some(l => l.id === currentLabelId.value))
        }
        
        if (!targetSet && labelSets.value.length > 0) {
            targetSet = labelSets.value[0]
        }
    }

    return targetSet ? targetSet.labels : []
})

const openContextMenu = (x: number, y: number, id: string) => {
    store.selectedAnnotationId = id
    contextMenuAnnotationId.value = id
    contextMenuX.value = x
    contextMenuY.value = y
    showContextMenu.value = true
}

const handleContextMenu = (e: any, id: string) => {
    // Prevent default browser context menu
    e.evt.preventDefault()
    openContextMenu(e.evt.clientX, e.evt.clientY, id)
}

const closeContextMenu = () => {
    showContextMenu.value = false
    contextMenuAnnotationId.value = null
}

const handleMenuSelect = (key: string) => {
    if (contextMenuAnnotationId.value) {
        // Find label
        let label: LabelItem | undefined
        
        // Check activeLabelSet first
        if (props.activeLabelSet) {
             label = props.activeLabelSet.labels.find(x => x.id === key)
        } else {
             // Fallback
            for(const set of labelSets.value) {
                label = set.labels.find(x => x.id === key)
                if (label) break
            }
        }
        
        if (label) {
            store.updateAnnotation(contextMenuAnnotationId.value, {
                labelId: key,
                color: label.color
            })
        }
    }
    // Do not close menu on select, allowing user to change mind or see result
}

const stageSize = computed(() => {
    const w = wrapperBounding.width.value || 800
    const h = wrapperBounding.height.value || 600
    const scale = store.stageConfig.scale
    return {
        width: w * scale,
        height: h * scale
    }
})
const groupConfig = ref({ x: 0, y: 0, scaleX: 1, scaleY: 1 })

const stageConfig = computed(() => ({
    width: stageSize.value.width,
    height: stageSize.value.height,
    scaleX: store.stageConfig.scale,
    scaleY: store.stageConfig.scale,
    x: store.stageConfig.x,
    y: store.stageConfig.y
}))

const magnifierConfig = computed(() => ({
    x: store.stageConfig.x + groupConfig.value.x * store.stageConfig.scale,
    y: store.stageConfig.y + groupConfig.value.y * store.stageConfig.scale,
    scale: store.stageConfig.scale * groupConfig.value.scaleX
}))

defineExpose({
    stageRef,
    transformerRef
})

const imageObj = ref<HTMLImageElement | null>(null)

// Drawing State
const isDrawing = ref(false)
const startPoint = ref({ x: 0, y: 0 })
const drawingShape = ref<{
    rect?: { x: number, y: number, width: number, height: number },
    circle?: { x: number, y: number, radius: number },
    points?: number[]
}>({})

const isHoveringStartPoint = ref(false)

const getPointPairs = (points: number[]) => {
    const pairs = []
    for (let i = 0; i < points.length; i += 2) {
        pairs.push({ x: points[i], y: points[i + 1] })
    }
    return pairs
}


// Watch selection change to clear editing state
watch(selectedAnnotationId, () => {
    editingPoints.value = null
})

// Helper to get editable points for any shape (Rect/Triangle/Polygon)
const getEditablePoints = (ann: Annotation) => {
    if (ann.type === 'rect' && ann.rect) {
        // Convert rect to 4 points (clockwise from top-left)
        const { x, y, width, height } = ann.rect
        return [x, y, x + width, y, x + width, y + height, x, y + height]
    } else if (ann.type === 'circle' && ann.rect) {
        // Generate 8 points around the circle
        const { x, y } = ann.rect
        const radius = ann.radius || 0
        const points = []
        for (let i = 0; i < 8; i++) {
            const angle = (i * 45) * (Math.PI / 180)
            points.push(x + radius * Math.cos(angle))
            points.push(y + radius * Math.sin(angle))
        }
        return points
    }
    return ann.points || []
}

const getDisplayCircle = (ann: Annotation) => {
    if (selectedAnnotationId.value === ann.id && editingPoints.value && editingPoints.value.length >= 16) {
        // Calculate center and radius from editingPoints
        // Point 0 (0 deg) and Point 4 (180 deg) are opposite
        const p0x = editingPoints.value[0] ?? 0
        const p0y = editingPoints.value[1] ?? 0
        const p4x = editingPoints.value[8] ?? 0
        const p4y = editingPoints.value[9] ?? 0
        
        const cx = (p0x + p4x) / 2
        const cy = (p0y + p4y) / 2
        
        // Radius is distance from center to P0
        const radius = Math.sqrt((p0x - cx) ** 2 + (p0y - cy) ** 2)
        
        return {
            x: cx,
            y: cy,
            radius: radius
        }
    }
    
    return {
        x: ann.rect?.x ?? 0,
        y: ann.rect?.y ?? 0,
        radius: ann.radius ?? 0
    }
}

const editingPoints = ref<number[] | null>(null)
const isShapeDragging = ref(false)
const isPreviewDragging = ref(false)

const draggingMidpointIndex = ref<number | null>(null)
const draggingMidpointPos = ref<{x: number, y: number} | null>(null)

const getDisplayPoints = (ann: Annotation) => {
    if (selectedAnnotationId.value === ann.id && editingPoints.value) {
        if (draggingMidpointIndex.value !== null && draggingMidpointPos.value) {
            const points = [...editingPoints.value]
            // Insert at index + 1 (after the start point of the segment)
            // draggingMidpointIndex is the index of the segment (0-based)
            // Segment 0 is between point 0 and 1. We want to insert after point 0.
            // Point 0 is at indices 0,1. Point 1 is at 2,3.
            // So insert at index 2.
            // Generally: insert at (index + 1) * 2
            const insertIdx = (draggingMidpointIndex.value + 1) * 2
            points.splice(insertIdx, 0, draggingMidpointPos.value.x, draggingMidpointPos.value.y)
            return points
        }
        return editingPoints.value
    }
    return getEditablePoints(ann)
}

const getPreviewPoints = (ann: Annotation) => {
    // If dragging the preview shape itself (which has Konva transform applied),
    // we must return the original points to avoid double-transform.
    // The "Preview Shape" is the one rendered in the selected template block.
    if (selectedAnnotationId.value === ann.id && isShapeDragging.value && isPreviewDragging.value) {
        return getEditablePoints(ann)
    }

    return getDisplayPoints(ann)
}

// 形状拖拽开始：初始化 editingPoints
const handleShapeDragStart = (e: any, annId: string) => {
    const ann = currentAnnotations.value.find(a => a.id === annId)
    if (ann) {
        isShapeDragging.value = true
        // Check if we are dragging the preview shape (identified by name or context)
        // The preview shape has name={`preview-${ann.id}`}
        const node = e.target
        const name = node.name()
        if (name === `preview-${ann.id}`) {
            isPreviewDragging.value = true
        } else {
            isPreviewDragging.value = false
        }
        editingPoints.value = [...getEditablePoints(ann)]
    }
}

// 形状拖拽移动：根据偏移量更新 editingPoints，实现锚点和 overlay 跟随
const handleStopPropagation = (e: any) => {
    e.cancelBubble = true
}

const getClampedTranslation = (ann: Annotation, dx: number, dy: number) => {
    if (!imageObj.value) return { dx, dy }
    const imgW = imageObj.value.width
    const imgH = imageObj.value.height
    
    let minDx = -Infinity, maxDx = Infinity
    let minDy = -Infinity, maxDy = Infinity
    
    if (ann.type === 'rect' && ann.rect) {
        const { x, y, width, height } = ann.rect
        minDx = -x
        maxDx = imgW - width - x
        minDy = -y
        maxDy = imgH - height - y
    } else if (ann.type === 'circle' && ann.rect) {
        const { x, y } = ann.rect
        const r = ann.radius || 0
        minDx = -(x - r)
        maxDx = imgW - (x + r)
        minDy = -(y - r)
        maxDy = imgH - (y + r)
    } else if (ann.points) {
        // Default range
        minDx = -Infinity
        maxDx = Infinity
        minDy = -Infinity
        maxDy = Infinity
        
        // Check all points
        for (let i = 0; i < ann.points.length; i += 2) {
            const px = ann.points[i] ?? 0
            const py = ann.points[i+1] ?? 0
            
            // px + dx >= 0  =>  dx >= -px
            minDx = Math.max(minDx, -px)
            
            // px + dx <= imgW  =>  dx <= imgW - px
            maxDx = Math.min(maxDx, imgW - px)
            
            minDy = Math.max(minDy, -py)
            maxDy = Math.min(maxDy, imgH - py)
        }
    }
    
    if (maxDx < minDx) maxDx = minDx
    if (maxDy < minDy) maxDy = minDy
    
    return {
        dx: Math.max(minDx, Math.min(dx, maxDx)),
        dy: Math.max(minDy, Math.min(dy, maxDy))
    }
}

const handleShapeDragMove = (e: any, annId: string) => {
    // Snap to grid/objects
    snapNode(e, groupConfig.value.scaleX)

    const node = e.target
    const ann = currentAnnotations.value.find(a => a.id === annId)
    if (!ann) return
    
    let dx = 0
    let dy = 0
    
    if (ann.type === 'rect' && ann.rect) {
        dx = node.x() - ann.rect.x
        dy = node.y() - ann.rect.y
    } else if (ann.type === 'circle' && ann.rect) {
        dx = node.x() - ann.rect.x
        dy = node.y() - ann.rect.y
    } else {
        dx = node.x()
        dy = node.y()
    }
    
    const clamped = getClampedTranslation(ann, dx, dy)
    dx = clamped.dx
    dy = clamped.dy
    
    const originalPoints = getEditablePoints(ann)
    const newPoints = []
    
    for(let i=0; i<originalPoints.length; i+=2) {
        const px = originalPoints[i] ?? 0
        const py = originalPoints[i+1] ?? 0
        newPoints.push(px + dx)
        newPoints.push(py + dy)
    }
    
    editingPoints.value = newPoints
}


// Auto-insert vertices if segment > 40px (visual)
const densifyPolygon = (points: number[]) => {
    if (!points || points.length < 6) return points
    
    const newPoints: number[] = []
    const count = points.length / 2
    // Threshold: 40px in screen coordinates
    const threshold = 40 / groupConfig.value.scaleX
    
    for (let i = 0; i < count; i++) {
        const x1 = points[i * 2] ?? 0
        const y1 = points[i * 2 + 1] ?? 0
        const nextIdx = (i + 1) % count
        const x2 = points[nextIdx * 2] ?? 0
        const y2 = points[nextIdx * 2 + 1] ?? 0
        
        newPoints.push(x1, y1)
        
        const dx = x2 - x1
        const dy = y2 - y1
        const dist = Math.sqrt(dx * dx + dy * dy)
        
        // If segment is long, insert midpoint
        if (dist > threshold) {
            newPoints.push((x1 + x2) / 2, (y1 + y2) / 2)
        }
    }
    return newPoints
}

// Check and add midpoint for specific segment if > 40px
const densifySegment = (points: number[], idx1: number, idx2: number) => {
    const threshold = 40 / groupConfig.value.scaleX
    
    const x1 = points[idx1 * 2] ?? 0
    const y1 = points[idx1 * 2 + 1] ?? 0
    const x2 = points[idx2 * 2] ?? 0
    const y2 = points[idx2 * 2 + 1] ?? 0
    
    const dx = x2 - x1
    const dy = y2 - y1
    const dist = Math.sqrt(dx * dx + dy * dy)
    
    if (dist > threshold) {
        // Return the midpoint
        return { x: (x1 + x2) / 2, y: (y1 + y2) / 2 }
    }
    return null
}

// 拖拽结束：更新 store
const handleDragEnd = (e: any, annId: string) => {
    clearLines()
    const node = e.target
    const ann = currentAnnotations.value.find(a => a.id === annId)
    if (!ann) return
    
    let dx = 0
    let dy = 0
    
    if (ann.type === 'rect' && ann.rect) {
        dx = node.x() - ann.rect.x
        dy = node.y() - ann.rect.y
    } else if (ann.type === 'circle' && ann.rect) {
        dx = node.x() - ann.rect.x
        dy = node.y() - ann.rect.y
    } else {
        dx = node.x()
        dy = node.y()
    }
    
    const clamped = getClampedTranslation(ann, dx, dy)
    dx = clamped.dx
    dy = clamped.dy
    
    if (ann.type === 'rect' && ann.rect) {
        store.updateAnnotation(annId, { 
            rect: { 
                ...ann.rect,
                x: ann.rect.x + dx,
                y: ann.rect.y + dy
            }
        })
        node.position({x: ann.rect.x + dx, y: ann.rect.y + dy})
    } else if (ann.type === 'circle' && ann.rect) {
        store.updateAnnotation(annId, { 
            rect: { 
                ...ann.rect,
                x: ann.rect.x + dx,
                y: ann.rect.y + dy
            }
        })
        node.position({x: ann.rect.x + dx, y: ann.rect.y + dy})
    } else if (ann.points) {
        const newPoints = ann.points.map((val, i) => {
            return i % 2 === 0 ? val + dx : val + dy
        })
        
        // Reset node position to 0,0 since we updated points absolute coordinates
        node.position({x: 0, y: 0})
        
        if (ann.type === 'polygon') {
             // const densified = densifyPolygon(newPoints)
             store.updateAnnotation(annId, { points: newPoints })
        } else {
             store.updateAnnotation(annId, { points: newPoints })
        }
    }
    
    editingPoints.value = null
    isShapeDragging.value = false
}

const handleVertexRightClick = (e: any, annId: string, index: number) => {
    // 阻止事件冒泡和默认菜单
    e.evt.preventDefault()
    e.cancelBubble = true
    
    // 如果是双击事件，Konva 的 dblclick 也会触发，这里统一处理逻辑
    deleteVertex(annId, index)
}

const handleVertexDblClick = (e: any, annId: string, index: number) => {
    e.cancelBubble = true
    deleteVertex(annId, index)
}

const deleteVertex = (annId: string, index: number) => {
    const ann = currentAnnotations.value.find(a => a.id === annId)
    if (!ann) return
    
    // 仅支持删除多边形/三角形的顶点（矩形和圆形有固定的几何逻辑）
    if (ann.type === 'rect' || ann.type === 'circle') {
        message.warning('无法删除矩形或圆形的顶点，请先转换为多边形')
        return
    }
    
    // 获取当前实际的点数组（优先使用 store 中的数据，避免编辑过程中的临时状态干扰）
    const currentPoints = ann.points
    if (!currentPoints) return
    
    // 检查最少顶点约束（3个点 = 6个坐标值）
    if (currentPoints.length <= 6) {
        // message.warning('多边形至少需要保留3个顶点')
        return
    }
    
    // 创建新的点数组
    const newPoints = [...currentPoints]
    
    // 删除指定索引处的 x 和 y 坐标
    // index 是顶点索引 (0, 1, 2...), 所以坐标索引是 index * 2
    newPoints.splice(index * 2, 2)
    
    store.updateAnnotation(annId, { points: newPoints })
    
    // 强制重置编辑状态，确保视图刷新
    editingPoints.value = null
}

const handleAnchorDragStart = (e: any, annId: string) => {
    e.cancelBubble = true
    const ann = currentAnnotations.value.find(a => a.id === annId)
    if (ann) {
        editingPoints.value = [...getEditablePoints(ann)]
    }
}

const handleAnchorDragMove = (e: any, annId: string, index: number) => {
    e.cancelBubble = true
    const node = e.target
    if (!editingPoints.value) return

    const ann = currentAnnotations.value.find(a => a.id === annId)
    if (!ann) return

    // Update local state for smooth preview
    const newPoints = [...editingPoints.value]
    
    // Clamp mouse position
    let nx = node.x()
    let ny = node.y()
    const clamped = clampToImage(nx, ny)

    // Snap to other objects
    const snapped = snapPoint(clamped, node.getParent(), annId, groupConfig.value.scaleX)
    nx = snapped.x
    ny = snapped.y

    // Update node position for visual feedback
    node.x(nx)
    node.y(ny)
    
    if (ann.type === 'rect') {
        // Rectangle constrained resizing logic
        // index: 0=TL, 1=TR, 2=BR, 3=BL
        // fixedIndex: 2, 3, 0, 1 (Opposite corner)
        const fixedIndex = (index + 2) % 4
        const fixedX = newPoints[fixedIndex * 2] ?? 0
        const fixedY = newPoints[fixedIndex * 2 + 1] ?? 0
        
        const currentX = nx
        const currentY = ny
        
        // Calculate new bounding box
        const x = Math.min(fixedX, currentX)
        const y = Math.min(fixedY, currentY)
        const w = Math.abs(fixedX - currentX)
        const h = Math.abs(fixedY - currentY)
        
        // Update all 4 points to form the new rectangle
        // TL
        newPoints[0] = x
        newPoints[1] = y
        // TR
        newPoints[2] = x + w
        newPoints[3] = y
        // BR
        newPoints[4] = x + w
        newPoints[5] = y + h
        // BL
        newPoints[6] = x
        newPoints[7] = y + h
    } else if (ann.type === 'circle' && ann.rect) {
        // Circle resizing logic
        const cx = ann.rect.x
        const cy = ann.rect.y
        const dx = nx - cx
        const dy = ny - cy
        let newRadius = Math.sqrt(dx*dx + dy*dy)
        
        // Limit radius to fit in image
        const imgW = imageObj.value?.width ?? 0
        const imgH = imageObj.value?.height ?? 0
        
        // The circle must stay within [0,0] to [imgW, imgH]
        // x range: [cx - r, cx + r], y range: [cy - r, cy + r]
        const maxRadiusX = Math.min(cx, imgW - cx)
        const maxRadiusY = Math.min(cy, imgH - cy)
        const maxAllowedRadius = Math.min(maxRadiusX, maxRadiusY)
        
        newRadius = Math.min(newRadius, maxAllowedRadius)
        
        // Update all 8 points based on new radius
        for (let i = 0; i < 8; i++) {
            const angle = (i * 45) * (Math.PI / 180)
            newPoints[i * 2] = cx + newRadius * Math.cos(angle)
            newPoints[i * 2 + 1] = cy + newRadius * Math.sin(angle)
        }

        // Sync node position with the constrained point
        const constrainedX = newPoints[index * 2]
        const constrainedY = newPoints[index * 2 + 1]
        node.x(constrainedX)
        node.y(constrainedY)
    } else {
        newPoints[index * 2] = nx
        newPoints[index * 2 + 1] = ny
    }
    
    editingPoints.value = newPoints
}

const handleAnchorDragEnd = (e: any, annId: string, index: number) => {
    e.cancelBubble = true
    clearLines()
    const node = e.target
    const ann = currentAnnotations.value.find(a => a.id === annId)
    if (!ann) return
    
    let nx = node.x()
    let ny = node.y()
    const clamped = clampToImage(nx, ny)
    nx = clamped.x
    ny = clamped.y
    
    // Also reset the anchor position visually to clamped position?
    // The anchor will be redrawn based on store update.
    // But we should update the node position to match clamped value if we want to be precise,
    // though the store update will trigger re-render anyway.
    
    let points: number[] = []
    
    // Finalize update
    if (ann.type === 'rect' && ann.rect && editingPoints.value) {
        // Use the calculated points from dragmove (stored in editingPoints) to update rect
        // Since we updated all points in dragmove, we can just take the bounding box
        const xs = [
            editingPoints.value[0] ?? 0, 
            editingPoints.value[2] ?? 0, 
            editingPoints.value[4] ?? 0, 
            editingPoints.value[6] ?? 0
        ]
        const ys = [
            editingPoints.value[1] ?? 0, 
            editingPoints.value[3] ?? 0, 
            editingPoints.value[5] ?? 0, 
            editingPoints.value[7] ?? 0
        ]
        
        const minX = Math.min(...xs)
        const minY = Math.min(...ys)
        const maxX = Math.max(...xs)
        const maxY = Math.max(...ys)
        
        store.updateAnnotation(annId, { 
            rect: {
                x: minX,
                y: minY,
                width: maxX - minX,
                height: maxY - minY
            }
        })
    } else if (ann.type === 'circle' && ann.rect && editingPoints.value) {
        // Calculate final radius from the first point
        const cx = ann.rect.x
        const cy = ann.rect.y
        const px = editingPoints.value[0] ?? 0
        const py = editingPoints.value[1] ?? 0
        const radius = Math.sqrt((px - cx) ** 2 + (py - cy) ** 2)
        
        store.updateAnnotation(annId, { radius: radius })
    } else if (ann.points) {
        points = [...ann.points]
        // Update specific vertex
        points[index * 2] = nx
        points[index * 2 + 1] = ny
        
        if (ann.type === 'polygon') {
             // Local densify: Check prev and next segments
             const count = points.length / 2
             const prevIdx = (index - 1 + count) % count
             const nextIdx = (index + 1) % count
             
             // We need to handle insertions carefully because inserting changes indices
             // Let's check next segment first (index -> nextIdx)
             // Then check prev segment (prevIdx -> index)
             
             // 1. Check current -> next
             const midNext = densifySegment(points, index, nextIdx)
             // 2. Check prev -> current
             const midPrev = densifySegment(points, prevIdx, index)
             
             let newPoints = [...points]
             let offset = 0
             
             if (midNext) {
                 // Insert after index
                 // If nextIdx is 0 (loop around), we append to end (or splice at end)
                 // Actually splice works with index + 1
                 // But wait, if index is last element, nextIdx is 0. 
                 // Splice at (index + 1) * 2 works for appending.
                 
                 // However, we should be careful if we have multiple insertions
                 // Let's rebuild the array or use splice with offset
                 
                 // Insert after current index
                 // Position: (index + 1) * 2
                 newPoints.splice((index + 1) * 2, 0, midNext.x, midNext.y)
                 offset = 1 // We added 1 point (2 coords)
             }
             
             if (midPrev) {
                 // Insert after prevIdx
                 // If prevIdx is last element (loop around), we insert after it.
                 // Position: (prevIdx + 1) * 2
                 
                 // Special case: if prevIdx is the last element, (prevIdx + 1) * 2 is end of array.
                 // If we inserted midNext (and index was not last), indices shifted?
                 
                 // Let's simpler logic:
                 // Construct new array
                 
                 const finalPoints: number[] = []
                  for (let i = 0; i < count; i++) {
                      finalPoints.push(points[i*2] ?? 0, points[i*2+1] ?? 0)
                      
                      // Check if we need to add after i
                      if (i === index && midNext) {
                          finalPoints.push(midNext.x, midNext.y)
                      }
                      if (i === prevIdx && midPrev) {
                          finalPoints.push(midPrev.x, midPrev.y)
                      }
                  }
                 newPoints = finalPoints
             }
             
             points = newPoints
        }

        store.updateAnnotation(annId, { points: points })
    }
    
    editingPoints.value = null
}

// 辅助函数：计算点到线段的距离和投影点
const pointToSegmentDistance = (p: {x: number, y: number}, v: {x: number, y: number}, w: {x: number, y: number}) => {
    const l2 = (v.x - w.x) ** 2 + (v.y - w.y) ** 2
    if (l2 === 0) return { dist: Math.sqrt((p.x - v.x) ** 2 + (p.y - v.y) ** 2), proj: v }
    
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2
    t = Math.max(0, Math.min(1, t))
    
    const proj = { x: v.x + t * (w.x - v.x), y: v.y + t * (w.y - v.y) }
    const dist = Math.sqrt((p.x - proj.x) ** 2 + (p.y - proj.y) ** 2)
    return { dist, proj }
}

// 多边形边双击添加顶点
const handleLineDblClick = (e: any, annId: string) => {
    if (showMagnifier.value) return
    
    const ann = currentAnnotations.value.find(a => a.id === annId)
    if (!ann || ann.type !== 'polygon') return
    
    const node = e.target
    const stage = node.getStage()
    const pointer = stage.getPointerPosition()
    if (!pointer) return

    // 获取相对于 group 的坐标
    const transform = node.getAbsoluteTransform().copy()
    transform.invert()
    const pos = transform.point(pointer)
    
    const points = ann.points || []
    if (points.length < 6) return
    
    // 1. Fuzzy Delete Check (8px threshold)
    const deleteThreshold = 8 / groupConfig.value.scaleX
    for (let i = 0; i < points.length / 2; i++) {
        const px = points[i * 2] ?? 0
        const py = points[i * 2 + 1] ?? 0
        const dist = Math.sqrt((pos.x - px) ** 2 + (pos.y - py) ** 2)
        if (dist < deleteThreshold) {
            handleVertexDblClick(e, annId, i)
            return
        }
    }
    
    // 2. Add Point Logic
    let minDistance = Infinity
    let insertIndex = -1
    let insertPoint = { x: 0, y: 0 }
    
    const count = points.length / 2
    for (let i = 0; i < count; i++) {
        const p1 = { x: points[i * 2] ?? 0, y: points[i * 2 + 1] ?? 0 }
        const p2 = { 
            x: points[((i + 1) % count) * 2] ?? 0, 
            y: points[((i + 1) % count) * 2 + 1] ?? 0
        }
        
        const { dist, proj } = pointToSegmentDistance(pos, p1, p2)
        
        if (dist < minDistance) {
            minDistance = dist
            insertIndex = i + 1
            insertPoint = proj
        }
    }
    
    let newPoints = [...points]
    newPoints.splice(insertIndex * 2, 0, insertPoint.x, insertPoint.y)
    
    // 3. Densify (Removed global densify, just add one point)
    // newPoints = densifyPolygon(newPoints)
    
    store.updateAnnotation(annId, { points: newPoints })
}



// Load Image Logic
watch(() => currentImage.value?.url, (newUrl) => {
    if (newUrl) {
        const img = new Image()
        img.onload = () => {
            imageObj.value = img
            fitImage()
        }
        img.src = newUrl
    } else {
        imageObj.value = null
    }
}, { immediate: true })

// Fit Image to Wrapper
const fitImage = () => {
    if (!wrapperRef.value || !imageObj.value) return
    const w = wrapperRef.value.clientWidth
    const h = wrapperRef.value.clientHeight

    const imgW = imageObj.value.width
    const imgH = imageObj.value.height
    
    // Calculate scale to fit image within canvas (contain)
    let scale = Math.min(w / imgW, h / imgH)
    
    // If image is smaller than canvas (scale > 1), use original size (scale = 1)
    if (scale > 1) {
        scale = 1
    }
    
    groupConfig.value = {
        scaleX: scale,
        scaleY: scale,
        x: (w - imgW * scale) / 2,
        y: (h - imgH * scale) / 2
    }
}

// Handle Delete Key
const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.key === 'Backspace' || e.key === 'Delete') && selectedAnnotationId.value) {
        store.removeAnnotation(selectedAnnotationId.value)
    }
}

// Handle Esc Shortcut
const handleEsc = () => {
    if (isDrawing.value) {
        isDrawing.value = false
        drawingShape.value = {}
    }
    // Also cancel any dragging operations
    editingPoints.value = null
}

onMounted(() => {
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('shortcut-esc', handleEsc)
    if (wrapperRef.value) {
        const observer = new ResizeObserver(() => {
            fitImage()
        })
        observer.observe(wrapperRef.value)
    }
})

onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown)
    window.removeEventListener('shortcut-esc', handleEsc)
})

const clampToImage = (x: number, y: number) => {
    if (!imageObj.value) return { x, y }
    const w = imageObj.value.width
    const h = imageObj.value.height
    return {
        x: Math.max(0, Math.min(x, w)),
        y: Math.max(0, Math.min(y, h))
    }
}

const isPanning = ref(false)
const panningStart = ref({ x: 0, y: 0 })

// Stage Events for Drawing
const handleStageMouseDown = (e: any) => {
    // Block interactions if magnifier is active
    if (showMagnifier.value) return

    // Check for Right Click (button 2) for Panning
    if (e.evt.button === 2) {
        e.evt.preventDefault() // Prevent context menu on start
        isPanning.value = true
        panningStart.value = { 
            x: e.evt.clientX, 
            y: e.evt.clientY 
        }
        return
    }

    if (!currentTool.value || !imageObj.value) return
    
    // Check if there are labels available
    let hasAvailableLabels = false
    if (props.activeLabelSet) {
        hasAvailableLabels = props.activeLabelSet.labels.length > 0
    } else {
        hasAvailableLabels = labelSets.value.some(s => s.labels.length > 0)
    }
    
    if (!hasAvailableLabels) {
        message.warning(t('annotation.noLabels'))
        return
    }

    if (selectedAnnotationId.value) {
        store.selectedAnnotationId = null
    }

    isDrawing.value = true
    const stage = e.target.getStage()
    const pointer = stage.getPointerPosition()
    
    // Transform pointer to image coordinates
    let x = (pointer.x - groupConfig.value.x) / groupConfig.value.scaleX
    let y = (pointer.y - groupConfig.value.y) / groupConfig.value.scaleY
    
    // Clamp to image bounds
    const clamped = clampToImage(x, y)
    x = clamped.x
    y = clamped.y
    
    startPoint.value = { x, y }

    if (currentTool.value === 'rect') {
        drawingShape.value = { rect: { x, y, width: 0, height: 0 } }
    } else if (currentTool.value === 'circle') {
        drawingShape.value = { circle: { x, y, radius: 0 } }
    } else if (currentTool.value === 'triangle' || currentTool.value === 'polygon') {
        // Add point
        if (!drawingShape.value.points) {
            drawingShape.value = { points: [x, y] }
        } else {
            // Check if closing polygon
            if (currentTool.value === 'polygon' && drawingShape.value.points.length >= 6) {
                const firstX = drawingShape.value.points[0] ?? 0
                const firstY = drawingShape.value.points[1] ?? 0
                const dist = Math.sqrt((x - firstX) ** 2 + (y - firstY) ** 2)
                if (dist < 10 / groupConfig.value.scaleX) {
                    finishDrawing()
                    return
                }
            }
            drawingShape.value.points.push(x, y)
        }
    }
}

const handleStageMouseMove = (e: any) => {
    if (!isDrawing.value && !drawingShape.value.points) return // Only track if drawing rect/circle or polygon started
    if (!imageObj.value) return
    
    const stage = e.target.getStage()
    const pointer = stage.getPointerPosition()
    let x = (pointer.x - groupConfig.value.x) / groupConfig.value.scaleX
    let y = (pointer.y - groupConfig.value.y) / groupConfig.value.scaleY

    // Clamp to image bounds
    const clamped = clampToImage(x, y)
    x = clamped.x
    y = clamped.y

    if (isDrawing.value) {
        if (currentTool.value === 'rect' && drawingShape.value.rect) {
            const w = x - startPoint.value.x
            const h = y - startPoint.value.y
            drawingShape.value.rect.width = w
            drawingShape.value.rect.height = h
        } else if (currentTool.value === 'circle' && drawingShape.value.circle) {
            const dx = x - startPoint.value.x
            const dy = y - startPoint.value.y
            let r = Math.sqrt(dx * dx + dy * dy)
            
            // Limit radius to fit in image
            const imgW = imageObj.value?.width ?? 0
            const imgH = imageObj.value?.height ?? 0
            const cx = startPoint.value.x
            const cy = startPoint.value.y
            
            // The circle must stay within [0,0] to [imgW, imgH]
            // Distance to nearest edge
            const maxRadius = Math.min(cx, imgW - cx, cy, imgH - cy)
            
            drawingShape.value.circle.radius = Math.min(r, maxRadius)
        }
    }
    
    // For Polygon closing hint
    if (currentTool.value === 'polygon' && drawingShape.value.points && drawingShape.value.points.length >= 6) {
        const firstX = drawingShape.value.points[0] ?? 0
        const firstY = drawingShape.value.points[1] ?? 0
        const dist = Math.sqrt((x - firstX) ** 2 + (y - firstY) ** 2)
        isHoveringStartPoint.value = dist < 10 / groupConfig.value.scaleX
    }
}

const handleStageMouseUp = () => {
    if (!isDrawing.value) return
    
    if (currentTool.value === 'rect' || currentTool.value === 'circle') {
        finishDrawing()
    } else if (currentTool.value === 'triangle') {
        if (drawingShape.value.points && drawingShape.value.points.length >= 6) {
            finishDrawing()
        }
    }
    // Polygon finishes on click start point (handled in mousedown)
}

const finishDrawing = () => {
    // Check if label list is empty
    if (!props.activeLabelSet || props.activeLabelSet.labels.length === 0) {
        // If there are other label sets, we might fallback, but if total labels are 0, warn
        let hasAnyLabels = labelSets.value.some(s => s.labels.length > 0)
        
        if (!hasAnyLabels) {
             message.warning(t('annotation.noLabels'))
             isDrawing.value = false
             drawingShape.value = {}
             return
        }
    }

    // Determine label color
    let color = '#000000'
    let targetLabelId = currentLabelId.value

    // If no current label selected (empty default), try to pick first available
    if (!targetLabelId) {
         if (props.activeLabelSet && props.activeLabelSet.labels.length > 0) {
             const firstLabel = props.activeLabelSet.labels[0]
             if (firstLabel) {
                targetLabelId = firstLabel.id
                color = firstLabel.color
             }
         } else {
             // Find first available in any set
             for(const set of labelSets.value) {
                 if (set.labels.length > 0) {
                     const firstLabel = set.labels[0]
                     if (firstLabel) {
                        targetLabelId = firstLabel.id
                        color = firstLabel.color
                        break
                     }
                 }
             }
         }
    } else {
        // Check activeLabelSet first
        if (props.activeLabelSet) {
            const l = props.activeLabelSet.labels.find(x => x.id === targetLabelId)
            if (l) color = l.color
        } else {
            // Fallback
            for(const set of labelSets.value) {
                const l = set.labels.find(x => x.id === targetLabelId)
                if (l) {
                    color = l.color
                    break
                }
            }
        }
    }
    
    // If still no label ID found (should be caught by empty check above, but safe guard)
    if (!targetLabelId) {
         message.warning(t('annotation.selectLabelFirst'))
         isDrawing.value = false
         drawingShape.value = {}
         return
    }

    const newAnn: Annotation = {
        id: crypto.randomUUID(),
        type: currentTool.value as any,
        labelId: targetLabelId,
        color: color
    }

    if (currentTool.value === 'rect' && drawingShape.value.rect) {
        // Normalize rect
        const { x, y, width, height } = drawingShape.value.rect
        // Min size check (e.g. 5px)
        if (Math.abs(width) < 5 || Math.abs(height) < 5) {
             isDrawing.value = false
             drawingShape.value = {}
             return
        }
        
        newAnn.rect = {
            x: width < 0 ? x + width : x,
            y: height < 0 ? y + height : y,
            width: Math.abs(width),
            height: Math.abs(height)
        }
    } else if (currentTool.value === 'circle' && drawingShape.value.circle) {
        // Min radius check (e.g. 3px)
        if ((drawingShape.value.circle.radius || 0) < 3) {
             isDrawing.value = false
             drawingShape.value = {}
             return
        }
        
        newAnn.rect = { 
            x: drawingShape.value.circle.x, 
            y: drawingShape.value.circle.y, 
            width: 0, height: 0 
        }
        newAnn.radius = drawingShape.value.circle.radius
    } else if ((currentTool.value === 'triangle' || currentTool.value === 'polygon') && drawingShape.value.points) {
        let points = [...drawingShape.value.points]
        newAnn.points = points
    }

    store.addAnnotation(newAnn)
    
    isDrawing.value = false
    drawingShape.value = {}

    // Auto-select the newly created annotation and show menu
    nextTick(() => {
        store.selectedAnnotationId = newAnn.id
        
        // Show context menu
        const stage = (stageRef.value as any)?.getStage()
        if (stage) {
            const pointer = stage.getPointerPosition()
            if (pointer) {
                // Get stage container position
                const container = stage.container()
                const rect = container.getBoundingClientRect()
                
                const menuX = rect.left + pointer.x
                const menuY = rect.top + pointer.y
                
                openContextMenu(menuX, menuY, newAnn.id)
            }
        }
    })
}

const handleSelect = (e: any, id: string) => {
    // Block selection if magnifier is active
    if (showMagnifier.value) return

    e.cancelBubble = true
    store.selectedAnnotationId = id
}

// Helper for drag bound func (limit to stage)
const getDragBoundFunc = (ann: Annotation) => {
    return function(this: any, pos: { x: number, y: number }) {
        if (!imageObj.value) return pos
        const imgW = imageObj.value.width
        const imgH = imageObj.value.height
        
        const node = this
        const group = node.getParent()
        if (!group) return pos
        
        // Convert absolute pos to local pos (relative to group)
        const transform = group.getAbsoluteTransform()
        const localPos = transform.copy().invert().point(pos)
        
        let minX = 0, maxX = 0, minY = 0, maxY = 0
        
        if (ann.type === 'rect' && ann.rect) {
            minX = localPos.x
            maxX = localPos.x + ann.rect.width
            minY = localPos.y
            maxY = localPos.y + ann.rect.height
        } else if (ann.type === 'circle' && ann.rect) {
             const r = ann.radius || 0
             minX = localPos.x - r
             maxX = localPos.x + r
             minY = localPos.y - r
             maxY = localPos.y + r
        } else if (ann.points) {
            let pMinX = Infinity, pMaxX = -Infinity, pMinY = Infinity, pMaxY = -Infinity
            for (let i = 0; i < ann.points.length; i += 2) {
                const px = ann.points[i] ?? 0
                const py = ann.points[i+1] ?? 0
                pMinX = Math.min(pMinX, px)
                pMaxX = Math.max(pMaxX, px)
                pMinY = Math.min(pMinY, py)
                pMaxY = Math.max(pMaxY, py)
            }
            
            minX = pMinX + localPos.x
            maxX = pMaxX + localPos.x
            minY = pMinY + localPos.y
            maxY = pMaxY + localPos.y
        } else {
            return pos
        }
        
        // Check bounds
        let validX = localPos.x
        let validY = localPos.y
        
        if (minX < 0) {
            validX += (0 - minX)
        } else if (maxX > imgW) {
            validX += (imgW - maxX)
        }
        
        if (minY < 0) {
            validY += (0 - minY)
        } else if (maxY > imgH) {
            validY += (imgH - maxY)
        }
        
        return transform.point({ x: validX, y: validY })
    }
}

// Helper for anchor drag bound func (limit to image area)
const getAnchorDragBoundFunc = () => {
    return function(this: any, pos: { x: number, y: number }) {
        const node = this
        // Check if image is loaded
        if (!imageObj.value) return pos

        // Get parent (Group)
        const group = node.getParent()
        if (!group) return pos
        
        // Convert absolute pos to local pos (relative to group)
        // We need to invert the group's absolute transform to get local coordinates
        const transform = group.getAbsoluteTransform()
        const localPos = transform.copy().invert().point(pos)
        
        const imgW = imageObj.value.width
        const imgH = imageObj.value.height
        
        const clampedX = Math.max(0, Math.min(localPos.x, imgW))
        const clampedY = Math.max(0, Math.min(localPos.y, imgH))
        
        // Convert back to absolute pos
        return transform.point({ x: clampedX, y: clampedY })
    }
}

// Transformer Watcher
watch(selectedAnnotationId, (newId) => {
  const transformer = (transformerRef.value as any)?.getNode()
  const stage = (stageRef.value as any)?.getStage()
  
  if (!transformer || !stage) return

  if (newId) {
    // Find the node in the group
    // The group is inside layer.
    // Node name is the ID.
    // const group = stage.find('Group')[0] // Assuming first group is ours
    // const selectedNode = group.findOne('.' + newId) // name selector
    
    // Only attach transformer for Circle
    // const ann = currentAnnotations.value.find(a => a.id === newId)
    // We handle resize manually for all shapes now, so no transformer needed?
    // Actually, user wants "points drag", so maybe no transformer.
    // Let's keep it disabled for now as we have custom handles.
    transformer.nodes([]) 
  } else {
    transformer.nodes([])
    transformer.getLayer().batchDraw()
  }
})
</script>

<style scoped>
.custom-context-menu {
    position: fixed;
    background: white;
    border: 1px solid #eee;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    border-radius: 4px;
    z-index: 1000;
    min-width: 200px;
    display: flex;
    flex-direction: column;
}

.menu-header {
    padding: 8px;
    border-bottom: 1px solid #f0f0f0;
}

.menu-list {
    max-height: 200px;
    overflow-y: auto;
    padding: 4px 0;
}

.menu-item {
    display: flex;
    align-items: center;
    padding: 6px 12px;
    cursor: pointer;
    transition: background-color 0.2s;
    gap: 8px;
    font-size: 13px;
    color: #333;
}

.menu-item:hover {
    background-color: #f5f5f5;
}

.color-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    flex-shrink: 0;
}

.menu-empty {
    padding: 12px;
    text-align: center;
    color: #999;
    font-size: 12px;
}

/* Custom Scrollbar for Canvas Wrapper to ensure it's always visible */
.canvas-wrapper::-webkit-scrollbar {
    width: 12px;
    height: 12px;
    background-color: #f5f5f5;
}

.canvas-wrapper::-webkit-scrollbar-track {
    -webkit-box-shadow: inset 0 0 6px rgba(0,0,0,0.1);
    border-radius: 10px;
    background-color: #f5f5f5;
}

.canvas-wrapper::-webkit-scrollbar-thumb {
    border-radius: 10px;
    -webkit-box-shadow: inset 0 0 6px rgba(0,0,0,.3);
    background-color: #c1c1c1;
}

.canvas-wrapper::-webkit-scrollbar-thumb:hover {
    background-color: #a8a8a8;
}

.canvas-wrapper::-webkit-scrollbar-corner {
    background-color: #f5f5f5;
}
</style>