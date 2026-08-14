from typing import List

from app.core.logging import logger
from app.models.entity import Entity, ProposalStatus


def calculate_string_similarity(s1: str, s2: str) -> float:
    """
    Computes a normalized similarity score (0.0 to 1.0) between two strings
    using Jaccard token overlap, prefix containment, and character bigram similarity.
    """
    s1_clean = s1.strip().lower()
    s2_clean = s2.strip().lower()

    if not s1_clean or not s2_clean:
        return 0.0

    if s1_clean == s2_clean:
        return 1.0

    # Prefix / Substring match
    if s1_clean.startswith(s2_clean) or s2_clean.startswith(s1_clean):
        min_len = min(len(s1_clean), len(s2_clean))
        max_len = max(len(s1_clean), len(s2_clean))
        prefix_ratio = min_len / max_len
        if prefix_ratio >= 0.5:
            return round(0.5 + 0.5 * prefix_ratio, 3)

    # Token overlap
    tokens1 = set(s1_clean.split())
    tokens2 = set(s2_clean.split())
    if tokens1 and tokens2:
        common_tokens = tokens1 & tokens2
        if common_tokens:
            token_overlap = len(common_tokens) / min(len(tokens1), len(tokens2))
            if token_overlap >= 0.5:
                return round(0.6 + 0.4 * (len(common_tokens) / len(tokens1 | tokens2)), 3)

    # Bigram character similarity
    def get_bigrams(s: str) -> set:
        return {s[i : i + 2] for i in range(len(s) - 1)}

    b1 = get_bigrams(s1_clean)
    b2 = get_bigrams(s2_clean)

    if not b1 or not b2:
        return 0.0

    intersection = len(b1 & b2)
    union = len(b1 | b2)
    return round(intersection / union, 3)


def generate_candidate_merge_proposals(
    entities: List[Entity],
    threshold: float = 0.70,
) -> List[dict]:
    """
    Evaluates pairwise entity similarity and generates candidate merge proposal dictionaries.
    Invariant: Proposal-only operation. Never modifies or merges the entities automatically.
    """
    proposals: List[dict] = []
    n = len(entities)

    for i in range(n):
        for j in range(i + 1, n):
            e1 = entities[i]
            e2 = entities[j]

            # Only compare entities of compatible types
            if e1.entity_type != e2.entity_type:
                continue

            score = calculate_string_similarity(e1.name, e2.name)

            # Check matching attributes (e.g. same phone digits or email)
            if score < threshold and e1.attributes and e2.attributes:
                for k, v in e1.attributes.items():
                    if k in e2.attributes and e2.attributes[k] == v:
                        score = max(score, 0.85)

            if score >= threshold:
                proposals.append(
                    {
                        "case_id": e1.case_id,
                        "source_entity_id": e1.id,
                        "target_entity_id": e2.id,
                        "similarity_score": score,
                        "reason": f"High lexical/attribute similarity ({int(score * 100)}%) between '{e1.name}' and '{e2.name}'.",
                        "status": ProposalStatus.PENDING,
                    }
                )
                logger.info(
                    f"Generated EntityMergeProposal: '{e1.name}' <-> '{e2.name}' (score={score}, status=PENDING)"
                )

    return proposals
