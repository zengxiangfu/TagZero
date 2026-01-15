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
                    <n-popselect
                        :value="ann.labelId"
                        :options="currentLabelOptions"
                        @update:value="(val) => handleLabelChange(ann.id, val)"
                        trigger="click"
                    >
                        <span class="clickable-label" :class="{ 'selected-text': selectedAnnotationId === ann.id }">{{ getLabelName(ann.labelId) }}</span>
                    </n-popselect>
                </div>
                <n-tag size="small" :bordered="false" :color="{ color: ann.color + '20', textColor: ann.color }">
                    {{ t('shapes.' + ann.type) }}
                </n-tag>
                <n-button size="tiny" type="error" text @click.stop="store.removeAnnotation(ann.id)">
                    X
                </n-button>
            </n-space>
            </div>
        </n-list-item>
    </n-list>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { NList, NListItem, NIcon, NPopselect, NSpace, NTag, NButton, NH3 } from 'naive-ui'
import { useEditorStore } from '../../../stores/editor'
import { storeToRefs } from 'pinia'
import type { LabelSet } from '../../../types'

const props = defineProps<{
  activeLabelSet: LabelSet | null
}>()

const { t } = useI18n()
const store = useEditorStore()
const { currentAnnotations, selectedAnnotationId } = storeToRefs(store)

const currentLabelOptions = computed(() => {
    if (!props.activeLabelSet) return []
    return props.activeLabelSet.labels.map(l => ({ label: l.name, value: l.id }))
})

const getLabelName = (id: string) => {
    if (!props.activeLabelSet) return id
    const label = props.activeLabelSet.labels.find(l => l.id === id)
    return label ? label.name : id
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
</style>