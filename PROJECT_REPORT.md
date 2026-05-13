# Maze Hunter - Project Report

## 1. Mô Tả Chung

**Maze Hunter** là một trò chơi sinh tồn trong mê cung, nơi người chơi phải tìm đường đến cổng thoát hiểm trước khi hết thời gian, đồng thời né tránh hoặc xử lý các kẻ địch được điều khiển bằng nhiều thuật toán tìm kiếm đường đi khác nhau.

Trò chơi kết hợp giữa yếu tố hành động thời gian thực, quản lý tài nguyên, cơ chế bản đồ thay đổi theo từng vòng chơi và trực quan hóa các thuật toán nền tảng trong môn Cấu trúc dữ liệu và Giải thuật. Người chơi không chỉ di chuyển trong mê cung mà còn phải quan sát môi trường, tận dụng vật phẩm, đặt bom phá tường, đối phó với sương mù chiến tranh và thích nghi với từng loại bản đồ.

### Mục Tiêu Của Người Chơi

Người chơi bắt đầu mỗi vòng trong một mê cung mới. Mục tiêu chính là:

- Tìm đường đến ô **EXIT** để hoàn thành vòng chơi.
- Tránh va chạm với kẻ địch.
- Thu thập vật phẩm hỗ trợ để tăng khả năng sống sót.
- Sử dụng **Wall Bombs** để phá tường và mở đường tắt.
- Hoàn thành càng nhiều vòng càng tốt để đạt điểm cao.
- Ghi điểm vào bảng xếp hạng sau khi kết thúc lượt chơi.

### Thể Loại Và Trải Nghiệm

Maze Hunter thuộc nhóm game:

- Maze survival.
- Real-time action.
- Algorithm-driven enemy AI.
- Procedural map generation.
- Score attack / leaderboard.

Trò chơi được thiết kế để vừa có tính giải trí, vừa thể hiện rõ cách các thuật toán tìm đường vận hành trong môi trường lưới. Mỗi loại địch có cách ra quyết định khác nhau, khiến người chơi phải thay đổi chiến thuật thay vì chỉ chạy theo một đường cố định.

### Công Nghệ Sử Dụng

Project được xây dựng bằng các công nghệ chính:

| Thành phần | Công nghệ / Vai trò |
| --- | --- |
| Frontend framework | SvelteKit |
| Ngôn ngữ chính | TypeScript |
| Giao diện | Svelte components, Tailwind-style utility classes, CSS custom properties |
| Render game | HTML Canvas |
| State management | Svelte stores và `GameState` nội bộ |
| Game loop | `requestAnimationFrame` kết hợp fixed-step update |
| Cơ sở dữ liệu | SQLite thông qua `better-sqlite3` |
| Server routes | SvelteKit API routes |

### Kiến Trúc Tổng Quan

Project được chia thành nhiều lớp rõ ràng để tách biệt giao diện, logic game, thuật toán và dữ liệu:

```text
src/
  lib/
    algorithms/       Các thuật toán BFS, DFS, Dijkstra, A*, DSU
    components/       HUD, canvas, menu, modal hướng dẫn, landing page
    core/             Kiểu dữ liệu, graph helpers, maze generator, map themes
    entities/         Player, Enemy và hành vi thực thể
    server/           SQLite database và thao tác server-side
    stores/           Game state, settings, audio, player stores
    systems/          Game loop, renderer, wave manager, event manager
  routes/
    +page.svelte      Landing page
    game/+page.svelte Màn hình chơi chính
    api/              API cho player, score, leaderboard
```

Kiến trúc này giúp project dễ mở rộng. Khi muốn thêm map mới, enemy mới hoặc thuật toán mới, phần lớn thay đổi có thể được đặt vào các module tương ứng mà không cần viết lại toàn bộ trò chơi.

---

## 2. Các Cơ Chế Nổi Bật Của Trò Chơi

### 2.1. Sinh Mê Cung Tự Động

Mỗi vòng chơi tạo ra một mê cung mới thay vì dùng bản đồ cố định. Điều này giúp mỗi lượt chơi có trải nghiệm khác nhau và buộc người chơi phải quan sát lại bản đồ từ đầu.

Mê cung được sinh dựa trên ý tưởng **DFS Recursive Backtracker**:

