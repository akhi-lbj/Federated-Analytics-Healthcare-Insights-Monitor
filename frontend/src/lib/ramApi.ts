import { TraceAggregate, RamAttachment, RamTurn } from '../types/ram';

const BASE_URL = import.meta.env.VITE_RAM_GATEWAY_URL || '/api/ram';
const TEAM_ID = import.meta.env.VITE_DEFAULT_TEAM_ID || 'team-ehs-ops';

// Ephemeral in-memory state: A fresh session ID is created on every page load/refresh.
// This guarantees that refreshing the page resets the connection to disconnected (red)
// and requires authentication again.
let activeSessionId: string = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
let activeToken: string | null = null;

// Clean up any stale localStorage tokens on module load
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('ram_token');
    localStorage.removeItem('ram_session_id');
    localStorage.removeItem('ram_session_backup');
  } catch {}
}

function isTokenExpired(token: string | null): boolean {
  if (!token || token === 'null' || token === 'undefined' || token.trim() === '') return true;
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (payload.exp && typeof payload.exp === 'number') {
        return Date.now() / 1000 >= payload.exp - 10;
      }
    }
  } catch {
    // If not a parseable JWT, don't auto-expire
  }
  return false;
}

function getHeaders(customHeaders: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = {
    'X-Team-Id': TEAM_ID,
    'Accept': 'application/json',
    'X-Session-Id': activeSessionId,
    ...customHeaders,
  };
  if (activeToken && !isTokenExpired(activeToken)) {
    headers['Authorization'] = `Bearer ${activeToken}`;
  }
  return headers;
}

export async function checkRamHealth(): Promise<{
  status: string;
  authenticated: boolean;
  signinFlow: 'device' | 'code';
  viyaAuthUrl?: string;
  clientConfig?: any;
}> {
  try {
    const res = await fetch(`${BASE_URL}/health`, {
      method: 'GET',
      credentials: 'include',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error(`Health check returned ${res.status}`);
    const data = await res.json();
    if (!data.authenticated) {
      localStorage.removeItem('ram_token');
    }
    return data;
  } catch (e) {
    return {
      status: 'offline',
      authenticated: false,
      signinFlow: 'device',
    };
  }
}

export async function startDeviceLogin(): Promise<{
  userCode: string;
  verificationUri: string;
  verificationUriComplete?: string;
  deviceCode?: string;
  verifier?: string;
  expiresIn: number;
  interval: number;
  sessionId?: string;
}> {
  const res = await fetch(`${BASE_URL}/auth/device/start`, {
    method: 'POST',
    credentials: 'include',
    headers: getHeaders({ 'Content-Type': 'application/json' }),
  });
  if (!res.ok) throw new Error(`Failed to start device login: ${await res.text()}`);
  const data = await res.json();
  if (data.sessionId) {
    activeSessionId = data.sessionId;
  }
  return data;
}

export async function pollDeviceLogin(deviceCode?: string, verifier?: string): Promise<{
  ok?: boolean;
  authenticated?: boolean;
  session?: any;
  token?: string;
  pending?: boolean;
  slowDown?: boolean;
  sessionId?: string;
}> {
  const res = await fetch(`${BASE_URL}/auth/device/poll`, {
    method: 'POST',
    credentials: 'include',
    headers: getHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ deviceCode, verifier }),
  });
  if (!res.ok) throw new Error(`Polling failed: ${await res.text()}`);
  const data = await res.json();
  if (data.token) {
    activeToken = data.token;
  }
  if (data.sessionId) {
    activeSessionId = data.sessionId;
  }
  return data;
}

export async function restoreSession(session: any): Promise<{
  ok: boolean;
  authenticated: boolean;
}> {
  try {
    const res = await fetch(`${BASE_URL}/auth/restore`, {
      method: 'POST',
      credentials: 'include',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ session }),
    });
    if (!res.ok) {
      return { ok: false, authenticated: false };
    }
    const data = await res.json();
    return data;
  } catch {
    return { ok: false, authenticated: false };
  }
}

export async function signOutRam(): Promise<void> {
  activeToken = null;
  activeSessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('ram_token');
      localStorage.removeItem('ram_session_id');
      localStorage.removeItem('ram_session_backup');
    } catch {}
  }
  await fetch(`${BASE_URL}/auth/signout`, {
    method: 'POST',
    credentials: 'include',
    headers: getHeaders(),
  });
}

