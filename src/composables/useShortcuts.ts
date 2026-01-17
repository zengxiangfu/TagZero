import { onMounted, onUnmounted } from 'vue'
import { useEditorStore } from '../stores/editor'
import { useShortcutStore } from '../stores/shortcutStore'
import { storeToRefs } from 'pinia'

export function useShortcuts() {
    const store = useEditorStore()
    const shortcutStore = useShortcutStore()
    const { 
        currentImageId, 
        images, 
        selectedAnnotationId
    } = storeToRefs(store)

    // Helper to check if user is typing in an input
    const isTyping = () => {
        const activeEl = document.activeElement
        return activeEl instanceof HTMLInputElement || activeEl instanceof HTMLTextAreaElement
    }

    const handleKeyDown = (e: KeyboardEvent) => {
        // Allow shortcuts if not typing, OR if modifiers are used (like Ctrl+S)
        const typing = isTyping()
        
        // 1. Core Editing
        
        // Delete / Backspace
        if (shortcutStore.matches('delete', e) && !typing) {
            if (selectedAnnotationId.value) {
                e.preventDefault()
                store.removeAnnotation(selectedAnnotationId.value)
            }
        }

        // Save / Export
        if (shortcutStore.matches('save', e)) {
            e.preventDefault()
            window.dispatchEvent(new CustomEvent('shortcut-export'))
        }

        // Undo
        if (shortcutStore.matches('undo', e)) {
            e.preventDefault()
            store.undo()
        }

        // Redo
        if (shortcutStore.matches('redo', e)) {
            e.preventDefault()
            store.redo()
        }
        
        // 2. Navigation
        if (!typing) {
            if (shortcutStore.matches('prevImage', e)) {
                e.preventDefault()
                navigateImage(-1)
            }
            if (shortcutStore.matches('nextImage', e)) {
                e.preventDefault()
                navigateImage(1)
            }
        }

        // 3. Tool Switching
        if (!typing) {
            if (shortcutStore.matches('toolRect', e)) store.setTool('rect')
            if (shortcutStore.matches('toolCircle', e)) store.setTool('circle')
            if (shortcutStore.matches('toolTriangle', e)) store.setTool('triangle')
            if (shortcutStore.matches('toolPolygon', e)) store.setTool('polygon')
        }

        // 4. Canvas View Control
        
        // Esc
        if (shortcutStore.matches('cancel', e) && !typing) {
            e.preventDefault()
            if (selectedAnnotationId.value) {
                store.selectedAnnotationId = null
            } else {
                window.dispatchEvent(new CustomEvent('shortcut-esc'))
            }
        }

        // Zoom
        if (shortcutStore.matches('zoomIn', e)) {
            e.preventDefault()
            store.zoomIn()
        }
        if (shortcutStore.matches('zoomOut', e)) {
            e.preventDefault()
            store.zoomOut()
        }
        if (shortcutStore.matches('resetZoom', e)) {
            e.preventDefault()
            store.resetZoom()
        }
        
        // Note: Toggle Magnifier (Z) is handled by AnnotationCanvas or should be moved here?
        // Currently 'z' is handled as 'Undo' (Ctrl+Z).
        // If 'z' (no modifiers) is 'toggleMagnifier', we can check:
        // if (shortcutStore.matches('toggleMagnifier', e)) { ... }
        // But the current implementation of magnifier is state-based (pressed), not toggle?
        // README says "Z Key: Toggle Magnifier Switch". 
        // Let's assume we might want to dispatch an event or check if we should support it here.
        // For now, I'll leave Magnifier logic as is in Canvas component unless requested to move it.
    }

    const navigateImage = (direction: number) => {
        if (!currentImageId.value || images.value.length === 0) return
        
        const currentIndex = images.value.findIndex(img => img.id === currentImageId.value)
        if (currentIndex === -1) return

        let newIndex = currentIndex + direction
        if (newIndex < 0) newIndex = 0 // Clamp or Wrap? Usually clamp.
        if (newIndex >= images.value.length) newIndex = images.value.length - 1
        
        if (newIndex !== currentIndex) {
            const nextImage = images.value[newIndex]
            if (nextImage) {
                store.selectImage(nextImage.id)
            }
        }
    }

    onMounted(() => {
        window.addEventListener('keydown', handleKeyDown)
    })

    onUnmounted(() => {
        window.removeEventListener('keydown', handleKeyDown)
    })
}
