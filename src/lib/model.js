import raw from '../data/viewerModel.json'

// ── 轨道取舍（决策 5：不展示临时轨与点状腔格）─────────────────────────────
//   保留：腔格轨、动作  ；剔除：名字含「临时」的轨；点轨里剔除「点状腔格」。
const DROP_TRACK = (name) => /临时/.test(name)
const DROP_POINT = (tk) => /点状腔格/.test(tk)

function buildModel(src) {
  const tracks = (src.tracks || [])
    .filter((t) => !DROP_TRACK(t.name))
    .map((t) => ({
      ...t,
      points: (t.points || []).filter((p) => !DROP_POINT(p.tk)),
    }))
  return {
    meta: src.meta,
    lines: [...src.lines].sort((a, b) => a.s - b.s),
    breaths: src.breaths || [],
    tracks,
  }
}

export const model = buildModel(raw)

// 给每个出现过的腔格/动作类型分配一个稳定的淡彩
const PALETTE = ['#c98a7d', '#7da08f', '#c2a86a', '#8194ab', '#a87fa0', '#9a9270',
  '#6fa0a8', '#bb8e63', '#8f7fae', '#86a877', '#bf8c6e', '#7e94a0']
const _color = {}; let _ci = 0
export function colorOf(type) {
  if (!(type in _color)) _color[type] = PALETTE[_ci++ % PALETTE.length]
  return _color[type]
}

// ── 查找：当前句（最后一个 start<=t；t 在首句之前返回 -1）─────────────────
export function bisectLine(t) {
  const L = model.lines
  if (!L.length || t < L[0].s) return -1
  let lo = 0, hi = L.length - 1, ans = 0
  while (lo <= hi) {
    const m = (lo + hi) >> 1
    if (L[m].s <= t) { ans = m; lo = m + 1 } else hi = m - 1
  }
  return ans
}

export function activeCharIdx(line, t) {
  if (!line) return -1
  return line.chars.findIndex((c) => t >= c.s && t < c.e)
}

// ── 当前正在发生的腔格/动作（决策改进 2b：精确到时间点，而非句级）────────
export function activeAttrs(t) {
  const out = []
  for (const tk of model.tracks) {
    for (const b of tk.blocks) {
      if (t >= b.s && t < b.e) out.push({ type: b.t, track: tk.name, color: colorOf(b.t) })
    }
  }
  return out
}
// 用于变更检测，避免每帧重建响应式数组
export function attrsKey(attrs) { return attrs.map((a) => a.track + ':' + a.type).join('|') }

// 最近是否「正经过一个呼吸点」（用于阅读栏的瞬时气口提示）
export function breathAt(t, prev) {
  // 若在 [prev, t] 区间内跨过某个呼吸时间，则返回该时间，否则 null
  for (const b of model.breaths) {
    if (b.t > prev && b.t <= t + 0.001) return b.t
  }
  return null
}
