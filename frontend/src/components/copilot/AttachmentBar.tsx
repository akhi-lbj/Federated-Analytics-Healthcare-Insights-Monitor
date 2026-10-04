import React, { useRef } from 'react';
import { RamAttachment } from '../../types/ram';
import { extractDocumentText } from '../../lib/ramApi';
import { Paperclip, FileText, X, AlertCircle, Loader2 } from 'lucide-react';

interface AttachmentBarProps {
  attachments: RamAttachment[];
  onAddAttachment: (att: RamAttachment) => void;
  onRemoveAttachment: (index: number) => void;
  isExtracting: boolean;
  setIsExtracting: (v: boolean) => void;
  onError: (msg: string) => void;
}

export const AttachmentBar: React.FC<AttachmentBarProps> = ({
  attachments,
  onAddAttachment,
  onRemoveAttachment,
  isExtracting,
  setIsExtracting,
  onError,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExtracting(true);
    try {
      const extracted = await extractDocumentText(file);
      onAddAttachment(extracted);
    } catch (err: any) {
      onError(err.message || 'Failed to extract text from clinical attachment.');
    } finally {
      setIsExtracting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Attached Chips List */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-2 bg-[#070e1b] rounded-lg border border-[#1e293b]">
          {attachments.map((att, idx) => (
            <div
              key={idx}
              className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#0f172a] border border-cyan-800 text-slate-200 text-xs"
            >
              <FileText className="w-3.5 h-3.5 text-primary" />
              <span className="truncate max-w-[150px] font-medium">{att.name}</span>
              <span className="text-[10px] text-slate-400 font-mono">
                ({att.text.length} chars)
              </span>
              <button
                type="button"
                onClick={() => onRemoveAttachment(idx)}
                className="text-slate-400 hover:text-rose-400 p-0.5 ml-1"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf,.docx,.doc,.txt,.csv,.json,.md"
        className="hidden"
      />

      <div className="flex items-center justify-between text-xs">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isExtracting}
          className="flex items-center gap-1.5 text-slate-300 hover:text-primary transition-colors text-xs font-medium"
        >
          {isExtracting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
              <span>Extracting Document Text...</span>
            </>
          ) : (
            <>
              <Paperclip className="w-3.5 h-3.5 text-primary" />
              <span>Attach Protocol / Audit Document (PDF, DOCX, CSV)</span>
            </>
          )}
        </button>

        <span className="text-[10px] text-slate-500 font-mono">Max 20,000 chars</span>
      </div>
    </div>
  );
};
