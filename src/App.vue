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
                <n-tooltip trigger="hover">
                  <template #trigger>
                    <n-button quaternary circle @click="toggle">
                      <template #icon>
                        <n-icon size="22">
                          <svg v-if="!isFullscreen" viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" fill="currentColor"/></svg>
                          <svg v-else viewBox="0 0 24 24"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" fill="currentColor"/></svg>
                        </n-icon>
                      </template>
                    </n-button>
                  </template>
                  {{ isFullscreen ? t('common.exitFullscreen') : t('common.fullscreen') }}
                </n-tooltip>
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
import { useFullscreen } from '@vueuse/core'
import { 
  NConfigProvider, NLayout, NLayoutHeader, NLayoutContent, NSpace, NMenu, NSwitch,
  NDialogProvider, NMessageProvider, NButton, NIcon, NTooltip
} from 'naive-ui'
import type { MenuOption } from 'naive-ui'

const { t, locale } = useI18n()
const router = useRouter()
const route = useRoute()
const { isFullscreen, toggle } = useFullscreen()

// Try to lock keyboard to prevent Esc from exiting fullscreen
watch(isFullscreen, async (val) => {
    if (val) {
        try {
            // @ts-ignore - navigator.keyboard is experimental
            if (navigator.keyboard && navigator.keyboard.lock) {
                // @ts-ignore
                await navigator.keyboard.lock(['Escape'])
            }
        } catch (e) {
            console.warn('Keyboard lock failed:', e)
        }
    } else {
        try {
             // @ts-ignore
            if (navigator.keyboard && navigator.keyboard.unlock) {
                 // @ts-ignore
                navigator.keyboard.unlock()
            }
        } catch (e) {
            console.warn('Keyboard unlock failed:', e)
        }
    }
})

const activeKey = ref<string>('annotation')

watch(() => route.name, (newName) => {
  if (newName) {
    activeKey.value = newName as string
  }
})

// Listen to Escape key to prevent default fullscreen exit behavior
// We only want to exit fullscreen via the button
// Note: Browser security policies may not allow preventing ESC from exiting fullscreen completely,
// but we can try to re-request it or manage our own state.
// However, most modern browsers force ESC to exit fullscreen for security.
// The user request is "Esc should not cancel fullscreen".
// If the browser enforces it, we might not be able to fully stop it, 
// but we can ensure our button state syncs correctly.
// Actually, if we use `useFullscreen`, it handles the state.
// If we want to PREVENT Esc from exiting, we might be out of luck on standard fullscreen API.
// BUT, maybe the user means: "When I press Esc to cancel selection, it ALSO exits fullscreen, which is annoying."
// If so, we can consume the event.
// Let's try to capture the event in the capture phase.

// NOTE: Browsers (Chrome, etc.) do NOT allow preventing ESC from exiting fullscreen mode initiated by Element.requestFullscreen().
// This is a hard security feature.
// However, if we use "F11" style fullscreen (browser window max), that's different.
// Assuming we are using the standard API.
// Let's see if we can at least make sure our app logic fires first.
// The `useShortcuts` already calls `e.preventDefault()`. 
// If that's not enough, it means the browser handles it before JS.
// Wait, if the user is in Fullscreen, and presses ESC, the browser WILL exit fullscreen.
// We can try to re-enter fullscreen immediately? No, that requires user interaction.
// 
// Alternative interpretation: "Esc cancels selection AND exits fullscreen."
// If we preventDefault, maybe it helps?
// `useShortcuts.ts` already does `e.preventDefault()`.
// 
// Let's look at `useFullscreen` options.
// Maybe we can't stop it, but we can check if we can make the experience better.
// Or maybe the user is okay with us not using the native Fullscreen API but just a CSS "fullscreen" overlay?
// No, the icon implies real fullscreen.
// 
// Let's try to add a global listener in App.vue to stop propagation if possible, 
// but likely the browser intercepts it at the window manager level.
// 
// Wait, the user said "modify esc to NOT cancel fullscreen".
// If technical limitation prevents this for native fullscreen, 
// we might need to explain or use a "fake" fullscreen (position: fixed; inset: 0; z-index: 9999).
// Given the context of a web app, a "fake" fullscreen is often preferred for complex editors exactly for this reason.
// Let's switch `useFullscreen` to use a specific element (the layout) and if that fails, 
// we might consider the CSS approach if the user insists.
// BUT, `useFullscreen` usually defaults to `document.documentElement`.
// 
// Let's try to see if `useShortcuts` is catching it.
// If I change the `useFullscreen` target to the main layout div, maybe it behaves differently?
// No, ESC always exits DOM fullscreen.
// 
// PLAN: Switch to "Fake Fullscreen" (CSS based) OR accept the limitation.
// However, "Fake Fullscreen" doesn't hide the browser address bar.
// If the user wants the address bar gone, we need native fullscreen.
// 
// Let's assume the user wants to prioritize "ESC for logic" over "ESC for fullscreen exit".
// The only way to do that is... you can't in native fullscreen.
// https://stackoverflow.com/questions/20969560/prevent-escape-key-from-exiting-full-screen-mode-in-chrome
// "You cannot prevent the Escape key from exiting full screen mode. This is a security feature."
// 
// So the only solution is to use "Fake Fullscreen" (CSS).
// Let's implement a "Fake Fullscreen" mode instead of native `useFullscreen`.
// OR, we check if the user is in native fullscreen, and if they press ESC, we show a toast saying "Press F11" or something?
// No, that's bad UX.
// 
// Let's try to implement the CSS-based fullscreen as an alternative or replacement.
// If I replace `useFullscreen` with a simple state that adds a class to the body/layout,
// then ESC won't exit it.
// The downside: Address bar remains.
// The upside: ESC works for the app.
// 
// Let's ask or assume? "modify esc cannot cancel shrink" (cannot cancel fullscreen).
// I will switch to CSS-based fullscreen.

const isFakeFullscreen = ref(false)
const toggleFullscreen = () => {
    isFakeFullscreen.value = !isFakeFullscreen.value
    if (isFakeFullscreen.value) {
        document.body.classList.add('fake-fullscreen')
    } else {
        document.body.classList.remove('fake-fullscreen')
    }
    // Trigger resize event for canvas
    window.dispatchEvent(new Event('resize'))
}
// Remove useFullscreen usage or keep it as an option? 
// The user explicitly asked to change the behavior.
// Let's replace the logic.

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
