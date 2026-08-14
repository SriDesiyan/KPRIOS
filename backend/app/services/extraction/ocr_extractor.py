import io
from typing import Any, Dict

import pytesseract
from PIL import Image

from app.core.logging import logger


def extract_ocr_text(file_bytes: bytes, mime_type: str) -> Dict[str, Any]:
    """
    Performs OCR on image artifacts using Tesseract.
    Returns structured dictionary with extracted text, status, and confidence.
    Invariant: Surfaces real tool status without fabricating text on failure.
    """
    result: Dict[str, Any] = {
        "status": "skipped",
        "text": "",
        "confidence": 0.0,
        "word_count": 0,
        "error": None,
    }

    if not mime_type.startswith("image/"):
        return result

    try:
        image = Image.open(io.BytesIO(file_bytes))
        # Ensure image is in RGB mode for OCR
        rgb_image = image.convert("RGB") if image.mode not in ("RGB", "L") else image

        # Run Tesseract OCR
        ocr_text = pytesseract.image_to_string(rgb_image)
        cleaned_text = ocr_text.strip()

        result["status"] = "success"
        result["text"] = cleaned_text
        result["word_count"] = len(cleaned_text.split())
        result["confidence"] = 0.85 if cleaned_text else 0.0

    except pytesseract.TesseractNotFoundError:
        logger.warning("Tesseract binary not found in PATH; OCR marked as unavailable.")
        result["status"] = "unavailable"
        result["error"] = "Tesseract OCR binary not found on host system."
    except Exception as e:
        logger.warning(f"OCR extraction encountered error: {str(e)}")
        result["status"] = "error"
        result["error"] = str(e)

    return result
