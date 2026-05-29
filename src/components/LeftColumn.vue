<script setup>
import { ref, watch, nextTick } from 'vue'
import { PLAY_INFO } from '../data/meta'
import { model } from '../lib/model'
import { clock } from '../composables/useClock'

const railEl = ref(null)
const { activeLineIdx } = clock

const fmt = (s) => { s = Math.max(0, s || 0); const m = (s / 60) | 0, x = (s % 60) | 0; return `${m}:${String(x).padStart(2, '0')}` }

// 当前句变化时，在「句轨」容器内部自动滚动到可见（不影响整页）
watch(activeLineIdx, async (i) => {
  if (i < 0) return
  await nextTick()
  const el = railEl.value?.querySelector(`[data-i="${i}"]`)
  if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
})
</script>

<template>
  <aside class="left">
    <section class="intro">
      <h2 class="ttl">{{ PLAY_INFO.title }}</h2>
      <div class="sub">{{ PLAY_INFO.subtitle }}</div>
      <dl class="facts">
        <template v-for="f in PLAY_INFO.fields" :key="f.k">
          <dt>{{ f.k }}</dt><dd>{{ f.v }}</dd>
        </template>
      </dl>
      <p class="syn">{{ PLAY_INFO.synopsis }}</p>
    </section>

    <section class="rail-wrap">
      <div class="rail-hd">句级时间轨 · 点击跳转</div>
      <div class="rail" ref="railEl">
        <button
          v-for="(l, i) in model.lines" :key="l.id" :data-i="i"
          class="rail-item" :class="{ on: i === activeLineIdx }"
          @click="clock.seek(l.s)"
          :title="`${fmt(l.s)} ${l.text}`">
          <span class="rt">{{ fmt(l.s) }}</span>
          <span class="rx">{{ l.text }}</span>
        </button>
      </div>
    </section>
  </aside>
</template>

<style scoped>
.left {
  border-right: 1px solid var(--line);
  background: linear-gradient(180deg, #f7f2e8, #f1eadc);
  display: grid; grid-template-rows: auto minmax(0, 1fr); min-height: 0;
}
.intro { padding: 12px 14px 10px; border-bottom: 1px solid var(--line-2); overflow: auto; max-height: 44vh; }
.ttl { margin: 0; font-size: 20px; letter-spacing: .06em; color: var(--ink); }
.sub { font-size: 11.5px; color: var(--dai); letter-spacing: .04em; margin: 3px 0 8px; }
.facts { display: grid; grid-template-columns: auto 1fr; gap: 2px 8px; margin: 0 0 8px; font-size: 12.5px; }
.facts dt { color: var(--dai); white-space: nowrap; }
.facts dd { margin: 0; color: var(--ink-soft); }
.syn { font-size: 12.5px; line-height: 1.7; color: var(--ink-soft); margin: 0; text-align: justify; }

.rail-wrap { display: grid; grid-template-rows: auto minmax(0, 1fr); min-height: 0; }
.rail-hd { font-size: 11px; color: var(--dai); letter-spacing: .12em; padding: 7px 14px 5px; }
.rail { overflow-y: auto; padding: 0 8px 10px; }
.rail-item {
  display: flex; gap: 8px; align-items: baseline; width: 100%; text-align: left;
  border: none; background: none; padding: 4px 8px; border-radius: 6px;
  color: var(--ink-soft); border-left: 2px solid transparent; transition: background .15s, color .15s;
}
.rail-item:hover { background: #00000008; }
.rail-item.on { background: rgba(178, 58, 46, .09); color: var(--zhu); border-left-color: var(--zhu); }
.rt { font-family: var(--num); font-size: 10.5px; color: var(--dai); min-width: 30px; }
.rail-item.on .rt { color: var(--zhu-soft); }
.rx { font-size: 14px; letter-spacing: .03em; }
</style>
