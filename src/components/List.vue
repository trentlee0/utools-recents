<script setup lang="ts">
import { onKeyDown, useScroll } from '@vueuse/core'
import ListItem from './ListItem.vue'
import { onMounted, ref, watchEffect } from 'vue'
import { useMouse } from '@/hooks/useMouse'

interface ListItem {
  title: string
  subtitle?: string
  icon?: string
  keyword?: string
}

const props = withDefaults(
  defineProps<{
    activeIndex: number
    data: Array<ListItem>
    loading?: boolean
    windowSize?: number
    showShortkeys?: boolean
    dynamic?: boolean
  }>(),
  {
    showShortkeys: true,
    dynamic: true
  }
)

const height = 48
const windowSize = ref(10)

const emit = defineEmits<{
  (e: 'update:activeIndex', value: number): void
  (e: 'select', index: number): void
}>()

const { isMouseMove } = useMouse()

const listRef = ref<HTMLDivElement | null>(null)

onMounted(() => {
  windowSize.value =
    props.windowSize ?? Math.floor(listRef.value!.clientHeight / height)
})

useScroll(listRef, {
  idle: 30,
  onScroll() {
    const windowPosition = getWindowPosition()

    if (props.activeIndex < windowPosition) {
      emit('update:activeIndex', windowPosition)
    } else if (props.activeIndex >= windowPosition + windowSize.value) {
      emit('update:activeIndex', windowPosition + windowSize.value - 1)
    }
  },
  onStop() {
    scrollToIndex(getWindowPosition())
  }
})

onKeyDown(['ArrowUp', 'ArrowDown'], (e) => {
  e.preventDefault()

  const activeIndex = props.activeIndex
  if (activeIndex === -1) return

  const windowPosition = getWindowPosition()
  const data = props.data

  let index: number
  if (e.key === 'ArrowUp') {
    if (activeIndex === windowPosition) {
      index = Math.min(windowPosition + windowSize.value - 1, data.length - 1)
    } else {
      index = Math.max(activeIndex - 1, 0)
    }
  } else {
    index = (activeIndex + 1) % data.length
  }
  emit('update:activeIndex', index)

  const { scrollTop } = listRef.value!
  const windowOffset = index - windowPosition

  if (windowOffset < 0) {
    scrollToTop(scrollTop - height)
  } else if (windowOffset >= windowSize.value) {
    scrollToTop(scrollTop + height)
  }
})

onKeyDown(['Meta', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0'], (e) => {
  if (!e.metaKey || e.key === 'Meta') return
  const num = parseInt(e.key)
  let index: number
  if (num === 0) {
    index = getWindowPosition() + 9
  } else {
    index = getWindowPosition() + num - 1
  }
  if (index >= props.data.length) return
  emit('update:activeIndex', index)
  emit('select', index)
})

onKeyDown(['Enter'], (e) => {
  if (e.key === 'Enter') {
    emit('select', props.activeIndex)
  }
})

// from zero
function getWindowPosition() {
  const { scrollTop } = listRef.value!
  return Math.round(scrollTop / height)
}

function scrollToTop(top: number) {
  listRef.value?.scrollTo({ top })
}

function scrollToIndex(index: number) {
  scrollToTop(index * height)
}

function handleMouseOver(index: number) {
  if (isMouseMove.value) {
    emit('update:activeIndex', index)
  }
}

const selectModifier = ref(utools.isMacOS() ? '⌘' : 'Alt')

if (props.dynamic) {
  watchEffect(() => {
    utools.setExpendHeight(
      height * Math.min(props.data.length, windowSize.value)
    )
  })
}
</script>

<template>
  <div class="fixed z-10 h-px w-full" v-show="loading">
    <progress class="progress h-px w-full align-top"></progress>
  </div>

  <div class="list-container" ref="listRef">
    <div
      v-for="(item, index) in data"
      :key="`${item.title}-${index}`"
      @mouseover="handleMouseOver(index)"
      @click="emit('select', index)"
    >
      <slot :data="{ item, index }">
        <ListItem
          class="cursor-pointer"
          :icon="item.icon"
          :title="item.title"
          :subtitle="item.subtitle"
          :keyword="item.keyword"
          :active="activeIndex === index"
        >
          <template #append>
            <div class="w-[72px]"></div>
          </template>
        </ListItem>
      </slot>
    </div>

    <div
      v-if="showShortkeys"
      class="absolute right-0 top-0 z-10 select-none font-light text-neutral-500 dark:text-neutral-400"
    >
      <div
        class="flex items-center justify-center text-lg"
        :style="`height: ${height}px`"
        v-for="num in Math.min(props.data.length, 10)"
        :key="num"
        @mouseover="handleMouseOver(getWindowPosition() + num - 1)"
        @click="emit('select', getWindowPosition() + num - 1)"
      >
        <div class="px-[16px]">{{ selectModifier }}+{{ num % 10 }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.list-container {
  @apply h-full w-full overflow-y-auto overflow-x-hidden;

  &::-webkit-scrollbar {
    @apply w-[2px];
  }

  &::-webkit-scrollbar-track-piece {
    @apply bg-transparent;
  }

  &::-webkit-scrollbar-thumb:vertical {
    @apply bg-neutral-400 dark:bg-neutral-500;
  }
}
</style>
