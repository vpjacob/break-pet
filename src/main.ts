import './styles.css';
import { BreakTimer, type TimerMode, type TimerSnapshot } from './timer';
import { createStretchPlayer } from './stretch';

const STORAGE_KEY = 'break-pet-state-v1';
const DEMO_WORK_SECONDS = 20;
const DEMO_BREAK_SECONDS = 8;
const DEFAULT_PET_SIZE = 180;
const MIN_PET_SIZE = 140;
const MAX_PET_SIZE = 260;
const DEFAULT_PET_OPACITY = 100;
const MIN_PET_OPACITY = 30;
const MAX_PET_OPACITY = 100;

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('App root not found');

app.innerHTML = `
  <div class="app-shell">
    <header class="topbar">
      <div class="brand-lockup">
        <div class="brand-mark" aria-hidden="true">✦</div>
        <div>
          <p class="eyebrow">DAILY RHYTHM / 01</p>
          <h1>起身一下</h1>
        </div>
      </div>
      <div class="topbar-actions">
        <span class="sync-status"><span class="sync-dot"></span> 本地运行</span>
        <button class="icon-button" data-action="settings" aria-label="打开设置">☼</button>
      </div>
    </header>

    <section class="hero-grid">
      <div class="pet-stage" data-pet-stage>
        <div class="sun-orbit orbit-one"></div>
        <div class="sun-orbit orbit-two"></div>
        <div class="pet-shadow"></div>
        <div class="pet" data-pet aria-label="卡皮巴拉桌面宠物" role="img">
          <div class="pet-ear ear-left"></div><div class="pet-ear ear-right"></div>
          <div class="pet-body"><div class="pet-face"><span class="eye eye-left"></span><span class="eye eye-right"></span><span class="snout"></span></div><div class="pet-paw paw-left"></div><div class="pet-paw paw-right"></div><div class="pet-cup">◒</div></div>
        </div>
        <div class="pet-label"><span class="status-pulse"></span><span data-pet-status>准备陪你工作</span></div>
        <div class="speech-bubble" data-speech>今天也慢慢来，先把这一小时照顾好。</div>
      </div>

      <div class="timer-panel">
        <div class="panel-kicker"><span data-mode-label>FOCUS SESSION</span><span class="session-count" data-session-count>01</span></div>
        <div class="timer-display" data-timer>60:00</div>
        <p class="timer-caption" data-caption>专注工作，时间到了我会提醒你。</p>
        <div class="progress-track"><span class="progress-fill" data-progress></span></div>
        <div class="timer-actions">
          <button class="primary-button" data-action="start">开始这一轮 <span>→</span></button>
          <button class="ghost-button" data-action="pause">暂停</button>
          <button class="ghost-button" data-action="break-now">现在休息</button>
        </div>
        <div class="quick-row">
          <span>快速体验</span>
          <button data-action="demo">20 分钟</button>
          <button data-action="reset">重置本轮</button>
        </div>
      </div>
    </section>

    <section class="insight-grid">
      <article class="insight-card stat-card">
        <div class="card-heading"><span>今日节奏</span><span class="card-icon">↗</span></div>
        <div class="stat-number" data-completed>0</div>
        <p>次完整休息</p>
        <div class="mini-bars" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i class="active"></i></div>
      </article>
      <article class="insight-card note-card">
        <div class="card-heading"><span>给自己的提醒</span><span class="card-icon">✎</span></div>
        <p class="note-copy">“身体不是后台进程，记得给它一个重新加载的机会。”</p>
        <button class="text-button" data-action="break-now">现在就走两步 <span>↗</span></button>
      </article>
      <article class="insight-card settings-card">
        <div class="card-heading"><span>本轮设置</span><span class="card-icon">⌁</span></div>
        <div class="setting-summary"><div><strong data-work-setting>60</strong><small>分钟工作</small></div><div class="setting-divider">/</div><div><strong data-break-setting>5</strong><small>分钟休息</small></div></div>
        <button class="text-button" data-action="settings">调整节奏 <span>→</span></button>
      </article>
    </section>

    <footer class="footer-note"><span class="tiny-pet">◡</span> 卡皮巴拉正在观察你的坐姿 <span class="footer-dot">·</span> <button class="footer-link" data-action="settings">偏好设置</button></footer>
  </div>

  <div class="break-overlay" data-overlay aria-hidden="true">
    <div class="overlay-noise"></div>
    <div class="break-content">
      <p class="eyebrow">BREAK TIME / 起身一下</p>
      <h2>离开屏幕，走动几步。</h2>
      <section class="stretch-player" data-stretch-player aria-label="休息动作演示"></section>
      <p class="break-copy">接一杯水，去趟洗手间，<br />让肩膀和眼睛也休息一下。</p>
      <div class="break-timer" data-break-timer>05:00</div>
      <div class="break-progress"><span data-break-progress></span></div>
      <div class="break-actions"><button class="primary-button light-button" data-action="end-break">我回来了 <span>→</span></button><button class="overlay-link" data-action="skip">长按 5 秒跳过</button></div>
      <p class="overlay-footnote">休息期间可以放心离开电脑，倒计时会继续。</p>
    </div>
  </div>

  <dialog class="settings-dialog" data-settings-dialog>
    <form method="dialog" class="settings-form" data-settings-form>
      <div class="dialog-header"><div><p class="eyebrow">PERSONAL RHYTHM</p><h2>调整你的节奏</h2></div><button value="cancel" class="dialog-close" aria-label="关闭">×</button></div>
      <label>工作时长 <span><input name="work" type="number" min="1" max="480" value="60" /> 分钟</span></label>
      <label>休息时长 <span><input name="break" type="number" min="1" max="60" value="5" /> 分钟</span></label>
      <label class="select-label">提醒强度 <span><select name="intensity"><option value="gentle">温和提醒</option><option value="forced" selected>强制休息</option><option value="strict">严格休息</option></select></span></label>
      <label class="range-label">宠物大小 <span><input name="pet-size" type="range" min="140" max="260" step="10" value="180" /><output data-pet-size-value>180px</output></span></label>
      <label class="range-label">宠物透明度 <span><input name="pet-opacity" type="range" min="30" max="100" step="5" value="100" /><output data-pet-opacity-value>100%</output></span></label>
      <label class="floating-option">显示悬浮宠物 <span><input name="floating-pet" type="checkbox" checked /></span></label>
      <label class="autostart-option">开机自动启动 <span><input name="autostart" type="checkbox" /></span></label>
      <div class="dialog-tip">建议每工作 60 分钟，休息 5 分钟。你可以用“快速体验”验证完整流程。</div>
      <button class="primary-button dialog-submit" value="default">保存设置 <span>→</span></button>
    </form>
  </dialog>
`;