- Bắt đầu từ một ô hợp lệ trong lưới.
- Chọn ngẫu nhiên một hướng chưa thăm.
- Đục tường để nối hai vùng.
- Tiếp tục đi sâu cho đến khi không còn hướng hợp lệ.
- Quay lui để tìm nhánh khác.

Cách sinh này tạo ra các đường hầm liên thông, có cảm giác giống mê cung cổ điển và bảo đảm người chơi có thể di chuyển qua bản đồ.

### 2.2. Hệ Thống Vòng Chơi

Maze Hunter được chia thành nhiều vòng. Sau mỗi vòng:

- Mê cung mới được tạo.
- Độ khó tăng dần.
- Thời gian giới hạn có thể giảm.
- Số lượng và loại kẻ địch thay đổi.
- Bản đồ có thể chuyển sang biome khác.

Các vòng đầu giúp người chơi làm quen với cơ chế cơ bản. Từ các vòng sau, trò chơi đưa thêm nhiều enemy và sự kiện môi trường để tạo áp lực.

### 2.3. Giới Hạn Thời Gian

Mỗi vòng có một bộ đếm thời gian. Người chơi phải tìm được EXIT trước khi hết giờ. Nếu không, người chơi mất mạng hoặc kết thúc lượt chơi tùy trạng thái hiện tại.

Cơ chế này tạo nhịp chơi căng thẳng:

- Người chơi không thể đứng yên quá lâu.
- Các quyết định như đi đường vòng, phá tường hoặc nhặt vật phẩm đều có chi phí thời gian.
- Những vòng sau có thời gian ít hơn, khiến việc tối ưu đường đi quan trọng hơn.

### 2.4. Fog of War

Bản đồ không luôn hiển thị hoàn toàn. Cơ chế **Fog of War** giới hạn vùng nhìn thấy quanh người chơi.

Tác dụng của Fog of War:

- Tăng cảm giác khám phá.
- Buộc người chơi phải ghi nhớ đường đi.
- Làm cho vị trí enemy trở nên khó đoán hơn.
- Khiến các thuật toán của enemy trở nên đáng sợ hơn vì chúng có thể tiếp cận từ vùng chưa quan sát.

Một số sự kiện hoặc object trong map có thể làm vùng nhìn bị thu hẹp tạm thời.

### 2.5. Wall Bombs

Người chơi có thể dùng **Wall Bombs** để phá tường gần vị trí hiện tại.

Vai trò của Wall Bombs:

- Tạo đường tắt đến EXIT.
- Thoát khỏi tình huống bị enemy ép góc.
- Mở ra tuyến di chuyển mới.
- Giúp người chơi chủ động thay đổi cấu trúc mê cung.

Số lượng bom có giới hạn, vì vậy đây là tài nguyên chiến thuật. Người chơi cần quyết định khi nào nên tiết kiệm và khi nào nên dùng để sống sót.

### 2.6. Hệ Thống Vật Phẩm

Game có các vật phẩm hỗ trợ xuất hiện trong mê cung:

| Vật phẩm | Công dụng |
| --- | --- |
| Power Crystal | Tăng sức mạnh tạm thời, giúp người chơi xử lý enemy trong thời gian ngắn |
| Freeze Clock | Làm chậm hoặc đóng băng enemy tạm thời |
| Bomb Pickup | Tăng số lượng Wall Bombs, tối đa theo giới hạn của game |

Vật phẩm làm cho gameplay có thêm chiều sâu. Người chơi phải cân nhắc giữa việc đi thẳng đến EXIT hay rẽ hướng để nhặt tài nguyên.

### 2.7. Enemy AI Theo Thuật Toán

Một điểm nổi bật của Maze Hunter là mỗi loại enemy sử dụng một chiến lược tìm đường khác nhau. Điều này làm cho hành vi enemy không giống nhau.

| Enemy | Thuật toán chính | Đặc điểm |
| --- | --- | --- |
| Ghost | BFS | Tìm đường ngắn nhất theo số bước trên lưới không trọng số |
| Heavy | Dijkstra | Tính đến chi phí địa hình, di chuyển nặng nhưng bền bỉ |
| Hunter | A* | Truy đuổi hiệu quả bằng heuristic hướng về người chơi |
| Shadow | DFS | Di chuyển khó đoán, có xu hướng đi sâu theo nhánh |

Nhờ sự khác biệt này, người chơi phải đọc tình huống:

