<script setup lang="ts">
import { computed } from 'vue'
import { useSharedState } from '../composables/useSharedState'
import { gameRounds } from '../lib/logic.mjs'
const state = useSharedState('game-five', { round: 0, answers: gameRounds.map(() => null) as (boolean | null)[], revealed: gameRounds.map(() => false), finished: false })
const current = computed(() => gameRounds[state.round])
const answer = computed(() => state.answers[state.round])
const revealed = computed(() => state.revealed[state.round])
const points = computed(() => gameRounds.filter((r, i) => state.revealed[i] && state.answers[i] === r.valid).length)
const traps = computed(() => state.revealed.filter(Boolean).length - points.value)
function select(valid: boolean) { if (!revealed.value) state.answers[state.round] = valid }
function reveal() { if (answer.value !== null) state.revealed[state.round] = true }
function next() { if (state.round < gameRounds.length - 1) state.round++; else state.finished = true }
function reset() { Object.assign(state, { round: 0, answers: gameRounds.map(() => null), revealed: gameRounds.map(() => false), finished: false }) }
</script>
<template>
  <section class="proof-game" @click.stop @keydown.stop>
    <div class="game-top"><span class="micro">{{ state.finished ? 'FINAL SCORE' : `ROUND 0${state.round + 1} / 0${gameRounds.length}` }}</span><div class="game-score"><span>CLASS <b>{{ points }}</b></span><span class="trap-score">TRAPS <b>{{ traps }}</b></span><button class="text-button" @click="reset">Restart</button></div></div>
    <Transition name="round-change" mode="out-in">
      <div v-if="state.finished" key="finished" class="game-finish">
        <div class="final-points">{{ points }}<span>/ {{ gameRounds.length }}</span></div>
        <h3>{{ points === gameRounds.length ? 'The class has trust issues. Good.' : 'Every trap has a lesson.' }}</h3>
        <p>A true conclusion can have a bad proof.<br />A valid proof needs every step to hold.</p>
        <button class="primary-button" @click="reset">Play again</button>
      </div>
      <div v-else :key="state.round" :class="['game-round', { 'game-round-dense': current.prose && current.lines.length >= 4 }]">
        <div class="game-claim"><MathTex :tex="current.claim" /></div>
        <div class="game-work">
          <div class="game-argument"><div v-for="(line, i) in current.lines" :key="i" :class="['game-line', { 'bad-line': revealed && current.badLine === i }]"><span class="line-number">{{ i + 1 }}</span><MathTex :tex="line" /></div><p v-if="current.prose" class="game-prose">{{ current.prose }}</p></div>
          <div class="game-vote">
            <p class="micro">HANDS UP. DEFEND YOUR VOTE.</p>
            <button :disabled="revealed" :class="['vote-button', { selected: answer === true }]" :aria-pressed="answer === true" @click="select(true)"><span>A</span>Valid proof</button>
            <button :disabled="revealed" :class="['vote-button', { selected: answer === false }]" :aria-pressed="answer === false" @click="select(false)"><span>B</span>Broken proof</button>
            <button v-if="!revealed" class="primary-button reveal-button" :disabled="answer === null" @click="reveal">Reveal verdict</button>
            <button v-else class="primary-button reveal-button" @click="next">{{ state.round === gameRounds.length - 1 ? 'Final score' : 'Next round' }}</button>
          </div>
        </div>
        <div class="game-verdict" aria-live="polite"><Transition name="verdict"><div v-if="revealed" :class="{ correct: answer === current.valid }"><strong>{{ answer === current.valid ? '+1 CLASS' : '+1 TRAPS' }} <span>{{ current.verdict }}</span></strong><p>{{ current.explanation }}</p></div></Transition></div>
      </div>
    </Transition>
  </section>
</template>
