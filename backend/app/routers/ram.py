import io
import time
import secrets
import json
import base64
from typing import Optional, List, Dict, Any
import httpx
from fastapi import APIRouter, Request, Response, HTTPException, Depends, UploadFile, File
from pydantic import BaseModel
from app.config import settings
from app.services.ram_client import ram_service

COOKIE_NAME = "ram_sid"

def extract_jwt_exp(token: str) -> Optional[float]:
    """Safely extracts the expiration timestamp from an unverified JWT payload."""
    try:
        parts = token.split(".")
        if len(parts) == 3:
            payload_b64 = parts[1] + "=" * (-len(parts[1]) % 4)
            payload_json = base64.urlsafe_b64decode(payload_b64.encode()).decode("utf-8")
            data = json.loads(payload_json)
            if "exp" in data:
                return float(data["exp"])
    except Exception:
        pass
    return None

async def get_session_context(request: Request, response: Response) -> str:
    raw_sid = request.headers.get("X-Session-Id") or request.cookies.get(COOKIE_NAME)
    if not raw_sid:
        raw_sid = secrets.token_urlsafe(24)
        response.set_cookie(
            key=COOKIE_NAME,
            value=raw_sid,
            httponly=True,
            samesite="lax",
            secure=settings.COOKIE_SECURE,
            path="/"
        )
    team_id = request.headers.get("X-Team-Id", "default")
    sid = f"{raw_sid}@{team_id}"
    request.state.sid = sid
    request.state.raw_sid = raw_sid

    session = ram_service.get_or_create_session(sid)

    # Ingest refresh token if provided by frontend
    refresh_header = request.headers.get("X-Refresh-Token")
    if refresh_header and refresh_header not in ("null", "undefined", ""):
        session["refresh_token"] = refresh_header

    # Auto-hydrate session token from Authorization header if provided and valid
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        bearer_token = auth_header.split(" ", 1)[1].strip()
        if bearer_token and bearer_token not in ("null", "undefined", ""):
            exp = extract_jwt_exp(bearer_token)
            if exp is not None:
                if exp <= time.time() and not session.get("refresh_token"):
                    # Token already expired and no refresh token available
                    session["token"] = None
                    session["expires_at"] = 0
                else:
                    session["token"] = bearer_token
                    session["expires_at"] = exp
            elif settings.RAM_TOKEN and bearer_token == settings.RAM_TOKEN:
                session["token"] = bearer_token
                session["expires_at"] = time.time() + 86400
            elif not session.get("token"):
                session["token"] = bearer_token
                session["expires_at"] = time.time() + 3600

    return sid

router = APIRouter(dependencies=[Depends(get_session_context)])

# ── Health & Auto-Detection ──
@router.get("/health")
async def health_check(request: Request, response: Response):
    sid = request.state.sid
    authenticated = False
    
    if settings.RAM_TOKEN:
        authenticated = True
    else:
        session = ram_service.get_or_create_session(sid)
        token = session.get("token")
        expires_at = session.get("expires_at", 0)
        
        # 1. Unexpired active token
        if token and token not in ("null", "undefined", "") and expires_at > time.time() + 10:
            authenticated = True
        # 2. Token expired or nearing expiration: attempt seamless token refresh
        elif session.get("refresh_token"):
            try:
                new_token = await ram_service.get_valid_token(sid)
                if new_token:
                    authenticated = True
                    response.headers["X-New-Token"] = new_token
            except Exception as e:
                # Refresh failed or revoked
                authenticated = False
        else:
            authenticated = False

    return {
        "status": "ok" if authenticated else "signin_required",
        "authenticated": authenticated,
        "token": session.get("token") if authenticated else None,
        "refreshToken": session.get("refresh_token") if authenticated else None,
        "signinFlow": "device",
        "clientConfig": {
            "defaultAgentId": settings.DEFAULT_AGENT_ID,
            "maxAttachChars": settings.MAX_ATTACH_CHARS,
        }
    }

# ── Authentication Endpoints ──
@router.post("/auth/device/start")
async def device_start(request: Request):
    res = await ram_service.start_device_flow(request.state.sid)
    res["sessionId"] = getattr(request.state, "raw_sid", None)
    return res

class DevicePollRequest(BaseModel):
    deviceCode: Optional[str] = None
    verifier: Optional[str] = None