- Ghost gây áp lực ổn định.
- Heavy nguy hiểm trong bản đồ có nhiều chi phí địa hình.
- Hunter thường tiếp cận nhanh và thông minh hơn.
- Shadow khó đoán vì đường đi không luôn tối ưu.

### 2.8. Enemy Traits

Ngoài thuật toán, enemy còn có thể có các trait để thay đổi hành vi:

- **FAST**: di chuyển nhanh hơn.
- **HEAVY**: khó bị ảnh hưởng bởi một số hiệu ứng.
- **HUNTER**: ưu tiên truy đuổi người chơi quyết liệt hơn.
- **SCOUT**: có khả năng kiểm soát không gian tốt hơn.
- **BURROWER**: có thể tương tác đặc biệt với một số địa hình.
- **CLIMBER**: thích nghi tốt hơn với các tuyến di chuyển đặc biệt.
- **ELITE**: phiên bản mạnh hơn enemy thường.
- **BOSS**: enemy cấp cao, gây áp lực lớn trong các vòng khó.

Sự kết hợp giữa thuật toán và trait giúp enemy có nhiều biến thể mà không cần viết lại hoàn toàn AI.

### 2.9. Biome Và Object Riêng Của Từng Map

Game có nhiều chủ đề bản đồ khác nhau. Mỗi biome có object, địa hình và sự kiện riêng.

#### Data Jungle

Data Jungle có phong cách rừng dữ liệu, tập trung vào nhiễu tầm nhìn và các vùng ảnh hưởng.

Các object nổi bật:

- **Stealth Node**: làm nhiễu quan sát, khiến vùng nhìn của người chơi bị hạn chế.
- **Stealth Vines**: vùng di chuyển chậm, làm người chơi mất nhịp nếu đi qua.
- **Toxic Moss**: địa hình nguy hiểm hoặc gây hiệu ứng bất lợi.
- **Hardlight Bridge**: tuyến đi đặc biệt có thể mở đường qua khu vực khó.
- **Cyber-Spore Bloom**: sự kiện diện rộng, cảnh báo trước khi phát nổ hoặc gây hiệu ứng trên vùng 3x3.

#### Cooling Sea

Cooling Sea tạo cảm giác nhà máy làm mát hoặc vùng biển dữ liệu lạnh, tập trung vào trượt, dòng chảy và đóng băng.

Các object nổi bật:

- **Data Stream**: dòng chảy có thể đẩy hướng di chuyển.
- **Deep Coolant**: vùng làm chậm hoặc gây bất lợi.
- **Frozen Floor**: nền trơn khiến việc điều khiển khó hơn.
- **Ventilation Shaft**: tuyến di chuyển đặc biệt.
- **Cryo-Geyser**: sự kiện đóng băng khu vực hoặc enemy/người chơi trong phạm vi ảnh hưởng.

#### Lava Core

Lava Core là biome nguy hiểm nhất, tập trung vào nhiệt, nổ và địa hình không ổn định.

Các object nổi bật:

- **Volatile Sector**: khu vực có thể phát nổ theo chu kỳ.
- **Melted Slag**: địa hình chậm hoặc nguy hiểm.
- **Scorched Glass**: vùng có tính chất đặc biệt về di chuyển/tầm nhìn.
- **Thermal Elevator**: object có thể thay đổi trạng thái, sập hoặc tái tạo.
- **Volatile Eruption**: sự kiện diện rộng có thể gây chết người nếu đứng sai vị trí.

### 2.10. Session Log Thời Gian Thực

HUD trong game có phần **Session Log** ghi lại các sự kiện theo thời gian thực khi người chơi đang chơi.

Các sự kiện có thể được ghi lại:

- Bắt đầu vòng mới.
- Nhặt vật phẩm.
- Đặt bom hoặc phá tường.
- Kích hoạt sự kiện map.
- Enemy bị xử lý.
- Người chơi mất mạng.
- Hoàn thành vòng.
- Game over.

Log này giúp người chơi theo dõi lại diễn biến trận đấu và làm cho HUD giống một hệ thống tác chiến trong thời gian thực.

### 2.11. Debug Overlay

Game có chế độ debug để quan sát thông tin thuật toán:

- Đường đi enemy đang chọn.
- Các ô đã được thuật toán thăm.
- Thống kê số node xử lý.
- Hành vi hiện tại của enemy.

Đây là phần quan trọng để chứng minh các thuật toán đang được áp dụng trong game thật, không chỉ mô tả lý thuyết.

