<template>
  <n-modal
    :show="show"
    @update:show="emit('update:show', $event)"
    preset="dialog"
    :title="t('common.export')"
    style="width: 600px"
  >
    <div style="margin-bottom: 20px;">
        <p>{{ t('annotation.exportPrompt', { count: images.length }) }}</p>
        <p v-if="unannotatedImageIds.size > 0" style="color: #faad14;">
            {{ t('annotation.unannotatedWarning', { count: unannotatedImageIds.size }) }}
            <br/>
            <span style="font-size: 12px; color: #999;">
                {{ t('annotation.unannotatedIndices') }}: {{ getUnannotatedIndicesDisplay() }}
            </span>
        </p>
    </div>
    <n-form>
        <n-form-item :label="t('common.format')">
            <n-radio-group v-model:value="exportFormat">
                <n-radio-button value="tagzero">TagZero JSON</n-radio-button>
                <n-radio-button value="coco">COCO</n-radio-button>
                <n-radio-button value="yolo">YOLO</n-radio-button>
                <n-radio-button value="voc">Pascal VOC</n-radio-button>
            </n-radio-group>
        </n-form-item>
    </n-form>
    <template #action>
        <n-button @click="emit('update:show', false)">{{ t('common.cancel') }}</n-button>
        <n-button type="primary" :loading="isExporting" @click="confirmExport">
            {{ t('common.confirm') }}
        </n-button>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { NModal, NButton, NRadioGroup, NRadioButton, NForm, NFormItem } from 'naive-ui'
import { useEditorStore } from '../../../stores/editor'
import { exportData } from '../../../utils/exportUtils'
import type { LabelSet } from '../../../types'
import { storeToRefs } from 'pinia'

const props = defineProps<{
  show: boolean
  unannotatedImageIds: Set<string>
  currentLabelSet: LabelSet | null
}>()

const emit = defineEmits<{
  (e: 'update:show', show: boolean): void
}>()

const { t } = useI18n()
const store = useEditorStore()
const { images } = storeToRefs(store)

const exportFormat = ref<'tagzero' | 'coco' | 'yolo' | 'voc'>('tagzero')
const isExporting = ref(false)

const getUnannotatedIndicesDisplay = () => {
    if (props.unannotatedImageIds.size === 0) return ''
    const indices = images.value
        .map((img, idx) => props.unannotatedImageIds.has(img.id) ? idx + 1 : -1)
        .filter(idx => idx !== -1)
    
    if (indices.length <= 10) return indices.join(', ')
    return indices.slice(0, 10).join(', ') + '...'
}

const confirmExport = async () => {
    if (!props.currentLabelSet) {
        // Should handle this case, maybe alert user
        return
    }
    
    isExporting.value = true
    try {
        await exportData({
            images: images.value,
            labelSet: props.currentLabelSet,
            format: exportFormat.value
        })
        emit('update:show', false)
    } catch (error) {
        console.error('Export failed:', error)
    } finally {
        isExporting.value = false
    }
}
</script>
