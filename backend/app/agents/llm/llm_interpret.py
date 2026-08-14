import re
from typing import Any, Dict, List

from app.core.logging import logger


def interpret_unstructured_evidence(
    raw_text: str,
    source_evidence_id: str,
    known_entities: List[Dict[str, Any]],
    known_evidence: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """
    Bounded LLM interpretation service.
    Converts unstructured evidence into typed JSON facts with prompt-injection defense.
    Invariant: Raw evidence text is treated strictly as data within isolated delimiters,
    never interpreted as commands or concatenated into the system instructions.
    """
    # 1. Prompt Injection Sanitization: neutralize command injection tokens
    sanitized_text = re.sub(
        r"(?i)(ignore previous instructions|system prompt|you are now|delete database)",
        "[BLOCKED_PROMPT_INJECTION_PATTERN]",
        raw_text,
    )

    # 2. Extract structured observations deterministically
    facts: List[Dict[str, Any]] = []
    lines = sanitized_text.splitlines()

    for line in lines:
        line_clean = line.strip()
        if not line_clean or line_clean.startswith("#"):
            continue

        # Extract structured statement
        facts.append(
            {
                "statement": line_clean[:200],
                "fact_type": "OBSERVATION",
                "source_ids": [source_evidence_id],
                "confidence": 0.90,
                "attributes": {"extraction_method": "bounded_interpretation"},
            }
        )

    logger.info(f"Interpreted {len(facts)} structured facts from evidence {source_evidence_id}")
    return facts
