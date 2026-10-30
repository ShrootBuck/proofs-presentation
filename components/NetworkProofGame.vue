<script setup lang="ts">
import { computed } from 'vue'
import { useLiveRoom } from '../composables/useLiveRoom'
const { live, act } = useLiveRoom()
const room = computed(() => live.room)
const joinHost = computed(() => room.value ? new URL(room.value.joinUrl).host : '')
const control = computed(() => ({ lobby: ['start', 'Start round 1'], open: ['lock', 'Lock voting'], locked: ['reveal', 'Reveal the answer'], revealed: room.value?.round === room.value?.totalRounds - 1 ? ['finish', 'Final score'] : ['next', 'Next round'] }[room.value?.phase] || null))
const percent = (n: number) => room.value.counts?.total ? `${Math.round(100 * n / room.value.counts.total)}%` : '0%'
</script>
<template>
  <section class="network-game" @click.stop @keydown.stop>
    <div v-if="!room" class="live-loading"><p>{{ live.error || 'Connecting to the live room…' }}</p><a href="/host" target="_blank">Open host setup</a></div>
    <div v-else-if="room.activity === 'hunt'" class="live-lobby"><div class="live-intro"><h2>Same room. New challenge.</h2><p>Keep the phone page open.<br />Five arguments. Judge every step.</p><button v-if="live.credentials?.hostToken" class="primary-button" @click="act('proof-setup')">Open Proof or Bluff</button><span v-else>Waiting for the host</span></div></div>
    <template v-else>
      <div class="game-top"><span class="micro">{{ room.phase === 'lobby' ? 'SCAN TO JOIN' : `ROUND 0${room.round + 1} / 0${room.totalRounds}` }} <span class="live-indicator">{{ live.connected ? '● LIVE' : '○ RECONNECTING' }}</span></span><div class="game-score"><span>CLASS <b>{{ room.score.class }}</b></span><span class="trap-score">TRAPS <b>{{ room.score.traps }}</b></span></div></div>
      <div v-if="room.phase === 'lobby'" class="live-lobby">
        <div class="live-intro"><h2>Make your call.</h2><p>Five proofs. Five votes.<br />Catch the step that doesn't follow.</p><div class="live-joined"><strong>{{ room.joined }}</strong><span>joined the room</span></div><p class="live-rules">Vote on your phone. Results stay hidden until voting locks.<br />A majority must be correct for the class to earn a point.</p></div>
        <div class="live-qr"><img :src="`/api/rooms/${room.code}/qr.svg`" alt="Scan this QR code to join the voting room" /><div class="room-code">{{ room.code }}</div><div class="join-address">{{ joinHost }}/join</div></div>
      </div>
      <div v-else-if="room.phase === 'finished'" class="game-finish live-finish"><div class="final-points">{{ room.score.class }}<span>/ {{ room.totalRounds }}</span></div><h3>{{ room.score.class === room.totalRounds ? 'The class has trust issues. Good.' : 'Every trap has a lesson.' }}</h3><p>{{ room.score.traps }} points for the traps.<br />A valid proof needs every step to hold.</p></div>
      <div v-else class="live-round">
        <div class="game-claim"><MathTex :tex="room.question.claim" /></div>
        <div class="game-work">
          <div class="game-argument"><div v-for="(line, i) in room.question.lines" :key="i" :class="['game-line', { 'bad-line': room.answer?.badLine === i }]"><span class="line-number">{{ i + 1 }}</span><MathTex :tex="line" /></div><p v-if="room.question.prose" class="game-prose">{{ room.question.prose }}</p></div>
          <div class="live-voting">
            <template v-if="room.phase === 'open'"><div class="micro">VOTES RECEIVED</div><div class="vote-count">{{ room.voted }}<span>/ {{ room.joined }}</span></div><div class="live-vote-key"><span>A</span>Valid proof<br /><span>B</span>Broken proof</div><p class="tiny muted">Votes stay hidden until locking.</p></template>
            <template v-else><div class="micro">THE CLASS HAS COMMITTED</div><div v-for="(entry, i) in [['A · Valid', room.counts.valid], ['B · Broken', room.counts.broken]]" :key="i" class="live-tally"><div><span>{{ entry[0] }}</span><strong>{{ entry[1] }} <small>{{ percent(entry[1] as number) }}</small></strong></div><div class="tally-track"><span :style="{ width: percent(entry[1] as number) }" /></div></div><p v-if="!room.answer" class="tiny muted">Which step makes or breaks it?</p></template>
          </div>
        </div>
        <div class="game-verdict"><div v-if="room.answer" :class="{ correct: room.history[room.round]?.winner === 'class' }"><strong>{{ room.history[room.round]?.winner === 'none' ? 'NO VOTES' : room.history[room.round]?.winner === 'class' ? '+1 CLASS' : '+1 TRAPS' }} <span>{{ room.answer.verdict }}</span></strong><p>{{ room.answer.explanation }}</p></div></div>
      </div>
      <div class="live-controls"><span class="live-status">{{ live.error || (room.phase === 'lobby' ? 'No account. No names. Just your verdict.' : `Room ${room.code} · ${room.joined} joined`) }}</span><button v-if="control && live.credentials?.hostToken" class="primary-button" :disabled="live.busy || !live.connected" @click="act(control[0])">{{ control[1] }}</button><span v-else-if="control" class="micro">Waiting for the host</span></div>
    </template>
  </section>
</template>