### 2.12. Leaderboard

Sau khi kết thúc lượt chơi, điểm số có thể được lưu vào hệ thống leaderboard.

Leaderboard giúp:

- Tạo động lực chơi lại.
- So sánh kết quả giữa nhiều người chơi.
- Lưu thông tin điểm cao bằng cơ sở dữ liệu SQLite.

---

## 3. Các Cấu Trúc Dữ Liệu Và Giải Thuật Đã Sử Dụng

### 3.1. Grid 2D

Bản đồ game được biểu diễn bằng ma trận hai chiều.

Mỗi ô trong ma trận là một `CellType`, ví dụ:

- `FLOOR`: ô có thể đi.
- `WALL`: tường.
- `EXIT`: cổng thoát.
- `MUD`: địa hình chậm.
- `ICE`: địa hình trơn hoặc đặc biệt.
- `CRACK`: ô nứt/nguy hiểm.
- `LADDER`: tuyến di chuyển đặc biệt.

Biểu diễn bằng grid giúp việc kiểm tra va chạm, tìm đường, sinh mê cung và render canvas trở nên trực tiếp.

### 3.2. Position Object

Vị trí của player, enemy, item và object thường được biểu diễn bằng cặp tọa độ:

```ts
type Pos = {
  x: number;
  y: number;
};
```

Cấu trúc này đơn giản nhưng rất quan trọng vì hầu hết thuật toán tìm đường đều hoạt động trên tọa độ lưới.

### 3.3. Graph Ẩn Trên Grid

Mặc dù bản đồ được lưu dưới dạng ma trận, khi chạy thuật toán nó được xem như một đồ thị:

- Mỗi ô đi được là một đỉnh.
- Mỗi bước di chuyển giữa hai ô kề nhau là một cạnh.
- Một số địa hình có trọng số khác nhau.

Các helper trong phần core graph chịu trách nhiệm:

- Tìm neighbor hợp lệ.
- Kiểm tra ô có thể đi qua.
- Tính chi phí di chuyển.
- Tính khoảng cách Manhattan.
- Xử lý các cạnh đặc biệt như ladder.

### 3.4. Queue Cho BFS

Thuật toán BFS sử dụng hàng đợi để duyệt các ô theo từng lớp khoảng cách.

Ứng dụng trong game:

- Enemy Ghost tìm đường ngắn nhất theo số bước.
- Có thể dùng để kiểm tra vùng liên thông.
- Phù hợp khi mọi bước di chuyển có chi phí bằng nhau.

Độ phức tạp:

- Thời gian: `O(V + E)`
- Bộ nhớ: `O(V)`

Trong đó `V` là số ô hợp lệ và `E` là số cạnh giữa các ô.

### 3.5. Stack Và Đệ Quy Cho DFS

DFS được sử dụng ở hai nơi chính:

- Sinh mê cung bằng recursive backtracker.
- Enemy Shadow di chuyển theo phong cách đi sâu, khó đoán.

DFS đi sâu theo một nhánh trước khi quay lui, vì vậy nó phù hợp để tạo mê cung có các hành lang dài và nhiều nhánh rẽ.

Độ phức tạp:

- Thời gian: `O(V + E)`
- Bộ nhớ: `O(V)` trong trường hợp xấu nhất.

### 3.6. Priority Queue Cho Dijkstra

Dijkstra được dùng để tìm đường ngắn nhất trên đồ thị có trọng số không âm.

Ứng dụng trong game:

- Enemy Heavy tính đến chi phí địa hình.
- Các ô như bùn, băng hoặc địa hình đặc biệt có thể khiến đường ngắn về số bước không còn là đường rẻ nhất.

Ý nghĩa gameplay:

- Heavy không chỉ chọn đường ít ô nhất.
- Enemy có thể chọn đường vòng nếu tổng chi phí thấp hơn.
- Bản đồ có trọng số trở nên có ý nghĩa thật sự.

Độ phức tạp thường gặp:

- Với priority queue: `O((V + E) log V)`

### 3.7. A* Search

A* là thuật toán tìm đường kết hợp:

- Chi phí đã đi từ điểm bắt đầu.
- Heuristic ước lượng khoảng cách đến đích.

Trong Maze Hunter, heuristic phù hợp nhất là khoảng cách Manhattan:

```text
h = abs(x1 - x2) + abs(y1 - y2)
```

Ứng dụng trong game:

- Enemy Hunter truy đuổi người chơi hiệu quả.
- Giảm số node cần duyệt so với Dijkstra trong nhiều tình huống.
- Tạo cảm giác enemy thông minh và định hướng rõ ràng.

Độ phức tạp:

- Trường hợp xấu nhất có thể tương đương Dijkstra.
- Trong thực tế thường nhanh hơn khi heuristic tốt.

### 3.8. Disjoint Set Union

DSU, còn gọi là Union-Find, được dùng để quản lý các tập hợp rời nhau.

Các thao tác chính:

- `find`: tìm đại diện của một tập.
- `union`: gộp hai tập.

Ứng dụng phù hợp trong project:

- Kiểm tra hoặc hỗ trợ tính liên thông của các vùng.
- Phục vụ các bước xử lý liên quan đến cấu trúc mê cung.
- Có thể mở rộng để dùng trong các thuật toán sinh maze kiểu Kruskal.

Độ phức tạp gần như hằng số với path compression và union by rank:

- Gần `O(α(n))`, với `α` là hàm Ackermann đảo.

### 3.9. Set Và Map

Các thuật toán tìm đường cần theo dõi:

- Ô đã thăm.
- Ô đang chờ xử lý.
- Quan hệ cha-con để dựng lại đường đi.
- Chi phí tốt nhất đã biết.

Các cấu trúc như `Set` và `Map` giúp việc tra cứu theo tọa độ nhanh hơn. Vì tọa độ là object, project thường chuyển vị trí thành key dạng chuỗi như:

```text
"x,y"
```

Cách này giúp so sánh vị trí ổn định khi dùng trong hash map.

### 3.10. GameState

`GameState` là cấu trúc trung tâm mô tả trạng thái hiện tại của game.

Nó chứa các nhóm dữ liệu như:

- Lưới bản đồ.
- Người chơi.
- Danh sách enemy.
- Vật phẩm.
- Vòng hiện tại.
- Điểm số.
- Mạng còn lại.
- Số bom.
- Trạng thái pause/game over.
- Biome hiện tại.
- Các timed events.
- Session logs.

Cấu trúc này giúp game loop, renderer và HUD cùng đọc từ một nguồn dữ liệu thống nhất.

### 3.11. Entity List

Enemy, item, timed event và AoE event được lưu theo danh sách.

Mỗi frame, game loop duyệt các danh sách này để:

- Cập nhật vị trí enemy.
- Kiểm tra va chạm.
- Xử lý thời gian còn lại của hiệu ứng.
- Render object lên canvas.
- Xóa các object đã hết hiệu lực.

Đây là mô hình phổ biến trong game 2D vì đơn giản, dễ kiểm soát và đủ hiệu quả với quy mô bản đồ của project.

### 3.12. Game Loop

Game loop điều khiển toàn bộ tiến trình trận đấu.

Luồng xử lý chính:

1. Nhận input từ người chơi.
2. Cập nhật vị trí player.
3. Cập nhật enemy bằng thuật toán tương ứng.
4. Xử lý item, bomb, timed event và AoE.
5. Kiểm tra điều kiện thắng/thua.
6. Cập nhật HUD và session log.
7. Render lại canvas.

Việc tách update và render giúp game dễ bảo trì hơn. Logic trò chơi không bị trộn trực tiếp vào phần vẽ giao diện.

### 3.13. SQLite Leaderboard

Leaderboard sử dụng SQLite để lưu dữ liệu điểm số.

Các dữ liệu thường gồm:

- Tên người chơi.
- Điểm số.
- Vòng cao nhất đạt được.
- Thời gian hoặc ngày ghi điểm.

SQLite phù hợp với project vì:

- Nhẹ.
- Dễ cài đặt.
- Không cần server database riêng.
- Đủ tốt cho leaderboard cục bộ hoặc demo học thuật.

---

## 4. Kết Quả Đạt Được

### 4.1. Hoàn Thành Một Trò Chơi Có Thể Chơi Được

Project đã xây dựng được một game hoàn chỉnh với:

- Màn hình landing page.
- Main menu.
- Màn hình chơi chính.
- HUD trong game.
- Hướng dẫn chơi.
- Game over screen.
- Leaderboard.
- Nhiều vòng chơi tăng dần độ khó.

