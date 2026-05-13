# Maze Hunter Field Manual

Tai lieu huong dan tac chien, gameplay va tong quan ky thuat cho du an Maze Hunter.

## 1. Tong quan nhiem vu

Maze Hunter la game sinh ton trong me cung. Nguoi choi bat dau o diem xuat phat, phai tim duong den cong thoat trong thoi gian gioi han, dong thoi tranh cac ke dich duoc dieu khien bang thuat toan tim duong tren do thi.

Muc tieu chinh:

- Di chuyen qua me cung va cham den EXIT de qua wave.
- Tranh bi ke dich cham vao nguoi. Moi lan bi bat se mat 1 mang.
- Thu thap vat pham de tao loi the tam thoi.
- Dung Wall Bomb de pha tuong khi bi chan duong.
- Dat diem cao va luu ket qua len leaderboard.

## 2. Cach khoi dong

Yeu cau: Node.js va npm.

```bash
npm install
npm run dev
```

Mo duong dan Vite hien trong terminal, thuong la:

```text
http://localhost:5173
```

Cac lenh khac:

```bash
npm run check
npm run build
npm run preview
```

## 3. Dieu khien

| Hanh dong | Ban phim | Mobile |
|---|---|---|
| Di chuyen len | `W` hoac `ArrowUp` | Vuot len |
| Di chuyen xuong | `S` hoac `ArrowDown` | Vuot xuong |
| Di chuyen trai | `A` hoac `ArrowLeft` | Vuot trai |
| Di chuyen phai | `D` hoac `ArrowRight` | Vuot phai |
| Dung Wall Bomb | `Space` | Cham man hinh |
| Tuong tac / dung ladder | `E` hoac `Enter` | Theo tinh huong |
| Tam dung / tiep tuc | `Esc` hoac `P` | Nut Pause |
| Bat/tat debug overlay | `F1` | Khong co nut rieng |

Luu y: trong ban hien tai, phim `D` la di chuyen sang phai; debug overlay dung `F1`.

## 4. HUD va thong tin tren man hinh

HUD hien cac thong tin quan trong trong khi choi:

- Score: tong diem hien tai.
- Wave/Round: muc hien tai cua lan choi.
- Lives: so mang con lai.
- Wall Bombs: so bom pha tuong con lai, toi da 5.
- Power Crystal timer: thoi gian hieu luc cua crystal.
- Freeze timer: thoi gian dong bang ke dich.
- Event log: thong bao su kien map, ke dich va power-up.

Neu game dang o trang thai paused, nguoi choi co the resume, restart, xem huong dan, hoac ve menu chinh.

## 5. Luat chien dau va sinh ton

### Movement

Nguoi choi di chuyen theo tung o tren grid. Moi phim hop le tuong ung mot buoc. Neu o tiep theo la tuong, nhan vat khong di chuyen.

### Fog of War

Tam nhin mac dinh co ban kinh 4 o. Khi Power Crystal dang kich hoat, tam nhin tang len 6 o. Mot so hieu ung cua biome co the lam tam nhin giam manh trong thoi gian ngan.

### Lives

Neu ke dich cham vao nguoi choi, nguoi choi mat 1 mang va round duoc khoi phuc vi tri. Khi lives ve 0, game chuyen sang Game Over.

### Time Limit

Moi wave co gioi han thoi gian:

| Wave | Thoi gian |
|---|---:|
| 1 | 90 giay |
| 2 | 75 giay |
| 3 | 60 giay |
| 4+ | Giam dan, toi thieu 30 giay |

Neu het gio truoc khi den EXIT, nguoi choi mat mang.

## 6. Vat pham

| Vat pham | Tac dung |
|---|---|
| Power Crystal | Kich hoat trong 12 giay, tang tam nhin len 6 va bien nguoi choi thanh moi nguy hiem voi ke dich. |
| Freeze Clock | Dong bang toan bo ke dich trong 8 giay. |
| Bomb Pickup | Tang them 1 Wall Bomb, toi da 5. |

Khi co Power Crystal, cham vao ke dich co the tieu diet ke dich va cong diem.

## 7. Wall Bomb

Wall Bomb duoc dung bang `Space` hoac tap tren mobile. Bom se pha tuong o huong gan voi nguoi choi de tao duong moi. So bom ban dau thay doi theo round:

| Round | Bomb ban dau |
|---|---:|
| 1 | 3 |
| 2 | 2 |
| 3 | 1 |
| 4+ | 3 |