const timer = new BreakTimer();
const stretchPlayer = createStretchPlayer(app.querySelector<HTMLElement>('[data-stretch-player]')!);
let lastSnapshot: TimerSnapshot = timer.snapshot();
let intensity = 'forced';
let floatingPetEnabled = true;
let floatingPetSize = DEFAULT_PET_SIZE;
let floatingPetOpacity = DEFAULT_PET_OPACITY;
let nativeBreakActive = false;

const isTauriRuntime = () => Boolean((window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__);

const query = <T extends Element>(selector: string) => app.querySelector<T>(selector);
const formatTime = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const syncNativePetPresentation = () => {
  app.classList.toggle('uses-floating-pet', isTauriRuntime() && floatingPetEnabled);
};
const getStored = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as {
      timer?: ReturnType<BreakTimer['serialize']>;
      intensity?: string;
      floatingPet?: boolean;
      petSize?: number;
      petOpacity?: number;
    };
  } catch { return {}; }
};
const persist = () => localStorage.setItem(STORAGE_KEY, JSON.stringify({
  timer: timer.serialize(),
  intensity,
  floatingPet: floatingPetEnabled,
  petSize: floatingPetSize,
  petOpacity: floatingPetOpacity,
}));

const syncNativeBreakWindow = async (active: boolean) => {
  if (!isTauriRuntime() || nativeBreakActive === active) return;
  nativeBreakActive = active;
  try {
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    const currentWindow = getCurrentWindow();
    if (active) {
      await currentWindow.show();
      await currentWindow.setAlwaysOnTop(true);
      await currentWindow.setFullscreen(true);
      await currentWindow.setFocus();
    } else {
      await currentWindow.setAlwaysOnTop(false);
      if (await currentWindow.isFullscreen()) await currentWindow.setFullscreen(false);
    }
  } catch {
    nativeBreakActive = !active;
  }
};

