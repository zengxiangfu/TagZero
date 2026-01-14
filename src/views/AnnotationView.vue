<template>
  <div class="annotation-view">
    <!-- Empty State -->
    <div v-if="images.length === 0" class="empty-layout">
        <n-empty :description="t('common.emptyStateTip')">
            <template #extra>
                <n-space justify="center" size="large">
                    <n-button @click="triggerUpload('directory')">
                        <template #icon><n-icon><div class="icon-folder" /></n-icon></template>
                        {{ t('common.uploadFolder') }}
                    </n-button>
                    <n-button @click="triggerUpload('multiple')">
                        <template #icon><n-icon><div class="icon-images" /></n-icon></template>
                        {{ t('common.uploadMultiple') }}
                    </n-button>
                </n-space>
            </template>
        </n-empty>
    </div>

    <!-- Main Layout -->
    <n-layout v-else has-sider style="height: calc(100vh - 60px)">
      <!-- Left Sidebar: Image List (15%) -->
      <n-layout-sider
        bordered
        :width="'15%'"
        content-style="padding: 0; display: flex; flex-direction: column; height: 100%;"
        :native-scrollbar="false"
      >
        <!-- Header -->
        <div class="sidebar-header">
            {{ t('annotation.originalFiles') }}
        </div>

        <n-list hoverable clickable style="flex: 1; overflow-y: auto;">
          <n-list-item
            v-for="(img, index) in images"
            :key="img.id"
            :class="{ 'selected-image': currentImageId === img.id }"
            @click="store.selectImage(img.id)"
          >
            <div class="image-item">
              <div class="image-index" :style="{ backgroundColor: unannotatedImageIds.has(img.id) ? '#d03050' : '#1890ff' }">{{ index + 1 }}</div>
              <div class="image-thumb">
                <img :src="img.url" alt="thumb" />
              </div>
              <div class="image-name" :title="img.name">{{ img.name }}</div>
            </div>
          </n-list-item>
        </n-list>
        <!-- Add button at bottom if needed -->
        <div v-if="images.length > 0" style="padding: 10px; text-align: center; border-top: 1px solid #eee;">
             <n-button size="small" @click="triggerUpload('multiple')">
                + {{ t('common.add') }}
             </n-button>
        </div>
      </n-layout-sider>

      <!-- Middle: Toolbar + Canvas -->
      <n-layout content-style="display: flex; flex-direction: column;">
        <!-- Toolbar -->
        <div class="toolbar">
          <div style="flex: 1"></div>
          <n-radio-group :value="currentTool" @update:value="store.setTool">
            <n-radio-button value="rect">
              <n-icon><div class="icon-rect" /></n-icon> {{ t('shapes.rect') }}
            </n-radio-button>
            <n-radio-button value="triangle">
              <n-icon><div class="icon-triangle" /></n-icon> {{ t('shapes.triangle') }}
            </n-radio-button>
            <n-radio-button value="circle">
              <n-icon><div class="icon-circle" /></n-icon> {{ t('shapes.circle') }}
            </n-radio-button>
            <n-radio-button value="polygon">
              <n-icon><div class="icon-polygon" /></n-icon> {{ t('shapes.polygon') }}
            </n-radio-button>
          </n-radio-group>

          <div style="flex: 1; display: flex; justify-content: flex-end; padding-right: 20px;">
            <n-button size="small" @click="handleExport">
              {{ t('common.export') }}
            </n-button>
          </div>
        </div>

        <!-- Canvas Area -->
        <div class="canvas-container">
          <div class="canvas-wrapper" v-if="currentImage">
            <AnnotationCanvas :active-label-set="currentLabelSet" />
          </div>
          <n-empty v-else :description="t('annotation.selectImageTip')" />
        </div>
      </n-layout>

      <!-- Right Sidebar: Labels & Annotations -->
      <n-layout-sider
        bordered
        :width="'20%'"
        content-style="padding: 0; display: flex; flex-direction: column; height: 100%;"
      >
        <!-- Header -->
        <div class="sidebar-header">
            {{ t('annotation.annotationResults') }}
        </div>
        
        <!-- Fixed Top Content (Label Set + Preset Labels) -->
        <div style="padding: 12px; border-bottom: 1px solid #eee; flex-shrink: 0; display: flex; flex-direction: column; gap: 16px;">
            <!-- Label Set Selection -->
            <!-- Moved inside Preset Labels -->

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
                    <!-- Removed n-empty -->
                </n-collapse-item>
            </n-collapse>
            </div>
        </div>

        <!-- Scrollable Annotations List -->
        <div style="flex: 1; display: flex; flex-direction: column; overflow: hidden; padding: 12px 0;">
            <!-- Annotations List -->
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
        </div>
      </n-layout-sider>
    </n-layout>

    <!-- Hidden File Inputs -->
    <input type="file" ref="fileInputMultiple" style="display: none" accept="image/*" multiple @change="(e) => handleFileChange(e)" />
    <input type="file" ref="fileInputDirectory" style="display: none" webkitdirectory directory @change="(e) => handleFileChange(e)" />
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
    <n-modal v-model:show="showExportModal" preset="dialog" :title="t('common.export')">
        <div style="margin-top: 10px;">
            <div v-if="unannotatedImageIds.size > 0" style="margin-bottom: 16px; padding: 12px; background-color: #fff2f0; border: 1px solid #ffccc7; border-radius: 4px; color: #333;">
                <div style="font-weight: bold; margin-bottom: 8px; line-height: 1.5;" v-html="t('common.unannotatedWarning', { count: `<span style='color: #d03050'>${unannotatedImageIds.size}</span>` })">
                </div>
                <div style="font-size: 12px; color: #666; line-height: 1.5;">
                    {{ t('common.unannotatedDetail', { indices: getUnannotatedIndicesDisplay() }) }}
                </div>
            </div>
            <div style="margin-bottom: 8px;">{{ t('common.selectExportFormat') }}</div>
            <n-select v-model:value="exportFormat" :options="exportFormatOptions" />
        </div>
        <template #action>
            <n-button @click="showExportModal = false">{{ t('common.cancel') }}</n-button>
            <n-button type="primary" :loading="isExporting" @click="confirmExport">{{ t('common.confirm') }}</n-button>
        </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { 
  NLayout, NLayoutSider, NButton, NList, NListItem, NIcon, NRadioGroup, NRadioButton,
  NCollapse, NCollapseItem, NEmpty, NH3, NSpace, NTag, NSelect, NPopselect, useMessage,
  NInput, NColorPicker, NModal, NCard, NSwitch, NTooltip
} from 'naive-ui'
import AnnotationCanvas from '../components/AnnotationCanvas.vue'
import { useEditorStore } from '../stores/editor'
import { useLabelStore, PRESET_COLORS } from '../stores/labelStore'
import { exportData, type ExportFormat } from '../utils/exportUtils'
import { storeToRefs } from 'pinia'
import type { ImageFile, LabelSet } from '../types'