Trong thiet ke ban dau, DSU/Union-Find duoc dung de kiem tra tinh lien thong khi thay doi tuong. Trong ban hien tai, Wall Bomb chu yeu duoc dung de pha tuong va mo loi thoat khi bi ket.

## 8. Dia hinh

| Dia hinh | Tac dong |
|---|---|
| FLOOR | O di chuyen binh thuong. |
| WALL | Chan duong. Can bom hoac su kien map de mo. |
| MUD | Lam cham di chuyen 50%. Cu moi buoc hop le thi buoc tiep theo co the bi chan. |
| ICE | Truot lien tuc theo huong dang di cho den khi gap vat can. |
| EXIT | Den day de hoan thanh wave. |
| CRACK | O nguy hiem, co the sap sau khi su dung. |
| LADDER | Cau noi/duong tat giua hai vung san, dung `E` hoac `Enter` de tuong tac. |

## 9. Biome

Nguoi choi chon biome truoc khi bat dau. Neu chon Shuffle, moi round se chon ngau nhien mot biome.

### Data Jungle

Mau chu dao xanh la. Thien ve an minh va gay nhieu hieu ung tam nhin.

- Stealth Node: dung ben trong de giam 70% kha nang phat hien cua ke dich.
- Stealth Vines: bien the MUD, lam cham nguoi choi va ke dich.
- Toxic Moss: bien the ICE, gay truot khong dung giua chung.
- Hardlight Bridge: ladder dang cau anh sang.
- Cyber-Spore Bloom: AoE 3x3 moi 10 giay, canh bao 3 giay; neu dinh se giam fog radius xuong 1 trong 4 giay.

### Cooling Sea

Mau chu dao cyan. Tap trung vao dong chay, bang va dong bang.

- Data Stream: conveyor co huong. Di cung huong nhanh gap 2, di nguoc huong cham 0.5 lan.
- Deep Coolant: bien the MUD, lam cham 50%.
- Frozen Floor: bien the ICE, gay truot thang.
- Ventilation Shaft: ladder on dinh, dung lam loi thoat an toan.
- Cryo-Geyser: AoE 3x3 moi 10 giay, canh bao 3 giay; co the dong bang doi tuong trong vung.

### Lava Core

Mau chu dao cam do. Nguy hiem cao, nhieu o co the gay chet tuc thi.

- Volatile Sector: no theo chu ky 5 giay; dung tren do khi no se chet.
- Melted Slag: bien the MUD, lam cham va co the bung phat.
- Scorched Glass: bien the ICE, de truot vao vung nguy hiem.
- Thermal Elevator: ladder co the sap va can thoi gian tai tao.
- Volatile Eruption: AoE 3x3 moi 10 giay, canh bao 3 giay; dinh phai co the chet ngay.

## 10. Ke dich va thuat toan

Moi ke dich co mot thuat toan tim duong rieng. Dieu nay la phan DSA chinh cua du an.

| Ke dich | Thuat toan | Dac diem |
|---|---|---|
| Ghost | BFS | Tim duong ngan nhat tren do thi khong trong so. On dinh, de doan. |
| Heavy | Dijkstra | Xet chi phi dia hinh, phu hop voi map co trong so nhu MUD/ICE. Cham hon nhung ben bi. |
| Hunter | A* | Dung heuristic Manhattan de truy duoi nhanh va thong minh. Thuong tinh lai duong lien tuc. |
| Shadow | DFS | Di chuyen kho doan hon, khong luon toi uu duong ngan nhat. |

Trait co the thay doi hanh vi:

- FAST: di chuyen nhanh hon.
- HEAVY: cham hon, it bi anh huong boi mot so dia hinh.
- HUNTER: uu tien truy duoi, tinh lai duong thuong xuyen.
- SCOUT: linh hoat, nhanh hon co ban.
- BURROWER: di qua MUD tot hon.
- CLIMBER: tan dung ladder tot hon, nhung bat loi tren ICE.
- ELITE/BOSS: bien the manh trong cac round cao.

## 11. Wave va do kho

Game tang ap luc theo wave:

| Wave/Round | Noi dung chinh |
|---|---|
| Round 1 | Gioi thieu co che co ban, co Ghost BFS va Heavy Dijkstra. |
| Round 2 | Them Hunter A* va Shadow DFS, xuat hien ladder va su kien mo duong. |
| Round 3 | Them elite/boss, giam tai nguyen, enemy nhanh va nguy hiem hon. |
| Wave cao hon | Map lon hon, enemy co the duoc bo sung them, thoi gian giam dan. |

