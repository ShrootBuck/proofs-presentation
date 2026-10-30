<script setup lang="ts">
import { useSlideContext } from '@slidev/client'
const { $frontmatter, $page } = useSlideContext()
</script>
<template>
  <div v-if="!$frontmatter.hideFooter" :class="['deck-footer', { light: $frontmatter.class?.includes('dark') || $frontmatter.class?.includes('blue') }]">
    <span style="margin-left: auto">{{ String($page).padStart(2, '0') }} <span class="footer-divider">/</span> 26</span>
  </div>
</template>
