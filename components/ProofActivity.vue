<script setup lang="ts">
import { useLiveRoom } from '../composables/useLiveRoom'
import { useSharedState } from '../composables/useSharedState'
const { live } = useLiveRoom()
const mode = useSharedState('mode', { offline: false })
</script>
<template>
  <div class="proof-activity">
    <div class="activity-mode" @click.stop @keydown.stop>
      <button v-if="live.credentials" class="text-button" @click="mode.offline = !mode.offline">{{ mode.offline ? 'Use phone voting' : 'Use show of hands' }}</button>
      <a v-else href="/host" target="_blank">Set up phone voting ↗</a>
    </div>
    <NetworkProofGame v-if="live.credentials && !mode.offline" />
    <ProofGame v-else />
  </div>
</template>
