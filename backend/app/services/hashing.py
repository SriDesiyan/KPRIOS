import hashlib
import os
from typing import BinaryIO


def compute_sha256_bytes(data: bytes) -> str:
    """Computes SHA-256 hash of raw byte buffer."""
    hasher = hashlib.sha256()
    hasher.update(data)
    return hasher.hexdigest()


def compute_sha256_file(file_path: str, chunk_size: int = 65536) -> str:
    """Computes SHA-256 hash of a file on disk using streaming chunks."""
    hasher = hashlib.sha256()
    with open(file_path, "rb") as f:
        while chunk := f.read(chunk_size):
            hasher.update(chunk)
    return hasher.hexdigest()


def compute_sha256_stream(stream: BinaryIO, chunk_size: int = 65536) -> str:
    """Computes SHA-256 hash from a readable binary stream."""
    hasher = hashlib.sha256()
    while chunk := stream.read(chunk_size):
        hasher.update(chunk)
    stream.seek(0)
    return hasher.hexdigest()


def verify_file_integrity(file_path: str, expected_hash: str) -> bool:
    """
    Verifies that the file on disk strictly matches its recorded SHA-256 hash.
    Invariant: Evidence is immutable and checked on access.
    """
    if not os.path.exists(file_path):
        return False
    computed = compute_sha256_file(file_path)
    return computed.lower() == expected_hash.lower()
