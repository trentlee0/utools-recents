<script setup lang="ts">
import List from '@/components/List.vue'
import { ref } from 'vue'
import { onKeyDown, onStartTyping } from '@vueuse/core'
import { hideAndOutPlugin } from 'utools-utils'
import {
  appRecentDocuments,
  finderRecents,
  getFileName,
  openFile,
  existsPath
} from '@/preload'
import NProgress from '@/utils/nprogress'
import {
  hideMainWindow,
  setSubInput,
  setSubInputValue,
  subInputFocus
} from 'utools-api'
import { commonStore, useAppsStore } from '@/store'
import * as featureApi from '@/api/featureApi'
import AppInfo from '@/models/AppInfo'
import { match } from 'pinyin-pro'

const settingStore = useAppsStore()

type ListItem = {
  title: string
  subtitle?: string
  icon?: string
  keyword?: string
}
const list = ref<Array<ListItem>>([])
const filteredList = ref<Array<ListItem>>([])

const activeIndex = ref(-1)

function getActiveIndex(arr: unknown[]) {
  return arr.length === 0 ? -1 : 0
}

const app = ref<AppInfo>()

async function getList() {
  if (!commonStore.action) return
  NProgress.start()

  const id = featureApi.getId(commonStore.action.code)
  app.value = settingStore.apps.find((app) => app.id === id)

  const res = app.value?.isFinder
    ? await finderRecents(id)
    : await appRecentDocuments(id)

  list.value = res.map((file) => ({
    title: getFileName(file),
    subtitle: file,
    icon: utools.getFileIcon(file)
  }))
  filteredList.value = list.value
  activeIndex.value = getActiveIndex(list.value)

  NProgress.done()
}

function checkItemSubtitle(itemIndex: number) {
  const { subtitle } = filteredList.value[itemIndex]
  if (subtitle && existsPath(subtitle)) {
    return subtitle
  }
  const msg = '文件或文件夹路径不存在！'
  utools.showNotification(msg)
  throw new Error(msg)
}

async function handleSelect(itemIndex: number) {
  const subtitle = checkItemSubtitle(itemIndex)
  await openFile(subtitle, app.value?.path)
  hideAndOutPlugin()
}

onKeyDown(['Meta', 'Enter'], async (e) => {
  if (e.key === 'Enter' && e.metaKey) {
    const subtitle = checkItemSubtitle(activeIndex.value)
    utools.shellShowItemInFolder(subtitle)
    hideMainWindow()
  }
})

setSubInput((e: { text: string }) => {
  const words = e.text.split(/ +/)
  let arr: Array<ListItem> = list.value
  for (const word of words) {
    if (!word) continue
    const lowerCase = word.toLowerCase()
    arr = arr.filter((val) => {
      if (match(val.title, word) !== null) return true
      return (
        val.title.toLowerCase().includes(lowerCase) ||
        val.subtitle?.toLowerCase().includes(lowerCase)
      )
    })
  }
  filteredList.value = arr
  activeIndex.value = getActiveIndex(filteredList.value)
}, '搜索')

onStartTyping((e) => {
  setSubInputValue(e.key)
  subInputFocus()
})

getList()
</script>

<template>
  <div class="absolute h-full w-full">
    <List
      v-model:active-index="activeIndex"
      :data="filteredList"
      :window-size="10"
      :dynamic="true"
      @select="handleSelect"
    ></List>
  </div>
</template>

<style scoped lang="scss"></style>
