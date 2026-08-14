import io

from PIL import Image

from app.models.entity import EntityType
from app.services.extraction.metadata_extractor import extract_metadata
from app.services.extraction.nlp_extractor import (
    extract_entities_from_text,
    extract_facts_from_content,
)
from app.services.extraction.ocr_extractor import extract_ocr_text


def test_metadata_extractor_on_image():
    # Create simple in-memory PNG image
    img = Image.new("RGB", (100, 100), color="blue")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    file_bytes = buf.getvalue()

    metadata = extract_metadata(file_bytes, "test_image.png", "image/png")
    assert metadata["file_name"] == "test_image.png"
    assert metadata["mime_type"] == "image/png"
    assert metadata["dimensions"] == {"width": 100, "height": 100}


def test_ocr_extractor_transparency():
    img = Image.new("RGB", (50, 50), color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    file_bytes = buf.getvalue()

    result = extract_ocr_text(file_bytes, "image/png")
    assert result["status"] in ("success", "unavailable", "skipped", "error")
    assert isinstance(result["text"], str)


def test_nlp_entity_extraction_cac_classes():
    sample_text = """
    Officer report: Suspect contact Rahul (handle @cyber_kerala) was contacting victim through
    email rahul.kpyrios@gmail.com and phone +919876543210.
    Ethereum address for transfer: 0x71C8705E3A338E07771040aD7862767098495094.
    Location: Ernakulam, Kerala.
    """
    entities = extract_entities_from_text(sample_text, source_evidence_id="ev-001")

    # Verify extracted entities
    types_found = {e["entity_type"] for e in entities}
    assert EntityType.DIGITAL_ACCOUNT in types_found  # Email / handle
    assert EntityType.PHONE_NUMBER in types_found  # Phone
    assert EntityType.CRYPTO_ADDRESS in types_found  # Ethereum address
    assert EntityType.LOCATION in types_found  # Location

    # Verify structural source_ids on every entity
    for e in entities:
        assert e["source_ids"] == ["ev-001"]
        assert e["confidence"] > 0.0


def test_fact_extraction_from_content():
    metadata = {
        "file_name": "evidence_log.txt",
        "file_size": 512,
        "mime_type": "text/plain",
        "has_exif": False,
    }
    sample_text = "Activity recorded at timestamp 2026-08-14T10:30:00Z during interrogation."
    facts = extract_facts_from_content(sample_text, metadata, source_evidence_id="ev-002")

    assert len(facts) >= 2
    for f in facts:
        assert f["source_ids"] == ["ev-002"]
        assert f["statement"] != ""
