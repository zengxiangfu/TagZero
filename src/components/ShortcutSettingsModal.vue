<template>
    <n-modal v-model:show="show" preset="card" :title="t('shortcuts.title')" style="width: 600px">
        <n-tabs type="line">
            <n-tab-pane v-for="cat in categories" :key="cat" :name="cat" :tab="t('shortcuts.categories.' + cat)">
                <n-list>
                    <n-list-item v-for="item in getShortcutsByCategory(cat)" :key="item.id">
                        <n-space justify="space-between" align="center">
                            <span>{{ t(item.labelKey) }}</span>
                            <n-space align="center">
                                <div class="shortcut-key" @click="startEditing(item)" :class="{ editing: editingId === item.id }">
                                    <template v-if="editingId === item.id">
                                        {{ t('shortcuts.pressKey') }}
                                    </template>
                                    <template v-else>
                                        <n-tag :bordered="false" type="info">
                                            {{ formatShortcut(item) }}
                                        </n-tag>
                                    </template>
                                </div>
                                <n-tooltip trigger="hover">
                                    <template #trigger>
                                        <n-button circle size="tiny" quaternary @click="store.resetShortcut(item.id)">
                                            <template #icon>
                                                <n-icon><RefreshOutline /></n-icon>
                                            </template>
                                        </n-button>
                                    </template>
                                    {{ t('shortcuts.reset') }}
                                </n-tooltip>
                            </n-space>
                        </n-space>
                    </n-list-item>
                </n-list>
            </n-tab-pane>
        </n-tabs>
        <template #footer>
            <n-space justify="space-between">
                <n-popconfirm @positive-click="store.resetAll">
                    <template #trigger>
                        <n-button type="warning" ghost>{{ t('shortcuts.resetAll') }}</n-button>
                    </template>
                    {{ t('common.confirm') }}?
                </n-popconfirm>
                <n-button @click="show = false">{{ t('common.close') }}</n-button>
            </n-space>
        </template>
    </n-modal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useShortcutStore, type ShortcutItem } from '../stores/shortcutStore'
import { NModal, NTabs, NTabPane, NList, NListItem, NSpace, NTag, NButton, NIcon, NTooltip, NPopconfirm } from 'naive-ui'
import { RefreshOutline } from '@vicons/ionicons5'

const props = defineProps<{
    show: boolean
}>()

const emit = defineEmits<{
    (e: 'update:show', value: boolean): void
}>()

const show = computed({
    get: () => props.show,
    set: (val) => emit('update:show', val)
})

const { t } = useI18n()
const store = useShortcutStore()
const editingId = ref<string | null>(null)

const categories = ['tools', 'editing', 'view', 'navigation'] as const

const getShortcutsByCategory = (cat: string) => {
    return store.shortcuts.filter(s => s.category === cat)
}

const formatShortcut = (item: ShortcutItem) => {
    const parts = []
    if (item.ctrl) parts.push('Ctrl')
    if (item.shift) parts.push('Shift')
    if (item.alt) parts.push('Alt')
    if (item.meta) parts.push('Meta')
    
    // Capitalize key
    let keyDisplay = item.key.toUpperCase()
    if (keyDisplay === ' ') keyDisplay = 'Space'
    
    parts.push(keyDisplay)
    return parts.join(' + ')
}

const startEditing = (item: ShortcutItem) => {
    if (!item.editable) return
    editingId.value = item.id
    window.addEventListener('keydown', handleEditKeyDown, { capture: true })
}

const stopEditing = () => {
    editingId.value = null
    window.removeEventListener('keydown', handleEditKeyDown, { capture: true })
}

const handleEditKeyDown = (e: KeyboardEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Ignore modifier-only presses
    if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return
    
    // Cancel on Esc?
    if (e.key === 'Escape') {
        stopEditing()
        return
    }

    if (editingId.value) {
        store.updateShortcut(editingId.value, e.key, {
            ctrl: e.ctrlKey || e.metaKey, 
            shift: e.shiftKey,
            alt: e.altKey
        })
    }
    stopEditing()
}
</script>

<style scoped>
.shortcut-key {
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    transition: background-color 0.2s;
    min-width: 60px;
    text-align: center;
}
.shortcut-key:hover {
    background-color: #f5f5f5;
}
.shortcut-key.editing {
    background-color: #e6f7ff;
    border: 1px dashed #1890ff;
    color: #1890ff;
}
</style>
