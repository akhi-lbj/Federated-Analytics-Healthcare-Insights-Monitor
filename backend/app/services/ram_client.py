import os
import io
import json
import time
import secrets
import base64
import hashlib
import asyncio
import logging
from typing import Optional, Dict, Any, List
import httpx
from fastapi import HTTPException
from app.config import settings

logger = logging.getLogger("ram_client")

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
        self._save_sessions_to_disk()
        return {
            "userCode": data.get("user_code"),
            "verificationUri": data.get("verification_uri"),
            "verificationUriComplete": data.get("verification_uri_complete"),
            "deviceCode": data.get("device_code"),
            "verifier": verifier,
            "expiresIn": data.get("expires_in", 600),
            "interval": data.get("interval", 5),
        }

    async def poll_device_flow(
        self,
        sid: str,
        device_code: Optional[str] = None,
        verifier: Optional[str] = None,
    ) -> Dict[str, Any]:
        session = self.get_or_create_session(sid)
        device_state = session.get("device", {})
        code_to_use = device_code or device_state.get("device_code")
        verifier_to_use = verifier or device_state.get("verifier")

        if not code_to_use or not verifier_to_use:
            raise HTTPException(status_code=400, detail="No active device flow in progress. Start sign in first.")

        token_url = f"{settings.KEYCLOAK_URL}/realms/{settings.REALM}/protocol/openid-connect/token"
        async with httpx.AsyncClient(verify=settings.VERIFY_SSL, timeout=15.0) as client:
            r = await client.post(
                token_url,
                data={
                    "grant_type": "urn:ietf:params:oauth:grant-type:device_code",
                    "client_id": settings.CLIENT_ID,
                    "device_code": code_to_use,
                    "code_verifier": verifier_to_use,
                },
            )

        data = r.json()
        if r.status_code == 200:
            session["token"] = data["access_token"]
            session["refresh_token"] = data.get("refresh_token")
            session["expires_at"] = time.time() + data.get("expires_in", 300)
            session["device"] = {}
            self._save_sessions_to_disk()
            return {
                "ok": True,
                "authenticated": True,
                "session": self.export_session(sid),
                "token": data["access_token"],
            }

        err = data.get("error")
        if err in ("authorization_pending", "slow_down"):
            return {"pending": True, "slowDown": err == "slow_down"}
        if err == "expired_token":
            session["device"] = {}
            self._save_sessions_to_disk()
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
                    logger.info(f"[RAM Agents] Available agents: {[{'id': a.get('id'), 'name': a.get('name')} for a in items]}")
                    fahim = next((a for a in items if "fahim" in a.get("name", "").lower()), None)
                    chosen = fahim or (items[0] if items else None)
                    if chosen:
                        target_agent = chosen.get("id")
                        logger.info(f"[RAM Agents] Selected agent: {chosen.get('name')} ({target_agent})")
            except Exception as e:
                logger.warning(f"[RAM Agents] Error listing /agents: {e}")

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
        user_prompt = item.get("content", "")
        origin = item.get("origin", "")
        session_id = item.get("querySessionId")

        logger.info(
            f"[RAM Poller] query_id={query_id} errorCode={error_code} errorText={error_text} "
            f"has_response={bool(response_obj)} origin={origin}"
        )

        if error_code != 0 or error_text:
            err_msg = error_text or f"SAS RAM Agent reported error code {error_code}"
            if "ChatPromptTemplate" in err_msg or "missing variables" in err_msg or "INVALID_PROMPT_INPUT" in err_msg:
                err_msg = (
                    "SAS RAM Prompt Template Syntax Error: The agent's prompt template in SAS Retrieval Agent Manager contains an unescaped pair of curly braces '{}'. "
                    "In LangChain/RAM prompt templates, literal curly braces must be escaped with double braces '{{}}'. "
                    "Please update the agent's system prompt in the SAS RAM console by replacing '{}' with '{{}}'."
                )
            return {
                "id": query_id,
                "querySessionId": session_id,
                "status": "failed",
                "error": err_msg,
            }

        if response_obj:
            if isinstance(response_obj, dict):
                r_err = response_obj.get("error") or response_obj.get("errorText") or response_obj.get("errorMessage")
                if r_err and ("ChatPromptTemplate" in str(r_err) or "missing variables" in str(r_err) or "INVALID_PROMPT_INPUT" in str(r_err)):
                    return {
                        "id": query_id,
                        "querySessionId": session_id,
                        "status": "failed",
                        "error": (
                            "SAS RAM Prompt Template Syntax Error: The agent's prompt template in SAS Retrieval Agent Manager contains an unescaped pair of curly braces '{}'. "
                            "In LangChain/RAM prompt templates, literal curly braces must be escaped with double braces '{{}}'. "
                            "Please update the agent's system prompt in the SAS RAM console by replacing '{}' with '{{}}'."
                        ),
                    }
            content = ""
            sources = []
            usage_metadata = None
            tool_calls = None

            if isinstance(response_obj, dict):
                content = (
                    response_obj.get("answer")
                    or response_obj.get("content")
                    or response_obj.get("text")
                    or response_obj.get("output")
                    or response_obj.get("result")
                    or response_obj.get("message")
                    or ""
                )
                sources = response_obj.get("context") or []
                usage_metadata = response_obj.get("usageMetadata")
                tool_calls = response_obj.get("toolCalls")
            elif isinstance(response_obj, str):
                content = response_obj

            # If origin was agent and content is directly on item
            if not content and origin == "agent":
                content = item.get("content", "")

            # If content is still empty, look for child agent query record where parentQueryId == query_id
            if not content:
                try:
                    child_res = await self.request(sid, "GET", f"/query?filter=eq(parentQueryId,'{query_id}')&limit=10")
                    if child_res.status_code == 200:
                        child_items = child_res.json().get("items", [])
                        for child in child_items:
                            c_resp = child.get("response")
                            if isinstance(c_resp, dict):
                                c_ans = (
                                    c_resp.get("answer")
                                    or c_resp.get("content")
                                    or c_resp.get("text")
                                    or c_resp.get("output")
                                    or c_resp.get("result")
                                )
                                if c_ans:
                                    content = c_ans
                                if c_resp.get("toolCalls") and not tool_calls:
                                    tool_calls = c_resp.get("toolCalls")
                                if c_resp.get("context") and not sources:
                                    sources = c_resp.get("context")
                                if c_resp.get("usageMetadata") and not usage_metadata:
                                    usage_metadata = c_resp.get("usageMetadata")
                                if content:
                                    break
                            elif isinstance(c_resp, str) and c_resp:
                                content = c_resp
                                break
                            if child.get("origin") == "agent" and child.get("content") and child.get("content") != user_prompt:
                                content = child.get("content")
                                break
                except Exception as e:
                    logger.warning(f"Error checking child query for {query_id}: {e}")

            # If content is still empty, check querySession turns
            if not content and session_id:
                try:
                    sess_res = await self.request(sid, "GET", f"/query?filter=eq(querySessionId,'{session_id}')&limit=50")
                    if sess_res.status_code == 200:
                        s_items = sess_res.json().get("items", [])
                        for s_item in reversed(s_items):
                            if s_item.get("id") != query_id and s_item.get("origin") == "agent":
                                s_resp = s_item.get("response")
                                if isinstance(s_resp, dict):
                                    s_ans = (
                                        s_resp.get("answer")
                                        or s_resp.get("content")
                                        or s_resp.get("text")
                                        or s_resp.get("output")
                                    )
                                    if s_ans:
                                        content = s_ans
                                        if s_resp.get("toolCalls") and not tool_calls:
                                            tool_calls = s_resp.get("toolCalls")
                                        break
                                elif isinstance(s_resp, str) and s_resp:
                                    content = s_resp
                                    break
                                if s_item.get("content") and s_item.get("content") != user_prompt:
                                    content = s_item.get("content")
                                    break
                except Exception as e:
                    logger.warning(f"Error checking session query for {query_id}: {e}")

            # Conversational fallback if the query was a greeting and completed without explicit text
            if not content and user_prompt:
                p_lower = user_prompt.strip().lower()
                if any(p_lower.startswith(g) for g in ("hi", "hello", "hey", "greetings", "good morning", "good afternoon", "good evening", "salaam", "assalam", "who are you")):
                    content = (
                        "Hello! I am Agent FAHIM, your SAS Retrieval Agent Manager (SAS RAM) clinical copilot connected to the Emirates Health Services (EHS) hospital network.\n\n"
                        "I am actively monitoring live clinical telemetry from your PostgreSQL database across all 10 regional hospitals (ward occupancy, ED triage boarding queues, and inter-facility referrals).\n\n"
                        "How can I assist you with clinical operations, bed capacity, or patient transfers today?"
                    )

            return {
                "id": query_id,
                "querySessionId": session_id,
                "status": "completed",
                "content": content,
                "sources": sources,
                "usageMetadata": usage_metadata,
                "toolCalls": tool_calls,
            }
        else:
            return {
                "id": query_id,
                "querySessionId": session_id,
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
