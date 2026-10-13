import React, { useState, useEffect } from 'react';
import { 
  Key, 
  Lock, 
  Unlock, 
  Terminal, 
  Play, 
  Cpu, 
  Layers, 
  Code2, 
  Sparkles, 
  Check, 
  AlertCircle, 
  Trash2, 
  Edit3, 
  Save, 
  RefreshCw, 
  ShieldCheck, 
  UserCheck, 
  X, 
  Clock, 
  Plus, 
  ChevronRight,
  ExternalLink,
  Flame,
  FileCode,
  Zap
} from 'lucide-react';
import { AdinkraGlyph } from './AdinkraGlyph';
import { api } from '../services/api';
import { MetaCapability, MetaAmendment, MetaAuthSession } from '../types';

interface SelfAmendingStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SelfAmendingStudioModal: React.FC<SelfAmendingStudioModalProps> = ({
  isOpen,
  onClose,
}) => {
  // Authentication state
  const [session, setSession] = useState<MetaAuthSession>(() => {
    const saved = sessionStorage.getItem('adinkra_meta_session');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return {
      isAuthenticated: false,
      uid: '',
      role: 'guest' as any,
      name: '',
      email: '',
      token: '',
    };
  });

  const [uidInput, setUidInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authenticating, setAuthenticating] = useState(false);

  // Active view tab
  const [activeTab, setActiveTab] = useState<'command' | 'capabilities' | 'editor' | 'access'>('command');

  // Capabilities & Amendments
  const [capabilities, setCapabilities] = useState<MetaCapability[]>([]);
  const [amendments, setAmendments] = useState<MetaAmendment[]>([]);
  const [authorizedProfiles, setAuthorizedProfiles] = useState<any[]>([]);
  const [loadingCaps, setLoadingCaps] = useState(false);

  // Self-Amendment Command Prompt
  const [amendCommand, setAmendCommand] = useState('');
  const [isAmending, setIsAmending] = useState(false);
  const [amendmentResult, setAmendmentResult] = useState<any>(null);
  const [amendError, setAmendError] = useState<string | null>(null);

  // Capability Runner & Editor state
  const [selectedCap, setSelectedCap] = useState<MetaCapability | null>(null);
  const [testInputJson, setTestInputJson] = useState('{}');
  const [runningExecution, setRunningExecution] = useState(false);
  const [executionOutput, setExecutionOutput] = useState<any>(null);
  const [editingCode, setEditingCode] = useState('');
  const [isSavingCode, setIsSavingCode] = useState(false);

  useEffect(() => {
    if (isOpen && session.isAuthenticated) {
      loadCapabilities();
    }
  }, [isOpen, session.isAuthenticated]);

  const loadCapabilities = async () => {
    setLoadingCaps(true);
    try {
      const data = await api.getMetaCapabilities();
      setCapabilities(data.capabilities || []);
      setAmendments(data.amendments || []);
      setAuthorizedProfiles(data.authorizedProfiles || []);
      if (data.capabilities?.length > 0 && !selectedCap) {
        setSelectedCap(data.capabilities[0]);
        setTestInputJson(JSON.stringify(data.capabilities[0].defaultInputs || {}, null, 2));
        setEditingCode(data.capabilities[0].code);
      }
    } catch (err: any) {
      console.error('Failed to load capabilities:', err);
    } finally {
      setLoadingCaps(false);
    }
  };

  const handleAuthenticate = async (uidToTry?: string) => {
    const key = (uidToTry || uidInput).trim();
    if (!key) {
      setAuthError('Please enter your unique developer or manager identifier.');
      return;
    }
    setAuthenticating(true);
    setAuthError(null);
    try {
      const resSession = await api.authMeta(key);
      setSession(resSession);
      sessionStorage.setItem('adinkra_meta_session', JSON.stringify(resSession));
      await loadCapabilities();
    } catch (err: any) {
      setAuthError(err.message || 'Invalid Unique Identifier.');
    } finally {
      setAuthenticating(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('adinkra_meta_session');
    setSession({
      isAuthenticated: false,
      uid: '',
      role: 'guest' as any,
      name: '',
      email: '',
      token: '',
    });
    setUidInput('');
  };

  // Run Self-Amendment
  const handleAmendStudio = async () => {
    if (!amendCommand.trim()) return;
    setIsAmending(true);
    setAmendError(null);
    setAmendmentResult(null);

    try {
      const res = await api.amendProgramming(amendCommand.trim(), session.uid);
      setAmendmentResult(res);
      await loadCapabilities();
      setSelectedCap(res.capability);
      setTestInputJson(JSON.stringify(res.capability.defaultInputs || {}, null, 2));
      setEditingCode(res.capability.code);
    } catch (err: any) {
      setAmendError(err.message || 'Failed to execute self-amendment command.');
    } finally {
      setIsAmending(false);
    }
  };

  // Run digital activity
  const handleRunCapability = async (capId: string) => {
    setRunningExecution(true);
    setExecutionOutput(null);
    try {
      let parsed = {};
      try {
        parsed = JSON.parse(testInputJson);
      } catch {
        parsed = { rawInput: testInputJson };
      }
      const res = await api.executeMetaCapability(capId, parsed);
      setExecutionOutput(res);
      await loadCapabilities();
    } catch (err: any) {
      setExecutionOutput({ success: false, error: err.message });
    } finally {
      setRunningExecution(false);
    }
  };

  // Save modified capability code
  const handleSaveCapabilityCode = async () => {
    if (!selectedCap) return;
    setIsSavingCode(true);
    try {
      const updated = await api.saveMetaCapability(
        {
          ...selectedCap,
          code: editingCode,
        },
        session.uid
      );
      setSelectedCap(updated);
      await loadCapabilities();
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setIsSavingCode(false);
    }
  };

  // Delete capability
  const handleDeleteCapability = async (id: string) => {
    if (!window.confirm('Delete this capability from Adinkra Studio registry?')) return;
    try {
      await api.deleteMetaCapability(id, session.uid);
      await loadCapabilities();
      if (selectedCap?.id === id) {
        setSelectedCap(null);
      }
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 select-none">
      <div className="w-full max-w-5xl bg-[#0c0e16] border border-amber-500/40 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 bg-gradient-to-r from-[#121626] via-[#101422] to-[#0c0e16] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/25 via-amber-600/15 to-transparent border border-amber-500/50 flex items-center justify-center shadow-lg shadow-amber-500/10">
              <AdinkraGlyph name="aya" size={24} className="text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-1.5">
                  Aya <span className="text-amber-400">Meta-Programming</span> Engine
                </h2>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/40 font-bold uppercase tracking-wider">
                  Self-Amending Architecture
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Aya (The Fern): Symbol of endurance, self-determination, and autonomous capability improvement.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {session.isAuthenticated && (
              <div className="hidden md:flex items-center gap-2 bg-emerald-950/60 border border-emerald-500/40 px-2.5 py-1 rounded-lg text-[11px] font-mono text-emerald-300">
                <UserCheck size={13} className="text-emerald-400" />
                <span>{session.name} ({session.role.toUpperCase()})</span>
              </div>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* AUTHENTICATION GATE (When not authenticated) */}
        {!session.isAuthenticated ? (
          <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center text-center max-w-xl mx-auto space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-xl shadow-amber-500/5">
              <Lock size={32} />
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-bold text-slate-100">
                Developer & Manager Unique Identifier Verification
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                To guarantee security and autonomy, Adinkra Studio can only amend its own programming at the verified command of the studio developer or manager with a registered Unique Identifier (UID).
              </p>
            </div>

            {/* Target Profile Card */}
            <div className="w-full p-3.5 bg-[#121624] border border-slate-800 rounded-xl text-left space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase tracking-wider border-b border-slate-800 pb-1.5">
                <span>Authorized Studio Leader</span>
                <span className="text-emerald-400 font-semibold">Pre-Registered</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Manager:</span>
                <span className="text-slate-100 font-bold">Violet Akuagyei</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Account:</span>
                <span className="text-amber-300">violetakuagyei@gmail.com</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Authority:</span>
                <span className="text-emerald-400 font-bold">Root Self-Amending Rights</span>
              </div>
            </div>

            {/* UID Input Form */}
            <div className="w-full space-y-3">
              <div className="space-y-1 text-left">
                <label className="text-[11px] font-semibold text-slate-300 block">
                  Enter Unique Identifier (UID):
                </label>
                <div className="relative">
                  <Key size={14} className="absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="e.g. ADINKRA-MGR-VIOLET-849599DD"
                    value={uidInput}
                    onChange={(e) => setUidInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAuthenticate()}
                    className="w-full bg-[#090b10] border border-slate-800 focus:border-amber-500 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 font-mono focus:outline-none"
                  />
                </div>
              </div>

              {authError && (
                <div className="p-2.5 bg-rose-950/60 border border-rose-800/80 rounded-lg text-rose-200 text-xs flex items-center gap-2 text-left">
                  <AlertCircle size={14} className="text-rose-400 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                onClick={() => handleAuthenticate()}
                disabled={authenticating}
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-lg text-xs transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
              >
                {authenticating ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    <span>Verifying Unique Identifier...</span>
                  </>
                ) : (
                  <>
                    <Unlock size={14} />
                    <span>Unlock Self-Amending Engine</span>
                  </>
                )}
              </button>

              {/* Quick Fill Buttons for Authorized Leader */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-slate-400">
                <span className="font-mono">Quick Access for Lead Developer:</span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => {
                      setUidInput('ADINKRA-MGR-VIOLET-849599DD');
                      handleAuthenticate('ADINKRA-MGR-VIOLET-849599DD');
                    }}
                    className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-amber-300 font-mono transition-colors"
                  >
                    Use Manager UID
                  </button>
                  <button
                    onClick={() => {
                      setUidInput('ADINKRA-DEV-AKUAGYEI-2026');
                      handleAuthenticate('ADINKRA-DEV-AKUAGYEI-2026');
                    }}
                    className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-slate-300 font-mono transition-colors"
                  >
                    Use Dev UID
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* AUTHENTICATED WORKSPACE */
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Top Workspace Navigation Tabs */}
            <div className="flex border-b border-slate-800 bg-[#090b10] px-4 pt-2 gap-2 text-xs font-medium select-none overflow-x-auto">
              <button
                onClick={() => setActiveTab('command')}
                className={`flex items-center gap-2 px-3 py-2 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'command'
                    ? 'border-amber-400 text-amber-300 font-semibold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles size={14} className={activeTab === 'command' ? 'text-amber-400' : ''} />
                <span>1. Command Studio to Amend Itself</span>
              </button>

              <button
                onClick={() => setActiveTab('capabilities')}
                className={`flex items-center gap-2 px-3 py-2 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'capabilities'
                    ? 'border-amber-400 text-amber-300 font-semibold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Terminal size={14} className={activeTab === 'capabilities' ? 'text-amber-400' : ''} />
                <span>2. Capability Registry & Digital Activities ({capabilities.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('editor')}
                className={`flex items-center gap-2 px-3 py-2 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'editor'
                    ? 'border-amber-400 text-amber-300 font-semibold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Code2 size={14} className={activeTab === 'editor' ? 'text-amber-400' : ''} />
                <span>3. Live Code Editor & Hot-Patcher</span>
              </button>

              <button
                onClick={() => setActiveTab('access')}
                className={`flex items-center gap-2 px-3 py-2 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'access'
                    ? 'border-amber-400 text-amber-300 font-semibold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Key size={14} className={activeTab === 'access' ? 'text-amber-400' : ''} />
                <span>4. Manager UIDs & Lineage</span>
              </button>
            </div>

            {/* TAB 1: Command Adinkra Studio to Amend Itself */}
            {activeTab === 'command' && (
              <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs text-slate-300">
                <div className="p-4 bg-gradient-to-r from-amber-950/40 via-[#131728] to-slate-900 border border-amber-500/40 rounded-xl flex items-start gap-3.5">
                  <AdinkraGlyph name="aya" size={26} className="text-amber-400 shrink-0 mt-1" />
                  <div className="space-y-1">
                    <span className="font-bold text-slate-100 text-sm block">
                      Autonomous Self-Amendment at Developer Command
                    </span>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      As authorized developer/manager <strong className="text-amber-300">{session.name}</strong> (UID: <code className="text-slate-200">{session.uid}</code>), 
                      you can command Adinkra Studio in plain language to improve its own capabilities, synthesize new digital activities, 
                      or add custom toolchains without relying on Google AI Studio.
                    </p>
                  </div>
                </div>

                {/* Command Input Box */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-200">
                      Developer Command for Studio Self-Improvement:
                    </label>
                    <span className="text-[10px] text-amber-400 font-mono">
                      Target: Adinkra Studio Runtime Registry
                    </span>
                  </div>

                  <div className="relative">
                    <textarea
                      rows={3}
                      value={amendCommand}
                      onChange={(e) => setAmendCommand(e.target.value)}
                      placeholder="e.g. Build an autonomous Data Scraper activity, or Add a Multilingual Proverbial Evaluator tool..."
                      className="w-full bg-[#090b10] border border-slate-800 focus:border-amber-500/80 rounded-xl p-3 text-xs text-slate-100 font-sans focus:outline-none shadow-inner"
                    />
                  </div>

                  {/* Sample Command Suggestions */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-slate-500 font-mono">Suggested commands:</span>
                    {[
                      'Build an autonomous Markdown Table generator tool',
                      'Create a Webhook event payload dispatcher simulator',
                      'Add an automated Akan proverb sentiment correlation analyzer',
                      'Implement an AST syntax tree token compressor',
                    ].map((sug) => (
                      <button
                        key={sug}
                        onClick={() => setAmendCommand(sug)}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 text-slate-400 hover:text-amber-300 transition-colors"
                      >
                        + {sug}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={handleAmendStudio}
                    disabled={isAmending || !amendCommand.trim()}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md ${
                      isAmending || !amendCommand.trim()
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 active:scale-95 shadow-amber-500/20'
                    }`}
                  >
                    {isAmending ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Synthesizing & Compiling Amendment...</span>
                      </>
                    ) : (
                      <>
                        <Zap size={14} className="fill-current" />
                        <span>Amend Adinkra Studio Programming Now</span>
                      </>
                    )}
                  </button>

                  <span className="text-[10px] text-slate-500 font-mono">
                    Authenticated session active
                  </span>
                </div>

                {amendError && (
                  <div className="p-3 bg-rose-950/50 border border-rose-800 rounded-xl text-rose-200 text-xs flex items-center gap-2">
                    <AlertCircle size={15} className="text-rose-400 shrink-0" />
                    <span>{amendError}</span>
                  </div>
                )}

                {/* Amendment Results Display */}
                {amendmentResult && (
                  <div className="p-4 bg-[#111524] border border-amber-500/40 rounded-xl space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
                        <Check size={16} className="text-emerald-400" />
                        <span>Self-Amendment Successfully Compiled & Registered</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                        Live Runtime Ready
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-mono block">Capability Name:</span>
                        <span className="font-bold text-slate-100">{amendmentResult.capability?.name}</span>
                        <p className="text-[11px] text-slate-400 mt-1">{amendmentResult.capability?.description}</p>
                      </div>

                      <div className="bg-[#090b10] p-2.5 rounded-lg border border-slate-800 space-y-1 font-mono text-[11px]">
                        <span className="text-slate-400 block text-[10px]">Verification Sandbox Dry-Run:</span>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Execution Status:</span>
                          <span className="text-emerald-400 font-bold">SUCCESS</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Latency:</span>
                          <span className="text-amber-300">{amendmentResult.dryRun?.latencyMs}ms</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end gap-2">
                      <button
                        onClick={() => setActiveTab('capabilities')}
                        className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                      >
                        <span>Test in Digital Activity Runner</span>
                        <ChevronRight size={13} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Capability Registry & Digital Activities */}
            {activeTab === 'capabilities' && (
              <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
                {/* Capabilities List (Left Column) */}
                <div className="w-full md:w-80 border-r border-slate-800/80 bg-[#090b10] flex flex-col min-h-0 overflow-y-auto divide-y divide-slate-800/80">
                  <div className="p-3 bg-[#0e111a] flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">
                      Active Capabilities ({capabilities.length})
                    </span>
                    <button
                      onClick={loadCapabilities}
                      className="p-1 text-slate-400 hover:text-slate-200 rounded"
                      title="Refresh capability list"
                    >
                      <RefreshCw size={13} className={loadingCaps ? 'animate-spin' : ''} />
                    </button>
                  </div>

                  {capabilities.map((cap) => (
                    <div
                      key={cap.id}
                      onClick={() => {
                        setSelectedCap(cap);
                        setTestInputJson(JSON.stringify(cap.defaultInputs || {}, null, 2));
                        setEditingCode(cap.code);
                        setExecutionOutput(null);
                      }}
                      className={`p-3 cursor-pointer transition-colors text-xs space-y-1 ${
                        selectedCap?.id === cap.id
                          ? 'bg-amber-500/10 border-l-2 border-amber-400'
                          : 'hover:bg-slate-900/60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-200 truncate block">
                          {cap.name}
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-amber-300">
                          {cap.category}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-2">
                        {cap.description}
                      </p>
                      <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono pt-1">
                        <span>v{cap.version} · {cap.executionCount} runs</span>
                        <span className="text-emerald-400">● Active</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Capability Execution Console (Right Column) */}
                <div className="flex-1 flex flex-col min-h-0 overflow-y-auto p-4 space-y-4 bg-[#0c0e14]">
                  {selectedCap ? (
                    <>
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                        <div>
                          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                            <span>{selectedCap.name}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                              {selectedCap.id}
                            </span>
                          </h3>
                          <p className="text-xs text-slate-400 mt-0.5">{selectedCap.description}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setActiveTab('editor');
                              setEditingCode(selectedCap.code);
                            }}
                            className="flex items-center gap-1 px-2.5 py-1 text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-xs transition-colors"
                          >
                            <Edit3 size={12} />
                            <span>Edit Code</span>
                          </button>
                          <button
                            onClick={() => handleDeleteCapability(selectedCap.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                            title="Delete capability"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Input JSON Editor for Activity */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                          <span>Activity Input Parameters (JSON):</span>
                          <span className="text-[10px] text-slate-500 font-mono">Passed to execute(inputs)</span>
                        </label>
                        <textarea
                          rows={4}
                          value={testInputJson}
                          onChange={(e) => setTestInputJson(e.target.value)}
                          className="w-full bg-[#090b10] border border-slate-800 focus:border-amber-500/50 rounded-lg p-2.5 font-mono text-xs text-emerald-300 focus:outline-none"
                        />
                      </div>

                      {/* Execute Button */}
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => handleRunCapability(selectedCap.id)}
                          disabled={runningExecution}
                          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold rounded-lg text-xs transition-all shadow-md active:scale-95"
                        >
                          <Play size={13} className="fill-current" />
                          <span>{runningExecution ? 'Executing...' : 'Execute Digital Activity'}</span>
                        </button>
                        <span className="text-[10px] text-slate-500 font-mono">
                          Runtime: Scoped Isolated JavaScript
                        </span>
                      </div>

                      {/* Execution Output Console */}
                      {executionOutput && (
                        <div className="p-3 bg-[#090b10] border border-slate-800 rounded-xl space-y-2">
                          <div className="flex items-center justify-between text-xs font-mono">
                            <span className="text-slate-400 font-bold uppercase text-[10px]">Activity Output:</span>
                            <div className="flex items-center gap-3">
                              <span className="text-emerald-400">Status: {executionOutput.success ? 'Success' : 'Failed'}</span>
                              {executionOutput.latencyMs !== undefined && (
                                <span className="text-amber-300">{executionOutput.latencyMs}ms</span>
                              )}
                            </div>
                          </div>

                          {executionOutput.error ? (
                            <div className="p-2.5 bg-rose-950/60 border border-rose-800 rounded text-rose-200 text-xs font-mono">
                              {executionOutput.error}
                            </div>
                          ) : (
                            <pre className="p-2.5 bg-[#050608] rounded text-emerald-300 font-mono text-[11px] overflow-x-auto leading-relaxed shadow-inner">
                              {JSON.stringify(executionOutput.result, null, 2)}
                            </pre>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                      Select a capability from the registry to inspect and execute.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: Code Editor & Hot-Patcher */}
            {activeTab === 'editor' && (
              <div className="flex-1 flex flex-col min-h-0 overflow-y-auto p-5 space-y-4 text-xs text-slate-300">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-100 flex items-center gap-2">
                      <span>Capability Runtime Code Hot-Patcher</span>
                      {selectedCap && (
                        <span className="text-amber-400 font-mono text-[11px]">[{selectedCap.name}]</span>
                      )}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Directly modify the JavaScript logic of studio capabilities. Changes take effect instantly in memory.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSaveCapabilityCode}
                      disabled={isSavingCode || !selectedCap}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-colors shadow-sm"
                    >
                      <Save size={13} />
                      <span>{isSavingCode ? 'Saving...' : 'Apply Hot-Patch'}</span>
                    </button>
                  </div>
                </div>

                <div className="flex-1 min-h-[300px] border border-slate-800 rounded-xl overflow-hidden bg-[#07090e] flex flex-col">
                  <div className="p-2 bg-[#0d101a] border-b border-slate-800 text-[10px] text-slate-400 font-mono flex items-center justify-between">
                    <span>javascript / execution closure</span>
                    <span>Entrypoint: execute(inputs)</span>
                  </div>
                  <textarea
                    value={editingCode}
                    onChange={(e) => setEditingCode(e.target.value)}
                    rows={16}
                    className="flex-1 w-full p-3 bg-transparent text-emerald-300 font-mono text-xs focus:outline-none resize-none leading-relaxed"
                  />
                </div>
              </div>
            )}

            {/* TAB 4: Manager UIDs & Lineage */}
            {activeTab === 'access' && (
              <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs text-slate-300">
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-100 uppercase font-mono tracking-wider">
                    Authorized Unique Identifiers (UIDs)
                  </h3>

                  <div className="border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800 bg-[#090b10]">
                    {authorizedProfiles.map((p, idx) => (
                      <div key={idx} className="p-3 flex items-center justify-between text-xs">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-200">{p.name}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 uppercase">
                              {p.role}
                            </span>
                          </div>
                          <span className="text-slate-400 font-mono text-[11px] block">{p.uid}</span>
                          <span className="text-[10px] text-slate-500">{p.description}</span>
                        </div>
                        <span className="text-emerald-400 font-mono text-[10px] font-bold">
                          ✓ Verified
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Lineage Audit Log */}
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-bold text-slate-100 uppercase font-mono tracking-wider">
                    Studio Self-Amendment Lineage ({amendments.length})
                  </h3>

                  <div className="border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800 bg-[#090b10]">
                    {amendments.length === 0 ? (
                      <div className="p-4 text-center text-slate-500">
                        No self-amendments logged yet. Command the studio above to create your first self-amendment.
                      </div>
                    ) : (
                      amendments.map((a) => (
                        <div key={a.id} className="p-3 space-y-1 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-200">"{a.command}"</span>
                            <span className="text-[9px] font-mono text-slate-500">
                              {new Date(a.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400">{a.summary}</p>
                          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 pt-0.5">
                            <span>Author: {a.authorName}</span>
                            <span>·</span>
                            <span className="text-emerald-400">Status: {a.status}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Authenticated Modal Footer */}
            <div className="p-3 border-t border-slate-800 bg-[#090b10] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                <ShieldCheck size={14} className="text-emerald-400" />
                <span>Operating in Autonomous Self-Amending Runtime.</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleLogout}
                  className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700 rounded text-xs transition-colors"
                >
                  Lock Session
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold rounded text-xs transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