const setFloatingPetWindowVisible = async (visible: boolean) => {
  if (!isTauriRuntime()) return;
  try {
    const { Window } = await import('@tauri-apps/api/window');
    const petWindow = await Window.getByLabel('pet');
    if (!petWindow) return;
    if (visible) await petWindow.show();
    else await petWindow.hide();
  } catch {
    // The browser build has no separate pet window.
  }
};

const emitNativeSnapshot = async (snapshot: TimerSnapshot) => {
  if (!isTauriRuntime()) return;
  try {
    const { emit } = await import('@tauri-apps/api/event');
    await emit('pet-state', snapshot);
  } catch {
    // The browser build intentionally has no native event bridge.
  }
};

const emitNativePetPreferences = async (preferences = { size: floatingPetSize, opacity: floatingPetOpacity }) => {
  if (!isTauriRuntime()) return;
  try {
    const { emit } = await import('@tauri-apps/api/event');
    await emit('pet-preferences', preferences);
  } catch {
    // The browser build intentionally has no native event bridge.
  }
};

const updatePetPreferenceOutputs = (size = floatingPetSize, opacity = floatingPetOpacity) => {
  const sizeOutput = query<HTMLOutputElement>('[data-pet-size-value]');
  const opacityOutput = query<HTMLOutputElement>('[data-pet-opacity-value]');
  if (sizeOutput) sizeOutput.value = `${size}px`;
  if (opacityOutput) opacityOutput.value = `${opacity}%`;
};

const openSettings = async () => {
  const dialog = query<HTMLDialogElement>('[data-settings-dialog]');
  if (!dialog) return;
  const floatingPet = query<HTMLInputElement>('[name="floating-pet"]');
  if (floatingPet) floatingPet.checked = floatingPetEnabled;
  const intensitySelect = query<HTMLSelectElement>('[name="intensity"]');
  if (intensitySelect) intensitySelect.value = intensity;
  const petSize = query<HTMLInputElement>('[name="pet-size"]');
  if (petSize) petSize.value = String(floatingPetSize);
  const petOpacity = query<HTMLInputElement>('[name="pet-opacity"]');
  if (petOpacity) petOpacity.value = String(floatingPetOpacity);
  updatePetPreferenceOutputs();
  const autostart = query<HTMLInputElement>('[name="autostart"]');
  if (isTauriRuntime() && autostart) {
    try {
      const { isEnabled } = await import('@tauri-apps/plugin-autostart');
      autostart.checked = await isEnabled();
    } catch {
      autostart.checked = false;
    }
  }
  dialog.showModal();
};

const setPetState = (mode: TimerMode) => {
  const stage = query<HTMLElement>('[data-pet-stage]');
  const pet = query<HTMLElement>('[data-pet]');
  stage?.classList.toggle('is-break', mode === 'break');
  pet?.classList.toggle('is-active', mode === 'work');
  pet?.classList.toggle('is-break', mode === 'break');
};

