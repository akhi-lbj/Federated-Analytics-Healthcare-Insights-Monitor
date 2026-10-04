import os
import io
import json
import time
import secrets
import base64
import hashlib
import asyncio
from typing import Optional, Dict, Any, List
import httpx
from fastapi import HTTPException
from app.config import settings

class RamClientService:
    def __init__(self):
        self._sessions: Dict[str, Dict[str, Any]] = {}
        self._locks: Dict[str, asyncio.Lock] = {}
        self._load_sessions_from_disk()

    def _get_lock(self, sid: str) -> asyncio.Lock:
        if sid not in self._locks:
            self._locks[sid] = asyncio.Lock()
        return self._locks[sid]

    def _load_sessions_from_disk(self):
        if os.path.exists(settings.RAM_SESSION_FILE):
            try:
                with open(settings.RAM_SESSION_FILE, "r") as f:
                    self._sessions = json.load(f)
            except Exception:
                self._sessions = {}

    def _save_sessions_to_disk(self):
        try:
            with open(settings.RAM_SESSION_FILE, "w") as f:
                json.dump(self._sessions, f)
        except Exception:
            pass

    def get_or_create_session(self, sid: str) -> Dict[str, Any]:
        if sid not in self._sessions:
            self._sessions[sid] = {
                "token": None,
                "refresh_token": None,
                "expires_at": 0,
                "device": {},
                "created_at": time.time(),
            }
        return self._sessions[sid]

    def export_session(self, sid: str) -> Dict[str, Any]:
        session = self.get_or_create_session(sid)
        return {
            "token": session.get("token"),
            "refresh_token": session.get("refresh_token"),
            "expires_at": session.get("expires_at", 0),
        }

    def import_session(self, sid: str, data: Dict[str, Any]):
        session = self.get_or_create_session(sid)
        if data.get("token"):
            session["token"] = data["token"]
        if data.get("refresh_token"):
            session["refresh_token"] = data["refresh_token"]
        if data.get("expires_at"):
            session["expires_at"] = data["expires_at"]
        self._save_sessions_to_disk()

    def clear_session(self, sid: str):
        if sid in self._sessions:
            del self._sessions[sid]
            self._save_sessions_to_disk()

    # ─────────────────────────────────────────────────────────
    # Token Acquisition with Mutex Concurrency Lock
    # ─────────────────────────────────────────────────────────
    async def get_valid_token(self, sid: str) -> str:
        # Static Token override
        if settings.RAM_TOKEN:
            return settings.RAM_TOKEN

        session = self.get_or_create_session(sid)
        
        # Fast path
        if session.get("token") and session.get("expires_at", 0) > time.time() + 60:
            return session["token"]

        async with self._get_lock(sid):
            # Double check within mutex
            if session.get("token") and session.get("expires_at", 0) > time.time() + 60:
                return session["token"]

            refresh_token = session.get("refresh_token")
            if not refresh_token:
                raise HTTPException(status_code=401, detail="Authentication required. Please sign in.")

            # Refresh token grant
            token_url = f"{settings.KEYCLOAK_URL}/realms/{settings.REALM}/protocol/openid-connect/token"
            async with httpx.AsyncClient(verify=settings.VERIFY_SSL, timeout=15.0) as client:
                r = await client.post(
                    token_url,
                    data={
                        "grant_type": "refresh_token",
                        "client_id": settings.CLIENT_ID,
                        "refresh_token": refresh_token,
                    },
                )

            if r.status_code != 200:
                session["token"] = None
                session["refresh_token"] = None
                self._save_sessions_to_disk()
                raise HTTPException(status_code=401, detail="Session expired. Please sign in again.")

            data = r.json()
            session["token"] = data["access_token"]
            session["refresh_token"] = data.get("refresh_token", refresh_token)
            session["expires_at"] = time.time() + data.get("expires_in", 300)
            self._save_sessions_to_disk()
            return session["token"]

    # ─────────────────────────────────────────────────────────
    # Flow A: OAuth 2.0 Device Code Flow with PKCE
    # ─────────────────────────────────────────────────────────
    async def start_device_flow(self, sid: str) -> Dict[str, Any]:
        verifier = base64.urlsafe_b64encode(secrets.token_bytes(32)).decode().rstrip("=")
        challenge = base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest()).decode().rstrip("=")

        device_url = f"{settings.KEYCLOAK_URL}/realms/{settings.REALM}/protocol/openid-connect/auth/device"
        async with httpx.AsyncClient(verify=settings.VERIFY_SSL, timeout=15.0) as client:
            r = await client.post(
                device_url,
                data={
                    "client_id": settings.CLIENT_ID,
                    "scope": "openid",
                    "code_challenge": challenge,
                    "code_challenge_method": "S256",
                },
            )

        if r.status_code != 200:
            raise HTTPException(status_code=r.status_code, detail=f"Device authorization initiation failed: {r.text}")

        data = r.json()
        session = self.get_or_create_session(sid)
        session["device"] = {
            "verifier": verifier,
            "device_code": data.get("device_code"),
            "expires_at": time.time() + data.get("expires_in", 600),
            "interval": data.get("interval", 5),
        }
        return {
            "userCode": data.get("user_code"),
            "verificationUri": data.get("verification_uri"),
            "verificationUriComplete": data.get("verification_uri_complete"),
            "expiresIn": data.get("expires_in", 600),
            "interval": data.get("interval", 5),
        }

    async def poll_device_flow(self, sid: str) -> Dict[str, Any]:
        session = self.get_or_create_session(sid)
        device_state = session.get("device", {})
        device_code = device_state.get("device_code")
        verifier = device_state.get("verifier")

        if not device_code or not verifier:
            raise HTTPException(status_code=400, detail="No active device flow in progress. Start sign in first.")

        token_url = f"{settings.KEYCLOAK_URL}/realms/{settings.REALM}/protocol/openid-connect/token"
        async with httpx.AsyncClient(verify=settings.VERIFY_SSL, timeout=15.0) as client:
            r = await client.post(
                token_url,
                data={
                    "grant_type": "urn:ietf:params:oauth:grant-type:device_code",
                    "client_id": settings.CLIENT_ID,
                    "device_code": device_code,
                    "code_verifier": verifier,
                },
            )

        data = r.json()
        if r.status_code == 200:
            session["token"] = data["access_token"]
            session["refresh_token"] = data.get("refresh_token")
            session["expires_at"] = time.time() + data.get("expires_in", 300)
            session["device"] = {}
            self._save_sessions_to_disk()
            return {"ok": True, "authenticated": True, "session": self.export_session(sid)}

        err = data.get("error")
        if err in ("authorization_pending", "slow_down"):
            return {"pending": True, "slowDown": err == "slow_down"}
        if err == "expired_token":
            session["device"] = {}
            raise HTTPException(status_code=400, detail="Device code has expired. Please initiate sign in again.")

        raise HTTPException(status_code=400, detail=data.get("error_description", "Device authorization failed."))

    # ─────────────────────────────────────────────────────────
    # Upstream Request Helper (Intercepts 302 Ingress Redirects)
    # ─────────────────────────────────────────────────────────
    async def request(self, sid: str, method: str, path: str, **kwargs) -> httpx.Response:
        token = await self.get_valid_token(sid)
        url = f"{settings.RAM_API_URL.rstrip('/')}/{path.lstrip('/')}"
        headers = kwargs.pop("headers", {})
        headers["Authorization"] = f"Bearer {token}"
        headers.setdefault("Accept", "application/json")

        async with httpx.AsyncClient(verify=settings.VERIFY_SSL, follow_redirects=False, timeout=60.0) as client:
            res = await client.request(method, url, headers=headers, **kwargs)

        # Trap 302 Ingress Redirect to HTML login page
        if res.status_code in (301, 302, 307, 308):
            raise HTTPException(
                status_code=401,
                detail="Upstream session unauthorized (302 redirect intercepted). Please re-authenticate."
            )

        if res.status_code == 401:
            raise HTTPException(status_code=401, detail="Upstream returned 401 Unauthorized.")

        return res

    # ─────────────────────────────────────────────────────────
    # 504-Immune Asynchronous Query Submission
    # ─────────────────────────────────────────────────────────
    async def submit_query_async(
        self,
        sid: str,
        content: str,
        agent_id: Optional[str] = None,
        query_session_id: Optional[str] = None,
        attachments: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        formatted_prompt = content
        if attachments:
            for doc in attachments:
                name = doc.get("name", "document")
                text = doc.get("text", "")[: settings.MAX_ATTACH_CHARS]
                formatted_prompt += f"\n\n--- Attached document: {name} ---\n{text}\n--- End of attached document ---"
            formatted_prompt += "\n\nUse the attached document content above to answer the question where relevant."

        target_agent = agent_id or settings.DEFAULT_AGENT_ID
        if not target_agent:
            try:
                agents_res = await self.request(sid, "GET", "/agents?limit=10")
                if agents_res.status_code == 200:
                    items = agents_res.json().get("items", [])
                    fahim = next((a for a in items if "fahim" in a.get("name", "").lower()), None)
                    chosen = fahim or (items[0] if items else None)
                    if chosen:
                        target_agent = chosen.get("id")
            except Exception:
                pass

        if not target_agent:
            target_agent = "7011b392-41b7-4c46-a4a3-760db904d18e"

        payload = {
            "content": formatted_prompt,
            "agentId": target_agent,
            "querySessionId": query_session_id or None,
        }
        # Remove None values
        payload = {k: v for k, v in payload.items() if v is not None}

        # Submit with synchronous=false & persistent=true
        res = await self.request(sid, "POST", "/query?synchronous=false&persistent=true", json=payload)
        if res.status_code not in (200, 201):
            raise HTTPException(status_code=res.status_code, detail=f"Query submission failed: {res.text}")

        data = res.json()
        query_id = data.get("queryId") or data.get("id")
        return {
            "queryId": query_id,
            "querySessionId": data.get("querySessionId"),
            "status": data.get("status", "pending"),
        }

    # ─────────────────────────────────────────────────────────
    # Query Status & Live Execution Trace Aggregation
    # ─────────────────────────────────────────────────────────
    async def get_query_status(self, sid: str, query_id: str) -> Dict[str, Any]:
        # SAS RAM v1 queries single query via filter=eq(id,'...')
        res = await self.request(sid, "GET", f"/query?filter=eq(id,'{query_id}')")
        if res.status_code != 200:
            raise HTTPException(status_code=res.status_code, detail=f"Query lookup failed: {res.text}")

        data = res.json()
        items = data.get("items", [])
        if not items:
            return {"id": query_id, "status": "pending", "content": ""}

        item = items[0]
        response_obj = item.get("response")
        error_code = item.get("errorCode", 0)
        error_text = item.get("errorText")

        if response_obj:
            return {
                "id": query_id,
                "querySessionId": item.get("querySessionId"),
                "status": "completed",
                "content": response_obj.get("answer", ""),
                "sources": response_obj.get("context") or [],
                "usageMetadata": response_obj.get("usageMetadata"),
                "toolCalls": response_obj.get("toolCalls"),
            }
        elif error_code != 0 or error_text:
            return {
                "id": query_id,
                "querySessionId": item.get("querySessionId"),
                "status": "failed",
                "error": error_text or f"SAS RAM Agent reported error code {error_code}",
            }
        else:
            return {
                "id": query_id,
                "querySessionId": item.get("querySessionId"),
                "status": "running",
                "content": "",
            }

    async def get_query_trace(self, sid: str, query_id: str) -> Dict[str, Any]:
        flt = f"eq(parentQueryId,'{query_id}')"
        h = {"filter": flt, "limit": 100}

        async def fetch_endpoint(path: str):
            try:
                r = await self.request(sid, "GET", path, params=h)
                return r.json().get("items", []) if r.status_code == 200 else []
            except Exception:
                return []

        tools_task = fetch_endpoint("/toolCalls")
        retrievals_task = fetch_endpoint("/retrievalCalls")
        llms_task = fetch_endpoint("/llmCalls")

        tools, retrievals, llms = await asyncio.gather(tools_task, retrievals_task, llms_task)
        return {
            "queryId": query_id,
            "toolCalls": tools,
            "retrievalCalls": retrievals,
            "llmCalls": llms,
        }

    # ─────────────────────────────────────────────────────────
    # Historical Tool Output Re-hydration (_attach_tool_outputs)
    # ─────────────────────────────────────────────────────────
    async def attach_tool_outputs(self, sid: str, turns: List[Dict[str, Any]], concurrency: int = 8):
        sem = asyncio.Semaphore(concurrency)

        async def attach_one(turn: Dict[str, Any]):
            query_id = turn.get("id") or turn.get("queryId")
            if not query_id:
                return
            async with sem:
                try:
                    res = await self.request(
                        sid, "GET", "/toolCalls",
                        params={"filter": f"eq(parentQueryId,'{query_id}')", "limit": 100}
                    )
                    items = res.json().get("items", []) if res.status_code == 200 else []
                    if items:
                        if "trace" not in turn:
                            turn["trace"] = {}
                        turn["trace"]["toolCalls"] = items
                except Exception:
                    pass

        await asyncio.gather(*(attach_one(t) for t in turns), return_exceptions=True)

ram_service = RamClientService()
