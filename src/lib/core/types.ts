// ============================================================
// types.ts — Shared interfaces and enums for Maze Hunter
// ============================================================

// --------------- Enums ---------------

/** Enum đại diện cho CellType. */
export enum CellType {
  /** Phần tử Enum WALL. */
    WALL = 0,
  /** Phần tử Enum FLOOR. */
    FLOOR = 1,
  /** Phần tử Enum MUD. */
    MUD = 2,
  /** Phần tử Enum ICE. */
    ICE = 3,
  /** Phần tử Enum EXIT. */
    EXIT = 4,
  /** Phần tử Enum CRYSTAL. */
    CRYSTAL = 5,
  /** Phần tử Enum FREEZE_CLOCK. */
    FREEZE_CLOCK = 6,
  /** Phần tử Enum BOMB_PICKUP. */
    BOMB_PICKUP = 7,
  // --- Terrain / hazard types (LADDER removed — now a floating LadderObject entity) ---
  /** Bridge: narrow chokepoint connector. Only 1 entity fits comfortably. */
    BRIDGE = 9,
  /** Crack tile: collapses after a set number of uses. */
    CRACK = 12,
}

/** Enum đại diện cho AlgoType. */
export enum AlgoType {
  /** Phần tử Enum BFS. */
    BFS = 'BFS',
  /** Phần tử Enum DIJKSTRA. */
    DIJKSTRA = 'DIJKSTRA',
  /** Phần tử Enum ASTAR. */
    ASTAR = 'ASTAR',
  /** Phần tử Enum DFS. */
    DFS = 'DFS',
}

/** Enum đại diện cho GamePhase. */
export enum GamePhase {
  /** Phần tử Enum MENU. */
    MENU = 'MENU',
  /** Phần tử Enum PLAYING. */
    PLAYING = 'PLAYING',
  /** Phần tử Enum PAUSED. */
    PAUSED = 'PAUSED',
  /** Phần tử Enum GAME_OVER. */
    GAME_OVER = 'GAME_OVER',
  /** Phần tử Enum WIN. */
    WIN = 'WIN',
  /** Round intro screen — shown briefly before round begins. */
    ROUND_INTRO = 'ROUND_INTRO',
}

/** Enum đại diện cho Direction. */
export enum Direction {
  /** Phần tử Enum UP. */
    UP = 'UP',
  /** Phần tử Enum DOWN. */
    DOWN = 'DOWN',
  /** Phần tử Enum LEFT. */
    LEFT = 'LEFT',
  /** Phần tử Enum RIGHT. */
    RIGHT = 'RIGHT',
}

/** Enum đại diện cho EnemyMode. */
export enum EnemyMode {
  /** Phần tử Enum PURSUE. */
    PURSUE = 'PURSUE',
  /** Phần tử Enum FLEE. */
    FLEE = 'FLEE',
  /** Enemy confused — moves toward decoy position for a short time. */
    CONFUSED = 'CONFUSED',
}

/**
 * Enemy personality trait that adds behaviour on top of the base algorithm.
 * Each enemy can have at most one trait.
 */
export enum EnemyTrait {
  NONE     = 'NONE',
  /** Fast: reduced base step interval. */
  FAST     = 'FAST',
  /** Heavy: high step interval but resists some effects; treats mud at cost 5 (half of 10). */
  HEAVY    = 'HEAVY',
  /** Hunter: A*-based, forced pursue; refreshes path every step. */
  HUNTER   = 'HUNTER',
  /** Scout: fast on FLOOR, penalty on turns/mud. */
  SCOUT    = 'SCOUT',
  /** Burrower: mud cost 1 (loves mud), cannot use LADDER. */
  BURROWER = 'BURROWER',
  /** Climber: ladder bonus (half traversal time), penalty on ICE. */
  CLIMBER  = 'CLIMBER',
  /** Elite: elite variant — visibly marked; significantly increased speed. */
  ELITE    = 'ELITE',
  /** Boss: mini-boss; can use ladders, mud cost 1, highest HP, fastest. */
  BOSS     = 'BOSS',
}

// --------------- Primitives ---------------

/** Interface đại diện cho Pos. */
export interface Pos {
  /** Thuộc tính row. */
    row: number;
  /** Thuộc tính col. */
    col: number;
}

// --------------- Grid ---------------

/** Kiểu dữ liệu Grid. */
export type Grid = CellType[][];

// --------------- Ladder Entity ---------------

export interface LadderObject {
  /** Định danh duy nhất. */
  id: string;
  /**
   * Mảng chứa chuỗi các tọa độ mà thang đi qua.
   * Node đầu tiên là Start, node cuối cùng là End (đều phải là ô Floor).
   * Các node trung gian là cầu thang bắc qua Wall.
   */
  path_nodes: Pos[];
  /** Khoảng cách từ start đến end. Cũng là chi phí pathfinding. */
  length: number;
}

// --------------- Algorithm Result ---------------

/** Interface đại diện cho AlgoResult. */
export interface AlgoResult {
  /** Ordered path from start to goal (inclusive). Empty if no path found. */
  path: Pos[];
  /** All positions visited/expanded during the search (for debug overlay). */
  visited: Pos[];
  /** Time taken to compute, in milliseconds. */
  computeMs: number;
}

// --------------- Crack tile state ---------------

/** Tracks the remaining uses for each crack tile. */
export type CrackDurability = Map<string, number>; // key = "row,col"

// --------------- Timed Events ---------------

/** A single timed event that fires once at a specific elapsed time. */
export interface TimedEvent {
  /** ms after round start to fire. */
  triggerMs: number;
  /** Whether this event has already fired. */
  fired: boolean;
  /** Human-readable label shown briefly in HUD. */
  label: string;
  /** The type of event. */
  type: TimedEventType;
  /** Optional positional data for position-specific events. */
  payload?: Record<string, unknown>;
}