export async function submitQueryAsync(params: {
  content: string;
  agentId?: string;
  querySessionId?: string;
  attachments?: RamAttachment[];
}): Promise<{ queryId: string; querySessionId?: string; status: string }> {
  const res = await fetch(`${BASE_URL}/query`, {
    method: 'POST',
    credentials: 'include',
    headers: getHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`Query submission failed: ${await res.text()}`);
  return await res.json();
}

export async function pollQueryStatus(queryId: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/query/${queryId}`, {
    method: 'GET',
    credentials: 'include',
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error(`Status polling failed: ${await res.text()}`);
  return await res.json();
}

export async function fetchQueryTrace(queryId: string): Promise<TraceAggregate> {
  const res = await fetch(`${BASE_URL}/query/${queryId}/trace`, {
    method: 'GET',
    credentials: 'include',
    headers: getHeaders(),
  });
  if (!res.ok) return { queryId, toolCalls: [], retrievalCalls: [], llmCalls: [] };
  return await res.json();
}

export async function extractDocumentText(file: File): Promise<RamAttachment> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${BASE_URL}/extract`, {
    method: 'POST',
    credentials: 'include',
    headers: getHeaders(),
    body: formData,
  });
  if (!res.ok) throw new Error(`Extraction failed: ${await res.text()}`);
  return await res.json();
}

export async function listSessions(): Promise<any[]> {
  const res = await fetch(`${BASE_URL}/querySessions`, {
    method: 'GET',
    credentials: 'include',
    headers: getHeaders(),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.items || [];
}

export async function loadSessionHistory(sessionId: string): Promise<RamTurn[]> {
  const res = await fetch(`${BASE_URL}/querySessions/${sessionId}`, {
    method: 'GET',
    credentials: 'include',
    headers: getHeaders(),
  });
  if (!res.ok) return [];
  const data = await res.json();
  const rawItems = data.items || [];
  
  return rawItems.map((item: any) => ({
    id: item.id,
    querySessionId: item.querySessionId,
    role: item.role || (item.parentQueryId ? 'assistant' : 'user'),
    content: item.content || '',
    status: item.status,
    sources: item.sources || [],
    trace: item.trace || { toolCalls: item.toolCalls || [] },
    insertTimestamp: item.insertTimestamp,
    usageMetadata: item.usageMetadata,
  }));
}

/**
 * High-Level Autonomous 504-Immune Query Streamer with Live Trace Aggregation
 */
export async function streamAgentQuery(params: {
  content: string;
  agentId?: string;
  sessionId?: string;
  attachments?: RamAttachment[];
  onTraceUpdate?: (trace: TraceAggregate) => void;
  onPollTick?: (stepCount: number) => void;
}): Promise<{
  content: string;
  queryId: string;
  querySessionId: string;
  trace: TraceAggregate;
  sources: any[];
  usageMetadata?: any;
}> {
  // 1. Submit async query (504 timeout immune)
  const submission = await submitQueryAsync({
    content: params.content,
    agentId: params.agentId,
    querySessionId: params.sessionId,
    attachments: params.attachments,
  });

  const queryId = submission.queryId;
  let stepsCount = 0;
  let latestTrace: TraceAggregate = { queryId, toolCalls: [], retrievalCalls: [], llmCalls: [] };

  // 2. Poll loop every 2 seconds
  while (true) {
    await new Promise((r) => setTimeout(r, 2000));
    stepsCount++;
    params.onPollTick?.(stepsCount);

    // Concurrently fetch mid-flight live execution trace (Tier 1)
    fetchQueryTrace(queryId)
      .then((trace) => {
        if (trace && (trace.toolCalls?.length || trace.retrievalCalls?.length || trace.llmCalls?.length)) {
          latestTrace = trace;
          params.onTraceUpdate?.(trace);
        }
      })
      .catch(() => {});

    const status = await pollQueryStatus(queryId);

    if (status.status === 'completed') {
      const finalTrace = await fetchQueryTrace(queryId);
      return {
        content: status.content || 'Analysis complete.',
        queryId,
        querySessionId: status.querySessionId || submission.querySessionId,
        trace: finalTrace || latestTrace,
        sources: status.sources || [],
        usageMetadata: status.usageMetadata,
      };
    }

    if (status.status === 'failed') {
      throw new Error(status.error || 'SAS RAM reasoning failed.');
    }
  }
}
