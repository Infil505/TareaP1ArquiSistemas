
<template>
  <div class="card">
    <NuxtLink :to="`/models/${model.slug}`">
      <img :src="model.image" :alt="model.name" />
      <h3>{{ model.name }}</h3>
    </NuxtLink>
    <div class="opacity-70 text-sm">
      <span class="badge">{{ model.year }}</span>
      <span class="badge">{{ model.country }}</span>
      <span class="badge" v-if="model.power_hp">{{ model.power_hp }} hp</span>
      <span class="badge" v-if="model.top_speed_kmh">{{ model.top_speed_kmh }} km/h</span>
    </div>
    <p class="opacity-80">{{ model.summary }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{ model: any }>()
</script>