export enum TimedEventType {
  /** Open a previously blocked passage (convert WALL → BRIDGE). */
  OPEN_ROUTE  = 'OPEN_ROUTE',
  /** Collapse a bridge (convert BRIDGE → WALL). */
  COLLAPSE_BRIDGE = 'COLLAPSE_BRIDGE',
  /** Spawn a ladder at a random valid floor cell. */
  SPAWN_LADDER = 'SPAWN_LADDER',
  /** Spawn elite enemy. */
  SPAWN_ELITE = 'SPAWN_ELITE',
}

// --------------- Entities ---------------

/** Interface đại diện cho PlayerState. */
export interface PlayerState {
  /** Thuộc tính pos. */
    pos: Pos;
  /** Thuộc tính fogRadius. */
    fogRadius: number;        // default 4, becomes 6 when crystal active
  /** Thuộc tính powerUpTimer. */
    powerUpTimer: number;     // ms remaining on current power-up (0 = none)
  /** Thuộc tính wallBombs. */
    wallBombs: number;        // max 3
  /** Thuộc tính isSliding. */
    isSliding: boolean;       // true when sliding on ICE
  /** Thuộc tính slideDir. */
    slideDir: Direction | null;
  /** Thuộc tính freezeTimer. */
    freezeTimer: number;      // ms remaining on freeze clock (0 = none)
  /**
   * Mud slow toggle: khi player đứng trên ô MUD, cứ mỗi bước di chuyển
   * hợp lệ thì lần lượt cho phép / chặn (true = bước này bị chặn).
   * Điều này tạo hiệu ứng giảm tốc 50% mà không cần sửa vận tốc tuyệt đối.
   */
  mudBlocked: boolean;
  /** Đang di chuyển trên thang (tắt điều khiển WASD) */
  isClimbing: boolean;
  /** ms đã trôi qua khi leo thang */
  climbTimer: number;
  /** Tổng thời gian leo thang (ms) */
  climbDuration: number;
  /** Điểm bắt đầu leo thang (tọa độ Grid) */
  climbStart: Pos | null;
  /** Điểm kết thúc leo thang (tọa độ Grid) */
  climbEnd: Pos | null;
}

/** Interface đại diện cho EnemyState. */
export interface EnemyState {
  /** Thuộc tính id. */
    id: string;
  /** Thuộc tính pos. */
    pos: Pos;
  /** Thuộc tính algoType. */
    algoType: AlgoType;
  /** Personality trait layered on top of algorithm. */
  trait: EnemyTrait;
  /** Thuộc tính mode. */
    mode: EnemyMode;
  /** ms remaining in CONFUSED mode. */
  confusedTimer: number;
  /** Cached path (next steps to take). Re-used until invalidated. */
  pathCache: Pos[];
  /** Cached visited list from last pathfind (for debug overlay). */
  visitedCache: Pos[];
  /** ms elapsed since this enemy last moved one step. */
  stepTimer: number;
  /** ms between steps (lower = faster). */
  stepInterval: number;
  /** ms of extra delay added by mud / sticky effects. */
  slowTimer: number;
  /** Stats from last pathfinding call (for AlgorithmPanel). */
  lastAlgoResult: AlgoResult | null;
  /** Whether this enemy is currently on a BRIDGE (for congestion logic). */
  onBridge: boolean;
}

// --------------- Game State ---------------

/** Interface đại diện cho GameState. */
export interface GameState {
  /** Thuộc tính phase. */
    phase: GamePhase;
  /** Thuộc tính score. */
    score: number;
  /** Demo round number (1–3). Wave maps to round. */
  round: number;
  /** Thuộc tính wave. */
    wave: number;
  /** Thuộc tính lives. */
    lives: number;
  /** Thuộc tính timeElapsedMs. */
    timeElapsedMs: number;
  /** Thuộc tính player. */
    player: PlayerState;
  /** Thuộc tính enemies. */
    enemies: EnemyState[];
  /** Thuộc tính grid. */
    grid: Grid;
  /** Pending timed events for the current round. */
  timedEvents: TimedEvent[];
  /** Last fired timed event label (shown in HUD for 3 seconds). */
  lastEventLabel: string;
  /** ms remaining to show lastEventLabel. */
  eventLabelTimer: number;
  /** Whether fog of war is enabled */
  fogEnabled: boolean;
  /** Whether the debug overlay is currently active. */
  debugMode: boolean;
  /** Bridge cells currently in use (for congestion logic). Key = "row,col". */
  bridgeOccupancy: Record<string, string>; // value = entity id
  /**
   * Danh sách các LadderObject hiện có trên bản đồ.
   * Mỗi thang là một overlay floating entity, không chiếm ô grid.
   */
  ladders: LadderObject[];
}

// --------------- Settings ---------------

/** Kiểu dữ liệu Difficulty. */
export type Difficulty = 'easy' | 'normal' | 'hard';

/** Interface đại diện cho Settings. */
export interface Settings {
  /** Thuộc tính tileSize. */
    tileSize: number;
  /** Thuộc tính fpsCap. */
    fpsCap: number;
  /** Thuộc tính difficulty. */
    difficulty: Difficulty;
  /** Thuộc tính gridRows. */
    gridRows: number;
  /** Thuộc tính gridCols. */
    gridCols: number;
  /** Thuộc tính fogEnabled. */
    fogEnabled: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  tileSize: 32,
  fpsCap: 60,
  difficulty: 'normal',
  gridRows: 21,
  gridCols: 21,
  fogEnabled: true,
};
