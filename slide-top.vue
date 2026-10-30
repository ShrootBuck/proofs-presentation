<script setup lang="ts">
import { useSlideContext } from '@slidev/client'
const { $frontmatter, $page } = useSlideContext()
</script>
<template>
  <div v-if="!$frontmatter.hideFooter" :class="['deck-footer', { light: $frontmatter.class?.includes('dark') || $frontmatter.class?.includes('blue') }]">
    <span>PROVE IT <span class="footer-divider">/</span> {{ $frontmatter.section || 'THE ART OF BEING CERTAIN' }}</span>
    <span>{{ String($page).padStart(2, '0') }} <span class="footer-divider">/</span> 25</span>
  </div>
</template>
