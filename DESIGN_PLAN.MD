# Maze Hunter — Game Design Plan (SvelteKit)

## Tech Stack

- **SvelteKit** (SPA mode, `adapter-static`) — routing, state, component
- **HTML5 Canvas** — game render loop duy nhất (không dùng DOM để vẽ game)
- **Svelte stores** — quản lý game state bên ngoài Canvas
- **TailwindCSS v4** — UI chrome (HUD, menu, panel)
- **TypeScript** — strict mode toàn bộ game logic

***

## Cấu trúc dự án

```
src/
├── routes/
│   ├── +page.svelte          ← Main menu
│   └── game/
│       └── +page.svelte      ← Game screen (chứa Canvas)
├── lib/
│   ├── core/
│   │   ├── types.ts           ← Định nghĩa Cell, Node, Enemy, GameState, AlgoType
│   │   ├── graph.ts           ← Grid graph — adjacency list, getNeighbors, trọng số ô
│   │   └── maze-generator.ts  ← DFS Recursive Backtracker sinh mê cung
│   ├── algorithms/
│   │   ├── bfs.ts             ← BFS — trả về path + danh sách visited (cho visualizer)
│   │   ├── dijkstra.ts        ← Dijkstra với weighted terrain
│   │   ├── astar.ts           ← A* với Manhattan heuristic
│   │   ├── dfs.ts             ← DFS — dùng cho Shadow enemy và maze gen
│   │   └── dsu.ts             ← Disjoint Set Union — kiểm tra connectivity khi đặt tường
│   ├── entities/
│   │   ├── player.ts          ← Vị trí, hướng, trạng thái power-up, fog-of-war radius
│   │   └── enemy.ts           ← AlgoType, pursue/flee mode, path cache, step timer
│   ├── systems/
│   │   ├── game-loop.ts       ← requestAnimationFrame, deltaTime, update → render cycle
│   │   ├── renderer.ts        ← Canvas draw: floor, walls, fog, entities, path overlay
│   │   ├── input-handler.ts   ← Keyboard + Touch input → action queue
│   │   └── wave-manager.ts    ← Spawn wave, tăng độ khó theo level
│   └── stores/
│       ├── game-state.ts      ← $gameState: phase, score, wave, lives
│       ├── debug-store.ts     ← $debugMode: toggle algorithm overlay
│       └── settings-store.ts  ← $settings: tileSize, FPS cap, algorithmChoice
└── components/
    ├── GameCanvas.svelte       ← Wrapper bind canvas ref → game-loop
    ├── HUD.svelte              ← Score, wave, lives, power-up timer
    ├── AlgorithmPanel.svelte   ← Debug panel: nodes expanded, path length, ms
    ├── MainMenu.svelte         ← Start, chọn difficulty, chọn AI algorithm
    └── GameOverScreen.svelte   ← Final score, replay
```

***

## Cấu trúc game (logic flow)

### 1. Biểu diễn mê cung

Maze là grid **N×M ô** (mặc định 21×21, lẻ). Mỗi ô có kiểu: `WALL | FLOOR | MUD | ICE | EXIT`. Graph được biểu diễn implicit — không lưu adjacency list tường minh, chỉ compute neighbors on-the-fly bằng cách check 4 hướng kề. Weighted terrain: `FLOOR=1`, `MUD=3`, `ICE=0.5`.

### 2. Sinh mê cung

DFS Recursive Backtracker chạy trên grid con (chỉ xét ô lẻ). Bắt đầu từ `(1,1)`, push vào stack, random chọn hướng chưa visit, "đục tường" giữa 2 ô, đệ quy. Kết quả luôn là connected maze — đảm bảo tồn tại đường từ start đến exit.

### 3. Player

Di chuyển **step-by-step theo ô** (không continuous). Mỗi keystroke = 1 bước hợp lệ (không phải tường). Player giữ fog-of-war radius = 4 ô xung quanh — các ô ngoài radius bị che tối. Khi nhặt **Power Crystal**: kích hoạt flee mode cho toàn bộ enemy trong 8 giây, radius tăng lên 6.

### 4. Enemy AI

Mỗi enemy có `algoType: BFS | DIJKSTRA | ASTAR | DFS` và `mode: PURSUE | FLEE`. Mỗi N tick (tùy wave), enemy gọi lại pathfinding từ vị trí hiện tại đến `target` (= player khi PURSUE, = ô xa nhất khi FLEE). Enemy lưu path cache, chỉ recalculate khi player di chuyển hoặc map thay đổi. Flee mode dùng "max-distance BFS" — tìm ô đạt khoảng cách BFS tối đa từ player.

