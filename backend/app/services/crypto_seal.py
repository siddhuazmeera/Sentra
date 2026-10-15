import hashlib
import json
import datetime
from typing import Any, Dict

def compute_sha256(content: str) -> str:
    """Computes a hexadecimal SHA-256 digest of string content."""
    return hashlib.sha256(content.encode("utf-8")).hexdigest()

def generate_report_seal(report_payload: Dict[str, Any]) -> str:
    """
    Generates a deterministic cryptographic SHA-256 seal for a report and its attachments.
    """
    # Sort keys for consistent canonical serialization
    serialized = json.dumps(report_payload, sort_keys=True, default=str)
    return compute_sha256(serialized)

def create_audit_entry(action: str, user: str, evidence_hash: str = "") -> Dict[str, str]:
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()
    entry = {
        "action": action,
        "user": user,
        "timestamp": now,
    }
    if evidence_hash:
        entry["hash"] = evidence_hash
    else:
        entry["hash"] = compute_sha256(f"{action}:{user}:{now}")
    return entry
