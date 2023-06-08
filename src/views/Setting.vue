<script setup lang="ts">
import AppInfo from '@/models/AppInfo'
import { useAppsStore } from '@/store'
import { getFileIcon } from 'utools-api'
import { reactive, ref } from 'vue'
import * as featureApi from '@/api/featureApi'
import OverflowText from '@/components/OverflowText.vue'

const settingStore = useAppsStore()

const loading = ref(false)

async function getApps() {
  loading.value = true
  const { removed, added } = await settingStore.refreshApps()
  toast(`新增了 ${added.length} 个，移除了 ${removed.length} 个。`)
  loading.value = false
}

function handleClickApp(app: AppInfo) {
  if (app.enabled) {
    app.enabled = false
    featureApi.removeFeatures([app.id])
  } else {
    app.enabled = true
    featureApi.setFeatures([app])
  }
}

const toastOptions = reactive({
  show: false,
  msg: ''
})
let timer: number
function toast(msg: string) {
  window.clearTimeout(timer)
  toastOptions.show = true
  toastOptions.msg = msg
  timer = window.setTimeout(() => {
    toastOptions.show = false
  }, 3000)
}

async function init() {
  if (settingStore.apps.length === 0) {
    await getApps()
  }
}

init()
</script>

<template>
  <div class="toast-end toast toast-top z-10" v-show="toastOptions.show">
    <div class="alert alert-success">
      <span>{{ toastOptions.msg }}</span>
    </div>
  </div>

  <div class="absolute flex h-full w-full flex-col overflow-hidden">
    <div class="mb-2 mt-3 flex flex-none items-end justify-between px-5">
      <div>
        <div class="text-lg font-bold">所有最近文档应用</div>
        <div class="font-light">点击开启或关闭搜索</div>
      </div>
      <button class="btn-sm btn" @click="getApps">刷新</button>
    </div>

    <div
      class="relative flex-grow overflow-y-auto px-5 pb-4 pt-3"
      @wheel="loading && $event.preventDefault()"
    >
      <div class="relative grid grid-cols-4 gap-4">
        <div
          v-for="app in settingStore.apps"
          :key="app.id"
          class="relative overflow-hidden rounded-xl"
          @click="handleClickApp(app)"
        >
          <div
            class="flex select-none items-center bg-slate-200 p-1 dark:bg-neutral-700"
          >
            <div class="avatar">
              <div class="w-20">
                <img
                  :src="getFileIcon(app.path)"
                  style="-webkit-user-drag: none"
                />
              </div>
            </div>
            <OverflowText>
              {{ app.title }}
            </OverflowText>
          </div>
          <div
            class="absolute left-0 top-0 h-full w-full bg-slate-200 opacity-90 dark:bg-neutral-700 dark:opacity-80"
            v-show="!app.enabled"
          ></div>
        </div>

        <div
          class="absolute left-0 top-0 h-full w-full bg-neutral-200/30 dark:bg-neutral-700/30"
          v-show="loading"
        ></div>
      </div>

      <div
        class="absolute left-0 top-0 flex h-full w-full items-center justify-center"
        v-show="loading"
      >
        <span class="loading loading-spinner loading-lg"></span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss"></style>
