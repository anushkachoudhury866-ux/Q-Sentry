/* ============================================================
   Q-SENTRY — Security Monitoring Dashboard
  Simulated sensor controls backed by the Q-Sentry API.
   ============================================================ */

(function () {
  "use strict";

  const RISK_WEIGHTS = {
    door: 25,
    motion: 15,
    vibration: 50,
    printer: 10,
    afterHours: 47
  };

  const API_URL = "http://127.0.0.1:8000";
  const DEVICE_ID = "dashboard-demo-01";

  const state = {
    door: true,
    motion: true,
    vibration: false,
    printer: false,
    afterHours: true
  };

  let vibrationTimer = null;

  let eventLogData = [];
  let serverRiskScore = null;
  let syncQueue = Promise.resolve();

  const el = {
    dotDoor: document.getElementById("dotDoor"),
    valDoor: document.getElementById("valDoor"),
    dotMotion: document.getElementById("dotMotion"),
    valMotion: document.getElementById("valMotion"),
    dotVibration: document.getElementById("dotVibration"),
    valVibration: document.getElementById("valVibration"),
    dotPrinter: document.getElementById("dotPrinter"),
    valPrinter: document.getElementById("valPrinter"),

    ringFg: document.getElementById("ringFg"),
    riskScoreNum: document.getElementById("riskScoreNum"),
    threatPill: document.getElementById("threatPill"),
    threatLevelText: document.getElementById("threatLevelText"),
    breakdownList: document.getElementById("breakdownList"),

    alertCard: document.getElementById("alertCard"),
    alertText: document.getElementById("alertText"),

    eventLog: document.getElementById("eventLog"),
    dateTime: document.getElementById("dateTime"),
    apiStatusDot: document.getElementById("apiStatusDot"),
    apiStatusText: document.getElementById("apiStatusText"),

    simButtons: document.querySelectorAll(".sim-btn")
  };

  const RING_CIRCUMFERENCE = 2 * Math.PI * 78;
  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  function setApiStatus(connected) {
    el.apiStatusText.textContent = connected ? "API CONNECTED" : "API OFFLINE";
    el.apiStatusDot.classList.toggle("dot-green", connected);
    el.apiStatusDot.classList.toggle("dot-red", !connected);
    el.apiStatusDot.classList.remove("dot-yellow");
  }

  function loadEvents() {
    return fetch(`${API_URL}/events?limit=8`).then(response => {
      if (!response.ok) throw new Error(`Event request failed: ${response.status}`);
      return response.json();
    }).then(events => {
      eventLogData = events;
      renderLog();
    });
  }

  function syncState() {
    const reading = {
      device_id: DEVICE_ID,
      motion_detected: state.motion,
      door_open: state.door,
      tamper_detected: state.vibration,
      printer_connected: true,
      printer_active: state.printer,
      after_hours_detected: state.afterHours
    };

    syncQueue = syncQueue.then(() => fetch(`${API_URL}/sensor-data`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reading)
    })).then(response => {
      if (!response.ok) throw new Error(`Sensor request failed: ${response.status}`);
      return response.json();
    }).then(event => {
      serverRiskScore = event.risk_score;
      setApiStatus(true);
      renderRisk();
      return loadEvents();
    }).catch(error => {
      serverRiskScore = null;
      setApiStatus(false);
      renderRisk();
      console.error("Could not sync dashboard with Q-Sentry API:", error);
    });
  }

  function pad(n) { return n.toString().padStart(2, "0"); }

  function nowTimeString() {
    const d = new Date();
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  function updateDateTime() {
    const d = new Date();
    const dateStr = `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
    el.dateTime.textContent = `${dateStr}   ${nowTimeString()}`;
  }

  function computeRisk() {
    let score = 0;
    if (state.door) score += RISK_WEIGHTS.door;
    if (state.motion) score += RISK_WEIGHTS.motion;
    if (state.vibration) score += RISK_WEIGHTS.vibration;
    if (state.printer) score += RISK_WEIGHTS.printer;
    if (state.afterHours) score += RISK_WEIGHTS.afterHours;
    return Math.min(100, score);
  }

  function threatLevelFor(score) {
    if (score <= 30) return { label: "LOW", key: "low" };
    if (score <= 60) return { label: "MEDIUM", key: "medium" };
    if (score <= 80) return { label: "HIGH", key: "high" };
    return { label: "CRITICAL", key: "critical" };
  }

  const LEVEL_COLOR = { low: "var(--green)", medium: "var(--yellow)", high: "var(--orange)", critical: "var(--red)" };
  const LEVEL_DOT = { low: "dot-green", medium: "dot-yellow", high: "dot-orange", critical: "dot-red" };

  function renderSensors() {
    setSensor(el.dotDoor, el.valDoor, state.door, "OPEN", "CLOSED", true);
    setSensor(el.dotMotion, el.valMotion, state.motion, "DETECTED", "CLEAR", true);
    setSensor(el.dotVibration, el.valVibration, state.vibration, "DETECTED", "NORMAL", true);
    setSensor(el.dotPrinter, el.valPrinter, state.printer, "ACTIVE", "DISABLED", false);
  }

  function setSensor(dotEl, valEl, isTriggered, onLabel, offLabel, dangerStyle) {
    valEl.textContent = isTriggered ? onLabel : offLabel;
    valEl.classList.remove("danger", "safe", "warn");
    dotEl.classList.remove("dot-red", "dot-green", "dot-orange");

    if (isTriggered) {
      valEl.classList.add(dangerStyle ? "danger" : "warn");
      dotEl.classList.add(dangerStyle ? "dot-red" : "dot-orange");
    } else {
      valEl.classList.add("safe");
      dotEl.classList.add("dot-green");
    }
  }

  function renderRisk() {
    const score = serverRiskScore ?? computeRisk();
    const level = threatLevelFor(score);

    el.riskScoreNum.textContent = score;

    const offset = RING_CIRCUMFERENCE - (score / 100) * RING_CIRCUMFERENCE;
    el.ringFg.style.strokeDashoffset = offset.toFixed(1);
    el.ringFg.style.stroke = LEVEL_COLOR[level.key];

    el.threatPill.textContent = level.label;
    el.threatPill.style.color = LEVEL_COLOR[level.key];
    el.threatPill.style.border = `1px solid ${LEVEL_COLOR[level.key]}`;

    el.threatLevelText.innerHTML = `<span class="status-dot ${LEVEL_DOT[level.key]}"></span> ${level.label}`;
    el.threatLevelText.style.color = LEVEL_COLOR[level.key];

    el.breakdownList.innerHTML = `
      <li><span>Door opened</span><b>${state.door ? "+" + RISK_WEIGHTS.door : "+0"}</b></li>
      <li><span>Motion detected</span><b>${state.motion ? "+" + RISK_WEIGHTS.motion : "+0"}</b></li>
      <li><span>Vibration / tampering</span><b>${state.vibration ? "+" + RISK_WEIGHTS.vibration : "+0"}</b></li>
      <li><span>Printer active</span><b>${state.printer ? "+" + RISK_WEIGHTS.printer : "+0"}</b></li>
      <li><span>Outside allowed time</span><b>${state.afterHours ? "+" + RISK_WEIGHTS.afterHours : "+0"}</b></li>
    `;

    renderAlert(level);
  }

  function renderAlert(level) {
    if (level.key === "critical" || level.key === "high") {
      el.alertCard.style.display = "flex";
      const triggers = [];
      if (state.door) triggers.push("door");
      if (state.motion) triggers.push("motion");
      if (state.vibration) triggers.push("vibration");
      if (state.afterHours) triggers.push("off-hours activity");
      const list = triggers.length ? triggers.join(", ") : "multiple sensors";
      el.alertText.textContent = `Unauthorized activity detected — flagged by ${list}.`;
    } else {
      el.alertCard.style.display = "none";
    }
  }

  function renderLog() {
    if (!eventLogData.length) {
      el.eventLog.innerHTML = '<tr><td colspan="4">No backend events yet</td></tr>';
      return;
    }

    el.eventLog.innerHTML = eventLogData.map(row => `
      <tr>
        <td class="time">${new Date(row.timestamp).toLocaleTimeString()}</td>
        <td>${describeEvent(row)}</td>
        <td class="risk-pos">${row.risk_score}</td>
        <td><span class="status-chip ${row.risk_level === "low" ? "normal" : "active"}">
          <span class="status-dot ${row.risk_level === "low" ? "dot-green" : "dot-red"}"></span>
          ${row.risk_level.toUpperCase()}
        </span></td>
      </tr>
    `).join("");
  }

  function describeEvent(event) {
    const signals = [];
    if (event.door_open) signals.push("Door open");
    if (event.motion_detected) signals.push("Motion detected");
    if (event.tamper_detected) signals.push("Tampering detected");
    if (event.printer_active) signals.push("Printer active");
    if (event.after_hours_detected) signals.push("Outside allowed time");
    return signals.length ? signals.join(", ") : "No active signals";
  }

  function renderAll() {
    renderSensors();
    renderRisk();
    renderLog();
  }

  function toggleDoor() {
    state.door = !state.door;
    renderAll();
    syncState();
  }

  function toggleMotion() {
    state.motion = !state.motion;
    renderAll();
    syncState();
  }

  function triggerVibration() {
    state.vibration = true;
    renderAll();
    syncState();

    clearTimeout(vibrationTimer);
    vibrationTimer = setTimeout(() => {
      state.vibration = false;
      renderAll();
      syncState();
    }, 4000);
  }

  function togglePrinter() {
    state.printer = !state.printer;
    renderAll();
    syncState();
  }

  function toggleAfterHours() {
    state.afterHours = !state.afterHours;
    renderAll();
    syncState();
  }

  function resetSystem() {
    clearTimeout(vibrationTimer);
    state.door = false;
    state.motion = false;
    state.vibration = false;
    state.printer = false;
    state.afterHours = false;
    renderAll();
    syncState();
  }

  const ACTIONS = {
    door: toggleDoor,
    motion: toggleMotion,
    vibration: triggerVibration,
    printer: togglePrinter,
    afterhours: toggleAfterHours,
    reset: resetSystem
  };

  el.simButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const action = ACTIONS[btn.dataset.action];
      if (action) action();
    });
  });

  setInterval(updateDateTime, 1000);
  updateDateTime();

  renderAll();
  syncState();

})();
