<template>
  <div class="toolbar">
    <!-- Edit & View Controls -->
    <div style="display: flex; gap: 8px; margin-left: 20px; align-items: center;">
      <div class="capsule-button-group">
        <n-tooltip trigger="hover">
          <template #trigger>
            <n-button strong @click="store.undo">
              <template #icon>
                <n-icon>
                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z" fill="currentColor"/></svg>
                </n-icon>
              </template>
            </n-button>
          </template>
          {{ t('toolbar.undo') }}
        </n-tooltip>

        <n-tooltip trigger="hover">
          <template #trigger>
            <n-button strong @click="store.redo" :disabled="!store.canRedo">
              <template #icon>
                <n-icon>
                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M18.4 10.6C16.55 9 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22L3.9 16c1.05-3.19 4.05-5.5 7.6-5.5 1.95 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6z" fill="currentColor"/></svg>
                </n-icon>
              </template>
            </n-button>
          </template>
          {{ t('toolbar.redo') }}
        </n-tooltip>
      </div>

      <div class="capsule-button-group">
        <n-tooltip trigger="hover">
          <template #trigger>
            <n-button strong secondary @click="store.zoomIn">
              <template #icon>
                <n-icon>
                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14zM12 10h-2v2H9v-2H7V9h2V7h1v2h2v1z" fill="currentColor"/></svg>
                </n-icon>
              </template>
            </n-button>
          </template>
          {{ t('toolbar.zoomIn') }}
        </n-tooltip>

        <n-tooltip trigger="hover">
          <template #trigger>
            <n-button strong secondary @click="store.zoomOut">
              <template #icon>
                <n-icon>
                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14zM7 9h5v1H7z" fill="currentColor"/></svg>
                </n-icon>
              </template>
            </n-button>
          </template>
          {{ t('toolbar.zoomOut') }}
        </n-tooltip>

        <n-tooltip trigger="hover">
          <template #trigger>
            <n-button strong @click="store.resetZoom">
              <template #icon>
                <n-icon>
                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M3 5v4h2V5h4V3H5c-1.1 0-2 .9-2 2zm2 10H3v4c0 1.1.9 2 2 2h4v-2H5v-4zm14 4h-4v2h4c1.1 0 2-.9 2-2v-4h-2v4zm0-16h-4v2h4v4h2V5c0-1.1-.9-2-2-2z" fill="currentColor"/></svg>
                </n-icon>
              </template>
            </n-button>
          </template>
          {{ t('toolbar.resetZoom') }}
        </n-tooltip>
      </div>

      <div class="capsule-button-group">
        <n-tooltip trigger="hover">
          <template #trigger>
            <n-popselect v-model:value="store.magnifierZoom" :options="zoomOptions" trigger="click">
              <n-button strong>
                {{ store.magnifierZoom }}x
              </n-button>
            </n-popselect>
          </template>
          {{ t('toolbar.magnifierZoom') }}
        </n-tooltip>

        <n-tooltip trigger="hover">
          <template #trigger>
            <n-popselect v-model:value="store.magnifierSize" :options="sizeOptions" trigger="click">
              <n-button strong>
                {{ store.magnifierSize }}px
              </n-button>
            </n-popselect>
          </template>
          {{ t('toolbar.magnifierSize') }}
        </n-tooltip>
      </div>
    </div>

    <div style="flex: 1"></div>

    <div class="capsule-button-group">
        <n-tooltip trigger="hover">
          <template #trigger>
            <n-button 
              :type="currentTool === 'rect' ? 'primary' : 'default'"
              strong
              @click="store.setTool('rect')"
            >
              <template #icon><div class="icon-rect" /></template>
            </n-button>
          </template>
          {{ t('shapes.rect') }}
        </n-tooltip>

        <n-tooltip trigger="hover">
          <template #trigger>
            <n-button 
              :type="currentTool === 'triangle' ? 'primary' : 'default'"
              strong
              @click="store.setTool('triangle')"
            >
              <template #icon><div class="icon-triangle" /></template>
            </n-button>
          </template>
          {{ t('shapes.triangle') }}
        </n-tooltip>

        <n-tooltip trigger="hover">
          <template #trigger>
            <n-button 
              :type="currentTool === 'circle' ? 'primary' : 'default'"
              strong
              @click="store.setTool('circle')"
            >
              <template #icon><div class="icon-circle" /></template>
            </n-button>
          </template>
          {{ t('shapes.circle') }}
        </n-tooltip>

        <n-tooltip trigger="hover">
          <template #trigger>
            <n-button 
              :type="currentTool === 'polygon' ? 'primary' : 'default'"
              strong
              @click="store.setTool('polygon')"
            >
              <template #icon><div class="icon-polygon" /></template>
            </n-button>
          </template>
          {{ t('shapes.polygon') }}
        </n-tooltip>
      </div>

    <div style="flex: 1; display: flex; justify-content: flex-end; padding-right: 20px;">
      <n-button @click="emit('export')">
        {{ t('common.export') }}
      </n-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { NButton, NIcon, NTooltip, NPopselect } from 'naive-ui'
import { useEditorStore } from '../../../stores/editor'
import { storeToRefs } from 'pinia'

const { t } = useI18n()
const store = useEditorStore()
const { currentTool } = storeToRefs(store)

const emit = defineEmits<{
  (e: 'export'): void
}>()

const zoomOptions = [
    { label: '1倍', value: 1 },
    { label: '2倍', value: 2 },
    { label: '4倍', value: 4 },
    { label: '8倍', value: 8 },
    { label: '16倍', value: 16 }
]

const sizeOptions = [
    { label: '200px', value: 200 },
    { label: '300px', value: 300 },
    { label: '400px', value: 400 },
    { label: '500px', value: 500 },
    { label: '600px', value: 600 }
]
</script>

<style scoped>
.toolbar {
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-bottom: 1px solid #eee;
}

/* Custom capsule style for button groups */
.capsule-button-group {
    display: flex;
    align-items: center;
}
.capsule-button-group .n-button {
    border-radius: 0;
    margin-left: -1px; /* Merge borders */
}
.capsule-button-group .n-button:hover,
.capsule-button-group .n-button:focus {
    z-index: 1;
}

/* Target first and last buttons in the group, accounting for tooltip wrappers if any */
/* We target the n-button inside the first/last child of the flex container */
:deep(.capsule-button-group > :first-child .n-button),
:deep(.capsule-button-group > .n-button:first-child) {
    border-top-left-radius: 20px;
    border-bottom-left-radius: 20px;
    padding-left: 12px;
    margin-left: 0;
}
:deep(.capsule-button-group > :last-child .n-button),
:deep(.capsule-button-group > .n-button:last-child) {
    border-top-right-radius: 20px;
    border-bottom-right-radius: 20px;
    padding-right: 12px;
}

/* Icon placeholders - simplified css shapes */
.icon-rect { 
    width: 14px; 
    height: 14px; 
    background-color: currentColor; 
    box-sizing: border-box; 
}
.icon-circle { 
    width: 14px; 
    height: 14px; 
    background-color: currentColor; 
    border-radius: 50%; 
    box-sizing: border-box; 
}
.icon-triangle { 
    width: 0; 
    height: 0; 
    border-left: 7px solid transparent; 
    border-right: 7px solid transparent; 
    border-bottom: 14px solid currentColor; 
    transform: translateY(-2px); /* Optically center the triangle */
}
.icon-polygon { 
    width: 12px; 
    height: 12px; 
    background-color: currentColor; 
    transform: rotate(45deg); 
    box-sizing: border-box; 
}
</style>