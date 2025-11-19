<script setup lang="ts">
import SnipcartProvider from '~/components/SnipcartProvider.vue';
</script>

<template>
  <!-- Inyecta Snipcart para toda la app -->
  <SnipcartProvider />

  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
