"""FastAPI application for receiving and reviewing Q-Sentry sensor data."""

from uuid import UUID

from fastapi import FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware

from config import APP_NAME, APP_VERSION
from event_store import event_store
from models import LegacySensorReading, SensorEvent
from risk_engine import calculate_risk

app = FastAPI(title=APP_NAME, version=APP_VERSION)

# The device dashboard and ESP32 tooling may be hosted on separate origins.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok", "service": APP_NAME}


@app.post("/sensor-data", response_model=SensorEvent, status_code=status.HTTP_201_CREATED)
def receive_sensor_data(reading: LegacySensorReading) -> SensorEvent:
    risk_score, risk_level = calculate_risk(reading)
    event = SensorEvent(
        **reading.model_dump(),
        risk_score=risk_score,
        risk_level=risk_level,
    )
    return event_store.add(event)


@app.get("/events", response_model=list[SensorEvent])
def list_events(
    device_id: str | None = None,
    limit: int = Query(default=100, ge=1, le=1000),
) -> list[SensorEvent]:
    return event_store.list(device_id=device_id, limit=limit)


@app.get("/events/{event_id}", response_model=SensorEvent)
def get_event(event_id: UUID) -> SensorEvent:
    event = event_store.get(event_id)
    if event is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    return event