// ============================================================
// input-handler.ts — Keyboard + Touch → Action queue
// ============================================================

/** Enum đại diện cho Action. */
export enum Action {
  /** Phần tử Enum MOVE_UP. */
    MOVE_UP    = 'MOVE_UP',
  /** Phần tử Enum MOVE_DOWN. */
    MOVE_DOWN  = 'MOVE_DOWN',
  /** Phần tử Enum MOVE_LEFT. */
    MOVE_LEFT  = 'MOVE_LEFT',
  /** Phần tử Enum MOVE_RIGHT. */
    MOVE_RIGHT = 'MOVE_RIGHT',
  /** Phần tử Enum PLACE_WALL. */
    PLACE_WALL = 'PLACE_WALL',
  /** Phần tử Enum TOGGLE_DEBUG. */
    TOGGLE_DEBUG = 'TOGGLE_DEBUG',
  /** Phần tử Enum PAUSE. */
    PAUSE = 'PAUSE',
  /** Interact (e.g. use ladder). */
    INTERACT = 'INTERACT',
}

const KEY_MAP: Record<string, Action> = {
  ArrowUp:    Action.MOVE_UP,
  ArrowDown:  Action.MOVE_DOWN,
  ArrowLeft:  Action.MOVE_LEFT,
  ArrowRight: Action.MOVE_RIGHT,
  w:          Action.MOVE_UP,
  s:          Action.MOVE_DOWN,
  a:          Action.MOVE_LEFT,
  d:          Action.MOVE_RIGHT,
  W:          Action.MOVE_UP,
  S:          Action.MOVE_DOWN,
  A:          Action.MOVE_LEFT,
  D:          Action.MOVE_RIGHT,
  ' ':        Action.PLACE_WALL,
  Escape:     Action.PAUSE,
  p:          Action.PAUSE,
  P:          Action.PAUSE,
  e:          Action.INTERACT,
  E:          Action.INTERACT,
  Enter:      Action.INTERACT,
};

// Special key for debug toggle (separate from WASD confusion)
const DEBUG_KEY = 'F1';

const SWIPE_THRESHOLD = 30; // px

/** Lớp đại diện cho InputHandler. */
export class InputHandler {
  /** Thuộc tính _queue. */
    private _queue: Action[] = [];
  /** Thuộc tính _touchStart. */
    private _touchStart: { x: number; y: number } | null = null;

  // Bound event handlers (kept as refs for cleanup)
  /** Thuộc tính _onKeyDown. */
    private _onKeyDown: (e: KeyboardEvent) => void;
  /** Thuộc tính _onTouchStart. */
    private _onTouchStart: (e: TouchEvent) => void;
  /** Thuộc tính _onTouchEnd. */
    private _onTouchEnd: (e: TouchEvent) => void;

  constructor() {
    this._onKeyDown = (e: KeyboardEvent) => {
      // Prevent arrow key scrolling the page
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (e.repeat) return;

      if (e.key === DEBUG_KEY) {
        this._queue.push(Action.TOGGLE_DEBUG);
        return;
      }

      const action = KEY_MAP[e.key];
      if (action) this._queue.push(action);
    };

    this._onTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      this._touchStart = { x: touch.clientX, y: touch.clientY };
    };

    this._onTouchEnd = (e: TouchEvent) => {
      if (!this._touchStart) return;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - this._touchStart.x;
      const dy = touch.clientY - this._touchStart.y;
      this._touchStart = null;

      if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD) {
        // Tap = place wall
        this._queue.push(Action.PLACE_WALL);
        return;
      }

      if (Math.abs(dx) > Math.abs(dy)) {
        this._queue.push(dx > 0 ? Action.MOVE_RIGHT : Action.MOVE_LEFT);
      } else {
        this._queue.push(dy > 0 ? Action.MOVE_DOWN : Action.MOVE_UP);
      }
    };
  }

  /** Phương thức attach. */
    attach() {
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('touchstart', this._onTouchStart, { passive: true });
    window.addEventListener('touchend', this._onTouchEnd, { passive: true });
  }

  /** Phương thức detach. */
    detach() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('touchstart', this._onTouchStart);
    window.removeEventListener('touchend', this._onTouchEnd);
  }

  /** Consume and return all queued actions since last tick. */
  flush(): Action[] {
    const actions = [...this._queue];
    this._queue = [];
    return actions;
  }
}
