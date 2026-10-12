import React, { useState } from 'react';
import { X, Copy, Check, Download, Upload, Share2, Users, Shield } from 'lucide-react';
import { PromptState, VersionSnapshot, WorkspaceComment } from '../types';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  promptState: PromptState;
  versions: VersionSnapshot[];
  comments: WorkspaceComment[];
  onImportWorkspace: (importedData: any) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  promptState,
  versions,
  comments,
  onImportWorkspace,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleExportJson = () => {
    const data = {
      app: 'Adinkra Studio',
      exportedAt: new Date().toISOString(),
      promptState,
      versions,
      comments,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${promptState.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-workspace.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.promptState) {
          onImportWorkspace(json);
          onClose();
        } else {
          setImportError('Invalid Adinkra Studio project format');
        }
      } catch (err: any) {
        setImportError('Failed to parse JSON file');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#101422] border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-4 border-b border-slate-800 bg-[#131728] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Share2 size={16} className="text-amber-400" />
            <div>
              <div className="text-sm font-semibold text-slate-100">Collaborate & Share Workspace</div>
              <div className="text-[11px] text-slate-400">
                Synchronize prompt versions and invite engineering teammates
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-4 text-xs bg-[#0c0e14]">
          {/* Share Link */}
          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1">
              Live Workspace Link:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={window.location.href}
                className="flex-1 bg-[#090b10] border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-400 font-mono select-all"
              />
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded font-medium transition-colors"
              >
                {copiedLink ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                <span>{copiedLink ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Export / Import Workspace */}
          <div className="p-3 bg-[#131724] border border-slate-800 rounded-xl space-y-2.5">
            <div className="text-[11px] font-semibold text-slate-200">
              Workspace Backup & Portability
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleExportJson}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-lg font-medium transition-colors"
              >
                <Download size={13} className="text-amber-400" />
                <span>Export JSON Bundle</span>
              </button>
              <label className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-lg font-medium cursor-pointer transition-colors">
                <Upload size={13} className="text-blue-400" />
                <span>Import JSON</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
            {importError && (
              <p className="text-[10px] text-rose-400 font-mono">{importError}</p>
            )}
          </div>

          {/* Collaborator Role Model */}
          <div className="p-3 bg-[#121622] border border-slate-800 rounded-xl space-y-2">
            <div className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
              <Shield size={12} className="text-amber-400" />
              <span>Workspace Access Roles</span>
            </div>
            <div className="space-y-1.5 text-[11px] text-slate-400">
              <div className="flex justify-between items-center py-0.5 border-b border-slate-800/60">
                <span className="text-slate-200">Violet Akuagyei</span>
                <span className="font-mono text-amber-400 text-[10px]">Owner · Prompt Architect</span>
              </div>
              <div className="flex justify-between items-center py-0.5 border-b border-slate-800/60">
                <span className="text-slate-200">Kwame Mensah</span>
                <span className="font-mono text-slate-400 text-[10px]">Staff ML Engineer</span>
              </div>
              <div className="flex justify-between items-center py-0.5">
                <span className="text-slate-200">Amara Okafor</span>
                <span className="font-mono text-slate-400 text-[10px]">Eval Specialist</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-3 border-t border-slate-800 bg-[#131728] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-lg text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
