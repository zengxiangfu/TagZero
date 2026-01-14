<template>
  <n-config-provider>
    <n-dialog-provider>
      <n-message-provider>
        <n-layout style="height: 100vh">
          <n-layout-header bordered style="height: 60px; padding: 0 20px; display: flex; align-items: center;">
            <n-space justify="space-between" style="width: 100%; align-items: center;">
              <div style="display: flex; align-items: center; gap: 20px;">
                <h2 style="margin: 0; margin-right: 20px;">TagZero</h2>
                <n-menu 
                  mode="horizontal" 
                  :options="menuOptions" 
                  :value="activeKey"
                  @update:value="handleMenuUpdate"
                />
              </div>
              <n-space align="center">
                <n-switch :value="locale === 'zh'" @update:value="toggleLocale">
                  <template #checked>中文</template>
                  <template #unchecked>English</template>
                </n-switch>
              </n-space>
            </n-space>
          </n-layout-header>

          <n-layout-content style="height: calc(100vh - 60px);">
            <router-view></router-view>
          </n-layout-content>
        </n-layout>
      </n-message-provider>
    </n-dialog-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vue-router'
import { 
  NConfigProvider, NLayout, NLayoutHeader, NLayoutContent, NSpace, NMenu, NSwitch,
  NDialogProvider, NMessageProvider
} from 'naive-ui'
import type { MenuOption } from 'naive-ui'

const { t, locale } = useI18n()
const router = useRouter()
const route = useRoute()

const activeKey = ref<string>('annotation')

watch(() => route.name, (newName) => {
  if (newName) {
    activeKey.value = newName as string
  }
})

const menuOptions = computed<MenuOption[]>(() => [
  {
    label: () => t('menu.annotation'),
    key: 'annotation'
  },
  {
    label: () => t('menu.labelConfig'),
    key: 'label-config'
  }
])

const handleMenuUpdate = (key: string) => {
  activeKey.value = key
  router.push({ name: key })
}

const toggleLocale = (value: boolean) => {
  locale.value = value ? 'zh' : 'en'
}
</script>
