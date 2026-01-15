<template>
  <n-layout-sider
    bordered
    :width="siderWidth"
    :content-style="{ padding: 0 }"
    style="transition: none;"
  >
    <div class="sider-content">
    <!-- Header -->
    <div class="sidebar-header">
        {{ t('annotation.originalFiles') }}
    </div>

    <n-list hoverable clickable style="flex: 1; overflow-y: auto; overflow-x: hidden;">
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
           <n-button size="small" @click="emit('triggerUpload', 'multiple')">
              + {{ t('common.add') }}
           </n-button>
      </div>
      
      <div class="resize-handle" :class="{ active: isResizing }" @mousedown="startResize">
          <div class="resize-line"></div>
      </div>
    </div>
  </n-layout-sider>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { NLayoutSider, NList, NListItem, NButton } from 'naive-ui'
import { useEditorStore } from '../../../stores/editor'
import { storeToRefs } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useWindowSize } from '@vueuse/core'

const props = defineProps<{
  unannotatedImageIds: Set<string>
}>()

const emit = defineEmits<{
  (e: 'triggerUpload', type: 'directory' | 'multiple'): void
}>()

const { t } = useI18n()
const store = useEditorStore()
const { images, currentImageId } = storeToRefs(store)

const { width: windowWidth } = useWindowSize()
const siderWidth = ref(windowWidth.value * 0.15)
const isResizing = ref(false)
const startX = ref(0)
const startWidth = ref(0)

watch(windowWidth, (newW) => {
    const min = newW * 0.10
    const max = newW * 0.16
    if (siderWidth.value < min) siderWidth.value = min
    if (siderWidth.value > max) siderWidth.value = max
})

const startResize = (e: MouseEvent) => {
    isResizing.value = true
    startX.value = e.clientX
    startWidth.value = siderWidth.value
    document.addEventListener('mousemove', handleResize)
    document.addEventListener('mouseup', stopResize)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
}

const handleResize = (e: MouseEvent) => {
    if (!isResizing.value) return
    const delta = e.clientX - startX.value
    let newWidth = startWidth.value + delta
    const min = windowWidth.value * 0.10
    const max = windowWidth.value * 0.16
    
    if (newWidth < min) newWidth = min
    if (newWidth > max) newWidth = max
    
    siderWidth.value = newWidth
}

const stopResize = () => {
    isResizing.value = false
    document.removeEventListener('mousemove', handleResize)
    document.removeEventListener('mouseup', stopResize)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
}
</script>

<style scoped>
.sider-content {
    display: flex;
    flex-direction: column;
    height: 100%;
    position: relative;
    overflow: hidden;
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
.image-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 10px;
    gap: 5px;
    position: relative;
    width: 100%;
    max-width: 100%;
    min-width: 0;
    aspect-ratio: 1;
    box-sizing: border-box;
    overflow: hidden;
}
:deep(.n-list-item) {
    padding: 0 !important;
    overflow: hidden;
    width: 100%;
    box-sizing: border-box;
    display: block;
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
    flex: 1;
    min-height: 0;
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
    max-width: 100%;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex-shrink: 0;
}
.selected-image {
    background-color: #e6f7ff;
}
.resize-handle {
    position: absolute;
    top: 0;
    right: 0;
    width: 10px;
    height: 100%;
    cursor: col-resize;
    z-index: 999; /* Ensure high z-index */
    background-color: transparent;
    display: flex;
    justify-content: center;
}
</style>