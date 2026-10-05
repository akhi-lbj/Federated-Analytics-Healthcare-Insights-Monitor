import React, { useState, useEffect } from 'react';
import { startDeviceLogin, pollDeviceLogin } from '../../lib/ramApi';
import {
  ShieldCheck,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  X,
  Copy,
  Check,
  AlertCircle
} from 'lucide-react';

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const SignInModal: React.FC<SignInModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [deviceData, setDeviceData] = useState<{
    userCode: string;
    verificationUri: string;
    verificationUriComplete?: string;
    deviceCode?: string;
    verifier?: string;
    expiresIn: number;
    interval: number;
  } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [pollingStatus, setPollingStatus] = useState<string>('');
  const [isApproved, setIsApproved] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Initiate device flow when modal opens
  useEffect(() => {
    if (isOpen && !deviceData && !loading) {
      initiateDeviceFlow();
    }
  }, [isOpen]);

  // Polling loop for Device Flow
  useEffect(() => {
    if (!deviceData || isApproved) return;

    let isMounted = true;
    const intervalSec = deviceData.interval || 5;

    const intervalId = setInterval(async () => {
      try {
        setPollingStatus('Waiting for approval in browser...');
        const res = await pollDeviceLogin(deviceData.deviceCode, deviceData.verifier);
        if (!isMounted) return;

        if (res.ok && res.authenticated) {
          setIsApproved(true);
          clearInterval(intervalId);
          setPollingStatus('Authentication approved! Binding session...');
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 900);
        }
      } catch (err: any) {
        if (!isMounted) return;
        setErrorMsg(err.message || 'Authorization failed.');
        clearInterval(intervalId);
      }
    }, intervalSec * 1000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [deviceData, isApproved]);

  const initiateDeviceFlow = async () => {
    setLoading(true);
    setErrorMsg('');
    setIsApproved(false);
    try {
      const data = await startDeviceLogin();
      setDeviceData(data);
      setPollingStatus('Code generated. Click below to approve.');
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to initiate device authentication.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (!deviceData?.userCode) return;
    navigator.clipboard.writeText(deviceData.userCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl w-full max-w-lg p-6 shadow-2xl relative text-slate-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition-colors p-1 rounded-lg hover:bg-[#1e293b]"
          title="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-800 flex items-center justify-center text-primary shadow-sm">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-headline text-lg font-bold text-slate-100 flex items-center gap-2">
              <span>SAS RAM Authentication</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300">
                OAuth 2.0 PKCE
              </span>
            </h3>
            <span className="text-[11px] text-slate-400">
              Federated Identity Binding to SAS Retrieval Agent Manager
            </span>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-xl text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">{errorMsg}</div>
          </div>
        )}

        {/* Device Code Flow (SSO) */}
        <div className="flex flex-col gap-4">
          <p className="text-xs text-slate-300 leading-relaxed">
            Connect seamlessly via SAS Single Sign-On (SSO). Approve access in your browser —
            <span className="text-cyan-300 font-semibold"> no tokens or codes need to be copied</span>.
          </p>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3 bg-[#070e1b] border border-[#1e293b] rounded-xl">
              <RefreshCw className="w-6 h-6 text-primary animate-spin" />
              <span className="text-xs text-slate-400">Initiating secure OAuth 2.0 PKCE handshake...</span>
            </div>
          ) : deviceData ? (
            <div className="flex flex-col gap-4 bg-[#070e1b] border border-[#1e293b] p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Verification Code
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-200 transition-colors"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-bold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-center bg-[#0b1326] border border-[#1e293b] py-3.5 px-4 rounded-xl">
                <span className="font-mono text-3xl font-black text-primary tracking-widest selection:bg-cyan-500 selection:text-black">
                  {deviceData.userCode}
                </span>
              </div>

              <a
                href={deviceData.verificationUriComplete || deviceData.verificationUri}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary hover:bg-primary-hover text-[#060e20] text-xs font-bold transition-all shadow-lg hover:shadow-cyan-500/20 active:scale-[0.98]"
              >
                <span>Open &amp; Approve in SAS Portal</span>
                <ExternalLink className="w-4 h-4" />
              </a>

              {/* Status indicator */}
              <div className="flex items-center justify-between pt-1 border-t border-[#1e293b]/60 text-[11px]">
                <div className="flex items-center gap-2">
                  {isApproved ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 animate-bounce" />
                      <span className="text-emerald-400 font-bold">
                        Authentication approved! Binding session...
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                      </span>
                      <span className="text-cyan-300 font-medium">
                        {pollingStatus || 'Waiting for authorization in browser...'}
                      </span>
                    </>
                  )}
                </div>
                <button
                  type="button"
                  onClick={initiateDeviceFlow}
                  className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1"
                  title="Generate a fresh code"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>New Code</span>
                </button>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed bg-[#0b1326] p-2.5 rounded-lg border border-[#1e293b]/40">
                💡 <span className="font-semibold text-slate-300">How it works:</span> Clicking the button opens the SAS authorization tab with your code already entered. Click <strong>Submit</strong> or <strong>Confirm</strong>, and this application will immediately connect you.
              </p>
            </div>
          ) : (
            <button
              type="button"
              onClick={initiateDeviceFlow}
              className="w-full py-3 rounded-xl bg-primary hover:bg-primary-hover text-[#060e20] font-bold text-xs shadow-md transition-all"
            >
              Generate Device Code
            </button>
          )}
        </div>

        {/* Footer Note */}
        <div className="mt-5 pt-3.5 border-t border-[#1e293b] text-center">
          <span className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Credentials persist securely via HttpOnly session cookie (<code className="text-primary font-mono">ram_sid</code>) with background refresh.</span>
          </span>
        </div>
      </div>
    </div>
  );
};