const render = (snapshot: TimerSnapshot) => {
  lastSnapshot = snapshot;
  const isBreak = snapshot.mode === 'break' || (snapshot.mode === 'paused' && snapshot.activeMode === 'break');
  const isRunning = snapshot.mode === 'work' || snapshot.mode === 'break';
  const modeLabel = query<HTMLElement>('[data-mode-label]');
  const caption = query<HTMLElement>('[data-caption]');
  const petStatus = query<HTMLElement>('[data-pet-status]');
  const speech = query<HTMLElement>('[data-speech]');
  const primary = query<HTMLButtonElement>('[data-action="start"]');
  const remaining = isBreak ? snapshot.remainingSeconds : snapshot.remainingSeconds;
  query<HTMLElement>('[data-timer]')!.textContent = formatTime(remaining);
  query<HTMLElement>('[data-break-timer]')!.textContent = formatTime(snapshot.remainingSeconds);
  query<HTMLElement>('[data-completed]')!.textContent = String(snapshot.completedBreaks);
  query<HTMLElement>('[data-session-count]')!.textContent = String(Math.max(1, snapshot.completedBreaks + 1)).padStart(2, '0');
  query<HTMLElement>('[data-work-setting]')!.textContent = snapshot.workSeconds < 60 ? '<1' : String(Math.round(snapshot.workSeconds / 60));
  query<HTMLElement>('[data-break-setting]')!.textContent = snapshot.breakSeconds < 60 ? '<1' : String(Math.round(snapshot.breakSeconds / 60));
  query<HTMLElement>('[data-pet-status]')!.textContent = isBreak ? '陪你一起休息' : snapshot.mode === 'paused' ? '先暂停一下' : isRunning ? '专注进行中' : '准备陪你工作';
  modeLabel!.textContent = isBreak ? 'BREAK WINDOW' : snapshot.mode === 'paused' ? 'PAUSED SESSION' : 'FOCUS SESSION';
  caption!.textContent = isBreak ? '去走动、喝水，回来时我还在这里。' : snapshot.mode === 'paused' ? '需要时再继续，节奏由你掌握。' : '专注工作，时间到了我会提醒你。';
  speech!.textContent = isBreak ? '走，我们去接杯水。' : snapshot.mode === 'paused' ? '肩膀放松一点，准备好再继续。' : snapshot.remainingSeconds <= 60 && isRunning ? '快到休息时间啦，收个尾吧。' : '今天也慢慢来，先把这一小时照顾好。';
  primary!.textContent = snapshot.mode === 'paused' ? '继续这一轮  →' : isRunning ? '进行中  ·' : '开始这一轮  →';
  primary!.disabled = isRunning;
  query<HTMLButtonElement>('[data-action="pause"]')!.disabled = !isRunning;
  const progress = isBreak ? (1 - snapshot.remainingSeconds / Math.max(1, snapshot.breakSeconds)) : (1 - snapshot.remainingSeconds / Math.max(1, snapshot.workSeconds));
  query<HTMLElement>('[data-progress]')!.style.width = `${Math.max(0, Math.min(100, progress * 100))}%`;
  query<HTMLElement>('[data-break-progress]')!.style.width = `${Math.max(0, Math.min(100, progress * 100))}%`;
  const overlay = query<HTMLElement>('[data-overlay]')!;
  const shouldShowOverlay = isBreak && intensity !== 'gentle';
  stretchPlayer.setActive(shouldShowOverlay, snapshot.mode === 'paused');
  overlay.classList.toggle('is-visible', shouldShowOverlay);
  overlay.setAttribute('aria-hidden', String(!shouldShowOverlay));
  void syncNativeBreakWindow(shouldShowOverlay);
  void emitNativeSnapshot(snapshot);
  setPetState(snapshot.mode);
};

const saveAndRender = (snapshot: TimerSnapshot) => { render(snapshot); persist(); };
const stored = getStored();
if (stored.timer) timer.hydrate(stored.timer);
if (stored.intensity) intensity = stored.intensity;
if (stored.floatingPet !== undefined) floatingPetEnabled = stored.floatingPet;
if (stored.petSize !== undefined) floatingPetSize = clamp(Number(stored.petSize), MIN_PET_SIZE, MAX_PET_SIZE);
if (stored.petOpacity !== undefined) floatingPetOpacity = clamp(Number(stored.petOpacity), MIN_PET_OPACITY, MAX_PET_OPACITY);
syncNativePetPresentation();
timer.subscribe(saveAndRender);
void setFloatingPetWindowVisible(floatingPetEnabled);
void emitNativePetPreferences();

