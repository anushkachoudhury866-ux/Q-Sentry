# 🔐 Q-SENTRY — Smart Question Paper Security System
---
## 📝 Description

Q-SENTRY is a smart, sensor-based security system designed to protect confidential question papers in examination centres. It detects unauthorized motion, door access, and physical tampering, triggers automatic alerts, and displays the security status in real time. The system also provides a web-based dashboard for monitoring events and security logs, enabling faster response and improved accountability.

<p align="center">
  <a href=https://github.com/anushkachoudhury866-ux/Q-Sentry.git>
    <img src="./Image/Q-Sentry circuit.png" />
  </a>
</p>

---

## ✨ Features

🔹 Motion detection using PIR

🔹 Door monitoring using Slide Switch

🔹 Tamper detection using SW-420

🔹 Automatic Buzzer & LED alerts

🔹 LCD 16 * 2 security-status display

🔹 Relay-based control

🔹 Real-time Security Monitoring Dashboard

🔹 Event logging and monitoring

---

## 🛠️ Tech Stack

*Hardware:*

- ESP32 / Arduino UNO 
- PIR 
- Slide Switch 
- SW-420 
- LCD 16 * 2 
- Buzzer 
- LEDs 
- Relay

*Software:*

- Arduino C++ 
- astAPI 
- Python 
- HTML/CSS/JavaScript 
- REST API 
- JSON 
- Git/GitHub 
- Tinkercad

---

## 📊 SWOT Analysis

**💪 Strengths**

- Real-time monitoring using multiple sensors.
- Automatic alerts for suspicious activity.
- Low-cost and easy-to-deploy solution.
- Dashboard provides centralized event monitoring.

**⚠️ Weaknesses**

- Sensor-based detection may cause false alerts.
- Internet connectivity is required for remote dashboard updates.
- Prototype depends on continuous power supply.

**🚀 Opportunities**

- Add camera-based verification and AI detection.
- Integrate SMS/WhatsApp notifications.
- Add RFID or biometric authentication.
- Scale for multiple examination centres.

**🔮 Threats**

- Sensor failure or physical damage.
- Power or network failure.
- Environmental factors may affect sensor readings.
- Unauthorized attempts to bypass or tamper with the system.

## ⚙️ How It Works

Sensors continuously monitor the examination room → ESP32/Arduino processes the inputs → detects security conditions → triggers alerts/automatic response → sends event data to the FastAPI backend → displays status and logs on the dashboard.

---

## 🖥️ Dashboard

Q-SENTRY | The Q-SENTRY dashboard provides a real-time overview of examination room security, displaying the current security status, risk level, sensor activity, and detected events. It highlights Normal, Warning, and Critical conditions and provides instant visibility into suspicious activities such as motion, door opening, or tampering. The dashboard also maintains event logs to support monitoring, tracking, and quick response.

<p align="center">
  <a href=https://github.com/anushkachoudhury866-ux/Q-Sentry.git>
    <img src="./Image/Q-Sentry Dashboard.jpg.png" />
  </a>
</p>


---

## 🔮 Future Scope

- Camera-based verification
- SMS/WhatsApp alerts
- RFID/biometric authentication
- Cloud-based monitoring
- AI-based anomaly detection


⚡ From detection to response — Q-SENTRY keeps exam security one step ahead.
