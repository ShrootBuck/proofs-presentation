<script setup lang="ts">
import { useSharedState } from '../composables/useSharedState'
const props = defineProps<{ kind: 'hunt' | 'proof' }>()
const state = useSharedState(`activity-launcher-${props.kind}`, { fallback: false })
</script>
<template>
  <section class="activity-launcher" @click.stop @keydown.stop>
    <template v-if="!state.fallback">
      <div v-if="kind === 'hunt'" class="launch-formulas"><MathTex tex="A=n^{17}+9" /><MathTex tex="B=(n+1)^{17}+9" /></div>
      <div class="launch-grid">
        <div><h2>{{ kind === 'hunt' ? 'One shared factor.' : 'Five arguments.' }}<br />{{ kind === 'hunt' ? 'One minute.' : 'Judge every step.' }}</h2><p :style="kind === 'hunt' ? { color: '#18201f' } : undefined">{{ kind === 'hunt' ? 'Find a nonnegative integer n such that A and B share a factor greater than 1.' : 'A true conclusion can still have a broken proof. Vote on the reasoning.' }}</p><a class="launch-button" href="/host" target="proofs-host">Open the activity screen ↗</a></div>
        <div class="launch-rules"><a class="launch-join-url" href="https://proofs.zaydkrunz.com/join" target="proofs-student">https://proofs.zaydkrunz.com/join</a><div><span>01</span>Scan or open the link. Join the room.</div><div><span>02</span>{{ kind === 'hunt' ? 'Try any nonnegative integer.' : 'Vote A: valid. B: broken.' }}</div><div v-if="kind !== 'hunt'"><span>03</span>Lock it in. Defend a step.</div><p v-if="kind !== 'hunt'">Same room. Same page. New challenge.</p></div>
      </div>
      <button class="text-button launch-fallback" @click="state.fallback = true">{{ kind === 'hunt' ? 'Call-out fallback' : 'Show-of-hands fallback' }}</button>
    </template>
    <template v-else><button class="text-button launch-return" @click="state.fallback = false">Back to activity link</button><SharedFactorHunt v-if="kind === 'hunt'" force-offline /><ProofGame v-else /></template>
  </section>
</template>
