<template>
  <div style="padding: 12px; border-bottom: 1px solid #eee; flex-shrink: 0; display: flex; flex-direction: column; gap: 16px;">
    <!-- Preset Labels -->
    <div class="section-labels">
    <n-collapse :default-expanded-names="['preset']">
        <n-collapse-item :title="t('annotation.presetLabels')" name="preset">
            <template #header-extra>
                <div style="display: flex; align-items: center; gap: 8px;" @click.stop>
                    <span style="font-size: 12px; color: #666;">{{ t('annotation.realTimeSync') }}</span>
                    <n-switch v-model:value="isSyncEnabled" size="small" :disabled="!selectedLabelSetId" />
                    <n-tooltip trigger="hover">
                        <template #trigger>
                            <n-icon size="14" style="cursor: help; color: #999;">
                                <div class="icon-help-circle" />
                            </n-icon>
                        </template>
                        {{ t('annotation.syncTip') }}
                    </n-tooltip>
                </div>
            </template>
            <div style="margin-bottom: 12px;">
                <n-select 
                    v-model:value="selectedLabelSetId" 
                    :options="labelSetOptions" 
                    :placeholder="t('annotation.selectLabelSet')"
                    clearable
                />
            </div>
            <div v-if="currentLabelSet" class="label-grid">
            <div 
                v-for="label in currentLabelSet.labels" 
                :key="label.id"
                class="label-chip"
                :class="{ 'selected-label': currentLabelId === label.id }"
                :style="{ 
                    backgroundColor: currentLabelId === label.id ? label.color + '33' : 'transparent' 
                }"
                @click="store.currentLabelId = label.id"
            >
                <div style="display: flex; align-items: center; gap: 6px;">
                    <div 
                        v-if="currentLabelId === label.id" 
                        class="selection-arrow" 
                        :style="{ borderLeftColor: label.color }"
                    ></div>
                    <div class="color-dot" :style="{ background: label.color }"></div>
                    <span :class="{ 'selected-text': currentLabelId === label.id }">{{ label.name }}{{ label.value ? ` [${label.value}]` : '' }}</span>
                </div>
                <div class="delete-icon" @click.stop="handleDeleteLabel(label.id)">
                    <n-icon size="14">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z" fill="currentColor"/></svg>
                    </n-icon>
                </div>
            </div>
        </div>
            <!-- Add Label Button -->
            <n-button 
                v-if="!isSyncEnabled || (isSyncEnabled && selectedLabelSetId)"
                dashed 
                size="small" 
                block 
                style="flex-shrink: 0; margin-top: 8px;"
                @click="handleAddLabel"
            >
                + {{ t('annotation.addLabel') }}
            </n-button>
        </n-collapse-item>
    </n-collapse>
    </div>

    <!-- Add Label Modal -->
    <n-modal v-model:show="showAddLabelModal">
      <n-card
        style="width: 400px"
        :title="t('annotation.addLabel')"
        :bordered="false"
        size="huge"
        role="dialog"
        aria-modal="true"
      >
        <n-space vertical>
            <n-input v-model:value="newLabelName" :placeholder="t('annotation.labelName')" />
            <n-input v-model:value="newLabelValue" :placeholder="t('labelConfig.labelValuePlaceholder')" />
            <n-color-picker v-model:value="newLabelColor" :show-alpha="false" :swatches="PRESET_COLORS" />
            <n-space justify="end">
                <n-button @click="showAddLabelModal = false">{{ t('common.cancel') }}</n-button>
                <n-button type="primary" @click="confirmAddLabel">{{ t('common.confirm') }}</n-button>
            </n-space>
        </n-space>
      </n-card>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { 
  NButton, NCollapse, NCollapseItem, NSwitch, NTooltip, NIcon, NSelect, 
  NModal, NCard, NSpace, NInput, NColorPicker 
} from 'naive-ui'
import { useEditorStore } from '../../../stores/editor'
import { useLabelStore, PRESET_COLORS } from '../../../stores/labelStore'
import { storeToRefs } from 'pinia'
import type { LabelSet } from '../../../types'

const { t } = useI18n()
const store = useEditorStore()
const labelStore = useLabelStore()
const { currentLabelId } = storeToRefs(store)

const emit = defineEmits<{
    (e: 'update:activeLabelSet', value: LabelSet | null): void
}>()

const selectedLabelSetId = ref<string | null>(null)
const isSyncEnabled = ref(false)
const localLabelSet = ref<LabelSet>({
    id: 'local_temp',
    name: 'Temporary',
    labels: []
})

const showAddLabelModal = ref(false)
const newLabelName = ref('')
const newLabelValue = ref('')
const newLabelColor = ref('#FF0000')

const labelSetOptions = computed(() => labelStore.labelSets.map(ls => ({
    label: ls.name,
    value: ls.id
})))

const selectedStoreLabelSet = computed(() => {
    if (selectedLabelSetId.value) {
        return labelStore.getLabelSetById(selectedLabelSetId.value)
    }
    return null
})

const currentLabelSet = computed(() => {
    if (isSyncEnabled.value && selectedStoreLabelSet.value) {
        return selectedStoreLabelSet.value
    }
    return localLabelSet.value
})

