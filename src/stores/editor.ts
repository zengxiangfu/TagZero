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
  }

  function addAnnotation(annotation: Annotation) {
    if (currentImage.value) {
      currentImage.value.annotations.push(annotation)
    }
  }

  function updateAnnotation(id: string, updates: Partial<Annotation>) {
    if (currentImage.value) {
      const index = currentImage.value.annotations.findIndex(a => a.id === id)
      if (index !== -1) {
        currentImage.value.annotations[index] = {
          ...currentImage.value.annotations[index],
          ...updates
        } as Annotation
      }
    }
  }

  function removeAnnotation(id: string) {
    if (currentImage.value) {
      currentImage.value.annotations = currentImage.value.annotations.filter(a => a.id !== id)
      if (selectedAnnotationId.value === id) {
        selectedAnnotationId.value = null
      }
    }
  }

  function setTool(tool: ShapeType) {
    currentTool.value = tool
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
    addImages,
    selectImage,
    addAnnotation,
    updateAnnotation,
    removeAnnotation,
    setTool
  }
})