Difficulty anh huong toc do va roster:

- Easy: ke dich cham hon, qua trinh tang do kho nhe hon.
- Normal: can bang.
- Hard: vao game da co ap luc cao, ke dich nhanh hon va roster nang hon.

## 12. Cham diem va leaderboard

Diem den tu:

- Hoan thanh wave: `wave * 100`.
- Bonus thoi gian con lai: moi giay con lai duoc cong them 10 diem.
- Tieu diet ke dich khi co Power Crystal: cong diem.
- Nhat Bomb Pickup khi da day bom: cong diem thuong.

Khi ket thuc game, ket qua duoc gui den API `/api/scores` va luu bang SQLite. Leaderboard xep theo score giam dan, sau do wave cao hon va thoi diem tao ban ghi.

## 13. Debug overlay

Nhan `F1` de bat/tat debug overlay. Overlay dung de quan sat cach thuat toan hoat dong:

- Cac o da duoc expand/visited trong lan tim duong gan nhat.
- Duong di hien tai cua enemy.
- Thong so thuat toan nhu so node da mo rong, do dai path va thoi gian tinh toan.

Day la cong cu tot de demo phan DSA khi thuyet trinh.

## 14. Kien truc du an

```text
src/
  routes/
    +page.svelte                 Menu / landing
    game/+page.svelte            Man hinh choi
    leaderboard/+page.svelte     Bang xep hang
    api/                         API players, scores, leaderboard
  lib/
    algorithms/                  BFS, DFS, Dijkstra, A*, DSU
    core/                        Types, graph, maze generator, map themes
    entities/                    Player va enemy state/update
    systems/                     Game loop, input, renderer, wave, events
    stores/                      Game state, settings, session config
    components/                  Canvas, HUD, menu, overlays
```

Luon tach logic game khoi UI:

- `core/`, `algorithms/`, `entities/`, `systems/` khong phu thuoc vao Svelte UI.
- Canvas render bang `requestAnimationFrame`.
- Svelte stores chi dung de day state ra HUD va cac man hinh.
- API server dung `better-sqlite3` de luu nguoi choi va diem.

## 15. Luong game loop

1. Tao maze moi cho wave hien tai.
2. Tao player, enemy, pickups, hazards va timed events.
3. Doc input tu keyboard/touch.
4. Cap nhat player, power-up, dia hinh va event.
5. Enemy tinh lai path neu can va di chuyen theo cache.
6. Kiem tra va cham, EXIT, het gio, mat mang hoac ket thuc game.
7. Render grid, fog, entity, HUD va overlay len Canvas.

## 16. Cac thuat toan noi bat

### Maze Generation

Me cung duoc sinh bang DFS Recursive Backtracker. Thuat toan bat dau tu o xuat phat, dao tuong giua cac o chua tham va dam bao me cung co tinh lien thong.

### BFS

Dung queue de tim duong ngan nhat trong do thi khong trong so. Phu hop cho Ghost.

### Dijkstra

Dung chi phi tich luy nho nhat, xu ly tot terrain co trong so. Phu hop cho Heavy.

### A*

Ket hop chi phi da di va heuristic Manhattan den muc tieu. Phu hop cho Hunter vi can truy duoi hieu qua.

### DFS

Di sau theo nhanh, tao hanh vi kho doan. Phu hop cho Shadow.

### DSU

Union-Find duoc dat trong `src/lib/algorithms/dsu.ts`, dung de kiem tra tinh lien thong khi thay doi cau truc map.

## 17. Chien thuat goi y

- Dung Power Crystal de dao nguoc the truy duoi, nhung dung lang phi khi enemy o xa.
- Tren Cooling Sea, co gang dan enemy di nguoc chieu conveyor.
- Tren Lava Core, uu tien quan sat o Volatile truoc khi truot tren ICE.
- Tren Data Jungle, dung Stealth Node de cat duoi Hunter/A*.
- Giu lai it nhat 1 Wall Bomb cho luc bi khoa trong ngo cut.
- Khi debug overlay bat, quan sat path cua Hunter de hoc cach cat goc va dung ladder.

## 18. Noi dung co the demo khi bao cao

- Maze sinh ngau nhien nhung van co duong tu start den exit.
- Enemy dung 4 thuat toan do thi khac nhau.
- Terrain co trong so anh huong Dijkstra va movement.
- Fog of war va power-up thay doi chien thuat.
- Wave system tang enemy, toc do, event va giam tai nguyen.
- Leaderboard luu score bang SQLite qua API SvelteKit.
