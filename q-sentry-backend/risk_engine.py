"""Translate sensor signals into a simple, explainable risk score."""

from config import RISK_LEVELS, RISK_WEIGHTS
from models import LegacySensorReading


def calculate_risk(reading: LegacySensorReading) -> tuple[int, str]:
    """Return a capped 0-100 risk score and its corresponding severity."""
    score = 0
    score += RISK_WEIGHTS["motion_detected"] if reading.motion_detected else 0
    score += RISK_WEIGHTS["door_open"] if reading.door_open else 0
    score += RISK_WEIGHTS["tamper_detected"] if reading.tamper_detected else 0
    score += RISK_WEIGHTS["printer_disconnected"] if not reading.printer_connected else 0
    score = min(score, 100)

    for upper_bound, level in RISK_LEVELS:
        if score < upper_bound:
            return score, level

    return score, "critical"