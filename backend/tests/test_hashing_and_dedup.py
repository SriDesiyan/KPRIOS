import os
import tempfile

from app.models.evidence import EvidenceItem, EvidenceModality
from app.services.deduplication import cluster_evidence_by_fingerprint, compute_source_fingerprint
from app.services.hashing import (
    compute_sha256_bytes,
    compute_sha256_file,
    verify_file_integrity,
)


def test_sha256_bytes_computation():
    data = b"Sample digital forensics chat transcript between suspect and contact."
    h1 = compute_sha256_bytes(data)
    h2 = compute_sha256_bytes(data)

    assert len(h1) == 64
    assert h1 == h2
    assert compute_sha256_bytes(b"Different data") != h1


def test_sha256_file_and_integrity_verification():
    with tempfile.NamedTemporaryFile(delete=False) as tmp:
        tmp.write(b"Forensic file content for integrity check")
        tmp_path = tmp.name

    try:
        file_hash = compute_sha256_file(tmp_path)
        assert verify_file_integrity(tmp_path, file_hash) is True
        assert verify_file_integrity(tmp_path, "0" * 64) is False
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


def test_source_fingerprint_clustering():
    fp1 = compute_source_fingerprint("hashA", 1024, "image/jpeg")
    fp2 = compute_source_fingerprint("hashA", 1024, "image/jpeg")
    fp3 = compute_source_fingerprint("hashB", 2048, "text/plain")

    assert fp1 == fp2
    assert fp1 != fp3

    item1 = EvidenceItem(
        id="item-1",
        case_id="case-1",
        hash="hashA",
        source_fingerprint=fp1,
        modality=EvidenceModality.IMAGE,
        file_name="photo1.jpg",
        file_size_bytes=1024,
        mime_type="image/jpeg",
        storage_path="/tmp/photo1.jpg",
        trust_vector={},
        metadata_payload={},
    )
    item2 = EvidenceItem(
        id="item-2",
        case_id="case-1",
        hash="hashA",
        source_fingerprint=fp1,
        modality=EvidenceModality.IMAGE,
        file_name="photo1_copy.jpg",
        file_size_bytes=1024,
        mime_type="image/jpeg",
        storage_path="/tmp/photo1_copy.jpg",
        trust_vector={},
        metadata_payload={},
    )
    item3 = EvidenceItem(
        id="item-3",
        case_id="case-1",
        hash="hashB",
        source_fingerprint=fp3,
        modality=EvidenceModality.DOCUMENT,
        file_name="doc.txt",
        file_size_bytes=2048,
        mime_type="text/plain",
        storage_path="/tmp/doc.txt",
        trust_vector={},
        metadata_payload={},
    )

    clusters = cluster_evidence_by_fingerprint([item1, item2, item3])
    assert len(clusters) == 2
    assert len(clusters[fp1]) == 2
    assert "item-1" in clusters[fp1]
    assert "item-2" in clusters[fp1]
    assert len(clusters[fp3]) == 1
