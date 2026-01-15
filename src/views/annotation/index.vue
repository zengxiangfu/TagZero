<template>
  <div class="annotation-view">
    <!-- 空状态 -->
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

    <!-- 主布局 -->
    <n-layout v-else has-sider style="height: calc(100vh - 60px)">
      <!-- 左侧边栏：图片列表 -->
      <ImageList 
        :unannotated-image-ids="unannotatedImageIds"
        @trigger-upload="triggerUpload"
      />

      <!-- 中间区域：工具栏 + 画布 -->
      <n-layout content-style="display: flex; flex-direction: column;">
        <EditorToolbar @export="showExportModal = true" />

        <!-- 画布区域 -->
        <div class="canvas-container">
          <div class="canvas-wrapper" v-if="currentImage">
            <AnnotationCanvas :active-label-set="activeLabelSet" />
          </div>
          <n-empty v-else :description="t('annotation.selectImageTip')" />
        </div>
      </n-layout>

      <!-- 右侧边栏：标签 & 标注结果 -->
      <n-layout-sider
        bordered
        :width="'15%'"
        content-style="padding: 0; display: flex; flex-direction: column; height: 100%;"
      >
        <div class="sidebar-header">
            {{ t('annotation.annotationResults') }}
        </div>
        
        <LabelManager 
            @update:active-label-set="activeLabelSet = $event"
        />

        <AnnotationList 
            :active-label-set="activeLabelSet"
        />
      </n-layout-sider>
    </n-layout>

    <!-- 隐藏的文件输入框 -->
    <input type="file" ref="fileInputMultiple" style="display: none" accept="image/*" multiple @change="(e) => handleFileChange(e)" />
    <input type="file" ref="fileInputDirectory" style="display: none" webkitdirectory directory @change="(e) => handleFileChange(e)" />

    <!-- 导出弹窗 -->
    <ExportModal 
        v-model:show="showExportModal"
        :unannotated-image-ids="unannotatedImageIds"
        :current-label-set="activeLabelSet"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { NLayout, NLayoutSider, NButton, NEmpty, NSpace, NIcon } from 'naive-ui'
import { storeToRefs } from 'pinia'
import { useEditorStore } from '../../stores/editor'
import { useShortcuts } from '../../composables/useShortcuts'
import type { LabelSet } from '../../types'

// 组件引用
import ImageList from './components/ImageList.vue'
import EditorToolbar from './components/EditorToolbar.vue'
import LabelManager from './components/LabelManager.vue'
import AnnotationList from './components/AnnotationList.vue'
import ExportModal from './components/ExportModal.vue'
import AnnotationCanvas from './components/AnnotationCanvas.vue'

const { t } = useI18n()
const store = useEditorStore()
const { images, currentImage } = storeToRefs(store)

// 初始化快捷键
useShortcuts()

const activeLabelSet = ref<LabelSet | null>(null)
const showExportModal = ref(false)

// 文件上传逻辑
const fileInputMultiple = ref<HTMLInputElement | null>(null)
const fileInputDirectory = ref<HTMLInputElement | null>(null)

const triggerUpload = (type: 'directory' | 'multiple') => {
    if (type === 'directory') {
        fileInputDirectory.value?.click()
    } else {
        fileInputMultiple.value?.click()
    }
}

const handleFileChange = async (event: Event) => {
    const input = event.target as HTMLInputElement
    if (!input.files || input.files.length === 0) return

    const fileList = Array.from(input.files)
    const imageFiles = fileList.filter(file => file.type.startsWith('image/'))
    
    if (imageFiles.length === 0) return

    const newImages = imageFiles.map(file => ({
        id: Math.random().toString(36).substring(2, 9),
        name: file.name,
        url: URL.createObjectURL(file),
        file,
        annotations: []
    }))

    store.addImages(newImages)
    
    // 重置输入框
    input.value = ''
}

// 未标注图片逻辑
const unannotatedImageIds = computed(() => {
    const ids = new Set<string>()
    images.value.forEach(img => {
        if (!img.annotations || img.annotations.length === 0) {
            ids.add(img.id)
        }
    })
    return ids
})
</script>

<style scoped>
.annotation-view {
    height: 100%;
    display: flex;
    flex-direction: column;
}

.empty-layout {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.canvas-container {
    flex: 1;
    background: #f0f0f0;
    overflow: hidden;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
}

.canvas-wrapper {
    width: 100%;
    height: 100%;
}

.sidebar-header {
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-bottom: 1px solid #eee;
    font-weight: 500;
    flex-shrink: 0;
    background-color: #fff;
}

.icon-folder {
    width: 24px;
    height: 24px;
    background: currentColor;
    mask: url("data:image/svg+xml,%3Csvg viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z'/%3E%3C/svg%3E") no-repeat center;
}

.icon-images {
    width: 24px;
    height: 24px;
    background: currentColor;
    mask: url("data:image/svg+xml,%3Csvg viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z'/%3E%3C/svg%3E") no-repeat center;
}
</style>