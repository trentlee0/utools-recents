<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
  icon?: string
  keyword?: string
  active?: boolean
}>()
</script>

<template>
  <div class="item flex select-none items-center" :class="{ active }">
    <div class="item-icon" v-if="icon">
      <div
        class="item-icon"
        :style="{ 'background-image': `url(${icon})` }"
      ></div>
    </div>

    <div class="flex flex-grow items-center overflow-hidden">
      <div class="flex-grow overflow-hidden">
        <div class="truncate">
          <slot name="title">{{ title }}</slot>
        </div>
        <div class="text-neutral-500 dark:text-neutral-400">
          <div class="h-5 truncate font-light">
            <slot name="subtitle">{{ subtitle }}</slot>
          </div>
        </div>
      </div>

      <div class="w-6 flex-none" v-if="$slots.action" />
      <div class="flex-none" v-if="$slots.action">
        <slot name="action"></slot>
      </div>

      <div class="w-6 flex-none" v-if="keyword !== undefined" />
      <div
        class="flex-none font-light text-neutral-400"
        v-if="keyword !== undefined"
      >
        <slot name="keyword">{{ keyword }}</slot>
      </div>

      <slot name="append"></slot>
    </div>
  </div>
</template>

<style scoped lang="scss">
$padding-width: 16px;

.item {
  height: 48px;
  padding-left: $padding-width;
  padding-right: $padding-width;
}

.item-icon {
  $icon-size: 36px;
  height: $icon-size;
  width: $icon-size;
  margin-right: $padding-width - 1px;
  @apply flex-none bg-cover bg-center bg-no-repeat;
}

.active {
  @apply bg-gray-200 dark:bg-neutral-600;
}
</style>