Người chơi có thể bắt đầu game, chơi qua nhiều vòng, mất mạng, ghi điểm và xem kết quả.

### 4.2. Tích Hợp Giải Thuật Vào Gameplay Thật

Các thuật toán không chỉ được viết riêng lẻ mà được dùng trực tiếp trong hành vi game:

- BFS điều khiển enemy tìm đường ngắn nhất.
- Dijkstra xử lý enemy trong môi trường có trọng số.
- A* tạo enemy truy đuổi hiệu quả.
- DFS dùng trong sinh mê cung và hành vi enemy đặc biệt.
- DSU hỗ trợ tư duy xử lý liên thông.

Điều này giúp project thể hiện rõ mối liên hệ giữa lý thuyết thuật toán và ứng dụng thực tế.

### 4.3. Tạo Được Gameplay Có Chiều Sâu

Maze Hunter không chỉ là trò chơi tìm đường đơn giản. Game có nhiều lớp cơ chế:

- Fog of War.
- Wall Bombs.
- Powerups.
- Enemy AI khác nhau.
- Timed events.
- Biome riêng.
- Object riêng của từng map.
- Session log theo thời gian thực.

Những cơ chế này khiến mỗi vòng chơi có nhiều lựa chọn chiến thuật.

### 4.4. Hệ Thống Map Đa Dạng

Ba nhóm biome chính tạo ra sự khác biệt rõ ràng:

- Data Jungle thiên về nhiễu tầm nhìn và kiểm soát vùng.
- Cooling Sea thiên về trượt, dòng chảy và đóng băng.
- Lava Core thiên về nổ, nhiệt và địa hình nguy hiểm.

Điều này giúp trò chơi không bị lặp lại sau vài vòng đầu.

### 4.5. Giao Diện Có Tính Hoàn Thiện

Project có giao diện tương đối đầy đủ:

- Landing page giới thiệu game.
- Main menu với các lựa chọn rõ ràng.
- Field Manual / How to Play.
- HUD hiển thị trạng thái trận đấu.
- Session log giúp theo dõi sự kiện.
- Settings cho âm thanh và visual.

Các thành phần giao diện được chia thành component riêng, giúp dễ chỉnh sửa và mở rộng.

### 4.6. Có Khả Năng Mở Rộng

Kiến trúc hiện tại cho phép mở rộng thêm:

- Enemy mới.
- Thuật toán mới.
- Biome mới.
- Vật phẩm mới.
- Object map mới.
- Chế độ chơi mới.
- Thành tích hoặc nhiệm vụ phụ.

Ví dụ, nếu muốn thêm enemy dùng thuật toán Greedy Best-First Search, chỉ cần bổ sung thuật toán vào thư mục `algorithms`, thêm loại enemy tương ứng và kết nối vào hệ thống update enemy.

### 4.7. Giá Trị Học Tập

Project thể hiện được nhiều nội dung quan trọng của môn học:

- Biểu diễn bản đồ bằng ma trận.
- Chuyển grid thành graph.
- Duyệt đồ thị bằng BFS và DFS.
- Tìm đường có trọng số bằng Dijkstra.
- Tối ưu tìm đường bằng A*.
- Quản lý tập hợp bằng DSU.
- Thiết kế state cho ứng dụng tương tác.
- Tổ chức code theo module.
- Kết hợp frontend, game loop và cơ sở dữ liệu.

Nhờ đó, Maze Hunter vừa là sản phẩm game, vừa là minh họa trực quan cho các kiến thức cấu trúc dữ liệu và giải thuật.

---

## 5. Tổng Kết

Maze Hunter là một project game mê cung có định hướng rõ ràng: biến các thuật toán tìm đường và cấu trúc dữ liệu thành trải nghiệm chơi trực tiếp. Người chơi nhìn thấy tác động của thuật toán thông qua cách enemy truy đuổi, cách mê cung được sinh ra, cách địa hình ảnh hưởng đến đường đi và cách các sự kiện bản đồ thay đổi chiến thuật.

Kết quả đạt được là một game có thể chơi được, có nhiều cơ chế nổi bật, có giao diện hoàn chỉnh, có leaderboard và có nền tảng kỹ thuật đủ tốt để tiếp tục mở rộng. Project phù hợp để trình bày trong bối cảnh học thuật vì nó kết nối tốt giữa lý thuyết giải thuật và sản phẩm thực tế.
