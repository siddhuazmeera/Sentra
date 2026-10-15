import uuid
import datetime
from typing import Dict, Any, List
from ..models import Report, Asset, CVE

def generate_stix_bundle(report: Report, assets: List[Asset], cves: List[CVE]) -> Dict[str, Any]:
    """
    Generates a full OASIS STIX 2.1 Cyber Threat Intelligence JSON bundle
    for submission to CERT-In or other cybersecurity incident response agencies.
    """
    bundle_id = f"bundle--{uuid.uuid4()}"
    now_iso = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%fZ")

    reporting_identity_id = f"identity--{uuid.uuid5(uuid.NAMESPACE_DNS, 'sentra.security')}"
    reporting_identity = {
        "type": "identity",
        "spec_version": "2.1",
        "id": reporting_identity_id,
        "created": now_iso,
        "modified": now_iso,
        "name": "Sentra Attack Surface & Threat Intelligence Platform",
        "description": "Automated attack surface monitoring and threat exposure telemetry engine",
        "identity_class": "system",
        "sectors": ["defense", "technology", "financial-services"],
    }

    objects = [reporting_identity]

    # Report Object
    report_obj_id = f"report--{uuid.uuid4()}"
    object_refs = [reporting_identity_id]

    # Create STIX objects for Assets (Domain, IPv4, Observed Data)
    for asset in assets:
        domain_sdo_id = f"domain-name--{uuid.uuid5(uuid.NAMESPACE_DNS, asset.asset)}"
        domain_sdo = {
            "type": "domain-name",
            "spec_version": "2.1",
            "id": domain_sdo_id,
            "value": asset.asset,
        }
        objects.append(domain_sdo)
        object_refs.append(domain_sdo_id)

        if asset.ip and asset.ip != "0.0.0.0":
            ipv4_id = f"ipv4-addr--{uuid.uuid5(uuid.NAMESPACE_DNS, asset.ip)}"
            ipv4_sdo = {
                "type": "ipv4-addr",
                "spec_version": "2.1",
                "id": ipv4_id,
                "value": asset.ip,
            }
            objects.append(ipv4_sdo)
            object_refs.append(ipv4_id)

    # Create STIX objects for CVEs (Vulnerability SDOs)
    for cve in cves:
        vuln_id = f"vulnerability--{uuid.uuid5(uuid.NAMESPACE_DNS, cve.id)}"
        vuln_sdo = {
            "type": "vulnerability",
            "spec_version": "2.1",
            "id": vuln_id,
            "created": now_iso,
            "modified": now_iso,
            "name": cve.id,
            "description": cve.description,
            "external_references": [
                {
                    "source_name": "cve",
                    "external_id": cve.id,
                    "url": f"https://nvd.nist.gov/vuln/detail/{cve.id}",
                }
            ],
            "x_cvss_score": cve.cvss,
            "x_epss_probability": cve.epss,
            "x_cisa_kev": cve.cisaKev,
        }
        objects.append(vuln_sdo)
        object_refs.append(vuln_id)

    # Main STIX Report SDO
    report_sdo = {
        "type": "report",
        "spec_version": "2.1",
        "id": report_obj_id,
        "created": now_iso,
        "modified": now_iso,
        "name": report.title,
        "description": report.incidentDescription or f"Sentra Incident & Risk Assessment Report for {report.targetDomain}",
        "published": now_iso,
        "report_types": ["threat-report", "vulnerability"],
        "object_refs": object_refs,
        "created_by_ref": reporting_identity_id,
        "x_sentra_report_type": report.type,
        "x_sentra_sha256_seal": report.sha256Hash,
        "x_sentra_target_domain": report.targetDomain,
    }
    objects.append(report_sdo)

    return {
        "type": "bundle",
        "id": bundle_id,
        "spec_version": "2.1",
        "objects": objects,
    }
