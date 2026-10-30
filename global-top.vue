<script setup lang="ts">
import { onMounted } from 'vue'
import { startCollatz } from './composables/useCollatz'
onMounted(startCollatz)
</script>
<template><span hidden aria-hidden="true"></span></template>
