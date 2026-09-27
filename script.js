/* ============================================================
   Q-SENTRY — Security Monitoring Dashboard
   Frontend-only mock logic. No backend, no real sensors.
   ============================================================ */

(function () {
  "use strict";

  const RISK_WEIGHTS = {
    door: 20,
    motion: 20,
    vibration: 25,
    printer: 10,
    afterHours: 47
  };

  const state = {
    door: true,
    motion: true,
    vibration: false,
    printer: false,
    afterHours: true
  };

  let vibrationTimer = null;

  const eventLogData = [
    { time: "19:04:25", event: "Vibration detected", risk: "+25", status: "normal" },
    { time: "19:04:18", event: "Motion detected", risk: "+20", status: "active" },
    { time: "19:04:12", event: "Door opened", risk: "+20", status: "active" },
    { time: "18:45:03", event: "System reset", risk: "+0", status: "normal" }
  ];

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

    simButtons: document.querySelectorAll(".sim-btn")
  };

  const RING_CIRCUMFERENCE = 2 * Math.PI * 78;
  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

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

  function addLogEntry(event, riskDelta, status) {
    eventLogData.unshift({ time: nowTimeString(), event, risk: riskDelta, status });
    if (eventLogData.length > 8) eventLogData.pop();
    renderLog();
  }

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
    const score = computeRisk();
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
    el.eventLog.innerHTML = eventLogData.map(row => `
      <tr>
        <td class="time">${row.time}</td>
        <td>${row.event}</td>
        <td class="risk-pos">${row.risk}</td>
        <td><span class="status-chip ${row.status === "active" ? "active" : "normal"}">
          <span class="status-dot ${row.status === "active" ? "dot-red" : "dot-green"}"></span>
          ${row.status === "active" ? "ACTIVE" : "NORMAL"}
        </span></td>
      </tr>
    `).join("");
  }

  function renderAll() {
    renderSensors();
    renderRisk();
    renderLog();
  }

  function toggleDoor() {
    state.door = !state.door;
    addLogEntry(state.door ? "Door opened" : "Door closed", state.door ? `+${RISK_WEIGHTS.door}` : "+0", state.door ? "active" : "normal");
    renderAll();
  }

  function toggleMotion() {
    state.motion = !state.motion;
    addLogEntry(state.motion ? "Motion detected" : "Motion cleared", state.motion ? `+${RISK_WEIGHTS.motion}` : "+0", state.motion ? "active" : "normal");
    renderAll();
  }

  function triggerVibration() {
    state.vibration = true;
    addLogEntry("Vibration / tampering detected", `+${RISK_WEIGHTS.vibration}`, "active");
    renderAll();

    clearTimeout(vibrationTimer);
    vibrationTimer = setTimeout(() => {
      state.vibration = false;
      addLogEntry("Vibration returned to normal", "+0", "normal");
      renderAll();
    }, 4000);
  }

  function togglePrinter() {
    state.printer = !state.printer;
    addLogEntry(state.printer ? "Printer activated" : "Printer disabled", state.printer ? `+${RISK_WEIGHTS.printer}` : "+0", state.printer ? "active" : "normal");
    renderAll();
  }

  function toggleAfterHours() {
    state.afterHours = !state.afterHours;
    addLogEntry(state.afterHours ? "Activity outside allowed time" : "Back within allowed hours", state.afterHours ? `+${RISK_WEIGHTS.afterHours}` : "+0", state.afterHours ? "active" : "normal");
    renderAll();
  }

  function resetSystem() {
    clearTimeout(vibrationTimer);
    state.door = false;
    state.motion = false;
    state.vibration = false;
    state.printer = false;
    state.afterHours = false;
    addLogEntry("System reset", "+0", "normal");
    renderAll();
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

})();
