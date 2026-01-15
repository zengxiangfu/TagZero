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
                :style="{ 
                    backgroundColor: currentLabelId === label.id ? label.color + '33' : 'transparent' 
                }"
                @click="store.currentLabelId = label.id"
            >
                <div class="color-dot" :style="{ background: label.color }"></div>
                <span>{{ label.name }}</span>
                <div class="delete-icon" @click.stop="handleDeleteLabel(label.id)">
                    <n-icon size="12"><div class="icon-close" /></n-icon>
                </div>
            </div>
            <!-- Add Label Button -->
            <n-button 
                v-if="!isSyncEnabled || (isSyncEnabled && selectedLabelSetId)"
                dashed 
                size="small" 
                block 
                @click="handleAddLabel"
            >
                + {{ t('annotation.addLabel') }}
            </n-button>
        </div>
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
    showAddLabelModal.value = true
}

const confirmAddLabel = () => {
    if (!currentLabelSet.value || !newLabelName.value.trim()) return

    const newLabel = {
        id: Math.random().toString(36).substring(2, 9),
        name: newLabelName.value.trim(),
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
    flex-wrap: wrap;
    gap: 8px;
}
.label-chip {
    padding: 6px;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s;
    position: relative;
}
.label-chip:hover .delete-icon {
    display: flex;
}
.delete-icon {
    display: none;
    position: absolute;
    top: -6px;
    right: -6px;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #ff4d4f;
    color: white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    z-index: 10;
}
.delete-icon:hover {
    background: #ff7875;
    transform: scale(1.1);
}
.icon-close {
    width: 8px;
    height: 8px;
    position: relative;
}
.icon-close::before,
.icon-close::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 100%;
    height: 2px;
    background: currentColor;
    transform: translate(-50%, -50%) rotate(45deg);
    border-radius: 1px;
}
.icon-close::after {
    transform: translate(-50%, -50%) rotate(-45deg);
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