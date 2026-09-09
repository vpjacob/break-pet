import './stretch.css';

export const movements = [
  { name: '颈部 · 轻柔转头', tip: '肩膀放松，缓慢左右转头，只转到舒服的位置。', cues: ['慢慢转向一侧', '保持，自然呼吸', '慢慢回到正中', '换另一侧', '保持，自然呼吸', '回到正中'] },
  { name: '肩背 · 舒展胸口', tip: '坐直，双臂向两侧打开，肩膀向后、向下放松。', cues: ['慢慢打开双臂', '保持，自然呼吸', '双臂放松落下', '再次舒展胸口', '保持，自然呼吸', '双臂放松落下'] },
  { name: '腰背 · 轻柔转身', tip: '坐稳，双脚平放，双手交叉搭肩；骨盆不动，上身轻轻转动。', cues: ['上身轻转向一侧', '保持，骨盆不动', '慢慢回到正中', '换另一侧', '保持，骨盆不动', '回到正中'] },
];

// One side: 3 seconds moving, 5 holding, 3 returning. Both sides: 22 seconds.
export function stretchFrame(elapsed: number) {
  const seconds = Math.max(0, elapsed) / 1000;
  const cycle = seconds % 22;
  const side = cycle < 11 ? 0 : 1;
  const local = cycle % 11;
  const phase = local < 3 ? 0 : local < 8 ? 1 : 2;
  const amount = phase === 0 ? local / 3 : phase === 1 ? 1 : (11 - local) / 3;
  const eased = (1 - Math.cos(Math.PI * amount)) / 2;
  return { index: Math.floor(seconds / 44) % movements.length, cue: side * 3 + phase, amount: eased, direction: side === 0 ? -1 : 1, remaining: Math.ceil(44 - seconds % 44) };
}

