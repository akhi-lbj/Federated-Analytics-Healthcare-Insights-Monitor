export interface ToolCallOutput {
  structuredContent?: any;
  content?: string;
  isError?: boolean;
}

export interface ToolCall {
  id: string;
  parentQueryId: string;
  toolName: string;
  input: Record<string, any>;
  output?: ToolCallOutput;
  cost?: number;
  insertTimestamp?: string;
  durationMs?: number;
}

export interface RetrievalItem {
  documentName?: string;
  page?: number;
  snippet?: string;
  score?: number;
}

export interface RetrievalCall {
  id: string;
  parentQueryId: string;
  queryText?: string;
  items?: RetrievalItem[];
}

export interface LlmCall {
  id: string;
  parentQueryId: string;
  model?: string;
  promptTokens?: number;
  completionTokens?: number;
  cost?: number;
}

export interface TraceAggregate {
  queryId: string;
  toolCalls: ToolCall[];
  retrievalCalls: RetrievalCall[];
  llmCalls: LlmCall[];
}

export interface ChartSpec {
  kind: 'chart';
  type: 'bar' | 'line' | 'area' | 'pie' | 'scatter';
  title?: string;
  data: Record<string, any>[];
  xKey: string;
  yKeys: string[];
  colors?: string[];
}

export interface ReportSpec {
  kind: 'report_image';
  title?: string;
  imageUrl?: string;
  viewerUrl?: string;
  reportId?: string;
}

export interface PresentationSpec {
  kind: 'presentation';
  title?: string;
  template?: string;
  nSlides?: number;
  taskId?: string;
  status?: string;
  message?: string;
  downloadUrl?: string | null;
  editUrl?: string | null;
  presentationId?: string | null;
  contentSummary?: string;
  updatedAt?: string;
}

export interface RamAttachment {
  name: string;
  text: string;
  charCount?: number;
  truncated?: boolean;
}

export interface RamTurn {
  id: string;
  querySessionId?: string;
  role: 'user' | 'assistant';
  content: string;
  status?: 'pending' | 'running' | 'completed' | 'failed';
  sources?: any[];
  trace?: {
    toolCalls?: ToolCall[];
    retrievalCalls?: RetrievalCall[];
    llmCalls?: LlmCall[];
  };
  attachments?: RamAttachment[];
  insertTimestamp?: string;
  usageMetadata?: {
    llmTotalCost?: number;
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}