const { t } = useI18n()
const store = useEditorStore()
const labelStore = useLabelStore()
const message = useMessage()
const { images, currentImageId, currentImage, currentAnnotations, selectedAnnotationId, currentTool, currentLabelId } = storeToRefs(store)

const fileInputMultiple = ref<HTMLInputElement | null>(null)
const fileInputDirectory = ref<HTMLInputElement | null>(null)

const selectedLabelSetId = ref<string | null>(null)
const isSyncEnabled = ref(false)
const localLabelSet = ref<LabelSet>({
    id: 'local_temp',
    name: 'Temporary',
    labels: []
})

// Add Label State
const showAddLabelModal = ref(false)
const newLabelName = ref('')
const newLabelColor = ref('#FF0000')

// Initialize selected label set - Auto-selection removed as per request
// watch(() => labelStore.isInitialized, (ready) => {
//    if (ready && labelStore.labelSets.length > 0 && !selectedLabelSetId.value) {
//        selectedLabelSetId.value = labelStore.labelSets[0]?.id ?? null
//    }
// }, { immediate: true })

const triggerUpload = (type: 'directory' | 'multiple') => {
    if (type === 'directory') {
        fileInputDirectory.value?.click()
    } else {
        fileInputMultiple.value?.click()
    }
}

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
    // Return local set if sync is off OR no store set is selected
    return localLabelSet.value
})

