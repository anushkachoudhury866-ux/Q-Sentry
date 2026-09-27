"""Configuration constants for the Q-Sentry API."""

APP_NAME = "Q-Sentry API"
APP_VERSION = "1.0.0"
MAX_STORED_EVENTS = 1000

# Risk points are added for each active security signal, then capped at 100.
RISK_WEIGHTS = {
    "tamper_detected": 50,
    "door_open": 25,
    "printer_disconnected": 20,
    "printer_active": 10,
    "after_hours_detected": 47,
    "motion_detected": 15,
}

RISK_LEVELS = (
    (25, "low"),
    (50, "medium"),
    (75, "high"),
    (101, "critical"),
)