@router.post("/auth/device/poll")
async def device_poll(body: Optional[DevicePollRequest] = None, request: Request = None):
    device_code = body.deviceCode if body else None
    verifier = body.verifier if body else None
    res = await ram_service.poll_device_flow(request.state.sid, device_code=device_code, verifier=verifier)
    res["sessionId"] = getattr(request.state, "raw_sid", None)
    return res

class RestoreSessionRequest(BaseModel):
    session: Dict[str, Any]

@router.post("/auth/restore")
async def restore_session(body: RestoreSessionRequest, request: Request):
    sid = request.state.sid
    ram_service.import_session(sid, body.session)
    try:
        token = await ram_service.get_valid_token(sid)
        return {"ok": True, "authenticated": True, "tokenValid": bool(token)}
    except Exception as e:
        return {"ok": False, "authenticated": False, "error": str(e)}

@router.post("/auth/signout")
async def signout(request: Request, response: Response):
    sid = request.state.sid
    ram_service.clear_session(sid)
    response.delete_cookie(COOKIE_NAME, path="/")
    return {"ok": True, "authenticated": False}

# ── Query & Async Polling ──
class QuerySubmission(BaseModel):
    content: str
    agentId: Optional[str] = None
    querySessionId: Optional[str] = None
    attachments: Optional[List[Dict[str, Any]]] = None

@router.post("/query")
async def submit_query(body: QuerySubmission, request: Request):
    return await ram_service.submit_query_async(
        sid=request.state.sid,
        content=body.content,
        agent_id=body.agentId,
        query_session_id=body.querySessionId,
        attachments=body.attachments,
    )

@router.get("/query/{query_id}")
async def get_query(query_id: str, request: Request):
    return await ram_service.get_query_status(request.state.sid, query_id)

@router.get("/query/{query_id}/trace")
async def get_trace(query_id: str, request: Request):
    return await ram_service.get_query_trace(request.state.sid, query_id)

# ── Sessions & Re-hydration ──
@router.get("/querySessions")
async def list_query_sessions(request: Request):
    res = await ram_service.request(request.state.sid, "GET", "/querySessions?sortBy=insertTimestamp:descending&limit=50")
    return res.json()

@router.get("/querySessions/{session_id}")
async def get_session_history(session_id: str, request: Request):
    # Fetch turns for session
    res = await ram_service.request(request.state.sid, "GET", f"/query?filter=eq(querySessionId,'{session_id}')&limit=100")
    data = res.json()
    items = data.get("items", [])
    
    # Re-hydrate tool outputs for prior turns!
    await ram_service.attach_tool_outputs(request.state.sid, items)
    return {"sessionId": session_id, "items": items}

@router.delete("/querySessions/{session_id}")
async def delete_query_session(session_id: str, request: Request):
    res = await ram_service.request(request.state.sid, "DELETE", f"/querySessions/{session_id}")
    return {"ok": res.status_code in (200, 204)}

# ── Collections & Agents ──
@router.get("/collections")
async def list_collections(request: Request):
    res = await ram_service.request(request.state.sid, "GET", "/collections?limit=50")
    return res.json()

@router.get("/agents")
async def list_agents(request: Request):
    res = await ram_service.request(request.state.sid, "GET", "/agents?limit=50")
    return res.json()

# ── Ad-Hoc Document Text Extraction ──
@router.post("/extract")
async def extract_document(file: UploadFile = File(...)):
    data = await file.read()
    ext = (file.filename or "").rsplit(".", 1)[-1].lower()
    text = ""
    
    if ext == "pdf":
        try:
            from pypdf import PdfReader
            reader = PdfReader(io.BytesIO(data))
            text = "\n".join(p.extract_text() or "" for p in reader.pages)
        except Exception as e:
            raise HTTPException(status_code=422, detail=f"Failed to parse PDF: {str(e)}")
    elif ext in ("txt", "md", "csv", "json", "xml", "log"):
        text = data.decode("utf-8", errors="replace")
    elif ext in ("docx", "doc"):
        try:
            import docx
            doc = docx.Document(io.BytesIO(data))
            text = "\n".join(p.text for p in doc.paragraphs)
        except Exception:
            text = data.decode("utf-8", errors="replace")
    else:
        raise HTTPException(status_code=415, detail=f"Unsupported attachment type: .{ext}")

    truncated = len(text) > settings.MAX_ATTACH_CHARS
    return {
        "name": file.filename,
        "text": text[: settings.MAX_ATTACH_CHARS],
        "charCount": len(text),
        "truncated": truncated,
        "maxBudget": settings.MAX_ATTACH_CHARS
    }