// Watch selectedLabelSetId to merge labels when !isSyncEnabled
watch(selectedLabelSetId, (newId) => {
    // If set is deselected, we don't need to do anything (we fall back to local set, which retains its state)
    // If sync was on, user was viewing store set. Deselecting -> view local set.
    if (!newId) {
        // Auto-disable sync if no set selected, to avoid confusion
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
            if (existingNames.has(label.name)) return // Skip duplicates

            let color = label.color
            if (existingColors.has(color)) {
                // Find unused color
                color = PRESET_COLORS.find(c => !existingColors.has(c)) || label.color
            }
            
            // Add to local
            const newLabel = { ...label, color } 
            
            localLabelSet.value!.labels.push(newLabel)
            existingNames.add(newLabel.name)
            existingColors.add(newLabel.color)
        })
    }
}, { immediate: true })

// Watch Sync Switch
watch(isSyncEnabled, (enabled) => {
    if (!enabled && selectedStoreLabelSet.value) {
        // Initialize local with current store set
        localLabelSet.value = JSON.parse(JSON.stringify(selectedStoreLabelSet.value))
    }
})

const currentLabelOptions = computed(() => {
    if (!currentLabelSet.value) return []
    return currentLabelSet.value.labels.map(l => ({ label: l.name, value: l.id }))
})

const handleLabelChange = (annId: string, newLabelId: string) => {
    const label = currentLabelSet.value?.labels.find(l => l.id === newLabelId)
    const updates: any = { labelId: newLabelId }
    if (label) {
        updates.color = label.color
    }
    store.updateAnnotation(annId, updates)
}

const handleFileChange = (event: Event) => {
    const target = event.target as HTMLInputElement
    if (!target.files || target.files.length === 0) return

    const newImages: ImageFile[] = []
    
    Array.from(target.files).forEach(file => {
        if (!file.type.startsWith('image/')) return

        const url = URL.createObjectURL(file)
        newImages.push({
            id: Math.random().toString(36).substring(2, 9),
            name: file.name,
            url: url,
            file: file,
            annotations: []
        })
    })

    if (newImages.length > 0) {
        store.addImages(newImages)
        // Auto select first label if available
        if (currentLabelSet.value && currentLabelSet.value.labels.length > 0) {
            const firstLabel = currentLabelSet.value.labels[0]
            if (firstLabel) {
                store.currentLabelId = firstLabel.id
            }
        }
    } else {
        message.warning(t('common.noImagesFound') || 'No images found')
    }

    // Reset input value to allow selecting the same file again
    target.value = ''
}

const getLabelName = (id: string) => {
    if (!currentLabelSet.value) return id
    const label = currentLabelSet.value.labels.find(l => l.id === id)
    return label ? label.name : id
}

const handleAddLabel = () => {
    if (!currentLabelSet.value) return
    
    // Pick first unused color from presets
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
        // Sync Mode: Update store
        const updatedLabels = [...currentLabelSet.value.labels, newLabel]
        labelStore.updateLabelSet(currentLabelSet.value.id, { labels: updatedLabels })
    } else {
        // Local Mode: Update local ref
        // Check if localLabelSet exists (it should via computed)
        if (localLabelSet.value) {
            localLabelSet.value.labels.push(newLabel)
        }
    }
    
    showAddLabelModal.value = false
}

const showExportModal = ref(false)
const exportFormat = ref<ExportFormat>('tagzero')
const isExporting = ref(false)
const unannotatedImageIds = ref<Set<string>>(new Set())

const exportFormatOptions = computed(() => [
    { label: t('common.formats.tagzero'), value: 'tagzero' },
    { label: t('common.formats.coco'), value: 'coco' },
    { label: t('common.formats.yolo'), value: 'yolo' },
    { label: t('common.formats.voc'), value: 'voc' }
])

const handleExport = () => {
    const unannotated = new Set<string>()
    images.value.forEach(img => {
        if (img.annotations.length === 0) {
            unannotated.add(img.id)
        }
    })
    unannotatedImageIds.value = unannotated
    showExportModal.value = true
}

