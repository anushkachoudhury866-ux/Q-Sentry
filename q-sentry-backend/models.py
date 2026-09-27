"""Pydantic request and response models for Q-Sentry."""

from datetime import datetime, timezone
from typing import Literal
from uuid import UUID, uuid4

from pydantic import BaseModel, ConfigDict, Field


class SensorReading(BaseModel):
    """Sensor values reported by an ESP32 device."""

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "door": False,
                    "motion": True,
                    "vibration": False,
                    "printer_on": True,
                    "timestamp": "2026-09-27T09:30:00Z",
                }
            ]
        }
    )

    door: bool
    motion: bool
    vibration: bool
    printer_on: bool
    # Omitted device timestamps are filled with the current UTC time.
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class RiskResponse(BaseModel):
    """Risk assessment and hardware commands returned to the dashboard."""

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "risk_score": 65,
                    "status": "HIGH_RISK",
                    "action_taken": "Alert sent to exam cell staff",
                    "commands": {
                        "relay": False,
                        "buzzer": True,
                        "led_red": True,
                        "led_green": False,
                    },
                    "timestamp": "2026-09-27T09:30:00Z",
                }
            ]
        }
    )

    risk_score: int = Field(ge=0, le=100)
    status: Literal["NORMAL", "SUSPICIOUS", "HIGH_RISK", "CRITICAL"]
    action_taken: str
    commands: dict[str, bool]
    timestamp: datetime


class Event(BaseModel):
    """One item in the security event history."""

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "id": 42,
                    "timestamp": "2026-09-27T09:30:00Z",
                    "risk_score": 65,
                    "status": "HIGH_RISK",
                    "sensors": {
                        "door": False,
                        "motion": True,
                        "vibration": True,
                        "printer_on": True,
                    },
                    "action": "Buzzer activated",
                }
            ]
        }
    )

    id: int
    timestamp: datetime
    risk_score: int = Field(ge=0, le=100)
    status: Literal["NORMAL", "SUSPICIOUS", "HIGH_RISK", "CRITICAL"]
    sensors: dict[str, bool]
    action: str


class StatusResponse(BaseModel):
    """Current security posture and service health for GET /status."""

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "current_risk": 0,
                    "current_status": "NORMAL",
                    "last_update": "2026-09-27T09:30:00Z",
                    "system_health": "OK",
                    "total_events_today": 3,
                    "uptime_seconds": 86400,
                }
            ]
        }
    )

    current_risk: int = Field(ge=0, le=100)
    current_status: Literal["NORMAL", "SUSPICIOUS", "HIGH_RISK", "CRITICAL"]
    last_update: datetime | None = None
    system_health: Literal["OK", "SENSOR_OFFLINE", "TAMPER_DETECTED"]
    total_events_today: int = Field(ge=0)
    uptime_seconds: float = Field(ge=0)


class LegacySensorReading(BaseModel):
    """Compatibility input model used by the existing /sensor-data route."""

    device_id: str = Field(min_length=1, max_length=100)
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    motion_detected: bool = False
    door_open: bool = False
    tamper_detected: bool = False
    printer_connected: bool = True


class SensorEvent(LegacySensorReading):
    """Compatibility event response used by the existing API routes."""

    event_id: UUID = Field(default_factory=uuid4)
    risk_score: int = Field(ge=0, le=100)
    risk_level: Literal["low", "medium", "high", "critical"]