const selectedColor = computed(() => {
    if (!currentLabelSet.value || !currentLabelId.value) return '#1890ff'
    const label = currentLabelSet.value.labels.find(l => l.id === currentLabelId.value)
    return label ? label.color : '#1890ff'
})

// Emit changes to parent
watch(currentLabelSet, (val) => {
    emit('update:activeLabelSet', val)
}, { immediate: true, deep: true })

// Logic for sync/merge
watch(selectedLabelSetId, (newId) => {
    if (!newId) {
        isSyncEnabled.value = false
        return
    }

    const newSet = labelStore.getLabelSetById(newId)
    if (!newSet) return

    if (!isSyncEnabled.value && localLabelSet.value) {
        // Merge into local set
        const existingLabels = localLabelSet.value.labels
        const existingNames = new Set(existingLabels.map(l => l.name))
        const existingColors = new Set(existingLabels.map(l => l.color))

        newSet.labels.forEach(label => {
            if (existingNames.has(label.name)) return 

            let color = label.color
            if (existingColors.has(color)) {
                color = PRESET_COLORS.find(c => !existingColors.has(c)) || label.color
            }
            
            const newLabel = { ...label, color } 
            
            localLabelSet.value!.labels.push(newLabel)
            existingNames.add(newLabel.name)
            existingColors.add(newLabel.color)
        })
    }
}, { immediate: true })

watch(isSyncEnabled, (enabled) => {
    if (!enabled && selectedStoreLabelSet.value) {
        localLabelSet.value = JSON.parse(JSON.stringify(selectedStoreLabelSet.value))
    }
})

const handleAddLabel = () => {
    if (!currentLabelSet.value) return
    
    const existingColors = new Set(currentLabelSet.value.labels.map(l => l.color))
    const nextColor = PRESET_COLORS.find(c => !existingColors.has(c)) || PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)] || '#FF0000'

    newLabelColor.value = nextColor
    newLabelName.value = ''
    newLabelValue.value = ''
    showAddLabelModal.value = true
}

const confirmAddLabel = () => {
    if (!currentLabelSet.value || !newLabelName.value.trim()) return

    const newLabel = {
        id: Math.random().toString(36).substring(2, 9),
        name: newLabelName.value.trim(),
        value: newLabelValue.value.trim(),
        color: newLabelColor.value
    }
    
    if (isSyncEnabled.value && currentLabelSet.value && currentLabelSet.value.id !== 'temp') {
        const updatedLabels = [...currentLabelSet.value.labels, newLabel]
        labelStore.updateLabelSet(currentLabelSet.value.id, { labels: updatedLabels })
    } else {
        if (localLabelSet.value) {
            localLabelSet.value.labels.push(newLabel)
        }
    }
    
    showAddLabelModal.value = false
}

const handleDeleteLabel = (labelId: string) => {
    if (!currentLabelSet.value) return
    
    if (isSyncEnabled.value) {
        const updatedLabels = currentLabelSet.value.labels.filter(l => l.id !== labelId)
        labelStore.updateLabelSet(currentLabelSet.value.id, { labels: updatedLabels })
    } else {
         if (localLabelSet.value) {
             localLabelSet.value.labels = localLabelSet.value.labels.filter(l => l.id !== labelId)
         }
    }
    
    if (store.currentLabelId === labelId) {
        store.currentLabelId = null
    }
}
</script>

<style scoped>
.label-grid {
    display: flex;
    flex-direction: column;
    gap: 0;
    height: 200px;
    overflow-y: auto;
    padding-right: 4px;
    border: 1px solid #eee;
    border-radius: 4px;
}
.label-chip {
    padding: 4px 8px;
    border-bottom: 1px solid #f5f5f5;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    cursor: pointer;
    font-size: 13px;
    transition: all 0.2s;
    position: relative;
    flex-shrink: 0;
    height: 32px;
}
.label-chip:last-child {
    border-bottom: none;
}
.label-chip:hover .delete-icon {
    display: flex;
}
.delete-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    color: #ff4d4f;
    cursor: pointer;
    opacity: 0.8;
}
.delete-icon:hover {
    opacity: 1;
    background-color: #fff1f0;
    border-radius: 4px;
}

.selected-label {
    background: linear-gradient(90deg, v-bind("selectedColor + '14'") 0%, rgba(255, 255, 255, 0) 100%) !important;
}

.selected-text {
    font-weight: bold;
    color: v-bind("selectedColor");
    text-shadow: 0 0 1px v-bind("selectedColor + '33'");
}

.selection-arrow {
    width: 0;
    height: 0;
    border-top: 7px solid transparent;
    border-bottom: 7px solid transparent;
    border-left: 8px solid;
    margin-right: 0;
    flex-shrink: 0;
    animation: arrowPulse 1.2s infinite ease-in-out;
}

@keyframes arrowPulse {
    0%, 100% { transform: translateX(0); }
    50% { transform: translateX(3px); }
}

.color-dot {
    width: 14px;
    height: 14px;
    border-radius: 50%;
}
.icon-help-circle {
    width: 14px;
    height: 14px;
    border: 1.5px solid currentColor;
    border-radius: 50%;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
}
.icon-help-circle::before {
    content: '?';
    font-size: 10px;
    font-weight: bold;
    color: currentColor;
    line-height: 1;
}
</style>