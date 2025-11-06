// calculator.js - main interactive logic
import { postForm, postJSON } from "./api.js";

// --- DOM elements
const electricityEl = document.getElementById("electricity");
const fuelEl = document.getElementById("fuel");
const wasteEl = document.getElementById("waste");
const calcBtn = document.getElementById("calcBtn");
const saveBtn = document.getElementById("saveBtn");
const resultBox = document.getElementById("resultBox");
const resultAnimated = document.getElementById("resultAnimated");
const resultMsg = document.getElementById("resultMsg");
const breakdownBox = document.getElementById("breakdownBox");
const meterValue = document.getElementById("meterValue");
const meterSub = document.getElementById("meterSub");
const trendChartEl = document.getElementById("trendChart");
const btnForecast = document.getElementById("btnForecast");
const btnTips = document.getElementById("btnTips");
const tipsList = document.getElementById("tipsList");
const coinsCount = document.getElementById("coinsCount");
const scanBtn = document.getElementById("scanBtn");
const billInput = document.getElementById("billInput");
const fillDetected = document.getElementById("fillDetected");
const ocrHint = document.getElementById("ocrHint");
const hpDesc = document.getElementById("hpDesc");
const hpKg = document.getElementById("hpKg");
const addHandprint = document.getElementById("addHandprint");
const handprintMsg = document.getElementById("handprintMsg");

// quick local user id (replace with real auth)
const USER_ID = 1;

// Chart.js instance
let trendChart = null;
function buildChart(labels = [], data = []) {
  if (trendChart) trendChart.destroy();
  trendChart = new Chart(trendChartEl.getContext("2d"), {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Monthly CO₂ (kg)",
        data,
        borderWidth: 2,
        fill: true,
        backgroundColor: "rgba(43,255,153,0.06)",
        borderColor: "rgba(43,255,153,0.9)",
        tension: 0.3,
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: "#9aa7a6" } },
        y: { ticks: { color: "#9aa7a6" } }
      }
    }
  });
}

// deterministic calc (same as backend)
function calcCO2(electricity, fuel, waste) {
  const a = electricity * 0.85;
  const b = fuel * 2.31;
  const c = waste * 0.5;
  return { total: a + b + c, breakdown: { electricity: a, fuel: b, waste: c } };
}

