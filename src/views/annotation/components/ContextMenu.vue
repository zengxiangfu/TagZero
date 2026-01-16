<template>
    <Teleport to="body">
        <div
            v-if="visible"
            ref="menuRef"
            class="custom-context-menu"
            :style="{ left: x + 'px', top: y + 'px' }"
            @mousedown.stop
            @contextmenu.prevent
        >
            <div class="menu-header">
                <n-input 
                    v-model:value="searchValue" 
                    size="small" 
                    placeholder="Search..." 
                    clearable
                    autofocus
                    @click.stop
                    @keydown.stop
                    @input="handleSearchInput"
                />
            </div>
            <div class="menu-list">
                <div 
                    v-for="label in filteredLabels" 
                    :key="label.id"
                    class="menu-item"
                    @click="handleSelect(label.id)"
                >
                    <div class="color-dot" :style="{ backgroundColor: label.color }"></div>
                    <span>{{ label.name }}{{ label.value ? ` [${label.value}]` : '' }}</span>
                </div>
                <div v-if="filteredLabels.length === 0" class="menu-empty">
                    {{ t('common.noData') }}
                </div>
            </div>
        </div>
    </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { NInput } from 'naive-ui'
import type { LabelItem } from '../../../types'

const props = defineProps<{
    visible: boolean
    x: number
    y: number
    labels: LabelItem[]
    currentLabelName?: string
}>()

const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void
    (e: 'select', labelId: string): void
    (e: 'close'): void
}>()

const { t } = useI18n()
const menuRef = ref<HTMLDivElement | null>(null)
const searchValue = ref('')
const isUserSearching = ref(false)

// Initialize search value when opened
watch(() => props.visible, (newVal) => {
    if (newVal) {
        searchValue.value = props.currentLabelName || ''
        isUserSearching.value = false
        // Add click outside listener
        setTimeout(() => {
             window.addEventListener('mousedown', handleWindowMouseDown)
        }, 0)
    } else {
        window.removeEventListener('mousedown', handleWindowMouseDown)
    }
})

const filteredLabels = computed(() => {
    if (!isUserSearching.value) return props.labels
    if (!searchValue.value) return props.labels
    
    const search = searchValue.value.toLowerCase()
    return props.labels.filter(l => 
        l.name.toLowerCase().includes(search) || 
        (l.value && l.value.toLowerCase().includes(search))
    )
})

const handleSearchInput = () => {
    isUserSearching.value = true
}

const handleSelect = (id: string) => {
    emit('select', id)
    // Update search value to match selected
    const selected = props.labels.find(l => l.id === id)
    if (selected) {
        searchValue.value = selected.name
        isUserSearching.value = false
    }
}

const handleWindowMouseDown = (e: MouseEvent) => {
    if (menuRef.value && !menuRef.value.contains(e.target as Node)) {
        emit('update:visible', false)
        emit('close')
    }
}

onUnmounted(() => {
    window.removeEventListener('mousedown', handleWindowMouseDown)
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
    padding: 6px 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    transition: background-color 0.2s;
    font-size: 13px;
}

.menu-item:hover {
    background-color: #f5f5f5;
}

.color-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-right: 8px;
    flex-shrink: 0;
}

.menu-empty {
    padding: 12px;
    text-align: center;
    color: #999;
    font-size: 12px;
}
</style>