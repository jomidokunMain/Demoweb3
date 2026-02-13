// ---- Example data (replace with your real time-series arrays) ----
// You can load from JSON/CSV later; this is just a working skeleton.
const t = Array.from({ length: 300 }, (_, i) => i * 0.1);

const plotSeries = {
  hip: {
    title: "Hip Flexion Angle",
    y1: t.map((x) => 2 * Math.sin(x / 2) + (x > 10 ? (x - 10) * 8 : 0)),
    y2: t.map((x) => 2 * Math.cos(x / 2) + (x > 10 ? (x - 10) * 8 : 0)),
    name1: "hip_flexion_r",
    name2: "hip_flexion_l",
  },
  knee: {
    title: "Knee Flexion Angle",
    y1: t.map((x) => 8 * Math.sin(x / 3) + (x > 12 ? (x - 12) * 3 : 0)),
    y2: t.map((x) => 6 * Math.cos(x / 3) + (x > 12 ? (x - 12) * 3 : 0)),
    name1: "knee_flexion_r",
    name2: "knee_flexion_l",
  },
  l5s1: {
    title: "L5/S1 Moment (Nm)",
    y1: t.map((x) => 20 + 10 * Math.sin(x / 2) + (x > 9 ? 40 : 0)),
    y2: t.map((x) => 18 + 12 * Math.cos(x / 2) + (x > 9 ? 40 : 0)),
    name1: "moment_l5s1_r",
    name2: "moment_l5s1_l",
  },
};

function renderPlot(key) {
  const s = plotSeries[key];
  const data = [
    { x: t, y: s.y1, type: "scatter", mode: "lines", name: s.name1 },
    { x: t, y: s.y2, type: "scatter", mode: "lines", name: s.name2 },
  ];

  const layout = {
    title: { text: s.title, font: { size: 16 } },
    margin: { l: 55, r: 15, t: 45, b: 45 },
    xaxis: { title: "time (s)" },
    yaxis: { title: "value" },
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)",
    font: { color: "#e8eef6" },
  };

  const config = { displayModeBar: true, responsive: true };
  Plotly.react("plotArea", data, layout, config);
}

// Button wiring
document.addEventListener("DOMContentLoaded", () => {
  renderPlot("hip");

  const buttons = document.querySelectorAll(".plot-btn");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      renderPlot(btn.dataset.plot);
    });
  });
});
