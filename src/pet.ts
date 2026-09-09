import './pet.css';
import { Window as TauriWindow, getCurrentWindow } from '@tauri-apps/api/window';
import { listen } from '@tauri-apps/api/event';
import { LogicalSize, PhysicalPosition } from '@tauri-apps/api/dpi';

type PetSnapshot = {
  mode?: 'idle' | 'work' | 'break' | 'paused';
  activeMode?: 'work' | 'break';
  remainingSeconds?: number;
  completedBreaks?: number;
};

type PetPreferences = {
  size?: number;
  opacity?: number;
};

type PetPosition = {
  x: number;
  y: number;
};

const PET_BASE_WIDTH = 180;
const PET_BASE_WINDOW_WIDTH = 250;
const PET_BASE_WINDOW_HEIGHT = 190;
const PET_BUBBLE_LEFT = 130;
const MIN_PET_SIZE = 140;
const MAX_PET_SIZE = 260;
const MIN_PET_OPACITY = 30;
const MAX_PET_OPACITY = 100;
const POSITION_STORAGE_KEY = 'break-pet-view-v1';

const button = document.querySelector<HTMLButtonElement>('[data-open-main]');
const status = document.querySelector<HTMLElement>('[data-pet-status]');
const bubble = document.querySelector<HTMLElement>('[data-pet-bubble]');
const petArt = document.querySelector<HTMLElement>('.floating-pet');
const isTauriRuntime = () => Boolean((window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__);
let nativeResizeQueue = Promise.resolve();

const formatTime = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

const render = (snapshot: PetSnapshot) => {
  const mode = snapshot.mode ?? 'idle';
  const isBreak = mode === 'break' || (mode === 'paused' && snapshot.activeMode === 'break');
  const isPaused = mode === 'paused';
  document.body.classList.toggle('is-break', isBreak);
  document.body.classList.toggle('is-paused', isPaused);
  if (status) status.textContent = formatTime(snapshot.remainingSeconds ?? 0);
  if (bubble) bubble.textContent = isBreak ? '走，去喝点水' : isPaused ? '准备好再继续' : mode === 'work' ? '专注进行中' : '我陪你工作';
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const readStoredPreferences = (): PetPreferences => {
  try {
    const stored = JSON.parse(localStorage.getItem('break-pet-state-v1') ?? '{}') as { petSize?: number; petOpacity?: number };
    return { size: stored.petSize, opacity: stored.petOpacity };
  } catch {
    return {};
  }
};

const applyPreferences = async (preferences: PetPreferences) => {
  const size = clamp(Number(preferences.size ?? PET_BASE_WIDTH), MIN_PET_SIZE, MAX_PET_SIZE);
  const opacity = clamp(Number(preferences.opacity ?? MAX_PET_OPACITY), MIN_PET_OPACITY, MAX_PET_OPACITY);
  petArt?.style.setProperty('--pet-scale', String(size / PET_BASE_WIDTH));
  petArt?.style.setProperty('--pet-opacity', String(opacity / 100));
  const scale = size / PET_BASE_WIDTH;
  const windowWidth = Math.round(PET_BASE_WINDOW_WIDTH * scale);
  const windowHeight = Math.round(PET_BASE_WINDOW_HEIGHT * scale);
  petArt?.style.setProperty('--pet-window-width', `${windowWidth}px`);
  petArt?.style.setProperty('--pet-window-height', `${windowHeight}px`);
  bubble?.style.setProperty('--pet-bubble-left', `${Math.round(PET_BUBBLE_LEFT * scale)}px`);
  if (!isTauriRuntime()) return;
  nativeResizeQueue = nativeResizeQueue
    .then(() => getCurrentWindow().setSize(new LogicalSize(windowWidth, windowHeight)))
    .catch(() => undefined);
  await nativeResizeQueue;
};

const readStoredPosition = (): PetPosition | null => {
  try {
    const stored = JSON.parse(localStorage.getItem(POSITION_STORAGE_KEY) ?? 'null') as Partial<PetPosition> | null;
    if (typeof stored?.x !== 'number' || typeof stored.y !== 'number') return null;
    return { x: stored.x, y: stored.y };
  } catch {
    return null;
  }
};

const persistPosition = (position: PetPosition) => {
  localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(position));
};

const setupNativeWindow = async () => {
  if (!isTauriRuntime()) return;
  try {
    const petWindow = getCurrentWindow();
    const storedPosition = readStoredPosition();
    if (storedPosition) await petWindow.setPosition(new PhysicalPosition(storedPosition.x, storedPosition.y));
    await petWindow.onMoved(({ payload }) => {
      persistPosition({ x: payload.x, y: payload.y });
      if (pointerDown) draggedSincePointerDown = true;
    });
    await applyPreferences(readStoredPreferences());
  } catch {
    // Keep the pet usable if a platform window API is unavailable.
  }
};

const restoreSnapshot = () => {
  try {
    const stored = JSON.parse(localStorage.getItem('break-pet-state-v1') ?? '{}') as { timer?: PetSnapshot };
    if (stored.timer) render(stored.timer);
  } catch {
    render({ mode: 'idle', remainingSeconds: 60 * 60 });
  }
};

let pointerDown: { x: number; y: number } | null = null;
let draggedSincePointerDown = false;

petArt?.addEventListener('mousedown', (event) => {
  if (!isTauriRuntime() || event.button !== 0) return;
  pointerDown = { x: event.screenX, y: event.screenY };
  draggedSincePointerDown = false;
  void getCurrentWindow().startDragging();
});

petArt?.addEventListener('mousemove', (event) => {
  if (!pointerDown) return;
  const distance = Math.hypot(event.screenX - pointerDown.x, event.screenY - pointerDown.y);
  if (distance > 4) draggedSincePointerDown = true;
});

petArt?.addEventListener('mouseup', () => {
  pointerDown = null;
});

button?.addEventListener('click', async (event) => {
  if (draggedSincePointerDown) {
    event.preventDefault();
    draggedSincePointerDown = false;
    return;
  }
  const main = await TauriWindow.getByLabel('main');
  await main?.show();
  await main?.setFocus();
});

if (isTauriRuntime()) void listen<PetSnapshot>('pet-state', (event) => render(event.payload));
if (isTauriRuntime()) void listen<PetPreferences>('pet-preferences', (event) => void applyPreferences(event.payload));
restoreSnapshot();
void applyPreferences(readStoredPreferences());
void setupNativeWindow();
