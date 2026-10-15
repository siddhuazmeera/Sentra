import datetime
import uuid
from typing import List
from fastapi import APIRouter, HTTPException, Response
from ..models import Report, CreateReportRequest, AuditLogEntry
from ..data.repository import repository
from ..services.crypto_seal import generate_report_seal, create_audit_entry
from ..services.stix_generator import generate_stix_bundle

router = APIRouter(prefix="/reports", tags=["Reports & CERT-In Filing"])

@router.get("", response_model=List[Report])
def get_reports():
    """
    Returns incident disclosure reports with immutable SHA-256 seals
    and audit log chain-of-custody trails.
    """
    return repository.get_reports()

@router.get("/{report_id}", response_model=Report)
def get_report_by_id(report_id: str):
    """
    Returns a single report by ID.
    """
    report = repository.get_report_by_id(report_id)
    if not report:
        raise HTTPException(status_code=404, detail=f"Report '{report_id}' not found")
    return report

@router.post("", response_model=Report)
def create_report(payload: CreateReportRequest):
    """
    Generates an evidence-backed incident report:
    - Executive summary
    - Technical deep-dive
    - CERT-In / Cybercrime statutory disclosure format
    Computes cryptographic SHA-256 digest of report contents + evidence attachments.
    """
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    report_id = f"rep-{uuid.uuid4().hex[:8]}"

    report_dict = payload.model_dump()
    report_dict["id"] = report_id
    report_dict["generatedAt"] = now_iso

    # Generate cryptographic SHA-256 seal for tamper resistance
    sha256_hash = generate_report_seal(report_dict)

    audit_entry = AuditLogEntry(
        action="Report Generated & Cryptographically Stamped",
        user="SecOps Analyst (You)",
        timestamp=now_iso,
        hash=sha256_hash,
    )

    report_obj = Report(
        id=report_id,
        title=payload.title,
        type=payload.type,
        status="submitted" if payload.type == "cert-in" else "exported",
        generatedAt=now_iso,
        targetDomain=payload.targetDomain,
        findingsCount=len(payload.selectedFindingIds) or 3,
        fileFormat=payload.fileFormat,
        incidentDescription=payload.incidentDescription,
        evidenceAttachments=payload.evidenceAttachments,
        selectedAssetIds=payload.selectedAssetIds,
        selectedFindingIds=payload.selectedFindingIds,
        sha256Hash=sha256_hash,
        auditLog=[audit_entry],
    )

    return repository.add_report(report_obj)

@router.get("/{report_id}/export/stix")
def export_stix_bundle(report_id: str):
    """
    Exports report as an OASIS STIX 2.1 Cyber Threat Intelligence JSON bundle
    ready for submission to CERT-In or ingestion into threat-intel platforms.
    """
    report = repository.get_report_by_id(report_id)
    if not report:
        raise HTTPException(status_code=404, detail=f"Report '{report_id}' not found")

    assets = [a for a in repository.assets if a.id in (report.selectedAssetIds or [])]
    selected_finding_ids = set(report.selectedFindingIds or [])
    finding_cve_ids = {f.cveId for f in repository.findings if f.id in selected_finding_ids and f.cveId}
    cves = [
        c for c in repository.cves
        if c.id in selected_finding_ids or c.id in finding_cve_ids
    ]

    bundle = generate_stix_bundle(report, assets, cves)
    return bundle

@router.get("/{report_id}/export/pdf")
def export_pdf_report(report_id: str):
    """
    Generates a printable plaintext / markdown incident dossier with cryptographic stamps.
    """
    report = repository.get_report_by_id(report_id)
    if not report:
        raise HTTPException(status_code=404, detail=f"Report '{report_id}' not found")

    content = f"""================================================================================
SENTRA INCIDENT & ATTACK SURFACE DOSSIER
CONFIDENTIAL - CYBER THREAT INTELLIGENCE
================================================================================
Report ID:         {report.id}
Title:             {report.title}
Report Type:       {report.type.upper()}
Target Domain:     {report.targetDomain}
Generated At:      {report.generatedAt}
Status:            {report.status.upper()}
Cryptographic Seal (SHA-256):
{report.sha256Hash}

INCIDENT SUMMARY & DESCRIPTION:
{report.incidentDescription or 'Standard attack surface perimeter assessment.'}

EVIDENCE ATTACHMENTS & ARTIFACT CHECKSUMS:
"""
    for att in report.evidenceAttachments or []:
        content += f"- Artifact: {att.name} ({att.size}) | Timestamp: {att.timestamp}\n  SHA-256: {att.sha256}\n"

    content += f"""
CHAIN OF CUSTODY AUDIT TRAIL:
"""
    for log in report.auditLog:
        content += f"- [{log.timestamp}] {log.action} by {log.user}\n  Hash: {log.hash}\n"

    content += "\n================================================================================\n"

    return Response(
        content=content,
        media_type="text/plain",
        headers={
            "Content-Disposition": f"attachment; filename=sentra-report-{report.id}.txt"
        },
    )
