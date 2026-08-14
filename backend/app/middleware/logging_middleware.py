import time
import uuid

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.core.logging import logger


class StructuredLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware that records structured JSON metrics for every incoming HTTP request.
    Includes correlation ID, execution duration, path, method, and response status.
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        start_time = time.perf_counter()
        correlation_id = request.headers.get("X-Correlation-ID", str(uuid.uuid4()))

        # Process request
        try:
            response: Response = await call_next(request)
            process_time_ms = round((time.perf_counter() - start_time) * 1000, 2)

            response.headers["X-Correlation-ID"] = correlation_id
            response.headers["X-Process-Time-Ms"] = str(process_time_ms)

            # Avoid spamming logs for health checks
            if not request.url.path.endswith("/health"):
                logger.info(
                    f"{request.method} {request.url.path} completed with {response.status_code} in {process_time_ms}ms",
                    extra={
                        "extra_fields": {
                            "correlation_id": correlation_id,
                            "method": request.method,
                            "path": request.url.path,
                            "status_code": response.status_code,
                            "duration_ms": process_time_ms,
                            "client_host": request.client.host if request.client else "unknown",
                        }
                    },
                )
            return response
        except Exception as exc:
            process_time_ms = round((time.perf_counter() - start_time) * 1000, 2)
            logger.error(
                f"Unhandled exception during {request.method} {request.url.path}: {str(exc)}",
                exc_info=True,
                extra={
                    "extra_fields": {
                        "correlation_id": correlation_id,
                        "method": request.method,
                        "path": request.url.path,
                        "duration_ms": process_time_ms,
                    }
                },
            )
            raise exc
