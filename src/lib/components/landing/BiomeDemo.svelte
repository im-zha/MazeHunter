<!-- BiomeDemo.svelte — Paginated object tutorial for each biome -->
<script lang="ts">
  import type { BiomeId } from "$lib/core/types.js";

  interface Props {
    biomeId: BiomeId;
    color: string;
    onClose: () => void;
  }
  let { biomeId, color, onClose }: Props = $props();

  // ── Page definitions per biome ─────────────────────────────────────────────
  interface DemoPage {
    title: string;
    subtitle: string;
    desc: string;
    tip: string;
    tileType: "stealth" | "stealth_vine" | "toxic_moss" | "hardlight_bridge" | "conveyor_up" | "deep_coolant" | "frozen_floor" | "ventilation_shaft" | "volatile" | "melted_slag" | "scorched_glass" | "elevator" | "aoe" | "shuffle";
    animKey: string; // for CSS animation
  }

  const pages: Record<Exclude<BiomeId, "shuffle"> | "shuffle", DemoPage[]> = {
    data_jungle: [
      {
        title: "STEALTH NODE",
        subtitle: "Biome Gimmick · STEALTH_NODE",
        desc: "Ô Stealth Node phát sáng xanh lá. Đứng bên trong sẽ chặn 70% tầm phát hiện của kẻ thù — viền đứt gạch của ô sẽ sáng lên khi bạn đang được che.",
        tip: "⚡ Tốt nhất khi bạn bị bao vây — mua thời gian để chạy thoát.",
        tileType: "stealth",
        animKey: "",
      },
      {
        title: "STEALTH VINES",
        subtitle: "Terrain · MUD (Data Jungle)",
        desc: "Vùng dây leo rậm rạp phát sáng xanh neon. Di chuyển qua đây sẽ bị chậm 50% — cứ mỗi bước hợp lệ lại bị chặn một bước. Cả kẻ thù cũng bị ảnh hưởng.",
        tip: "⚡ Dùng Stealth Vines để chặn đường truy đuổi — kẻ thù bị chậm ngang bạn.",
        tileType: "stealth_vine",
        animKey: "",
      },
      {
        title: "TOXIC MOSS",
        subtitle: "Terrain · ICE (Data Jungle)",
        desc: "Rêu độc màu xanh lá trơn trượt. Khi di chuyển lên ô này, bạn tiếp tục trượt theo hướng đó cho đến khi va tường. Không thể dừng giữa chừng.",
        tip: "⚠️ Tránh trượt vào góc cụt — bạn sẽ bị kẹt và kẻ thù sẽ bắt kịp.",
        tileType: "toxic_moss",
        animKey: "",
      },
      {
        title: "HARDLIGHT BRIDGE",
        subtitle: "Entity · Ladder (Data Jungle)",
        desc: "Cầu ánh sáng neon xanh lá nối 2 ô Floor qua tường. Bước lên đầu cầu để di chuyển đến đầu bên kia ngay lập tức. Cả người chơi lẫn kẻ thù đều dùng được.",
        tip: "⚡ Hardlight Bridge thường tạo ra shortcut quan trọng — hãy nhớ vị trí của chúng.",
        tileType: "hardlight_bridge",
        animKey: "",
      },
      {
        title: "CYBER-SPORE BLOOM",
        subtitle: "Tactical AoE · 10s interval",
        desc: "Cứ 10 giây, một vụ nổ bào tử xuất hiện tại ô ngẫu nhiên. Vùng 3×3 nhấp nháy cảnh báo 3 giây. Nếu dính: fog radius thu hẹp xuống 1 trong 4 giây.",
        tip: "⚠️ Quan sát vùng nhấp nháy xanh lá và thoát ngay khỏi vùng 3×3.",
        tileType: "aoe",
        animKey: "",
      },
    ],
    cooling_sea: [
      {
        title: "DATA STREAM",
        subtitle: "Biome Gimmick · CONVEYOR",
        desc: "Băng chuyền dữ liệu có hướng (↑ ↓ ← →). Di chuyển cùng chiều mũi tên: tốc độ ×2. Di chuyển ngược chiều: tốc độ ×0.5. Áp dụng cho cả kẻ thù.",
        tip: "⚡ Dẫn kẻ thù vào stream ngược chiều — chúng sẽ bị chậm lại đáng kể.",
        tileType: "conveyor_up",
        animKey: "",
      },
      {
        title: "DEEP COOLANT",
        subtitle: "Terrain · MUD (Cooling Sea)",
        desc: "Vũng nước làm mát sâu màu xanh đậm. Di chuyển qua đây bị chậm 50% — cứ mỗi bước hợp lệ lại bị chặn một bước. Gợn sóng xanh lam nhấp nháy theo chu kỳ.",
        tip: "⚡ Kết hợp Deep Coolant + Data Stream để tạo bẫy cho kẻ thù.",
        tileType: "deep_coolant",
        animKey: "",
      },
      {
        title: "FROZEN FLOOR",
        subtitle: "Terrain · ICE (Cooling Sea)",
        desc: "Sàn băng màu trắng xanh với các vết nứt phát sáng cyan. Khi di chuyển lên ô này, bạn trượt thẳng không dừng được cho đến khi gặp tường.",
        tip: "⚠️ Frozen Floor gần Data Stream rất nguy hiểm — bạn có thể trượt ra khỏi đường thoát.",
        tileType: "frozen_floor",
        animKey: "",
      },
      {
        title: "VENTILATION SHAFT",
        subtitle: "Entity · Ladder (Cooling Sea)",
        desc: "Ống thông gió bằng thép màu xanh thép nối 2 ô Floor qua tường. Bước lên đầu ống để di chuyển đến đầu bên kia. Ổn định hơn Thermal Elevator — không bao giờ sập.",
        tip: "⚡ Ventilation Shaft là escape route an toàn nhất — luôn ưu tiên dùng khi bị dồn vào góc.",
        tileType: "ventilation_shaft",
        animKey: "",
      },
      {
        title: "CRYO-GEYSER",
        subtitle: "Tactical AoE · 10s interval",
        desc: "Cứ 10 giây, mạch phun băng xuất hiện tại ô ngẫu nhiên. Vùng 3×3 nhấp nháy cảnh báo 3 giây. Nếu dính: bị đóng băng hoàn toàn 3 giây — không thể di chuyển.",
        tip: "⚠️ Cryo-Geyser đóng băng CẢ kẻ thù — chờ chúng dính rồi chạy thoát.",
        tileType: "aoe",
        animKey: "",
      },
    ],
    lava_core: [
      {
        title: "VOLATILE SECTOR",
        subtitle: "Biome Gimmick · VOLATILE",
        desc: "Ô sàn không ổn định nhấp nháy cam đỏ, phát nổ mỗi 5 giây. Đứng trên đó khi nổ: chết ngay lập tức. Kẻ thù đứng trên đó cũng bị tiêu diệt.",
        tip: "⚡ Dụ kẻ thù đứng trên Volatile rồi bỏ chạy — chờ đếm ngược nổ!",
        tileType: "volatile",
        animKey: "",
      },
      {
        title: "MELTED SLAG",
        subtitle: "Terrain · MUD (Lava Core)",
        desc: "Vũng dung nham sệt màu đỏ nâu với các vết nứt phát sáng. Di chuyển qua đây bị chậm 50%. Cứ mỗi 5 giây, vùng slag có thể bùng phát — đứng trên đó khi bùng phát sẽ chết.",
        tip: "⚠️ Melted Slag kết hợp với Volatile Sector tạo ra vùng chết hàng loạt — hãy cẩn thận.",
        tileType: "melted_slag",
        animKey: "",
      },
      {
        title: "SCORCHED GLASS",
        subtitle: "Terrain · ICE (Lava Core)",
        desc: "Kính nứt do nhiệt độ cao, màu cam đỏ với các đường nứt phát sáng. Khi di chuyển lên đây, bạn trượt thẳng không dừng được — và có thể trượt thẳng vào ô Volatile.",
        tip: "⚠️ Scorched Glass + Volatile Sector = nguy hiểm nhất — luôn kiểm tra hướng trước khi trượt.",
        tileType: "scorched_glass",
        animKey: "",
      },
      {
        title: "THERMAL ELEVATOR",
        subtitle: "Entity · Ladder (Lava Core)",
        desc: "Thang sắt nung đỏ nối 2 ô qua tường. Khác các biome khác: thang có thể sập sau khi dùng và cần 5 giây tái tạo. Thang sập hiển thị màu đỏ nhấp nháy.",
        tip: "⚡ Đừng phụ thuộc vào một thang duy nhất — kẻ thù có thể chặn đường tái tạo.",
        tileType: "elevator",
        animKey: "",
      },
      {
        title: "VOLATILE ERUPTION",
        subtitle: "Tactical AoE · 10s interval",
        desc: "Cứ 10 giây, phun trào dung nham xuất hiện tại ô ngẫu nhiên. Vùng 3×3 nhấp nháy cảnh báo 3 giây. Nếu dính: chết ngay lập tức — nguy hiểm hơn mọi AoE khác.",
        tip: "⚠️ Volatile Eruption + Volatile Sector đồng thời = cực kỳ nguy hiểm. Luôn di chuyển.",
        tileType: "aoe",
        animKey: "",
      },
    ],
    shuffle: [
      {
        title: "SHUFFLE PROTOCOL",
        subtitle: "Randomised Biome · Every Round",
        desc: "Mỗi round, game tự động chọn ngẫu nhiên một trong 3 biome: Data Jungle, Cooling Sea, hoặc Lava Core. Bạn sẽ không biết trước biome nào xuất hiện.",
        tip: "⚡ Phải thành thạo cả 3 biome để sinh tồn trong Shuffle Protocol.",
        tileType: "shuffle",
        animKey: "",
      },
    ],
  };

  let currentPage = $state(0);

  const currentPages = $derived(
    biomeId === "shuffle" ? pages.shuffle : pages[biomeId as Exclude<BiomeId, "shuffle">]
  );
  const page = $derived(currentPages[currentPage]);
  const isLast = $derived(currentPage >= currentPages.length - 1);

  function next() {
    if (!isLast) currentPage++;
  }

  $effect(() => {
    // reset page when biome changes
    biomeId;
    currentPage = 0;
  });
