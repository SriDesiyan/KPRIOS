import io
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from PIL import ExifTags, Image

from app.core.logging import logger


def parse_gps_coordinates(gps_info: Dict[int, Any]) -> Optional[Dict[str, float]]:
    """Converts EXIF GPS rational tags to decimal latitude and longitude."""
    try:

        def dms_to_decimal(dms, ref):
            degrees = float(dms[0])
            minutes = float(dms[1]) / 60.0
            seconds = float(dms[2]) / 3600.0
            val = degrees + minutes + seconds
            if ref in ["S", "W"]:
                val = -val
            return val

        # GPS tag IDs: 1: LatRef, 2: Lat, 3: LongRef, 4: Long
        if 2 in gps_info and 4 in gps_info and 1 in gps_info and 3 in gps_info:
            lat = dms_to_decimal(gps_info[2], gps_info[1])
            lon = dms_to_decimal(gps_info[4], gps_info[3])
            return {"latitude": round(lat, 6), "longitude": round(lon, 6)}
    except Exception as e:
        logger.debug(f"GPS parsing error: {e}")
    return None


def extract_metadata(file_bytes: bytes, file_name: str, mime_type: str) -> Dict[str, Any]:
    """
    Extracts structured technical metadata, EXIF parameters, device characteristics,
    and timestamps from ingested evidence.
    """
    metadata: Dict[str, Any] = {
        "file_name": file_name,
        "mime_type": mime_type,
        "file_size": len(file_bytes),
        "extracted_at": datetime.now(timezone.utc).isoformat(),
        "has_exif": False,
        "exif_tags": {},
        "device_info": {},
        "geo_location": None,
        "timestamps": {},
    }

    # Image-specific EXIF extraction
    if mime_type.startswith("image/"):
        try:
            image = Image.open(io.BytesIO(file_bytes))
            metadata["dimensions"] = {"width": image.width, "height": image.height}
            metadata["image_format"] = image.format

            exif_raw = image.getexif()
            if exif_raw:
                metadata["has_exif"] = True
                parsed_exif = {}
                for tag_id, value in exif_raw.items():
                    tag_name = ExifTags.TAGS.get(tag_id, str(tag_id))
                    # Avoid serializing binary values directly
                    if isinstance(value, (bytes, bytearray)):
                        continue
                    parsed_exif[tag_name] = str(value)

                metadata["exif_tags"] = parsed_exif

                # Extract key forensic metadata
                if "Make" in parsed_exif:
                    metadata["device_info"]["make"] = parsed_exif["Make"]
                if "Model" in parsed_exif:
                    metadata["device_info"]["model"] = parsed_exif["Model"]
                if "Software" in parsed_exif:
                    metadata["device_info"]["software"] = parsed_exif["Software"]
                if "DateTimeOriginal" in parsed_exif:
                    metadata["timestamps"]["original"] = parsed_exif["DateTimeOriginal"]
                if "DateTime" in parsed_exif:
                    metadata["timestamps"]["modified"] = parsed_exif["DateTime"]

                # Extract GPS tags if present
                gps_raw = (
                    exif_raw.get_ifd(ExifTags.IFD.GPSInfo) if hasattr(ExifTags, "IFD") else None
                )
                if gps_raw:
                    coords = parse_gps_coordinates(dict(gps_raw))
                    if coords:
                        metadata["geo_location"] = coords

        except Exception as e:
            logger.warning(f"Error parsing image EXIF for {file_name}: {str(e)}")

    # Text / chat transcript metadata
    elif mime_type.startswith("text/") or file_name.endswith((".txt", ".json", ".csv", ".log")):
        try:
            text_str = file_bytes.decode("utf-8", errors="ignore")
            metadata["line_count"] = len(text_str.splitlines())
            metadata["char_count"] = len(text_str)
        except Exception:
            pass

    return metadata
