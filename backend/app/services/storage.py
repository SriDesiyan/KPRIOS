import os
import re
from pathlib import Path

from app.core.logging import logger

STORAGE_ROOT = os.getenv("KPYRIOS_STORAGE_ROOT", os.path.join(os.getcwd(), "kpyrios_storage"))


def sanitize_filename(filename: str) -> str:
    """Sanitizes filename against path traversal and unsafe characters."""
    clean = re.sub(r"[^\w\.-]", "_", filename)
    return clean or "unnamed_evidence"


def get_case_storage_dir(case_id: str) -> Path:
    """Returns and ensures the isolated storage directory for a specific case."""
    case_dir = Path(STORAGE_ROOT) / "cases" / case_id
    case_dir.mkdir(parents=True, exist_ok=True)
    return case_dir


def store_evidence_file(case_id: str, evidence_id: str, filename: str, content: bytes) -> str:
    """
    Writes raw evidence bytes once to the isolated case directory.
    Invariant: Evidence is immutable — raises FileExistsError if already present.
    """
    safe_name = sanitize_filename(filename)
    case_dir = get_case_storage_dir(case_id)
    target_path = case_dir / f"{evidence_id}_{safe_name}"

    if target_path.exists():
        raise FileExistsError(
            f"Evidence file already exists at {target_path}. Overwrite prohibited."
        )

    with open(target_path, "wb") as f:
        f.write(content)

    logger.info(f"Stored immutable evidence file: {target_path} ({len(content)} bytes)")
    return str(target_path)


def read_evidence_file(file_path: str) -> bytes:
    """Reads raw evidence bytes from storage."""
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Evidence file not found at {file_path}")
    with open(file_path, "rb") as f:
        return f.read()