const setupNativeBridge = async () => {
  if (!isTauriRuntime()) return;
  try {
    const { listen } = await import('@tauri-apps/api/event');
    await listen('tray-start-break', () => timer.startBreakNow());
  } catch {
    // The browser build intentionally has no native bridge.
  }
};
void setupNativeBridge();

app.addEventListener('click', (event) => {
  const target = event.target as HTMLElement;
  const actionElement = target.closest<HTMLElement>('[data-action]');
  const action = actionElement?.dataset.action;
  if (!action) return;
  if (action === 'start') timer.start();
  if (action === 'pause') timer.pause();
  if (action === 'reset') timer.reset();
  if (action === 'break-now') timer.startBreakNow();
  if (action === 'skip' || action === 'end-break') timer.skipBreak();
  if (action === 'demo') { timer.setDurations(DEMO_WORK_SECONDS, DEMO_BREAK_SECONDS); timer.reset(); timer.start(); }
  if (action === 'settings') void openSettings();
});

for (const input of [
  query<HTMLInputElement>('[name="pet-size"]'),
  query<HTMLInputElement>('[name="pet-opacity"]'),
]) {
  input?.addEventListener('input', () => {
    const value = Number(input.value);
    const size = input.name === 'pet-size' ? clamp(value, MIN_PET_SIZE, MAX_PET_SIZE) : floatingPetSize;
    const opacity = input.name === 'pet-opacity' ? clamp(value, MIN_PET_OPACITY, MAX_PET_OPACITY) : floatingPetOpacity;
    updatePetPreferenceOutputs(size, opacity);
    void emitNativePetPreferences({ size, opacity });
  });
}

query<HTMLDialogElement>('[data-settings-dialog]')?.addEventListener('close', (event) => {
  const dialog = event.currentTarget as HTMLDialogElement;
  if (dialog.returnValue === 'saved') return;
  const petSize = query<HTMLInputElement>('[name="pet-size"]');
  const petOpacity = query<HTMLInputElement>('[name="pet-opacity"]');
  if (petSize) petSize.value = String(floatingPetSize);
  if (petOpacity) petOpacity.value = String(floatingPetOpacity);
  updatePetPreferenceOutputs();
  void emitNativePetPreferences();
});

query<HTMLFormElement>('[data-settings-form]')?.addEventListener('submit', async (event) => {
  const submitter = (event as SubmitEvent).submitter as HTMLButtonElement | null;
  if (submitter?.value === 'cancel') return;
  event.preventDefault();
  const form = new FormData(event.currentTarget as HTMLFormElement);
  timer.setDurations(Number(form.get('work')) * 60, Number(form.get('break')) * 60);
  intensity = String(form.get('intensity') ?? 'forced');
  floatingPetSize = clamp(Number(form.get('pet-size') ?? DEFAULT_PET_SIZE), MIN_PET_SIZE, MAX_PET_SIZE);
  floatingPetOpacity = clamp(Number(form.get('pet-opacity') ?? DEFAULT_PET_OPACITY), MIN_PET_OPACITY, MAX_PET_OPACITY);
  floatingPetEnabled = form.get('floating-pet') === 'on';
  syncNativePetPresentation();
  void setFloatingPetWindowVisible(floatingPetEnabled);
  void emitNativePetPreferences();
  if (isTauriRuntime()) {
    try {
      const { enable, disable } = await import('@tauri-apps/plugin-autostart');
      if (form.get('autostart') === 'on') await enable();
      else await disable();
    } catch {
      // Keep the browser prototype usable when the native plugin is unavailable.
    }
  }
  persist();
  query<HTMLDialogElement>('[data-settings-dialog]')?.close('saved');
  render(timer.snapshot());
});

render(lastSnapshot);
updatePetPreferenceOutputs();
