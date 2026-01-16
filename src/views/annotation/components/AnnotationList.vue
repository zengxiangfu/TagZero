<template>
  <div class="section-annotations" style="flex: 1; display: flex; flex-direction: column; overflow: hidden;">
    <n-h3 style="flex-shrink: 0; padding: 0 12px;">{{ t('annotation.annotations') }}</n-h3>
    <div style="flex: 1; overflow-y: auto;">
        <n-list hoverable clickable size="small" :show-divider="false">
            <n-list-item 
                v-for="ann in [...currentAnnotations].reverse()" 
                :key="ann.id"
                class="annotation-list-item"
                :class="{ 'selected-ann': selectedAnnotationId === ann.id }"
                @click="store.selectedAnnotationId = ann.id"
            >
            <div style="width: 100%; box-sizing: border-box; padding-right: 18px;">
            <n-space justify="space-between" align="center">
                <div style="display: flex; align-items: center;">
                    <div style="width: 20px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-right: 4px;">
                        <n-icon v-if="selectedAnnotationId === ann.id" color="#d03050" class="game-cursor" size="16">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M64 464l384-208L64 48v416z" fill="currentColor"/></svg>
                        </n-icon>
                    </div>
                    
                    <!-- Shape Icon (Solid color) -->
                    <div 
                        class="shape-icon" 
                        :style="{ backgroundColor: ann.color }"
                        :class="getShapeClass(ann.type)"
                    >
                    </div>

                    <span 
                        class="clickable-label" 
                        :class="{ 'selected-text': selectedAnnotationId === ann.id }"
                        @click.stop="(e) => openContextMenu(e, ann.id)"
                    >
                        {{ getLabelName(ann.labelId) }}
                    </span>
                </div>
                <n-button size="tiny" type="error" text @click.stop="store.removeAnnotation(ann.id)">
                    X
                </n-button>
            </n-space>
            </div>
        </n-list-item>
    </n-list>
    </div>

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

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { NList, NListItem, NIcon, NSpace, NTag, NButton, NH3 } from 'naive-ui'
import { useEditorStore } from '../../../stores/editor'
import { storeToRefs } from 'pinia'
import type { LabelSet } from '../../../types'
import ContextMenu from './ContextMenu.vue'

const props = defineProps<{
  activeLabelSet: LabelSet | null
}>()

const { t } = useI18n()
const store = useEditorStore()
const { currentAnnotations, selectedAnnotationId } = storeToRefs(store)

// Context Menu State
const showContextMenu = ref(false)
const contextMenuX = ref(0)
const contextMenuY = ref(0)
const contextMenuAnnotationId = ref<string | null>(null)

const availableLabels = computed(() => {
    return props.activeLabelSet ? props.activeLabelSet.labels : []
})

const currentContextLabelName = computed(() => {
    if (!contextMenuAnnotationId.value || !props.activeLabelSet) return ''
    const ann = currentAnnotations.value.find(a => a.id === contextMenuAnnotationId.value)
    if (!ann) return ''
    
    const label = props.activeLabelSet.labels.find(l => l.id === ann.labelId)
    return label ? label.name : ''
})

const openContextMenu = (e: MouseEvent, id: string) => {
    store.selectedAnnotationId = id
    contextMenuAnnotationId.value = id
    contextMenuX.value = e.clientX
    contextMenuY.value = e.clientY
    showContextMenu.value = true
}

const closeContextMenu = () => {
    showContextMenu.value = false
    contextMenuAnnotationId.value = null
}

const handleMenuSelect = (labelId: string) => {
    if (contextMenuAnnotationId.value) {
        handleLabelChange(contextMenuAnnotationId.value, labelId)
    }
}

const getLabelName = (id: string) => {
    if (!props.activeLabelSet) return id
    const label = props.activeLabelSet.labels.find(l => l.id === id)
    return label ? label.name : id
}

const getShapeClass = (type: string) => {
    switch (type) {
        case 'rect': return 'shape-rect'
        case 'circle': return 'shape-circle'
        case 'polygon': return 'shape-polygon'
        case 'triangle': return 'shape-triangle'
        default: return 'shape-rect'
    }
}

const handleLabelChange = (annId: string, newLabelId: string) => {
    const label = props.activeLabelSet?.labels.find(l => l.id === newLabelId)
    const updates: any = { labelId: newLabelId }
    if (label) {
        updates.color = label.color
    }
    store.updateAnnotation(annId, updates)
}
</script>

<style scoped>
.annotation-list-item {
    transition: all 0.2s ease;
    padding: 8px 0 !important;
}

.annotation-list-item .n-list-item__content {
    padding: 0 !important;
}

.selected-ann {
    background: linear-gradient(90deg, rgba(208, 48, 80, 0.08) 0%, rgba(255, 255, 255, 0) 100%) !important;
}

.selected-text {
    font-weight: bold;
    color: #d03050;
    text-shadow: 0 0 1px rgba(208, 48, 80, 0.2);
}

.clickable-label {
    cursor: pointer;
    border-bottom: 1px dashed #999;
}
.clickable-label:hover {
    color: #1890ff;
    border-bottom-color: #1890ff;
}

@keyframes game-float {
    0%, 100% {
        transform: translateX(0);
    }
    50% {
        transform: translateX(6px);
    }
}

.game-cursor {
    animation: game-float 1s ease-in-out infinite;
    filter: drop-shadow(1px 2px 2px rgba(0,0,0,0.2));
}

.shape-icon {
    width: 14px;
    height: 14px;
    margin-right: 8px;
    flex-shrink: 0;
}

.shape-rect {
    /* Square */
}

.shape-circle {
    border-radius: 50%;
}

.shape-polygon {
    clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
}

.shape-triangle {
    clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
}
</style>