import hashlib
from typing import Dict, List, Optional

from app.models.evidence import EvidenceItem


def compute_source_fingerprint(
    content_hash: str,
    file_size: int,
    mime_type: str,
    derivation_parent_hash: Optional[str] = None,
) -> str:
    """
    Computes a deterministic source fingerprint for deduplication clustering.
    Combines SHA-256 content hash with normalized derivation lineage and structural properties.
    """
    fingerprint_seed = f"hash:{content_hash}|size:{file_size}|mime:{mime_type}"
    if derivation_parent_hash:
        fingerprint_seed += f"|parent:{derivation_parent_hash}"

    return hashlib.sha256(fingerprint_seed.encode("utf-8")).hexdigest()


def cluster_evidence_by_fingerprint(evidence_items: List[EvidenceItem]) -> Dict[str, List[str]]:
    """
    Groups evidence item IDs into clusters sharing matching source fingerprints or exact SHA-256 hashes.
    Returns mapping: cluster_key -> list of evidence item IDs.
    """
    clusters: Dict[str, List[str]] = {}
    for item in evidence_items:
        # Group by hash or source_fingerprint
        key = item.source_fingerprint or item.hash
        if key not in clusters:
            clusters[key] = []
        clusters[key].append(item.id)
    return clusters
