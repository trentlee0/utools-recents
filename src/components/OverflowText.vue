<script setup lang="ts">
import { ref, useSlots, watchEffect } from 'vue'

withDefaults(defineProps<{ nowrap?: boolean }>(), { nowrap: false })

const slots = useSlots()

const title = ref<string>()
const contentRef = ref<HTMLDivElement | null>(null)

watchEffect(() => {
  const el = contentRef.value
  if (el === null) return

  const child = slots.default?.()[0].children
  if (child === undefined || typeof child !== 'string') return

  if (el.clientWidth < el.scrollWidth) {
    title.value = child
  } else {
    title.value = undefined
  }
})
</script>

<template>
  <div
    class="overflow-hidden text-ellipsis"
    :class="{ 'whitespace-nowrap': nowrap }"
    :title="title"
    ref="contentRef"
  >
    <slot></slot>
  </div>
</template>
