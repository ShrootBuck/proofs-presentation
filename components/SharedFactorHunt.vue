<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useLiveRoom } from '../composables/useLiveRoom'
import { useSharedState } from '../composables/useSharedState'
import { evaluateGuess, COUNTEREXAMPLE, SHARED_FACTOR } from '../lib/hunt.mjs'
const { live, act } = useLiveRoom()
const offline = useSharedState('hunt-mode', { enabled: false })
const local = useSharedState('hunt', { phase: 'lobby', endsAt: 0, attempts: 0, found: 0, recent: [] as any[] })
const now = ref(Date.now()), input = ref(''), error = ref('')
let timer: ReturnType<typeof setInterval>
onMounted(() => { timer = setInterval(() => { now.value = Date.now(); if (local.phase === 'open' && now.value >= local.endsAt) local.phase = 'closed' }, 100) })
onUnmounted(() => clearInterval(timer))
const network = computed(() => Boolean(live.credentials) && !offline.enabled)
const hunt = computed(() => network.value ? live.room?.hunt : local)
const seconds = computed(() => hunt.value?.phase === 'lobby' ? 60 : Math.max(0, Math.ceil(((hunt.value?.endsAt || 0) - (now.value + (network.value ? live.clockOffset : 0))) / 1000)))
const joinHost = computed(() => live.room ? new URL(live.room.joinUrl).host : '')
const host = computed(() => !network.value || Boolean(live.credentials?.hostToken))
const short = (v: string) => v.length > 25 ? `${v.slice(0, 12)}…${v.slice(-7)}` : v
const shownN = computed(() => network.value ? live.room?.hunt.reveal?.n : COUNTEREXAMPLE)
const shownFactor = computed(() => network.value ? live.room?.hunt.reveal?.gcd : SHARED_FACTOR)
function start() { if (network.value) act('hunt-start'); else Object.assign(local, { phase: 'open', endsAt: Date.now() + 60000, attempts: 0, found: 0, recent: [] }) }
function reveal() { if (network.value) act('hunt-reveal'); else local.phase = 'revealed' }
function guess() {
  error.value = ''
  if (local.phase !== 'open' || Date.now() >= local.endsAt) return
  try { const result = evaluateGuess(input.value); local.attempts++; if (result.found) local.found++; local.recent.unshift(result); local.recent = local.recent.slice(0, 6); input.value = '' } catch (e: any) { error.value = e.message }
}
</script>
<template>
  <section class="hunt" @click.stop @keydown.stop>
    <div class="hunt-equation"><MathTex tex="A=n^{17}+9" /><span>&</span><MathTex tex="B=(n+1)^{17}+9" /></div>
    <div class="hunt-mode"><a v-if="!live.credentials" href="/host" target="_blank">Set up phone participation ↗</a><button v-else class="text-button" @click="offline.enabled = !offline.enabled">{{ offline.enabled ? 'Use phones' : 'Use call-out guesses' }}</button></div>
    <p v-if="!hunt">{{ live.error || 'Connecting to the room…' }}</p>
    <div v-else-if="hunt.phase === 'revealed'" class="hunt-reveal">
      <div class="micro">THE FIRST NONNEGATIVE INPUT THAT BREAKS IT</div>
      <div class="giant-integer">{{ shownN }}</div>
      <p>Both numbers share this factor:</p><div class="factor-integer">{{ shownFactor }}</div>
      <p class="takeaway">52 digits. One counterexample. Claim disproved.</p>
    </div>
    <div v-else class="hunt-grid">
      <div class="hunt-left">
        <p class="hunt-task">Find an input where A and B<br />share a factor greater than 1.</p>
        <p class="hunt-example">12 & 25: no shared factor.<br />12 & 18: both divisible by 6.</p>
        <div v-if="network && hunt.phase === 'lobby'" class="hunt-join"><img :src="`/api/rooms/${live.room.code}/qr.svg`" alt="Scan to join both classroom activities" /><div><b>{{ live.room.code }}</b><p>{{ joinHost }}/join</p><span>{{ live.room.joined }} joined · no account needed</span></div></div>
        <div v-else class="hunt-recent"><div class="micro">LATEST CLASS GUESSES</div><div v-for="(g,i) in hunt.recent.slice(0,4)" :key="i" class="hunt-entry"><span>n = {{ short(g.n) }}</span><b :class="{ 'red-text': g.found }">{{ g.found ? 'FOUND A FACTOR' : 'GCD = 1' }}</b></div><p v-if="!hunt.recent.length" class="small muted">Try something. Then try something bigger.</p></div>
      </div>
      <div class="hunt-clock"><div class="micro">{{ hunt.phase === 'closed' ? 'TIME IS UP' : 'SECONDS TO BREAK THE PATTERN' }}</div><div :class="['countdown', { urgent: seconds <= 10 }]">{{ String(seconds).padStart(2,'0') }}</div><div class="countdown-track"><span :style="{ width: `${seconds / 60 * 100}%` }" /></div><div class="hunt-stats"><span><b>{{ hunt.attempts }}</b> guesses</span><span><b>{{ hunt.found }}</b> found it</span></div>
      <button v-if="host && hunt.phase === 'lobby'" class="primary-button" :disabled="network && !live.connected" @click="start">Start the 60 seconds</button><button v-if="host && hunt.phase === 'closed'" class="primary-button" @click="reveal">Reveal the counterexample</button><p v-if="hunt.phase === 'open'" class="small muted">Any nonnegative whole number.<br />Up to 100 digits.</p></div>
    </div>
    <form v-if="!network && hunt?.phase === 'open'" class="hunt-local" @submit.prevent="guess"><input v-model="input" aria-label="Enter a nonnegative integer" inputmode="numeric" maxlength="100" placeholder="Call out an integer…" /><button class="primary-button">Test input</button></form>
    <p v-if="error || (network && live.error)" class="tiny red-text">{{ error || live.error }}</p>
    <button v-if="!network && hunt?.phase === 'revealed'" class="text-button" @click="local.phase = 'lobby'">Reset rehearsal</button>
  </section>
</template>