export function createStretchPlayer(root: HTMLElement) {
  root.innerHTML = `
    <div class="stretch-heading"><span><i class="stretch-live-dot"></i> MOMENT OF EASE / 舒展时刻</span><span data-stretch-count></span></div>
    <div class="stretch-body">
      <svg class="stretch-figure" viewBox="0 0 260 280" role="img" aria-label="坐姿舒展动作示意">
        <defs>
          <radialGradient id="stretch-halo"><stop stop-color="#eaf1e4"/><stop offset="1" stop-color="#eaf1e4" stop-opacity="0"/></radialGradient>
          <linearGradient id="stretch-skin" x2="1" y2=".4"><stop stop-color="#f0c7a5"/><stop offset=".6" stop-color="#e5b28f"/><stop offset="1" stop-color="#d39a7d"/></linearGradient>
          <linearGradient id="stretch-shirt" x2="1" y2=".5"><stop stop-color="#aac3ac"/><stop offset=".5" stop-color="#7fa58e"/><stop offset="1" stop-color="#547f6b"/></linearGradient>
          <linearGradient id="stretch-pants" x2="1" y2="1"><stop stop-color="#56675d"/><stop offset="1" stop-color="#2f453a"/></linearGradient>
          <filter id="stretch-soft"><feGaussianBlur stdDeviation="4"/></filter>
        </defs>
        <circle cx="130" cy="130" r="123" fill="url(#stretch-halo)"/>
        <circle data-breath-ring cx="130" cy="130" r="103" fill="none" stroke="#c5d7c6" stroke-width="1"/>
        <path d="M30 212Q130 193 230 212" stroke="#dce5d8" fill="none"/>
        <ellipse cx="130" cy="255" rx="65" ry="6" fill="#69816b" opacity=".2" filter="url(#stretch-soft)"/>
        <path d="M92 173L85 248M168 173L175 248" stroke="#a68b6e" stroke-width="7" stroke-linecap="round"/>
        <path d="M95 174L91 241M165 174L169 241" stroke="#ddc4a4" stroke-width="2"/>
        <rect x="84" y="168" width="92" height="12" rx="6" fill="#c3a684"/>
        <path d="M112 174Q103 188 109 209L108 239M148 174Q157 188 151 209L152 239" stroke="url(#stretch-pants)" stroke-width="21" fill="none" stroke-linecap="round"/>
        <path d="M115 186L116 224M145 186L144 224" stroke="#708172" stroke-width="2" opacity=".5"/>
        <path d="M97 237Q112 231 116 239L115 250H91Q87 243 97 237M145 239Q150 231 163 237L173 246Q174 250 167 250H145Z" fill="#f2eee2" stroke="#d4d6c6"/>
        <path d="M92 250H115M145 250H168" stroke="#aebba7" stroke-width="3" stroke-linecap="round"/>
        <g data-stretch-torso>
          <path d="M122 82V101H138V82" fill="url(#stretch-skin)"/>
          <path d="M105 99Q111 93 120 94Q130 107 140 94Q151 94 155 99L160 167Q133 180 100 167Z" fill="url(#stretch-shirt)"/>
          <path d="M119 96Q130 109 141 96M105 163Q128 171 155 164" fill="none" stroke="#d2dfc9" stroke-width="2" opacity=".7"/>
          <path d="M113 118Q109 140 112 158M147 130L150 155" stroke="#476d59" opacity=".2" fill="none"/>
          <g data-arm-left><path d="M105 105L97 137L101 163" stroke="url(#stretch-skin)" stroke-width="11" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M105 103L101 118" stroke="#93b39b" stroke-width="16" stroke-linecap="round"/><ellipse cx="101" cy="164" rx="6" ry="8" fill="url(#stretch-skin)"/></g>
          <g data-arm-right><path d="M155 105L163 137L159 163" stroke="url(#stretch-skin)" stroke-width="11" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M155 103L159 118" stroke="#6b937b" stroke-width="16" stroke-linecap="round"/><ellipse cx="159" cy="164" rx="6" ry="8" fill="url(#stretch-skin)"/></g>
          <path data-crossed-arms d="M105 109Q96 145 115 142L150 104M155 109Q164 146 145 145L110 104" stroke="url(#stretch-skin)" stroke-width="11" fill="none" stroke-linecap="round" stroke-linejoin="round" visibility="hidden"/>
          <g data-stretch-head>
            <ellipse cx="108" cy="66" rx="5" ry="8" fill="#dca785"/><ellipse cx="152" cy="66" rx="5" ry="8" fill="#dca785"/>
            <path d="M107 54Q105 34 130 35Q155 35 153 55L151 74Q149 91 130 93Q111 90 109 75Z" fill="url(#stretch-skin)"/>
            <path d="M107 66Q99 44 111 37Q116 26 133 30Q158 30 155 57L151 66L147 50Q130 57 113 48Z" fill="#4b423b"/>
            <path d="M111 42Q128 31 146 40" stroke="#756052" stroke-width="3" stroke-linecap="round" fill="none" opacity=".6"/>
            <g data-stretch-face><path d="M118 61L124 60M136 60L142 61" stroke="#765a46" stroke-width="1.5" stroke-linecap="round"/><g data-eyes><path d="M118 67Q121 64 124 67M136 67Q139 64 142 67" stroke="#514638" stroke-width="1.6" fill="none" stroke-linecap="round"/></g><path d="M130 67L128 75H132" stroke="#ba8668" stroke-width="1.3" stroke-linecap="round" fill="none"/><path d="M125 82Q130 85 136 81" stroke="#a56f59" stroke-width="1.5" fill="none" stroke-linecap="round"/><ellipse cx="116" cy="75" rx="4" ry="2" fill="#dc9686" opacity=".4"/><ellipse cx="143" cy="75" rx="4" ry="2" fill="#dc9686" opacity=".4"/></g>
          </g>
        </g>
        <g data-motion-guide fill="none" stroke="#8ba792" stroke-width="1.5" stroke-linecap="round"><path d="M88 77Q130 106 172 77" stroke-dasharray="3 5"/><path d="M166 77H173L172 84"/></g>
      </svg>
      <div class="stretch-instructions"><span class="stretch-step-label">轻柔活动 · 跟随自己的节奏</span><p class="stretch-title" data-stretch-title></p><p class="stretch-cue" data-stretch-cue aria-live="polite"></p><p class="stretch-tip" data-stretch-tip></p><div class="stretch-breath"><span data-breath-dot></span>放松肩膀，自然呼吸</div></div>
    </div>
    <div class="stretch-timeline"><span data-stretch-progress></span></div>
    <div class="stretch-controls"><button type="button" data-stretch-prev aria-label="上一个动作">←</button><button type="button" data-stretch-pause>暂停演示</button><button type="button" data-stretch-next aria-label="下一个动作">→</button></div>
    <p class="stretch-safety">请用稳固、不带轮子的椅子，缓慢活动；出现疼痛或头晕请停止。也可以先起身接水、走动。</p>`;
  const q = <T extends Element>(selector: string) => root.querySelector<T>(selector)!;
  let active = false, timerPaused = false, userPaused = false, elapsed = 0, last = 0, handle = 0;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  userPaused = reducedMotion.matches;
  const nodes = {
    face: q('[data-stretch-face]'), head: q('[data-stretch-head]'), torso: q('[data-stretch-torso]'),
    left: q('[data-arm-left]'), right: q('[data-arm-right]'), crossed: q('[data-crossed-arms]'),
    guide: q('[data-motion-guide]'), ring: q('[data-breath-ring]'),
    progress: q<HTMLElement>('[data-stretch-progress]'), breath: q<HTMLElement>('[data-breath-dot]'),
  };
  let previousIndex = -1;
  const draw = () => {
    const frame = stretchFrame(elapsed);
    const move = movements[frame.index];
    if (previousIndex !== frame.index) {
      if (previousIndex !== -1 && !reducedMotion.matches) q('.stretch-figure').animate([{ opacity: .25 }, { opacity: 1 }], { duration: 600, easing: 'ease-out' });
      previousIndex = frame.index;
    }
    q<HTMLElement>('[data-stretch-title]').textContent = move.name;
    const cue = q<HTMLElement>('[data-stretch-cue]');
    const cueText = move.cues[frame.cue];
    if (cue.textContent !== cueText) cue.textContent = cueText;
    q<HTMLElement>('[data-stretch-tip]').textContent = move.tip;
    q<HTMLElement>('[data-stretch-count]').textContent = `${frame.index + 1} / 3 · ${frame.remaining}s 后换组`;
    q<HTMLElement>('[data-stretch-pause]').textContent = userPaused ? '▷  继续演示' : 'Ⅱ  暂停演示';
    const turn = frame.amount * frame.direction;
    const breathing = (1 - Math.cos(elapsed / 4000 * Math.PI)) / 2;
    nodes.face.setAttribute('transform', `translate(${frame.index === 0 ? turn * 11 : 0} 0) translate(130 0) scale(${frame.index === 0 ? 1 - frame.amount * .28 : 1} 1) translate(-130 0)`);
    nodes.head.setAttribute('transform', frame.index === 0 ? `translate(130 90) scale(${1 - frame.amount * .12} 1) rotate(${turn * 2}) translate(-130 -90)` : '');
    // Project the shoulder turn around the seated pelvis; hips and feet stay anchored.
    const squeeze = frame.index === 2 ? 1 - frame.amount * .22 : 1;
    const shear = frame.index === 2 ? turn * -.12 : 0;
    nodes.torso.setAttribute('transform', `matrix(${squeeze} 0 ${shear} ${1 + breathing * .008} ${130 * (1 - squeeze) - 174 * shear} ${-174 * breathing * .008})`);
    const lift = frame.index === 1 ? frame.amount : 0;
    nodes.left.setAttribute('transform', `rotate(${lift * 48} 105 105)`);
    nodes.right.setAttribute('transform', `rotate(${-lift * 48} 155 105)`);
    nodes.left.setAttribute('visibility', frame.index === 2 ? 'hidden' : 'visible');
    nodes.right.setAttribute('visibility', frame.index === 2 ? 'hidden' : 'visible');
    nodes.crossed.setAttribute('visibility', frame.index === 2 ? 'visible' : 'hidden');
    nodes.guide.setAttribute('transform', `translate(0 ${frame.index === 0 ? 0 : frame.index === 1 ? 50 : 85})`);
    nodes.guide.setAttribute('opacity', String(.25 + frame.amount * .6));
    nodes.ring.setAttribute('r', String(98 + breathing * 7));
    nodes.ring.setAttribute('opacity', String(.3 + breathing * .3));
    nodes.breath.style.transform = `scale(${.8 + breathing * .3})`;
    nodes.progress.style.transform = `scaleX(${(elapsed % 44000) / 44000})`;
  };
  const tick = (now: number) => {
    if (last) elapsed += Math.min(now - last, 250);
    last = now;
    draw();
    handle = requestAnimationFrame(tick);
  };
  const sync = () => {
    cancelAnimationFrame(handle); last = 0;
    if (active && !userPaused && !timerPaused) handle = requestAnimationFrame(tick);
    draw();
  };
  q('[data-stretch-pause]').addEventListener('click', () => { userPaused = !userPaused; sync(); });
  const skip = (delta: number) => { elapsed = ((stretchFrame(elapsed).index + delta + 3) % 3) * 44000; sync(); };
  q('[data-stretch-prev]').addEventListener('click', () => skip(-1));
  q('[data-stretch-next]').addEventListener('click', () => skip(1));
  draw();
  return { setActive(next: boolean, paused = false) {
    if (next === active && paused === timerPaused) return;
    if (next && !active) { elapsed = 0; userPaused = reducedMotion.matches; }
    active = next; timerPaused = paused; sync();
  } };
}
