<script setup>
import { computed, ref, watch } from 'vue'
import { model } from '../lib/model'
import { clock } from '../composables/useClock'
import { toRenderNotes, beatClass, markAdjacentDieqiang, ORN_LABEL } from '../lib/gongche'

const { activeLineIdx, activeCharIdx, activeSymIdx, activeAttrs, breathPulse } = clock

const prevText = computed(() => activeLineIdx.value > 0 ? model.lines[activeLineIdx.value - 1].text : '')
const nextText = computed(() => {
  const i = activeLineIdx.value
  return i >= 0 && i < model.lines.length - 1 ? model.lines[i + 1].text : ''
})

// 当前句渲染模型：每个字的工尺符号 → Xiqu 风格的平面 notes 数组
const curLine = computed(() => {
  const i = activeLineIdx.value
  if (i < 0) return null
  const l = model.lines[i]
  return {
    ...l,
    chars: l.chars.map((c) => {
      const notes = toRenderNotes(c.gc || [])
      markAdjacentDieqiang(notes)
      return {
        ch: c.ch,
        nb: c.st === '念白式',
        notes,
      }
    }),
  }
})

// 瞬时呼吸提示：跨过呼吸点时闪一下
const breathing = ref(false)
let bt = null
watch(breathPulse, () => {
  breathing.value = true
  clearTimeout(bt); bt = setTimeout(() => (breathing.value = false), 650)
})

const ornText = (o) => [...o].map((c) => ORN_LABEL[c] || c).join('·')
</script>

<template>
  <div class="reader">
    <div class="ctx prev">{{ prevText }}</div>

    <div class="cur">
      <template v-if="curLine">
        <span
          v-for="(c, ci) in curLine.chars" :key="ci"
          class="word" :class="{ active: ci === activeCharIdx, nianbai: c.nb }">
          <span class="lyric">{{ c.ch }}</span>
          <span v-if="c.nb" class="bai">白</span>
          <span v-else-if="c.notes.length" class="gongche-cell gongche-reader-redmark">
            <span
              class="gongche-notes"
              :class="{ 'gongche-notes-nonote': !c.notes.some((n) => n.noteClass && !n.noteClass.startsWith('gcn-s-qikou')) }">
              <span
                v-for="(n, ni) in c.notes" :key="ni"
                class="lyrics-note"
                :class="{
                  'lyrics-side-note': n.side,
                  'adj-dieqiang': n.adjDieqiang,
                }">
                <!-- 气口附着在前一个主音上 -->
                <i v-if="n.qikou" class="gcn-symbol gcn-s-qikou" aria-hidden="true" />
                <!-- 工尺字或腔格字形 -->
                <i v-if="n.noteClass" :class="['gcn-symbol', n.noteClass]" aria-hidden="true" />
                <!-- 板眼符号 -->
                <span v-if="n.beats.length > 0" class="lyrics-beats">
                  <span>
                    <i
                      v-for="(d, di) in n.beats" :key="di"
                      :class="['gcn-symbol', beatClass(d)]"
                      aria-hidden="true"
                    />
                  </span>
                </span>
              </span>
            </span>
          </span>
        </span>
      </template>
      <span v-else class="prelude">（前奏 · 过门）</span>
    </div>

    <!-- 此刻正在唱的腔格/气口提示 -->
    <div class="nowbar">
      <span class="nb-label">此刻</span>
      <transition-group name="pop">
        <span v-for="a in activeAttrs" :key="a.track + a.type" class="attr" :style="{ '--c': a.color }">
          {{ a.type }}
        </span>
      </transition-group>
      <span class="breath" :class="{ on: breathing }">⌇ 呼吸</span>
    </div>

    <div class="ctx next">{{ nextText }}</div>
  </div>
</template>

<style scoped>
.reader { display: flex; flex-direction: column; min-height: 0; height: 100%; padding: 2px 4px; }
.ctx { color: var(--dai); font-size: 16px; letter-spacing: .05em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; opacity: .55; }
.ctx.prev { margin-bottom: 2px; }
.ctx.next { margin-top: auto; }

.cur { display: flex; flex-wrap: wrap; align-items: flex-start; margin: 6px 0; flex: 0 1 auto; align-content: flex-start; }
.prelude { color: var(--dai); font-size: 20px; }

.word { display: inline-flex; align-items: flex-start; margin: 0 .06em 4px; padding: 1px 1px 0; border-radius: 4px; transition: background .2s; }
.word.active { background: rgba(178, 58, 46, .08); }
.lyric { font-family: KaiTi, "Kaiti SC", STKaiti, "楷体_GB2312", serif; font-size: clamp(26px, 3.2vw, 40px); line-height: 1.04; color: var(--ink); transition: color .2s; }
.word.active .lyric { color: var(--zhu); }
.word.nianbai { opacity: .9; }
.word.nianbai .lyric { color: var(--dai); }
.bai { font-size: 10px; color: var(--dai); transform: translateY(2px); }

/* 工尺 cell：inline 排列在唱词右侧 */
.gongche-cell {
  display: inline-flex;
  align-items: flex-start;
  margin-left: 1px;
  margin-top: 2px;
}

/* opacity / active 状态 */
.gongche-notes .lyrics-note { opacity: .7; transition: opacity .15s; }
.word.active .gongche-notes .lyrics-note { opacity: .8; }
.gongche-notes .lyrics-note :deep(.gcn-symbol) {
  color: var(--ink-soft);
}
.word.active .gongche-notes .lyrics-note :deep(.gcn-symbol) {
  color: var(--zhu);
}
.gongche-notes .lyrics-side-note { opacity: .5; }

.nowbar { display: flex; align-items: center; gap: 6px; min-height: 26px; margin-top: 4px; flex-wrap: wrap; }
.nb-label { font-size: 10.5px; color: var(--dai); letter-spacing: .14em; }
.attr { font-size: 12px; padding: 2px 10px; border-radius: 20px; background: var(--c); color: #1c1a16; border: 1px solid #0002; }
.breath { font-size: 12px; color: var(--qing); opacity: .25; transition: opacity .15s, transform .15s; padding: 2px 8px; border: 1px dashed var(--qing); border-radius: 20px; }
.breath.on { opacity: 1; transform: scale(1.06); }
.pop-enter-from, .pop-leave-to { opacity: 0; transform: scale(.7); }
.pop-enter-active, .pop-leave-active { transition: all .18s; }
</style>
