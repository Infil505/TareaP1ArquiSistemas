<script setup lang="ts">
type Item = { _path: string; name?: string; title?: string }
defineProps<{ prev: Item | null; next: Item | null }>()
</script>

<template>
  <nav class="pn">
    <NuxtLink v-if="prev" :to="prev._path" class="btn prev">← {{ prev.name || prev.title }}</NuxtLink>
    <NuxtLink v-if="next" :to="next._path" class="btn next">{{ next.name || next.title }} →</NuxtLink>
  </nav>
</template>

<style scoped>
.pn{ display:flex; justify-content:space-between; gap:1rem; }
.btn{ border:1px solid #e5e7eb; padding:.5rem .8rem; border-radius:10px; }
.btn:hover{ background:#f8fafc; }
.prev{ margin-right:auto; }
.next{ margin-left:auto; }
</style>