### 5. Dynamic wall placement

Player có tối đa 3 **Wall Bomb**. Khi đặt tường, trước tiên kiểm tra connectivity bằng **DSU** (Union-Find): nếu đặt tường làm mất đường đi từ bất kỳ enemy nào đến exit thì hủy action. Nếu hợp lệ, cập nhật graph và trigger recalculate path cho tất cả enemy.

### 6. Wave system

Wave 1: 1 Ghost (BFS). Wave 2: thêm 1 Heavy (Dijkstra). Wave 3: thêm 1 Hunter (A\*). Wave 4+: tăng tốc độ enemy, sinh thêm instance. Mỗi wave sinh maze mới. Score tính theo số wave hoàn thành × bonus time còn lại.

### 7. Algorithm debug overlay

Toggle bằng phím `D`. Khi bật, renderer vẽ thêm:
- Ô màu xanh nhạt: các ô đã được expand trong lần pathfinding gần nhất của mỗi enemy
- Đường đỏ: path đang được enemy đi theo
- Panel bên phải: `nodesExpanded`, `pathLength`, `computeTimeMs` cho từng enemy

***

## Các màn hình

| Màn hình | Route | Mô tả |
|---|---|---|
| Main Menu | `/` | Chọn difficulty, chọn AI mode (AI tự chọn algo theo wave hay player chọn cố định), Start |
| Game | `/game` | Canvas full-viewport + HUD overlay + debug panel |
| Pause | Overlay trong `/game` | Resume, Restart, về Main Menu |
| Game Over | Overlay trong `/game` | Score, wave đạt được, Replay |
| Win | Overlay trong `/game` | Khi player thoát qua Exit |

***

## Thứ tự build (cho AI agent)

### Phase 1 — Core DSA (không có UI)
1. Viết `types.ts` — toàn bộ interface và enum
2. Viết `graph.ts` — grid graph, weighted neighbors
3. Viết `maze-generator.ts` — DFS Recursive Backtracker, test output JSON
4. Viết `bfs.ts`, `dijkstra.ts`, `astar.ts`, `dfs.ts` — mỗi file return `{ path, visited, computeMs }`
5. Viết `dsu.ts` — union-find với path compression, `isConnected(src, dst)`
6. Unit test tất cả trong Vitest trước khi tiếp tục

### Phase 2 — Game Core
7. Viết `player.ts` và `enemy.ts` — state, update logic
8. Viết `game-loop.ts` — requestAnimationFrame, fixed timestep 60fps
9. Viết `input-handler.ts` — keyboard event → action enum
10. Viết `wave-manager.ts` — spawn logic

### Phase 3 — Renderer
11. Viết `renderer.ts` — vẽ grid, fog, entities lên Canvas
12. Thêm path overlay và debug info vào renderer

### Phase 4 — SvelteKit UI
13. Tạo `GameCanvas.svelte` — bind canvas, gọi game-loop
14. Tạo `HUD.svelte`, `AlgorithmPanel.svelte` dùng Svelte stores
15. Tạo `MainMenu.svelte`, `GameOverScreen.svelte`
16. Route `/` và `/game`, setup `adapter-static`

### Phase 5 — Polish & Integration
17. Fog of war render
18. Power Crystal pickup + flee behavior
19. Wall Bomb + DSU connectivity check
20. Score system, wave progression
21. Debug overlay toggle

***

## Ràng buộc kỹ thuật quan trọng

- Game logic **hoàn toàn tách khỏi SvelteKit** — tất cả nằm trong `src/lib/`, không import Svelte bên trong `core/`, `algorithms/`, `entities/`, `systems/`
- Canvas render chạy trong `requestAnimationFrame` — **không dùng Svelte reactivity để update game state trong loop**
- Svelte stores chỉ dùng để truyền dữ liệu từ game-loop ra HUD (one-way: game → UI)
- Mỗi thuật toán phải trả về đủ `visited[]` để debug overlay hoạt động — không được tối ưu bỏ thông tin này
- DSU phải chạy trước khi accept wall placement — không async
- `adapter-static` build ra thư mục `build/` — chạy được bằng `npx serve build`