const getUnannotatedIndicesDisplay = () => {
    const indices = images.value
        .map((img, index) => ({ id: img.id, index: index + 1 }))
        .filter(item => unannotatedImageIds.value.has(item.id))
        .map(item => item.index)
    
    if (indices.length <= 10) {
        return indices.join('、')
    } else {
        return indices.slice(0, 10).join('、') + '...'
    }
}

const confirmExport = async () => {
    try {
        isExporting.value = true
        await exportData({
            images: images.value,
            labelSet: currentLabelSet.value,
            format: exportFormat.value
        })
        message.success(t('common.exportSuccess'))
        showExportModal.value = false
    } catch (error: any) {
        console.error(error)
        message.error('Export failed: ' + error.message || error)
    } finally {
        isExporting.value = false
    }
}

const handleDeleteLabel = (labelId: string) => {
    if (!currentLabelSet.value) return
    
    if (isSyncEnabled.value) {
        // Sync Mode: Update store
        const updatedLabels = currentLabelSet.value.labels.filter(l => l.id !== labelId)
        labelStore.updateLabelSet(currentLabelSet.value.id, { labels: updatedLabels })
    } else {
         // Local Mode: Update local ref
         if (localLabelSet.value) {
             localLabelSet.value.labels = localLabelSet.value.labels.filter(l => l.id !== labelId)
         }
    }
    
    // If deleted label was selected, deselect it
    if (store.currentLabelId === labelId) {
        store.currentLabelId = null
    }
}

</script>

<style scoped>
.annotation-view {
    height: 100%;
}
.empty-state {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}
.image-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 10px;
    gap: 5px;
    position: relative;
}
.image-index {
    position: absolute;
    top: 5px;
    left: 5px;
    background: #1890ff;
    color: white;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 12px;
    z-index: 1;
}
.image-thumb {
    width: 100%;
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    background: #f5f5f5;
    border-radius: 4px;
}
.image-thumb img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
}
.image-name {
    font-size: 12px;
    color: #666;
    text-align: center;
    width: 100%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.selected-image {
    background-color: #e6f7ff;
}
.sidebar-header {
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-bottom: 1px solid #eee;
    font-weight: 500;
    flex-shrink: 0;
    background-color: #fff; /* Ensure opaque background */
}
.toolbar {
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-bottom: 1px solid #eee;
}
.canvas-container {
    flex: 1;
    background: #f0f2f5;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    padding: 20px;
}
.canvas-wrapper {
    width: 70%; /* Occupy 70% width as requested */
    height: 100%; /* Or auto? */
    display: flex;
    align-items: center;
    justify-content: center;
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

.selected-text {
    font-weight: bold;
    color: #d03050;
    text-shadow: 0 0 1px rgba(208, 48, 80, 0.2);
}
/* Icon placeholders - simplified css shapes */
.icon-rect { width: 12px; height: 12px; border: 2px solid currentColor; }
.icon-circle { width: 12px; height: 12px; border: 2px solid currentColor; border-radius: 50%; }
.icon-triangle { width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-bottom: 12px solid currentColor; }
.icon-polygon { width: 12px; height: 12px; border: 2px solid currentColor; transform: rotate(45deg); }

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
.clickable-label {
    cursor: pointer;
    border-bottom: 1px dashed #999;
}
.clickable-label:hover {
    color: #1890ff;
    border-bottom-color: #1890ff;
}
.color-dot {
    width: 14px;
    height: 14px;
    border-radius: 50%;
}
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

.empty-layout {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}
.icon-folder {
    width: 16px;
    height: 12px;
    border: 2px solid currentColor;
    border-radius: 0 0 2px 2px;
    position: relative;
    margin-top: 2px;
}
.icon-folder::before {
    content: '';
    position: absolute;
    top: -4px;
    left: -2px;
    width: 6px;
    height: 2px;
    border: 2px solid currentColor;
    border-bottom: none;
    border-radius: 2px 2px 0 0;
}
.icon-image {
    width: 14px;
    height: 14px;
    border: 2px solid currentColor;
    border-radius: 2px;
}
.icon-images {
    width: 12px;
    height: 12px;
    border: 2px solid currentColor;
    border-radius: 2px;
    box-shadow: 4px -4px 0 -1px currentColor;
    margin-right: 4px;
    margin-top: 4px;
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
