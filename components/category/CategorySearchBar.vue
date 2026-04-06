<template>
  <SearchBar :placeholder="placeholder" @click="emit('click')" />
</template>

<script setup>
import SearchBar from '@/components/SearchBar.vue'

defineProps({
  placeholder: {
    type: String,
    default: '搜索生鲜商品…'
  }
})

const emit = defineEmits(['click'])
</script>
