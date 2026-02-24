/* posemech-demo.js
 *
 * Requirements:
 * - Plotly loaded in HTML:
 *   <script src="https://cdn.plot.ly/plotly-2.30.0.min.js"></script>
 *
 * HTML expectations:
 * - Videos:
 *   <video id="vid2d" ...></video>
 *   <video id="vid3d" ...></video>
 *   <video id="vidScene" ...></video>
 *
 * - Plot container:
 *   <div id="plotArea"></div>
 *
 * - Plot buttons (examples):
 *   <button class="plot-btn active"
 *     data-sto="static/sto/Hip_Flexion.sto"
 *     data-cols="hip_flexion_r,hip_flexion_l">Hip Flexion</button>
 *
 * Notes:
 * - This script expects your .sto files to be served over http(s).
 *   If you open the HTML as file://, fetch() may fail.
 *   Run: python3 -m http.server 8000
 */


const PLOT_TIME_OFFSET = 0.0;

// Optional: per-video offsets (if they are not perfectly aligned)
const VIDEO_OFFSETS = {
  vid2d: 0.0,
  vid3d: 0.0,
  vidScene: 0.0
};
(function () {
  "use strict";

  // ------------------------------
  // STO parsing + loading
  // ------------------------------
  function parseSTO(text) {
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith("#"));

    let startIdx = 0;
    const eh = lines.findIndex((l) => l.toLowerCase() === "endheader");
    if (eh !== -1) startIdx = eh + 1;

    if (startIdx >= lines.length) {
      throw new Error("STO parse error: could not locate header/data section.");
    }

    const header = lines[startIdx].split(/\s+/);
    const rows = [];

    for (let i = startIdx + 1; i < lines.length; i++) {
      const parts = lines[i].split(/\s+/);
      if (parts.length < header.length) continue;
      const nums = parts.map((v) => Number(v));
      if (nums.some((n) => Number.isNaN(n))) continue;
      rows.push(nums);
    }

    const cols = {};
    header.forEach((name, i) => {
      cols[name] = rows.map((r) => r[i]);
    });

    const timeKey = header.includes("time") ? "time" : header[0];
    if (!cols[timeKey]) {
      throw new Error("STO parse error: time column not found.");
    }

    return { header, cols, timeKey };
  }

  async function loadSTO(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);
    const text = await res.text();
    return parseSTO(text);
  }

  // ------------------------------
  // Plot sync state
  // ------------------------------
  const syncState = {
    sto: null,
    keys: [],
    title: "",
    yLabel: "value",
    rafId: null,
    lastIdx: -1,
    // current master video element used as the plot clock:
    masterVideo: null,
    // optional time offset (if your sto time doesn't start at 0):
    timeOffset: 0.0,
  };

  // Binary search: largest index where t[idx] <= curT
  function upperBoundTime(tArr, curT) {
    let lo = 0;
    let hi = tArr.length; // exclusive
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (tArr[mid] <= curT) lo = mid + 1;
      else hi = mid;
    }
    return Math.max(0, lo - 1);
  }

  function initProgressivePlot(stoData, keys, title, yLabel) {
    const { cols, timeKey } = stoData;
    const t = cols[timeKey];

    const traces = keys.map((k) => ({
      x: [t[0]],
      y: [cols[k][0]],
      type: "scatter",
      mode: "lines",
      name: k,
    }));

    const layout = {
      title: { text: title, font: { size: 16 } },
      margin: { l: 60, r: 15, t: 45, b: 45 },
      xaxis: { title: "time (s)" },
      yaxis: { title: yLabel },
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      font: { color: "#e8eef6" },
      legend: { orientation: "h" },
    };

    Plotly.react("plotArea", traces, layout, {
      responsive: true,
      displayModeBar: true,
    });

    syncState.lastIdx = 0;
  }

  function updatePlotToTime(videoTimeSeconds) {
    if (!syncState.sto) return;

    const { cols, timeKey } = syncState.sto;
    const t = cols[timeKey];

    // Apply optional offset
    // const curT = videoTimeSeconds + (syncState.timeOffset || 0.0);
    const curT = videoTimeSeconds + PLOT_TIME_OFFSET;

    // Clamp to available range
    const clampedT = Math.max(t[0], Math.min(curT, t[t.length - 1]));

    const idx = upperBoundTime(t, clampedT);

    if (idx === syncState.lastIdx) return;
    syncState.lastIdx = idx;

    const update = {
      x: syncState.keys.map(() => t.slice(0, idx + 1)),
      y: syncState.keys.map((k) => cols[k].slice(0, idx + 1)),
    };

    Plotly.update("plotArea", update);
  }

  function startRafLoop() {
    cancelAnimationFrame(syncState.rafId);

    const loop = () => {
      const mv = syncState.masterVideo;
      if (!mv) return;

      updatePlotToTime(mv.currentTime);

      if (!mv.paused && !mv.ended) {
        syncState.rafId = requestAnimationFrame(loop);
      }
    };

    syncState.rafId = requestAnimationFrame(loop);
  }

  function stopRafLoop() {
    cancelAnimationFrame(syncState.rafId);
  }

  async function setActivePlotFromButton(btn) {
    const stoUrl = btn.dataset.sto;
    const title = (btn.textContent || "").trim() || "STO Plot";

    if (!stoUrl) {
      throw new Error("Plot button missing data-sto attribute.");
    }

    const colsWanted = (btn.dataset.cols || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const stoData = await loadSTO(stoUrl);
    const { header, cols, timeKey } = stoData;

    let keys = colsWanted.filter((k) => cols[k] !== undefined);
    if (!keys.length) {
      keys = header.filter((k) => k !== timeKey);
      if (keys.length > 6) keys = keys.slice(0, 6);
    }

    if (!keys.length) {
      throw new Error(
        "No valid columns to plot. Check data-cols or STO header."
      );
    }

    syncState.sto = stoData;
    syncState.keys = keys;
    syncState.title = title;

    initProgressivePlot(stoData, keys, title, "value");

    // Snap plot to current master video time
    if (syncState.masterVideo) {
      updatePlotToTime(syncState.masterVideo.currentTime);
      if (!syncState.masterVideo.paused && !syncState.masterVideo.ended) {
        startRafLoop();
      }
    }
  }

  // ------------------------------
  // 3-video synchronization
  // ------------------------------
  let videos = [];
  let syncLock = false;

  function getVideos() {
    return [
      document.getElementById("vid2d"),
      document.getElementById("vid3d"),
      document.getElementById("vidScene"),
    ].filter(Boolean);
  }

  function setMasterVideo(v) {
    syncState.masterVideo = v;
  }

  function syncAllTo(source) {
    const baseTime = source.currentTime;

    videos.forEach((v) => {
      if (v === source) return;

      const offset = VIDEO_OFFSETS[v.id] || 0.0;
      const targetTime = baseTime + offset;

      if (Math.abs(v.currentTime - targetTime) > 0.03) {
        v.currentTime = targetTime;
      }
    });

    // Plot uses master video time only
    updatePlotToTime(baseTime);
  }

  function playAll(source) {
    videos.forEach((v) => {
      if (v === source) return;
      if (v.paused) v.play().catch(() => {});
    });
    startRafLoop();
  }

  function pauseAll(source) {
    videos.forEach((v) => {
      if (v === source) return;
      if (!v.paused) v.pause();
    });
    stopRafLoop();
  }

  function wireVideo(v) {
    v.addEventListener("play", () => {
      if (syncLock) return;
      syncLock = true;
      setMasterVideo(v);
      syncAllTo(v);
      playAll(v);
      syncLock = false;
    });

    v.addEventListener("pause", () => {
      if (syncLock) return;
      syncLock = true;
      setMasterVideo(v);
      syncAllTo(v);
      pauseAll(v);
      syncLock = false;
    });

    v.addEventListener("seeking", () => {
      if (syncLock) return;
      syncLock = true;
      setMasterVideo(v);
      syncAllTo(v);
      syncLock = false;
    });

    v.addEventListener("timeupdate", () => {
      // Only update plot based on master video, avoids 3 competing updates
      if (syncState.masterVideo === v) {
        updatePlotToTime(v.currentTime);
      }
    });

    v.addEventListener("ended", () => {
      // If master ended, pause everything
      if (syncState.masterVideo === v) {
        pauseAll(v);
      }
    });
  }

  // ------------------------------
  // Initialize everything
  // ------------------------------
  document.addEventListener("DOMContentLoaded", async () => {
    // Videos
    videos = getVideos();
    if (videos.length) {
      setMasterVideo(videos[0]);
      videos.forEach(wireVideo);
    }

    // Plot buttons
    const buttons = document.querySelectorAll(".plot-btn");
    buttons.forEach((btn) => {
      btn.addEventListener("click", async () => {
        buttons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        try {
          await setActivePlotFromButton(btn);
          if (syncState.masterVideo) {
            updatePlotToTime(syncState.masterVideo.currentTime);
          }
        } catch (err) {
          console.error(err);
          Plotly.purge("plotArea");
          const el = document.getElementById("plotArea");
          if (el) {
            el.innerHTML = `
              <div style="padding:12px; color:#e8eef6;">
                <b>Plot load failed.</b><br/>
                ${String(err.message || err)}
              </div>`;
          }
        }
      });
    });

    // Initial plot load
    const active = document.querySelector(".plot-btn.active") || buttons[0];
    if (active) {
      try {
        await setActivePlotFromButton(active);
      } catch (err) {
        console.error(err);
      }
    }
  });
})();