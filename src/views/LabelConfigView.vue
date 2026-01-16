<template>
  <div class="label-config-container">
    <n-space justify="space-between" align="center" style="margin-bottom: 24px;">
      <n-h2 style="margin: 0;">{{ t('menu.labelConfig') }}</n-h2>
      <n-button type="primary" @click="openModal()">
        {{ t('common.addNew') }}
      </n-button>
    </n-space>

    <n-grid :x-gap="24" :y-gap="24" cols="1 2 s:3 m:4 l:5 xl:6" responsive="screen">
      <n-grid-item v-for="set in labelSets" :key="set.id">
        <n-card :title="set.name" hoverable class="label-set-card">
          <template #cover>
            <div class="card-cover">
              <img v-if="set.presetImage" :src="set.presetImage" alt="preset" />
              <div v-else class="empty-cover">
                <span>{{ t('common.noImage') }}</span>
              </div>
            </div>
          </template>
          <template #action>
            <n-space justify="end">
              <n-button size="small" @click="openModal(set)">{{ t('common.edit') }}</n-button>
              <n-button size="small" type="error" @click="handleDelete(set.id)">{{ t('common.delete') }}</n-button>
            </n-space>
          </template>
        </n-card>
      </n-grid-item>
    </n-grid>

    <n-modal v-model:show="showModal" preset="card" :title="isEdit ? t('labelConfig.editSet') : t('labelConfig.newSet')" style="width: 800px">
      <n-form label-placement="left" label-width="100">
        <n-form-item :label="t('labelConfig.name')">
          <n-input v-model:value="currentSet.name" :placeholder="t('labelConfig.setNamePlaceholder')" />
        </n-form-item>
        <n-form-item :label="t('labelConfig.presetImage')">
           <n-upload
            list-type="image-card"
            :max="1"
            :default-file-list="currentSet.presetImage ? [{id: '1', name: 'preset', status: 'finished', url: currentSet.presetImage}] : []"
            @change="handleImageUpload"
            @remove="currentSet.presetImage = undefined"
          >
             {{ t('common.clickToUpload') }}
          </n-upload>
        </n-form-item>
      </n-form>

      <n-divider>{{ t('labelConfig.labels') }}</n-divider>
      
      <n-dynamic-input v-model:value="currentSet.labels">
        <template #default="{ value }">
          <div style="display: flex; align-items: center; width: 100%; gap: 10px;">
            <n-input v-model:value="value.name" :placeholder="t('labelConfig.labelNamePlaceholder')" style="flex: 1" />
            <n-input v-model:value="value.value" :placeholder="t('labelConfig.labelValuePlaceholder')" style="flex: 1" />
            <n-color-picker v-model:value="value.color" :swatches="PRESET_COLORS" style="width: 100px" />
          </div>
        </template>
      </n-dynamic-input>
      <n-button dashed block style="margin-top: 12px" @click="handleAddLabel">
        {{ t('common.add') }}
      </n-button>

      <template #footer>
        <n-space justify="end">
          <n-button @click="showModal = false">{{ t('common.cancel') }}</n-button>
          <n-button type="primary" @click="handleSave">{{ t('common.confirm') }}</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { 
  NSpace, NH2, NButton, NGrid, NGridItem, NCard, NModal, NForm, NFormItem, 
  NInput, NUpload, NDivider, NDynamicInput, NColorPicker, useDialog, useMessage
} from 'naive-ui'
import type { UploadFileInfo } from 'naive-ui'
import { useLabelStore, PRESET_COLORS } from '../stores/labelStore'
import { storeToRefs } from 'pinia'
import type { LabelSet, LabelItem } from '../types'

const { t } = useI18n()
const store = useLabelStore()
const { labelSets } = storeToRefs(store)
const dialog = useDialog()
const message = useMessage()

const showModal = ref(false)
const isEdit = ref(false)
const currentId = ref<string | null>(null)

// Initial empty state
const emptySet: Omit<LabelSet, 'id'> = {
  name: '',
  presetImage: undefined,
  labels: []
}

const currentSet = reactive<Omit<LabelSet, 'id'>>({ ...emptySet })

const openModal = (set?: LabelSet) => {
  if (set) {
    isEdit.value = true
    currentId.value = set.id
    currentSet.name = set.name
    currentSet.presetImage = set.presetImage
    // Deep copy labels to avoid direct mutation
    currentSet.labels = JSON.parse(JSON.stringify(set.labels))
  } else {
    isEdit.value = false
    currentId.value = null
    Object.assign(currentSet, JSON.parse(JSON.stringify(emptySet)))
    // Add one empty label by default
    currentSet.labels = [createLabel()]
  }
  showModal.value = true
}

const handleSave = () => {
  // Validations
  if (!currentSet.name || !currentSet.name.trim()) {
    message.error(t('labelConfig.validation.nameRequired'))
    return
  }
  
  if (!currentSet.labels || currentSet.labels.length === 0) {
    message.error(t('labelConfig.validation.labelsRequired'))
    return
  }

  const hasEmptyLabelName = currentSet.labels.some(l => !l.name || !l.name.trim())
  if (hasEmptyLabelName) {
    message.error(t('labelConfig.validation.labelNameRequired'))
    return
  }

  // Check duplicate names
  const names = new Set<string>()
  for (const l of currentSet.labels) {
    const name = l.name.trim()
    if (names.has(name)) {
      message.error(t('labelConfig.validation.duplicateLabelName') + ': ' + name)
      return
    }
    names.add(name)
  }

  if (isEdit.value && currentId.value) {
    store.updateLabelSet(currentId.value, currentSet)
  } else {
    store.addLabelSet(currentSet)
  }
  showModal.value = false
}

const handleDelete = (id: string) => {
    dialog.warning({
      title: t('common.confirm'),
      content: t('labelConfig.deleteConfirm'),
      positiveText: t('common.confirm'),
      negativeText: t('common.cancel'),
      onPositiveClick: () => {
        store.deleteLabelSet(id)
      }
    })
  }

const handleImageUpload = (options: { fileList: UploadFileInfo[] }) => {
  const file = options.fileList[0]?.file
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      currentSet.presetImage = e.target?.result as string
    }
    reader.readAsDataURL(file)
  } else {
    currentSet.presetImage = undefined
  }
}

const createLabel = (): LabelItem => {
  const randomColor = PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)] || '#000000'
  return {
    id: Math.random().toString(36).substring(2, 9),
    name: '',
    value: '',
    color: randomColor
  }
}

const handleAddLabel = () => {
  currentSet.labels.push(createLabel())
}
</script>

<style scoped>
.label-config-container {
  padding: 24px;
}
.card-cover {
  height: 150px;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.card-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.empty-cover {
  color: #999;
}
</style>
