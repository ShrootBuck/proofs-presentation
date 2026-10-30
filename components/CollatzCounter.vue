<script setup lang="ts">
import { computed } from 'vue'
import { useCollatz } from '../composables/useCollatz'
const state = useCollatz()
const count = computed(() => state.verified.replace(/\B(?=(\d{3})+(?!\d))/g, ','))
</script>
<template>
  <div class="collatz-counter">
    <span>{{ state.error ? 'Background checker stopped. Verified through:' : 'Since this presentation loaded, verified every starting value through:' }}</span>
    <strong>n = {{ count }}</strong>
  </div>
</template>
<style scoped>
.collatz-counter { margin-top: 20px; border-left: 3px solid var(--blue); padding-left: 18px; }
.collatz-counter span { display: block; font-size: 17px; color: var(--muted); }
.collatz-counter strong { display: block; font: 500 32px 'IBM Plex Mono', monospace; color: var(--blue); font-variant-numeric: tabular-nums; margin-top: 5px; }
</style>
