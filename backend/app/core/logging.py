import json
import logging
import sys
from datetime import datetime, timezone
from typing import Any, Dict


class JSONFormatter(logging.Formatter):
    """
    Custom formatter that outputs log records as structured JSON strings.
    Adheres to CyberDome / law-enforcement audit compliance.
    """

    def format(self, record: logging.LogRecord) -> str:
        log_data: Dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "line": record.lineno,
        }

        # Include exception info if present
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)

        # Include custom extra fields if attached to record
        if hasattr(record, "extra_fields") and isinstance(record.extra_fields, dict):
            log_data.update(record.extra_fields)

        return json.dumps(log_data)


def setup_logging(debug: bool = False) -> logging.Logger:
    """Configures structured JSON logging for the entire FastAPI backend."""
    logger = logging.getLogger("kpyrios")
    logger.setLevel(logging.DEBUG if debug else logging.INFO)

    # Prevent duplicate handlers if called multiple times
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(JSONFormatter())
        logger.addHandler(handler)

    # Also redirect uvicorn access logs
    uvicorn_logger = logging.getLogger("uvicorn.access")
    uvicorn_logger.handlers = logger.handlers

    return logger


logger = setup_logging()
