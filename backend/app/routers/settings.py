import uuid
import datetime
import secrets
from typing import List
from fastapi import APIRouter, HTTPException
from ..models import (
    ApiKey,
    CreateApiKeyRequest,
    DataSourceConfig,
    UpdateDataSourceKeyRequest,
    TeamMember,
    InviteTeamMemberRequest,
    NotificationChannel,
    UpdateNotificationChannelRequest,
)
from ..data.repository import repository

router = APIRouter(prefix="/settings", tags=["Settings & Administration"])

# ----------------------------------------------------------------------
# API Keys (Sentra Prefix: sn_live_ / sn_test_)
# ----------------------------------------------------------------------
@router.get("/api-keys", response_model=List[ApiKey])
def get_api_keys():
    """
    Returns existing API keys with masked token representations.
    """
    return repository.get_api_keys()

@router.post("/api-keys", response_model=ApiKey)
def create_api_key(payload: CreateApiKeyRequest):
    """
    Generates a new programmatic access key with 'sn_live_' prefix.
    The raw token is returned once in fullKey.
    """
    raw_hex = secrets.token_hex(16)
    full_key = f"sn_live_{raw_hex}"
    masked = f"sn_live_{raw_hex[:4]}••••••••••••••{raw_hex[-4:]}"

    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    new_key = ApiKey(
        id=f"key-{uuid.uuid4().hex[:8]}",
        name=payload.name,
        prefix="sn_live",
        keyMasked=masked,
        fullKey=full_key,
        role=payload.role,
        createdAt=now_iso,
        lastUsed="Never",
        scopes=payload.scopes,
    )
    return repository.add_api_key(new_key)

@router.delete("/api-keys/{key_id}")
def revoke_api_key(key_id: str):
    """
    Revokes an API key immediately.
    """
    success = repository.revoke_api_key(key_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"API key '{key_id}' not found")
    return {"success": True, "message": f"API key {key_id} successfully revoked"}

# ----------------------------------------------------------------------
# Connected Data Sources (BYOK)
# ----------------------------------------------------------------------
@router.get("/data-sources", response_model=List[DataSourceConfig])
def get_data_sources():
    """
    Returns external threat intelligence connector configurations
    (Shodan, VirusTotal, Censys, HIBP, AlienVault).
    """
    return repository.get_data_sources()

@router.put("/data-sources/{service_id}", response_model=DataSourceConfig)
def update_data_source(service_id: str, payload: UpdateDataSourceKeyRequest):
    """
    Saves external API credentials and validates connectivity.
    """
    updated = repository.update_data_source(service_id, payload.apiKey)
    if not updated:
        raise HTTPException(status_code=404, detail=f"Data source '{service_id}' not found")
    return updated

# ----------------------------------------------------------------------
# Team Members & Roles (Admin, Analyst, Viewer)
# ----------------------------------------------------------------------
@router.get("/team", response_model=List[TeamMember])
def get_team_members():
    """
    Returns workspace team roster with roles and 2FA status.
    """
    return repository.get_team_members()

@router.post("/team/invite", response_model=TeamMember)
def invite_team_member(payload: InviteTeamMemberRequest):
    """
    Dispatches invitation link to a new security analyst or team member.
    """
    new_member = TeamMember(
        id=f"usr-{uuid.uuid4().hex[:8]}",
        name=payload.name,
        email=payload.email,
        role=payload.role,
        status="pending",
        twoFactorEnabled=False,
        lastActive="Invitation sent",
    )
    return repository.add_team_member(new_member)

# ----------------------------------------------------------------------
# Alert Notification Channels (Email, Telegram, Slack, WhatsApp)
# ----------------------------------------------------------------------
@router.get("/notifications", response_model=List[NotificationChannel])
def get_notification_channels():
    """
    Returns incident routing destinations and category filters.
    """
    return repository.get_notification_channels()

@router.patch("/notifications/{channel_name}", response_model=NotificationChannel)
def update_notification_channel(channel_name: str, payload: UpdateNotificationChannelRequest):
    """
    Updates notification delivery settings and alert category toggles.
    """
    updated = repository.update_notification_channel(channel_name, payload.model_dump(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail=f"Notification channel '{channel_name}' not found")
    return updated