// animate number count-up
function animateValue(el, start, end, duration = 700) {
  const range = end - start;
  const startTime = performance.now();
  function step(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const value = start + range * progress;
    el.textContent = Math.round(value).toLocaleString() + " kg";
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// update UI with result object
function displayResult(res) {
  const total = Math.round(res.total);
  resultBox.classList.remove("hidden");
  resultAnimated.classList.add("countup");
  animateValue(resultAnimated, 0, total, 700);
  resultMsg.textContent = res.message || "";
  breakdownBox.innerHTML = `
    <div>Electricity: <b>${res.breakdown.electricity.toFixed(1)} kg</b></div>
    <div>Fuel: <b>${res.breakdown.fuel.toFixed(1)} kg</b></div>
    <div>Waste: <b>${res.breakdown.waste.toFixed(1)} kg</b></div>
  `;
  meterValue.textContent = `${total} kg`;
}

// quick local realtime calculation (on input)
[electricityEl, fuelEl, wasteEl].forEach(i => {
  i.addEventListener("input", () => {
    const e = parseFloat(electricityEl.value || 0);
    const f = parseFloat(fuelEl.value || 0);
    const w = parseFloat(wasteEl.value || 0);
    const r = calcCO2(e,f,w);
    meterValue.textContent = `${Math.round(r.total)} kg`;
  });
});

// Calculate button (do local calc + show)
calcBtn.addEventListener("click", () => {
  const e = parseFloat(electricityEl.value || 0);
  const f = parseFloat(fuelEl.value || 0);
  const w = parseFloat(wasteEl.value || 0);
  const r = calcCO2(e,f,w);
  // message based on thresholds
  let message = "";
  if (r.total < 1000) message = "👏 Great! Your footprint is below average. Keep it up!";
  else if (r.total < 3000) message = "🙂 Your footprint is moderate. Try using public transport or saving energy.";
  else message = "⚠ High footprint! Consider reducing travel and energy use.";

  displayResult({ total: r.total, breakdown: r.breakdown, message });
});

// Save+Log button: send to backend /api/log-emission
saveBtn.addEventListener("click", async () => {
  const e = parseFloat(electricityEl.value || 0);
  const f = parseFloat(fuelEl.value || 0);
  const w = parseFloat(wasteEl.value || 0);

  // quick UI feedback
  saveBtn.textContent = "Saving...";
  const form = new FormData();
  form.append("user_id", USER_ID);
  form.append("electricity", e);
  form.append("fuel", f);
  form.append("waste", w);

  try {
    const res = await postForm("/api/log-emission", form);
    // server returns entry with monthly_co2_kg
    const co2 = res.entry.monthly_co2_kg ?? null;
    if (co2 !== null) {
      displayResult({ total: co2, breakdown: { electricity: e*0.85, fuel: f*2.31, waste: w*0.5 }, message: "Saved to server." });
      // update chart / coins if present
      refreshDashboard();
    } else {
      alert("Saved but server responded unexpectedly.");
    }
  } catch (err) {
    console.error(err);
    alert("Error saving to server. See console.");
  } finally {
    saveBtn.textContent = "Save + Log";
  }
});

// OCR scan: upload bill to /api/upload-bill
scanBtn.addEventListener("click", async () => {
  const file = billInput.files[0];
  if (!file) { alert("Choose a file first"); return; }
  scanBtn.textContent = "Scanning...";
  const fd = new FormData();
  fd.append("file", file);
  try {
    const res = await postForm("/api/upload-bill", fd);
    if (res.kwh) {
      ocrHint.textContent = `Detected kWh: ${res.kwh}`;
      fillDetected.style.display = "inline-block";
      fillDetected.onclick = () => {
        electricityEl.value = res.kwh;
        fillDetected.style.display = "none";
        ocrHint.textContent = "kWh filled into Electricity field.";
      };
    } else {
      ocrHint.textContent = "No kWh found in uploaded file.";
    }
  } catch (err) {
    console.error(err);
    ocrHint.textContent = "OCR failed — check backend or file format.";
  } finally {
    scanBtn.textContent = "Scan";
  }
});

// Forecast button: call /api/forecast
btnForecast.addEventListener("click", async () => {
  btnForecast.textContent = "Forecasting...";
  const fd = new FormData();
  fd.append("user_id", USER_ID);
  try {
    const res = await postForm("/api/forecast", fd);
    if (res.forecast_co2 != null) {
      document.getElementById("forecastVal").textContent = `${res.forecast_co2} kg`;
      document.getElementById("lastAvg").textContent = `${res.change_pct}%`;
      alert(`Forecast: ${res.forecast_co2} kg — change ${res.change_pct}%`);
    } else {
      alert("Forecast unavailable. Train model first.");
    }
  } catch (err) {
    console.error(err);
    alert("Forecast error. See console.");
  } finally {
    btnForecast.textContent = "Forecast";
  }
});

// Tips button
btnTips.addEventListener("click", async () => {
  btnTips.textContent = "Loading...";
  const fd = new FormData();
  fd.append("user_id", USER_ID);
  try {
    const res = await postForm("/api/recommendations", fd);
    tipsList.innerHTML = "";
    (res.recommendations || []).forEach(t => {
      const el = document.createElement("div");
      el.className = "tip";
      el.innerHTML = `<div style="padding:8px 0">${t}</div>`;
      tipsList.appendChild(el);
    });
  } catch (err) {
    console.error(err);
    tipsList.innerHTML = `<p class="muted">Couldn't fetch tips.</p>`;
  } finally {
    btnTips.textContent = "Get Tips";
  }
});

// Handprint add
addHandprint.addEventListener("click", async () => {
  const desc = hpDesc.value.trim();
  const kg = parseFloat(hpKg.value || 0);
  if (!desc || kg <= 0) { handprintMsg.textContent = "Enter description and positive kg."; return; }
  addHandprint.textContent = "Saving...";
  const fd = new FormData();
  fd.append("user_id", USER_ID);
  fd.append("description", desc);
  fd.append("co2_saved_kg", kg);
  try {
    const res = await postForm("/api/handprint", fd);
    handprintMsg.textContent = `Saved! Coins: ${res.coins}`;
    coinsCount.textContent = res.coins;
    hpDesc.value = ""; hpKg.value = "";
  } catch (err) {
    console.error(err);
    handprintMsg.textContent = "Could not save handprint.";
  } finally {
    addHandprint.textContent = "Add Handprint";
    setTimeout(()=> handprintMsg.textContent = "", 4000);
  }
});

// refresh dashboard: load last N logs and build chart + coins
async function refreshDashboard() {
  try {
    // intensity endpoint gives avg and entries (we also need full logs — fallback: query /api/intensity then call chart with mock)
    const res = await fetch(`http://127.0.0.1:8000/api/intensity/${USER_ID}`);
    const json = await res.json();
    // for visualization we will request last few logs via /api/logs/{user_id} if available; else create mock
    let labels = [], dataPoints = [];
    // try /api/logs/{user_id}
    try {
      const logsRes = await fetch(`http://127.0.0.1:8000/api/logs/${USER_ID}`);
      if (logsRes.ok) {
        const logsJson = await logsRes.json();
        const logs = logsJson.logs || [];
        // take last 6
        const last = logs.slice(0,6).reverse();
        for (const l of last) {
          labels.push(new Date(l.created_at).toLocaleDateString());
          dataPoints.push(l.monthly_co2_kg);
        }
      }
    } catch(e){
      // ignore and fallback
    }
    if (labels.length === 0) {
      // fallback demo
      labels = ["Mar","Apr","May","Jun","Jul"];
      dataPoints = [120,140,132,160,150];
    }
    buildChart(labels, dataPoints);
    coinsCount.textContent = json.coins ?? coinsCount.textContent;
  } catch (err) {
    console.error("refresh error", err);
  }
}

// initial refresh
refreshDashboard();
