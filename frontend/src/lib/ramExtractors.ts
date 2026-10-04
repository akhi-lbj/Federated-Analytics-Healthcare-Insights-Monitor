import { ChartSpec, ReportSpec, PresentationSpec } from '../types/ram';

/**
 * Extract chart specs from tool call outputs
 */
export const extractCharts = (toolCalls?: any[]): ChartSpec[] => {
  if (!toolCalls) return [];
  const specs: ChartSpec[] = [];
  toolCalls.forEach((tc) => {
    const output = tc.output?.structuredContent || tc.output;
    if (output && typeof output === 'object') {
      if (output.kind === 'chart') specs.push(output);
      else if (output.charts && Array.isArray(output.charts)) specs.push(...output.charts);
    }
  });
  return specs;
};

/**
 * Extract report image specs from tool call outputs
 */
export const extractReports = (toolCalls?: any[]): ReportSpec[] => {
  if (!toolCalls) return [];
  const specs: ReportSpec[] = [];
  toolCalls.forEach((tc) => {
    const output = tc.output?.structuredContent || tc.output;
    if (output && typeof output === 'object' && output.kind === 'report_image') {
      specs.push(output);
    }
  });
  return specs;
};

/**
 * Robustly extract presentation generation artifacts from tool calls or text content.
 * Prevents false timeout / in-flight states when generation succeeded.
 */
