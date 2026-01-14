import { onMounted, onUnmounted } from 'vue'
import { useEditorStore } from '../stores/editor'
import { storeToRefs } from 'pinia'

export function useShortcuts() {
    const store = useEditorStore()
    const { 
        currentImageId, 
        images, 
        selectedAnnotationId,
        currentAnnotations,
        currentTool
    } = storeToRefs(store)

    // Helper to check if user is typing in an input
    const isTyping = () => {
        const activeEl = document.activeElement
        return activeEl instanceof HTMLInputElement || activeEl instanceof HTMLTextAreaElement
    }

    const handleKeyDown = (e: KeyboardEvent) => {
        // Always allow shortcuts that use modifiers (Ctrl/Cmd) even if typing?
        // Actually standard behavior is to allow Ctrl+S/Z etc. but block single keys like 'R'
        
        const isCtrlOrCmd = e.ctrlKey || e.metaKey
        
        // 1. Core Editing
        
        // Delete / Backspace
        if ((e.key === 'Delete' || e.key === 'Backspace') && !isTyping()) {
            if (selectedAnnotationId.value) {
                e.preventDefault()
                store.removeAnnotation(selectedAnnotationId.value)
            }
        }

        // Save / Export (Ctrl + S)
        if (isCtrlOrCmd && (e.key === 's' || e.key === 'S')) {
            e.preventDefault()
            // Dispatch custom event for view to handle export modal
            window.dispatchEvent(new CustomEvent('shortcut-export'))
        }

        // Undo (Ctrl + Z)
        if (isCtrlOrCmd && (e.key === 'z' || e.key === 'Z') && !e.shiftKey) {
            e.preventDefault()
            store.undo()
        }

        // Redo (Ctrl + Shift + Z)
        if (isCtrlOrCmd && e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
            e.preventDefault()
            store.redo()
        }

        // Select All (Ctrl + A)
        // We don't have a multi-select state yet, but let's reserve it or implement later.
        // For now, maybe just log or ignore. 
        // Requirement said: "Select all annotations". But our store only supports single selection (selectedAnnotationId).
        // If we want to support batch operations later, we need selectedAnnotationIds array.
        // For now, let's skip implementation or just select the first one?
        // Let's implement it as: Select the last annotation (simulate selecting something) or ignore.
        // Given current architecture is single select, we can't fully implement "Select All".
        
        // 2. Navigation
        if (!isTyping() && !isCtrlOrCmd) {
            if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
                e.preventDefault()
                navigateImage(-1)
            }
            if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
                e.preventDefault()
                navigateImage(1)
            }
        }

        // 3. Tool Switching
        if (!isTyping() && !isCtrlOrCmd) {
            switch (e.key.toLowerCase()) {
                case 'r':
                    store.setTool('rect')
                    break
                case 'c':
                    store.setTool('circle')
                    break
                case 't':
                    store.setTool('triangle')
                    break
                case 'p':
                    store.setTool('polygon')
                    break
            }
        }

        // 4. Canvas View Control
        
        // Esc
        if (e.key === 'Escape') {
            e.preventDefault()
            // If drawing polygon, cancel it (need support in store/canvas, currently logic is in Canvas component)
            // If selected, deselect
            if (selectedAnnotationId.value) {
                store.selectedAnnotationId = null
            }
            // Dispatch event for Canvas to handle drawing cancellation
            window.dispatchEvent(new CustomEvent('shortcut-esc'))
        }

        // Zoom (Ctrl + = / - / 0)
        if (isCtrlOrCmd) {
            if (e.key === '=' || e.key === '+') {
                e.preventDefault()
                store.zoomIn()
            }
            if (e.key === '-' || e.key === '_') {
                e.preventDefault()
                store.zoomOut()
            }
            if (e.key === '0') {
                e.preventDefault()
                store.resetZoom()
            }
        }
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
