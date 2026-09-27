"""Thread-safe, bounded in-memory storage for sensor events."""

from collections import deque
from threading import Lock
from uuid import UUID

from config import MAX_STORED_EVENTS
from models import SensorEvent


class EventStore:
    """Keep the newest events in memory for the lifetime of this process."""

    def __init__(self, max_events: int = MAX_STORED_EVENTS) -> None:
        self._events: deque[SensorEvent] = deque(maxlen=max_events)
        self._lock = Lock()

    def add(self, event: SensorEvent) -> SensorEvent:
        with self._lock:
            self._events.append(event)
        return event

    def list(self, device_id: str | None = None, limit: int = 100) -> list[SensorEvent]:
        with self._lock:
            events = list(reversed(self._events))

        if device_id is not None:
            events = [event for event in events if event.device_id == device_id]
        return events[:limit]

    def get(self, event_id: UUID) -> SensorEvent | None:
        with self._lock:
            return next(
                (event for event in reversed(self._events) if event.event_id == event_id),
                None,
            )


event_store = EventStore()