export const extractPresentations = (toolCalls?: any[], content?: string): PresentationSpec[] => {
  const specs: PresentationSpec[] = [];

  // 1. Scan content for direct PPTX and Presenton links
  let contentDownloadUrl: string | null = null;
  let contentEditUrl: string | null = null;
  let contentPresId: string | null = null;

  if (content) {
    const pptxMatch = content.match(/https:\/\/[^\s\)\"']+\.pptx/i);
    if (pptxMatch) contentDownloadUrl = pptxMatch[0];

    const editMatch = content.match(/https:\/\/(?:www\.)?presenton\.ai\/presentation\?[^\s\)\"']+/i);
    if (editMatch) contentEditUrl = editMatch[0];

    const idMatch = content.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
    if (idMatch) {
      contentPresId = idMatch[0];
      if (!contentEditUrl) {
        contentEditUrl = `https://presenton.ai/presentation?id=${contentPresId}&type=standard`;
      }
    }
  }

  // 2. Scan all tool calls
  if (toolCalls && toolCalls.length > 0) {
    toolCalls.forEach((tc) => {
      const toolName = tc.toolName || '';
      const isPresentationTool = toolName.includes('presentation') || toolName === 'get_async_task_status';
      const rawJson = typeof tc === 'object' ? JSON.stringify(tc) : '';
      const hasPptxOrPresId = rawJson.includes('.pptx') || rawJson.includes('presentation_id');

      if (isPresentationTool || hasPptxOrPresId) {
        let merged: any = { ...(tc.input || {}) };

        const parseCandidate = (val: any) => {
          if (!val) return;
          if (typeof val === 'object') {
            merged = { ...merged, ...val };
            if (typeof val.result === 'string') {
              try {
                const parsed = JSON.parse(val.result);
                if (typeof parsed === 'object' && parsed !== null) merged = { ...merged, ...parsed };
              } catch {}
            }
          } else if (typeof val === 'string') {
            try {
              const parsed = JSON.parse(val);
              if (typeof parsed === 'object' && parsed !== null) {
                merged = { ...merged, ...parsed };
                if (typeof parsed.result === 'string') {
                  try {
                    const nested = JSON.parse(parsed.result);
                    if (typeof nested === 'object' && nested !== null) merged = { ...merged, ...nested };
                  } catch {}
                }
              }
            } catch {}
          }
        };

        parseCandidate(tc.output);
        parseCandidate(tc.output?.result);
        parseCandidate(tc.output?.structuredContent);
        parseCandidate(tc.output?.structuredContent?.result);
        if (Array.isArray(tc.output?.content)) {
          tc.output.content.forEach((item: any) => {
            parseCandidate(item);
            parseCandidate(item?.text);
          });
        }

        // Regex fallback on the raw JSON of this tool call
        const pptxInTc = rawJson.match(/https:\/\/[^"'\s\)]+\.pptx/i);
        const presIdInTc = rawJson.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);

        const taskId = merged.task_id || tc.input?.task_id || merged.presentation_id || presIdInTc?.[0] || contentPresId;
        const presId = merged.presentation_id || presIdInTc?.[0] || contentPresId;
        const dlUrl = merged.download_url || (pptxInTc ? pptxInTc[0].replace(/\\/g, '') : null) || contentDownloadUrl;
        const edUrl = merged.edit_url || (presId ? `https://presenton.ai/presentation?id=${presId}&type=standard` : null) || contentEditUrl;
        const isSuccess = Boolean(dlUrl || edUrl || merged.success === true || merged.status === 'completed' || merged.status === 'succeeded');

        if (taskId || isPresentationTool || dlUrl || edUrl) {
          specs.push({
            kind: 'presentation',
            title: tc.input?.content?.split('\n')[0] || 'Al Dhaid Hospital — Operational Presentation Deck',
            template: tc.input?.standard_template || tc.input?.tone || 'pulse',
            nSlides: tc.input?.n_slides || (merged.slides ? 5 : 5),
            taskId: taskId,
            status: isSuccess ? 'completed' : (merged.status || 'pending'),
            message: isSuccess ? 'Presentation Generated Successfully' : (merged.message || 'Selecting layout for each slide'),
            downloadUrl: dlUrl || undefined,
            editUrl: edUrl || undefined,
            presentationId: presId || undefined,
            contentSummary: tc.input?.instructions || (typeof tc.input?.content === 'string' ? tc.input.content.slice(0, 300) : ''),
            updatedAt: merged.updated_at,
          });
        }
      }
    });
  }

  // 3. Fallback: If content has valid download/edit link but toolCalls didn't match
  if (contentDownloadUrl || contentEditUrl || contentPresId) {
    const fallbackSpec: PresentationSpec = {
      kind: 'presentation',
      title: 'Al Dhaid Hospital — DRA-W3 Operational Shift Report',
      template: 'pulse',
      nSlides: 5,
      taskId: contentPresId || undefined,
      status: 'completed',
      message: 'Presentation Generated Successfully',
      downloadUrl: contentDownloadUrl || undefined,
      editUrl: contentEditUrl || (contentPresId ? `https://presenton.ai/presentation?id=${contentPresId}&type=standard` : undefined),
      presentationId: contentPresId || undefined,
    };

    // Check if any spec in specs is already completed
    const existingSuccess = specs.find((s) => s.downloadUrl || s.editUrl || s.status === 'completed');
    if (existingSuccess) {
      if (!existingSuccess.downloadUrl && contentDownloadUrl) existingSuccess.downloadUrl = contentDownloadUrl;
      if (!existingSuccess.editUrl && fallbackSpec.editUrl) existingSuccess.editUrl = fallbackSpec.editUrl;
      if (!existingSuccess.presentationId && contentPresId) existingSuccess.presentationId = contentPresId;
      existingSuccess.status = 'completed';
      existingSuccess.message = 'Presentation Generated Successfully';
      return [existingSuccess];
    }

    return [fallbackSpec];
  }

  // CRITICAL: Always prioritize ANY completed presentation deck that has a downloadUrl or editUrl!
  const completedSpec = specs.find((s) => s.downloadUrl || s.editUrl || s.status === 'completed');
  if (completedSpec) {
    if (!completedSpec.downloadUrl && contentDownloadUrl) completedSpec.downloadUrl = contentDownloadUrl;
    if (!completedSpec.editUrl && contentEditUrl) completedSpec.editUrl = contentEditUrl;
    completedSpec.status = 'completed';
    completedSpec.message = 'Presentation Generated Successfully';
    return [completedSpec];
  }

  // Otherwise, find latest pending task
  const pendingSpec = specs.slice().reverse().find((s) => s.status === 'pending' || s.status === 'running');
  if (pendingSpec) return [pendingSpec];

  if (specs.length > 0) {
    return [specs[specs.length - 1]];
  }
  return [];
};
