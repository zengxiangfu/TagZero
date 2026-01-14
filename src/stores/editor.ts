import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Annotation, ImageFile, ShapeType } from '../types'

export const useEditorStore = defineStore('editor', () => {
  // State
  const images = ref<ImageFile[]>([])
  const currentImageId = ref<string | null>(null)
  const selectedAnnotationId = ref<string | null>(null)
  const currentLabelId = ref<string | null>(null) // Currently selected label for drawing
  const currentTool = ref<ShapeType>('rect')
  
  const stageConfig = ref({
    scale: 1,
    x: 0,
    y: 0
  })
  const isDrawing = ref(false)

  // History Stacks
  const undoStack = ref<string[]>([])
  const redoStack = ref<string[]>([])

  // Helper to save state for undo
  function saveState() {
    if (!currentImage.value) return
    // Deep clone current annotations
    const state = JSON.stringify(currentImage.value.annotations)
    undoStack.value.push(state)
    // Clear redo stack on new action
    redoStack.value = []
    // Limit stack size if needed (e.g. 50)
    if (undoStack.value.length > 50) {
      undoStack.value.shift()
    }
  }

  // Getters
  const currentImage = computed(() => 
    images.value.find(img => img.id === currentImageId.value) || null
  )

  const currentAnnotations = computed(() => 
    currentImage.value?.annotations || []
  )

  // Actions
  function addImages(newImages: ImageFile[]) {
    images.value.push(...newImages)
    if (!currentImageId.value && newImages.length > 0) {
      const first = newImages[0]
      if (first) {
        currentImageId.value = first.id
      }
    }
  }

  function selectImage(id: string) {
    currentImageId.value = id
    selectedAnnotationId.value = null
    // Reset stage transform when switching images? Maybe not, depends on UX.
    // Let's keep it for now but maybe reset if image size differs significantly.
    stageConfig.value = { scale: 1, x: 0, y: 0 } 
    // Clear history on image switch? Usually yes for per-image history
    undoStack.value = []
    redoStack.value = []
  }

  function addAnnotation(annotation: Annotation) {
    if (currentImage.value) {
      saveState()
      currentImage.value.annotations.push(annotation)
    }
  }

  function updateAnnotation(id: string, updates: Partial<Annotation>) {
    if (currentImage.value) {
      const index = currentImage.value.annotations.findIndex(a => a.id === id)
      if (index !== -1) {
        // Only save state if not a transient update (like dragging)? 
        // For now, save everything or let the caller handle it.
        // To avoid too many states during drag, we might need a separate 'commit' action.
        // But for simplicity, we'll assume this is called on dragEnd.
        saveState()
        currentImage.value.annotations[index] = {
          ...currentImage.value.annotations[index],
          ...updates
        } as Annotation
      }
    }
  }

  function removeAnnotation(id: string) {
    if (currentImage.value) {
      saveState()
      currentImage.value.annotations = currentImage.value.annotations.filter(a => a.id !== id)
      if (selectedAnnotationId.value === id) {
        selectedAnnotationId.value = null
      }
    }
  }

  function undo() {
    if (undoStack.value.length === 0 || !currentImage.value) return
    
    // Save current state to redo stack
    const currentState = JSON.stringify(currentImage.value.annotations)
    redoStack.value.push(currentState)
    
    // Pop from undo stack
    const prevState = undoStack.value.pop()
    if (prevState) {
      currentImage.value.annotations = JSON.parse(prevState)
      selectedAnnotationId.value = null // Deselect to avoid issues
    }
  }

  function redo() {
    if (redoStack.value.length === 0 || !currentImage.value) return
    
    // Save current state to undo stack
    const currentState = JSON.stringify(currentImage.value.annotations)
    undoStack.value.push(currentState)
    
    // Pop from redo stack
    const nextState = redoStack.value.pop()
    if (nextState) {
      currentImage.value.annotations = JSON.parse(nextState)
      selectedAnnotationId.value = null
    }
  }

  function setTool(tool: ShapeType) {
    currentTool.value = tool
  }

  function zoomIn() {
    stageConfig.value.scale *= 1.1
  }

  function zoomOut() {
    stageConfig.value.scale /= 1.1
  }

  function resetZoom() {
    stageConfig.value = { scale: 1, x: 0, y: 0 }
  }

  return {
    images,
    currentImageId,
    currentImage,
    currentAnnotations,
    selectedAnnotationId,
    currentLabelId,
    currentTool,
    stageConfig,
    isDrawing,
    undoStack,
    redoStack,
    addImages,
    selectImage,
    addAnnotation,
    updateAnnotation,
    removeAnnotation,
    setTool,
    undo,
    redo,
    saveState,
    zoomIn,
    zoomOut,
    resetZoom
  }
})