</script>

<!-- ── Demo Panel ──────────────────────────────────────────────────────────── -->
<div class="demo-panel" style="--demo-color: {color}">
  <!-- Header -->
  <div class="demo-header">
    <span class="demo-eyebrow">SECTOR BRIEF · PAGE {currentPage + 1}/{currentPages.length}</span>
    <button class="demo-close" onclick={onClose} aria-label="Close demo">[ESC] ✕</button>
  </div>

  <!-- Tile preview + content -->
  <div class="demo-body">
    <!-- Animated tile preview -->
    <div class="tile-preview-wrap">
      <div class="tile-preview">
        {#if page.tileType === "stealth"}
          <!-- Floor #0a1f14 + pulsing primaryColor fill + dashed border -->
          <svg viewBox="0 0 32 32" class="tile-svg">
            <rect width="32" height="32" fill="#0a1f14"/>
            <rect x="0.5" y="0.5" width="31" height="31" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="0.5"/>
            <rect x="2" y="2" width="28" height="28" fill="#4edea3" class="stealth-fill"/>
            <rect x="1" y="1" width="30" height="30" fill="none" stroke="#4edea3" stroke-width="1" stroke-dasharray="3 3" class="stealth-border"/>
          </svg>
        {:else if page.tileType === "conveyor_up"}
          <!-- Floor #051828 + #003d5c overlay + cyan arrow -->
          <svg viewBox="0 0 32 32" class="tile-svg">
            <rect width="32" height="32" fill="#051828"/>
            <rect x="1" y="1" width="30" height="30" fill="#003d5c" class="conveyor-fill"/>
            <line x1="16" y1="26" x2="16" y2="8" stroke="#00ffff" stroke-width="2" class="conveyor-glow"/>
            <polygon points="16,6 11,14 21,14" fill="#00ffff" class="conveyor-glow"/>
            <line x1="10" y1="20" x2="10" y2="12" stroke="#00ffff" stroke-width="1" opacity="0.4"/>
            <line x1="22" y1="20" x2="22" y2="12" stroke="#00ffff" stroke-width="1" opacity="0.4"/>
          </svg>
        {:else if page.tileType === "conveyor_down"}
          <svg viewBox="0 0 32 32" class="tile-svg">
            <rect width="32" height="32" fill="#051828"/>
            <rect x="1" y="1" width="30" height="30" fill="#003d5c" class="conveyor-fill"/>
            <line x1="16" y1="6" x2="16" y2="24" stroke="#00ffff" stroke-width="2" class="conveyor-glow"/>
            <polygon points="16,26 11,18 21,18" fill="#00ffff" class="conveyor-glow"/>
            <line x1="10" y1="12" x2="10" y2="20" stroke="#00ffff" stroke-width="1" opacity="0.4"/>
            <line x1="22" y1="12" x2="22" y2="20" stroke="#00ffff" stroke-width="1" opacity="0.4"/>
          </svg>
        {:else if page.tileType === "volatile"}
          <!-- Floor #1c0800 + #4a0e00 + radial orange glow + "!" -->
          <svg viewBox="0 0 32 32" class="tile-svg volatile-svg">
            <rect width="32" height="32" fill="#1c0800"/>
            <rect x="2" y="2" width="28" height="28" fill="#4a0e00" class="volatile-fill"/>
            <radialGradient id="vgrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#ff7818" stop-opacity="0.58"/>
              <stop offset="48%" stop-color="#ff2a00" stop-opacity="0.34"/>
              <stop offset="100%" stop-color="#ff0040" stop-opacity="0"/>
            </radialGradient>
            <rect width="32" height="32" fill="url(#vgrad)"/>
            <text x="16" y="22" text-anchor="middle" font-size="18" font-weight="bold" fill="#ff9100" class="volatile-excl"
              style="filter:drop-shadow(0 0 4px #ff4500)">!</text>
          </svg>
        {:else if page.tileType === "elevator"}
          <!-- Thermal Elevator: rails #5a1a08, rungs #ff6b35, glow nodes #ff9100 -->
          <svg viewBox="0 0 32 32" class="tile-svg elevator-svg">
            <rect width="32" height="32" fill="#1c0800"/>
            <!-- Left rail -->
            <line x1="9" y1="4" x2="9" y2="28" stroke="#5a1a08" stroke-width="3" stroke-linecap="round"/>
            <!-- Right rail -->
            <line x1="23" y1="4" x2="23" y2="28" stroke="#5a1a08" stroke-width="3" stroke-linecap="round"/>
            <!-- Rungs -->
            <line x1="9" y1="8"  x2="23" y2="8"  stroke="#ff6b35" stroke-width="2" stroke-linecap="round" style="filter:drop-shadow(0 0 3px #ff9100)"/>
            <line x1="9" y1="16" x2="23" y2="16" stroke="#ff6b35" stroke-width="2" stroke-linecap="round" style="filter:drop-shadow(0 0 3px #ff9100)"/>
            <line x1="9" y1="24" x2="23" y2="24" stroke="#ff6b35" stroke-width="2" stroke-linecap="round" style="filter:drop-shadow(0 0 3px #ff9100)"/>
            <!-- Glow nodes -->
            <circle cx="9"  cy="4"  r="3" fill="#ff9100" style="filter:drop-shadow(0 0 4px #ff9100)"/>
            <circle cx="23" cy="4"  r="3" fill="#ff9100" style="filter:drop-shadow(0 0 4px #ff9100)"/>
            <circle cx="9"  cy="28" r="3" fill="#fff0c0" style="filter:drop-shadow(0 0 4px #ff9100)"/>
            <circle cx="23" cy="28" r="3" fill="#fff0c0" style="filter:drop-shadow(0 0 4px #ff9100)"/>
          </svg>
        {:else if page.tileType === "crystal"}
          <!-- CRYSTAL: #1e2d4a floor + pink diamond #f72585 -->
          <svg viewBox="0 0 32 32" class="tile-svg crystal-svg">
            <rect width="32" height="32" fill="#1e2d4a"/>
            <polygon points="16,4 25,16 16,28 7,16" fill="#f72585"
              style="filter:drop-shadow(0 0 6px #f72585)"/>
            <polygon points="16,8 22,16 16,24 10,16" fill="#ff6eb4" opacity="0.5"/>
          </svg>
        {:else if page.tileType === "aoe"}
          <!-- 3×3 AoE warning grid with center cell highlighted -->
          <svg viewBox="0 0 32 32" class="tile-svg">
            <rect width="32" height="32" fill="#0a0a0a"/>
            {#each [0,1,2] as row}
              {#each [0,1,2] as col}
                <rect
                  x={col*10+1} y={row*10+1} width="9" height="9"
                  fill={row===1&&col===1 ? 'var(--demo-color)' : 'transparent'}
                  stroke="var(--demo-color)"
                  stroke-width="0.8"
                  opacity={row===1&&col===1 ? 0.9 : 0.45}
                  class="aoe-cell-svg"
                  style="animation-delay:{(row*3+col)*0.09}s"
                />
              {/each}
            {/each}
          </svg>
        {:else if page.tileType === "stealth_vine"}
          <!-- MUD data_jungle: #0b2415 + #39ff14 wavy vines -->
          <svg viewBox="0 0 32 32" class="tile-svg">
            <rect width="32" height="32" fill="#0b2415"/>
            <rect x="1" y="1" width="30" height="30" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="0.5"/>
            <path d="M8,2 C12,10 4,18 8,30" fill="none" stroke="#39ff14" stroke-width="1" class="vine-glow"/>
            <path d="M16,2 C20,10 12,18 16,30" fill="none" stroke="#39ff14" stroke-width="1" class="vine-glow"/>
            <path d="M24,2 C28,10 20,18 24,30" fill="none" stroke="#39ff14" stroke-width="1" class="vine-glow"/>
          </svg>
        {:else if page.tileType === "toxic_moss"}
          <!-- ICE data_jungle: #0a2a12 + green ellipse + shine -->
          <svg viewBox="0 0 32 32" class="tile-svg">
            <rect width="32" height="32" fill="#0a2a12"/>
            <ellipse cx="13" cy="18" rx="9" ry="6" fill="rgba(80,210,80,0.55)" transform="rotate(0.3,13,18)"/>
            <rect x="3" y="4" width="9" height="2" fill="rgba(180,255,160,0.55)" rx="1"/>
            <rect x="3" y="4" width="9" height="2" fill="rgba(180,255,160,0.55)" rx="1"/>
          </svg>
        {:else if page.tileType === "hardlight_bridge"}
          <!-- LADDER data_jungle: rails #1a4a20, rungs #39ff14, nodes #39ff14 -->
          <svg viewBox="0 0 32 32" class="tile-svg">
            <rect width="32" height="32" fill="#0a1f14"/>
            <line x1="9" y1="4" x2="9" y2="28" stroke="#1a4a20" stroke-width="3" stroke-linecap="round"/>
            <line x1="23" y1="4" x2="23" y2="28" stroke="#1a4a20" stroke-width="3" stroke-linecap="round"/>
            <line x1="9" y1="8"  x2="23" y2="8"  stroke="#39ff14" stroke-width="2" stroke-linecap="round" style="filter:drop-shadow(0 0 3px #39ff14)"/>
            <line x1="9" y1="16" x2="23" y2="16" stroke="#39ff14" stroke-width="2" stroke-linecap="round" style="filter:drop-shadow(0 0 3px #39ff14)"/>
            <line x1="9" y1="24" x2="23" y2="24" stroke="#39ff14" stroke-width="2" stroke-linecap="round" style="filter:drop-shadow(0 0 3px #39ff14)"/>
            <circle cx="9"  cy="4"  r="3" fill="#39ff14" style="filter:drop-shadow(0 0 4px #39ff14)"/>
            <circle cx="23" cy="4"  r="3" fill="#39ff14" style="filter:drop-shadow(0 0 4px #39ff14)"/>
            <circle cx="9"  cy="28" r="3" fill="#b0ffb0" style="filter:drop-shadow(0 0 4px #39ff14)"/>
            <circle cx="23" cy="28" r="3" fill="#b0ffb0" style="filter:drop-shadow(0 0 4px #39ff14)"/>
          </svg>
        {:else if page.tileType === "deep_coolant"}
          <!-- MUD cooling_sea: #001e3d + blue ripple ellipse -->
          <svg viewBox="0 0 32 32" class="tile-svg">
            <rect width="32" height="32" fill="#001e3d"/>
            <ellipse cx="16" cy="19" rx="10" ry="5" fill="rgba(0,140,220,0.6)" class="ripple-anim"/>
            <ellipse cx="16" cy="19" rx="6" ry="2.5" fill="rgba(0,180,255,0.3)" class="ripple-anim" style="animation-delay:0.4s"/>
          </svg>
        {:else if page.tileType === "frozen_floor"}
          <!-- ICE cooling_sea: #d6f0f8 + #00e5ff crack lines + white shine -->
          <svg viewBox="0 0 32 32" class="tile-svg">
            <rect width="32" height="32" fill="#d6f0f8"/>
            <line x1="3"  y1="10" x2="22" y2="22" stroke="#00e5ff" stroke-width="0.7" style="filter:drop-shadow(0 0 2px #00e5ff)"/>
            <line x1="16" y1="3"  x2="10" y2="29" stroke="#00e5ff" stroke-width="0.7" style="filter:drop-shadow(0 0 2px #00e5ff)"/>
            <rect x="3" y="3" width="9" height="2" fill="rgba(255,255,255,0.65)" rx="1"/>
          </svg>
        {:else if page.tileType === "ventilation_shaft"}
          <!-- LADDER cooling_sea: rails #1e3a4a, rungs #7ecdf5, glow #00e5ff -->
          <svg viewBox="0 0 32 32" class="tile-svg">
            <rect width="32" height="32" fill="#051828"/>
            <line x1="9" y1="4" x2="9" y2="28" stroke="#1e3a4a" stroke-width="3" stroke-linecap="round"/>
            <line x1="23" y1="4" x2="23" y2="28" stroke="#1e3a4a" stroke-width="3" stroke-linecap="round"/>
            <line x1="9" y1="8"  x2="23" y2="8"  stroke="#7ecdf5" stroke-width="2" stroke-linecap="round"/>
            <line x1="9" y1="16" x2="23" y2="16" stroke="#7ecdf5" stroke-width="2" stroke-linecap="round"/>
            <line x1="9" y1="24" x2="23" y2="24" stroke="#7ecdf5" stroke-width="2" stroke-linecap="round"/>
            <circle cx="9"  cy="4"  r="3" fill="#00e5ff" style="filter:drop-shadow(0 0 4px #00e5ff)"/>
            <circle cx="23" cy="4"  r="3" fill="#00e5ff" style="filter:drop-shadow(0 0 4px #00e5ff)"/>
            <circle cx="9"  cy="28" r="3" fill="#e0f8ff" style="filter:drop-shadow(0 0 4px #00e5ff)"/>
            <circle cx="23" cy="28" r="3" fill="#e0f8ff" style="filter:drop-shadow(0 0 4px #00e5ff)"/>
          </svg>
        {:else if page.tileType === "melted_slag"}
          <!-- MUD lava_core: #7a1e00 + #ff4500 crack lines -->
          <svg viewBox="0 0 32 32" class="tile-svg volatile-svg">
            <rect width="32" height="32" fill="#7a1e00"/>
            <rect x="2" y="2" width="28" height="28" fill="#5c1400" class="volatile-fill"/>
            <line x1="6"  y1="16" x2="16" y2="8"  stroke="#ff4500" stroke-width="0.8" style="filter:drop-shadow(0 0 2px #ff4500)"/>
            <line x1="16" y1="8"  x2="26" y2="16" stroke="#ff4500" stroke-width="0.8" style="filter:drop-shadow(0 0 2px #ff4500)"/>
            <line x1="16" y1="16" x2="16" y2="27" stroke="#ff4500" stroke-width="0.8" style="filter:drop-shadow(0 0 2px #ff4500)"/>
          </svg>
        {:else if page.tileType === "scorched_glass"}
          <!-- ICE lava_core: rgba(190,65,0,0.55) + #ff7700 crack lines -->
          <svg viewBox="0 0 32 32" class="tile-svg">
            <rect width="32" height="32" fill="#3a1200"/>
            <rect x="1" y="1" width="30" height="30" fill="rgba(190,65,0,0.55)"/>
            <line x1="4"  y1="4"  x2="28" y2="28" stroke="#ff7700" stroke-width="1" style="filter:drop-shadow(0 0 3px #ff7700)"/>
            <line x1="16" y1="2"  x2="10" y2="30" stroke="#ff7700" stroke-width="0.7" style="filter:drop-shadow(0 0 2px #ff7700)"/>
            <line x1="2"  y1="18" x2="30" y2="12" stroke="#ff5500" stroke-width="0.5"/>
          </svg>
        {:else if page.tileType === "shuffle"}
          <svg viewBox="0 0 32 32" class="tile-svg shuffle-svg">
            <rect width="32" height="32" fill="#111"/>
            <path d="M16,16 L16,2 A14,14 0 0,1 28.1,23z" fill="#4edea3" opacity="0.85"/>
            <path d="M16,16 L28.1,23 A14,14 0 0,1 3.9,23z" fill="#00ffff" opacity="0.85"/>
            <path d="M16,16 L3.9,23 A14,14 0 0,1 16,2z" fill="#ff4500" opacity="0.85"/>
            <circle cx="16" cy="16" r="5" fill="#111"/>
            <text x="16" y="20" text-anchor="middle" font-size="7" fill="#b82ff7" font-weight="900">?</text>
          </svg>
        {/if}
      </div>

      <!-- Page dots -->
      <div class="page-dots">
        {#each currentPages as _, i}
          <button
            class="dot {i === currentPage ? 'dot--active' : ''}"
            onclick={() => (currentPage = i)}
            aria-label="Go to page {i + 1}"
          ></button>
        {/each}
      </div>
    </div>

    <!-- Text content -->
    <div class="demo-content">
      <p class="demo-subtitle">{page.subtitle}</p>
      <h4 class="demo-title">{page.title}</h4>
      <p class="demo-desc">{page.desc}</p>
      <div class="demo-tip">{page.tip}</div>
    </div>
  </div>

  <!-- Footer buttons -->
  <div class="demo-footer">
    {#if !isLast}
      <button class="btn-next" onclick={next} id="demo-next-btn">
        NEXT <span class="btn-arrow">→</span>
      </button>
    {:else}
      <button class="btn-ok" onclick={onClose} id="demo-ok-btn">
        ✓ GOT IT
      </button>
    {/if}
  </div>
</div>

<style>
  /* ── Panel shell ────────────────────────────────────────────────────────── */
  .demo-panel {
    background: rgba(6, 7, 10, 0.98);
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-top: 2px solid var(--demo-color);
    box-shadow:
      0 0 40px rgba(0, 0, 0, 0.8),
      0 0 20px color-mix(in srgb, var(--demo-color) 15%, transparent);
    animation: demo-in 0.2s cubic-bezier(0.22, 1, 0.36, 1) both;
    width: 100%;
  }

  @keyframes demo-in {
    from { opacity: 0; transform: translateY(-8px) scale(0.98); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  /* ── Header ─────────────────────────────────────────────────────────────── */
  .demo-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 16px 8px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }

  .demo-eyebrow {
    font-family: "Outfit", sans-serif;
    font-size: 8px;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--demo-color);
    font-weight: 900;
  }

  .demo-close {
    font-family: "Outfit", sans-serif;
    font-size: 9px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.3);
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 2px 0;
    transition: color 0.2s;
  }
  .demo-close:hover { color: #fff; }

  /* ── Body ───────────────────────────────────────────────────────────────── */
  .demo-body {
    display: grid;
    grid-template-columns: 110px 1fr;
    gap: 14px;
    padding: 14px 16px;
    align-items: start;
  }

  /* ── Tile preview ───────────────────────────────────────────────────────── */
  .tile-preview-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  .tile-preview {
    width: 88px;
    height: 88px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
    outline: 1px solid color-mix(in srgb, var(--demo-color) 25%, transparent);
  }

  /* ── SVG tile base ──────────────────────────────────────────────────────── */
  .tile-svg {
    width: 80px;
    height: 80px;
    display: block;
    image-rendering: pixelated;
  }

  /* Stealth Node — pulsing fill + dashed border */
  .stealth-fill { animation: stealth-alpha 2s ease-in-out infinite; }
  @keyframes stealth-alpha {
    0%, 100% { opacity: 0.35; }
    50%       { opacity: 0.65; }
  }
  .stealth-border { animation: stealth-alpha 2s ease-in-out infinite; }

  /* Conveyor — fill blink */
  .conveyor-fill { animation: conveyor-blink 1.5s ease-in-out infinite; }
  @keyframes conveyor-blink {
    0%, 100% { opacity: 0.6; }
    50%       { opacity: 1;   }
  }
  .conveyor-glow { filter: drop-shadow(0 0 3px #00ffff); }

  /* Volatile — orange glow pulse */
  .volatile-svg { animation: volatile-glow 1s ease-in-out infinite; }
  @keyframes volatile-glow {
    0%, 100% { filter: drop-shadow(0 0 4px #ff4500); }
    50%       { filter: drop-shadow(0 0 10px #ff6600); }
  }
  .volatile-fill { animation: volatile-alpha 1s ease-in-out infinite; }
  @keyframes volatile-alpha {
    0%, 100% { opacity: 0.55; }
    50%       { opacity: 1;   }
  }
  .volatile-excl { animation: volatile-alpha 1s ease-in-out infinite; }

  /* Stealth Vine — neon green glow pulse */
  .vine-glow {
    filter: drop-shadow(0 0 2px #39ff14);
    animation: vine-pulse 2s ease-in-out infinite;
  }
  @keyframes vine-pulse {
    0%, 100% { opacity: 0.6; filter: drop-shadow(0 0 2px #39ff14); }
    50%       { opacity: 1;   filter: drop-shadow(0 0 5px #39ff14); }
  }

  /* Deep Coolant — ripple scale */
  .ripple-anim { animation: ripple-scale 2s ease-in-out infinite; }
  @keyframes ripple-scale {
    0%, 100% { transform: scale(1);    opacity: 0.7; }
    50%       { transform: scale(1.12); opacity: 1;   }
  }

  /* Elevator — shake */
  .elevator-svg { animation: elev-shake 3s ease-in-out infinite; }
  @keyframes elev-shake {
    0%, 84%, 100% { transform: translateX(0); }
    86% { transform: translateX(-2px); }
    88% { transform: translateX(2px); }
    90% { transform: translateX(-1px); }
    92% { transform: translateX(0); }
  }

  /* Crystal — spin */
  .crystal-svg { animation: crystal-rot 3s linear infinite; }
  @keyframes crystal-rot {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }

  /* AoE cell — staggered blink */
  .aoe-cell-svg { animation: aoe-blink 1.2s ease-in-out infinite; }
  @keyframes aoe-blink {
    0%, 100% { opacity: 0.3; }
    50%       { opacity: 1;   }
  }

  /* Shuffle — slow spin */
  .shuffle-svg { animation: shuffle-rot 4s linear infinite; }
  @keyframes shuffle-rot {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }

  /* ── Page dots ──────────────────────────────────────────────────────────── */
  .page-dots {
    display: flex;
    gap: 5px;
    justify-content: center;
  }

  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    border: none;
    cursor: pointer;
    padding: 0;
    transition: background 0.2s, transform 0.2s;
  }
  .dot--active {
    background: var(--demo-color);
    transform: scale(1.3);
    box-shadow: 0 0 6px var(--demo-color);
  }

  /* ── Text content ───────────────────────────────────────────────────────── */
  .demo-content {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .demo-subtitle {
    font-family: "Outfit", sans-serif;
    font-size: 8px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--demo-color);
    font-weight: 900;
    margin: 0;
  }

  .demo-title {
    font-family: "Outfit", sans-serif;
    font-size: 15px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #fff;
    margin: 0;
    line-height: 1.1;
  }

  .demo-desc {
    font-family: "Outfit", sans-serif;
    font-size: 11px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.62);
    line-height: 1.55;
    margin: 2px 0 0;
  }

  .demo-tip {
    font-family: "Outfit", sans-serif;
    font-size: 10px;
    font-weight: 700;
    color: var(--demo-color);
    background: color-mix(in srgb, var(--demo-color) 8%, transparent);
    border-left: 2px solid var(--demo-color);
    padding: 5px 8px;
    line-height: 1.4;
    margin-top: 2px;
  }

  /* ── Footer ─────────────────────────────────────────────────────────────── */
  .demo-footer {
    padding: 8px 16px 12px;
    display: flex;
    justify-content: flex-end;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
  }

  .btn-next,
  .btn-ok {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 20px;
    font-family: "Outfit", sans-serif;
    font-size: 11px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    cursor: pointer;
    border: none;
    transition: filter 0.2s, transform 0.15s;
  }

  .btn-next {
    background: var(--demo-color);
    color: #000;
  }

  .btn-ok {
    background: transparent;
    color: var(--demo-color);
    border: 1px solid var(--demo-color);
  }

  .btn-next:hover,
  .btn-ok:hover {
    filter: brightness(1.15);
    transform: translateY(-1px);
  }

  .btn-arrow {
    font-size: 14px;
    transition: transform 0.2s;
  }
  .btn-next:hover .btn-arrow { transform: translateX(3px); }
</style>
