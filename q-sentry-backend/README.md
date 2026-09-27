# Q-Sentry Backend

FastAPI service that accepts ESP32 sensor readings, computes a risk score, and
keeps recent events in process memory. No database is used; stored events are
cleared when the server process restarts.

## Requirements

- Python 3.10 or newer

## Run

From this directory, install dependencies and start the development server:

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload
```

The API is available at `http://127.0.0.1:8000`. Interactive API docs are at
`http://127.0.0.1:8000/docs`.

## Endpoints

- `GET /health` - service health check
- `POST /sensor-data` - submit a sensor reading and receive its risk assessment
- `GET /events?device_id=esp32-01&limit=100` - list newest events, optionally filtered
- `GET /events/{event_id}` - retrieve one event by ID

Example sensor payload:

```json
{
  "device_id": "esp32-01",
  "motion_detected": true,
  "door_open": false,
  "tamper_detected": false,
  "printer_connected": true
}
```

Risk points are 15 for motion, 25 for an open door, 50 for tampering, and 20
for a disconnected printer. Active signals are added and capped at 100. Severity
is `low` (0-24), `medium` (25-49), `high` (50-74), or `critical` (75-100).
These weights are initial policy defaults and should be tuned for the deployment.

## CORS

CORS allows requests from all origins, methods, and headers. Credentials are
disabled because wildcard origins are enabled.