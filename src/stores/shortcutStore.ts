import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export interface ShortcutItem {
    id: string;
    key: string;
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    meta?: boolean; // Command on Mac
    labelKey: string; // i18n key
    category: 'tools' | 'editing' | 'view' | 'navigation';
    editable?: boolean;
}

const STORAGE_KEY = 'tagzero-shortcuts'

export const useShortcutStore = defineStore('shortcuts', () => {
    const defaultShortcuts: ShortcutItem[] = [
        // Tools
        { id: 'toolRect', key: 'r', labelKey: 'shortcuts.toolRect', category: 'tools', editable: true },
        { id: 'toolCircle', key: 'c', labelKey: 'shortcuts.toolCircle', category: 'tools', editable: true },
        { id: 'toolTriangle', key: 't', labelKey: 'shortcuts.toolTriangle', category: 'tools', editable: true },
        { id: 'toolPolygon', key: 'p', labelKey: 'shortcuts.toolPolygon', category: 'tools', editable: true },
        
        // Editing
        { id: 'delete', key: 'Delete', labelKey: 'shortcuts.delete', category: 'editing', editable: true },
        { id: 'undo', key: 'z', ctrl: true, labelKey: 'shortcuts.undo', category: 'editing', editable: true },
        { id: 'redo', key: 'z', ctrl: true, shift: true, labelKey: 'shortcuts.redo', category: 'editing', editable: true },
        { id: 'save', key: 's', ctrl: true, labelKey: 'shortcuts.save', category: 'editing', editable: true },
        { id: 'cancel', key: 'Escape', labelKey: 'shortcuts.cancel', category: 'editing', editable: true },

        // Navigation
        { id: 'prevImage', key: 'a', labelKey: 'shortcuts.prevImage', category: 'navigation', editable: true },
        { id: 'nextImage', key: 'd', labelKey: 'shortcuts.nextImage', category: 'navigation', editable: true },
        
        // View
        { id: 'zoomIn', key: '=', ctrl: true, labelKey: 'shortcuts.zoomIn', category: 'view', editable: true },
        { id: 'zoomOut', key: '-', ctrl: true, labelKey: 'shortcuts.zoomOut', category: 'view', editable: true },
        { id: 'resetZoom', key: '0', ctrl: true, labelKey: 'shortcuts.resetZoom', category: 'view', editable: true },
        { id: 'toggleMagnifier', key: 'z', labelKey: 'shortcuts.toggleMagnifier', category: 'view', editable: true },
    ]

    // Load from storage
    const saved = localStorage.getItem(STORAGE_KEY)
    let initial = defaultShortcuts
    if (saved) {
        try {
            const parsed = JSON.parse(saved)
            initial = defaultShortcuts.map(d => {
                const p = parsed.find((x: any) => x.id === d.id)
                return p ? { ...d, ...p } : d
            })
        } catch (e) {
            console.error('Failed to load shortcuts', e)
        }
    }

    const shortcuts = ref<ShortcutItem[]>(initial)

    watch(shortcuts, (val) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
    }, { deep: true })

    function updateShortcut(id: string, newKey: string, modifiers: { ctrl?: boolean, shift?: boolean, alt?: boolean, meta?: boolean }) {
        const item = shortcuts.value.find(s => s.id === id)
        if (item && item.editable) {
            item.key = newKey
            item.ctrl = modifiers.ctrl || false
            item.shift = modifiers.shift || false
            item.alt = modifiers.alt || false
            item.meta = modifiers.meta || false
        }
    }

    function getShortcut(id: string) {
        return shortcuts.value.find(s => s.id === id)
    }

    // Check if an event matches a shortcut
    function matches(id: string, e: KeyboardEvent) {
        const s = getShortcut(id)
        if (!s) return false

        const keyMatch = e.key.toLowerCase() === s.key.toLowerCase()
        const ctrlMatch = !!s.ctrl === (e.ctrlKey || e.metaKey) // Treat Meta as Ctrl on Mac usually, or separate?
        // Note: In browser e.metaKey is Cmd on Mac. e.ctrlKey is Ctrl.
        // Usually apps treat Ctrl/Cmd interchangeably or strictly.
        // Let's match strict for now but handle "CtrlOrCmd" logic in store?
        // Actually, let's make it simple: 
        // If s.ctrl is true, we expect e.ctrlKey OR e.metaKey (to support Mac Cmd).
        
        const shiftMatch = !!s.shift === e.shiftKey
        const altMatch = !!s.alt === e.altKey
        
        // Special case for Delete/Backspace
        if (s.key === 'Delete' && (e.key === 'Delete' || e.key === 'Backspace')) return true

        return keyMatch && ctrlMatch && shiftMatch && altMatch
    }

    function resetShortcut(id: string) {
        const defaultItem = defaultShortcuts.find(s => s.id === id)
        const item = shortcuts.value.find(s => s.id === id)
        if (defaultItem && item) {
            item.key = defaultItem.key
            item.ctrl = defaultItem.ctrl
            item.shift = defaultItem.shift
            item.alt = defaultItem.alt
            item.meta = defaultItem.meta
        }
    }

    function resetAll() {
        shortcuts.value = JSON.parse(JSON.stringify(defaultShortcuts))
    }

    return {
        shortcuts,
        updateShortcut,
        getShortcut,
        matches,
        resetShortcut,
        resetAll
    }
})
