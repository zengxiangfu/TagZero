<template>
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
         <n-button size="small" @click="emit('triggerUpload', 'multiple')">
            + {{ t('common.add') }}
         </n-button>
    </div>
  </n-layout-sider>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { NLayoutSider, NList, NListItem, NButton } from 'naive-ui'
import { useEditorStore } from '../../../stores/editor'
import { storeToRefs } from 'pinia'

const props = defineProps<{
  unannotatedImageIds: Set<string>
}>()

const emit = defineEmits<{
  (e: 'triggerUpload', type: 'directory' | 'multiple'): void
}>()

const { t } = useI18n()
const store = useEditorStore()
const { images, currentImageId } = storeToRefs(store)
</script>

<style scoped>
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
</style>