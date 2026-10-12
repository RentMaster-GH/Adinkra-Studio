import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  MessageSquare, 
  FileText, 
  Table2, 
  Play, 
  CheckCircle2, 
  XCircle, 
  Copy, 
  Check,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Mic,
  MicOff,
  Send,
  CornerDownLeft,
  Square,
  AlertCircle
} from 'lucide-react';
import { PromptMode, ChatTurn, TestCase } from '../types';
import { AdinkraGlyph } from './AdinkraGlyph';

interface PromptEditorProps {
  mode: PromptMode;
  setMode: (mode: PromptMode) => void;
  userPrompt: string;
  setUserPrompt: React.Dispatch<React.SetStateAction<string>>;
  turns: ChatTurn[];
  setTurns: React.Dispatch<React.SetStateAction<ChatTurn[]>>;
  testCases: TestCase[];
  setTestCases: React.Dispatch<React.SetStateAction<TestCase[]>>;
  variables: Record<string, string>;
  setVariables: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onRunTestCase: (tc: TestCase) => void;
  onRunAllTestCases: () => void;
  isEvaluatingBatch?: boolean;
  onRun?: () => void;
  isGenerating?: boolean;
  onSendChatMessage?: (message: string) => void;
}

export const PromptEditor: React.FC<PromptEditorProps> = ({
  mode,
  setMode,
  userPrompt,
  setUserPrompt,
  turns,
  setTurns,
  testCases,
  setTestCases,
  variables,
  setVariables,
  onRunTestCase,
  onRunAllTestCases,
  isEvaluatingBatch = false,
  onRun,
  isGenerating = false,
  onSendChatMessage,
}) => {
  // Chat input state
  const [chatInput, setChatInput] = useState('');
  const [copiedTurnId, setCopiedTurnId] = useState<string | null>(null);

  // Speech Recognition state
  const [isRecording, setIsRecording] = useState(false);
  const [activeSpeechTarget, setActiveSpeechTarget] = useState<'freeform' | 'chat' | null>(null);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const chatScrollRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const freeformInputRef = useRef<HTMLTextAreaElement>(null);

  // Extract {{variable}} matches from prompt
  const detectedVariables = Array.from(
    new Set((userPrompt.match(/\{\{([a-zA-Z0-9_-]+)\}\}/g) || []).map((m) => m.slice(2, -2)))
  );

  const tokenEstimate = Math.ceil((userPrompt?.length || 0) / 4);

  // Scroll to bottom of chat when turns change or generating
  useEffect(() => {
    if (mode === 'chat' && chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [turns, isGenerating, mode]);

  // Speech Recognition initialization & toggle
  const toggleSpeechRecognition = (target: 'freeform' | 'chat') => {
    setSpeechError(null);

    // If currently recording this target, stop it
    if (isRecording && activeSpeechTarget === target) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      setActiveSpeechTarget(null);
      return;
    }

    // Check browser support for SpeechRecognition
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechError('Speech recognition is not supported in this browser. Please use Google Chrome, Edge, or Safari.');
      setTimeout(() => setSpeechError(null), 4000);
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
        setActiveSpeechTarget(target);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            transcript += event.results[i][0].transcript;
          }
        }

        if (transcript.trim()) {
          if (target === 'freeform') {
            setUserPrompt((prev) => (prev ? `${prev} ${transcript.trim()}` : transcript.trim()));
          } else {
            setChatInput((prev) => (prev ? `${prev} ${transcript.trim()}` : transcript.trim()));
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setSpeechError('Microphone permission denied. Please allow microphone access in browser settings.');
        } else if (event.error !== 'no-speech') {
          setSpeechError(`Microphone notice: ${event.error}`);
        }
        setIsRecording(false);
        setActiveSpeechTarget(null);
        setTimeout(() => setSpeechError(null), 4000);
      };

      recognition.onend = () => {
        setIsRecording(false);
        setActiveSpeechTarget(null);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('Failed to start speech recognition:', err);
      setSpeechError('Could not start microphone dictation.');
      setIsRecording(false);
      setActiveSpeechTarget(null);
      setTimeout(() => setSpeechError(null), 4000);
    }
  };

  // Send message in Chat mode
  const handleSendChat = () => {
    if (!chatInput.trim() || isGenerating) return;
    if (isRecording) {
      toggleSpeechRecognition('chat');
    }
    const message = chatInput.trim();
    setChatInput('');
    if (onSendChatMessage) {
      onSendChatMessage(message);
    }
  };

  // Handle Enter key in Chat input textarea
  const handleChatKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendChat();
    }
  };

  // Handle Enter key in Freeform mode textarea
  const handleFreeformKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (onRun) onRun();
    }
  };

  // Chat Turn operations
  const addTurn = (role: 'user' | 'model') => {
    setTurns((prev) => [
      ...prev,
      {
        id: `turn-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
        role,
        content: '',
      },
    ]);
  };

  const updateTurn = (id: string, content: string) => {
    setTurns((prev) => prev.map((t) => (t.id === id ? { ...t, content } : t)));
  };

  const toggleTurnRole = (id: string) => {
    setTurns((prev) =>
      prev.map((t) => (t.id === id ? { ...t, role: t.role === 'user' ? 'model' : 'user' } : t))
    );
  };

  const removeTurn = (id: string) => {
    setTurns((prev) => prev.filter((t) => t.id !== id));
  };

  const copyTurnContent = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedTurnId(id);
    setTimeout(() => setCopiedTurnId(null), 2000);
  };

  // Test Case operations
  const addTestCase = () => {
    const newId = `tc-${Date.now().toString(36)}`;
    setTestCases((prev) => [
      ...prev,
      {
        id: newId,
        category: 'Custom Test',
        input: 'Sample query for prompt evaluation',
        expectedOutput: '',
      },
    ]);
  };

  const updateTestCase = (id: string, field: keyof TestCase, val: any) => {
    setTestCases((prev) => prev.map((tc) => (tc.id === id ? { ...tc, [field]: val } : tc)));
  };

  const removeTestCase = (id: string) => {
    setTestCases((prev) => prev.filter((tc) => tc.id !== id));
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0c0e14]">
      {/* Mode Sub-Navigation Tabs */}
      <div className="h-11 px-4 border-b border-slate-800/80 bg-[#0e111a] flex items-center justify-between select-none">
        <div className="flex items-center gap-1.5 p-0.5 bg-slate-950 rounded-lg border border-slate-800">
          <button
            onClick={() => setMode('freeform')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              mode === 'freeform'
                ? 'bg-amber-500/20 text-amber-300 shadow-sm border border-amber-500/40 ring-1 ring-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Single or multi-variable prompt engineering"
          >
            <FileText size={13} className="text-amber-400" />
            <span>Freeform Prompt</span>
          </button>

          <button
            onClick={() => setMode('chat')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              mode === 'chat'
                ? 'bg-amber-500/20 text-amber-300 shadow-sm border border-amber-500/40 ring-1 ring-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Interactive conversational chat with Adinkra AI"
          >
            <MessageSquare size={13} className="text-amber-400" />
            <span>Chat Mode ({turns.length} turns)</span>
          </button>

          <button
            onClick={() => setMode('structured')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              mode === 'structured'
                ? 'bg-amber-500/20 text-amber-300 shadow-sm border border-amber-500/40 ring-1 ring-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Batch prompt resilience evaluation test matrix"
          >
            <Table2 size={13} className="text-amber-400" />
            <span>Test Matrix ({testCases.length})</span>
          </button>
        </div>

        {/* Right Info & Dictation Status */}
        <div className="flex items-center gap-3 text-xs text-slate-400">
          {speechError && (
            <div className="flex items-center gap-1 text-[11px] text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800 animate-in fade-in">
              <AlertCircle size={11} />
              <span>{speechError}</span>
            </div>
          )}

          {isRecording && (
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-amber-400 bg-amber-950/90 border border-amber-500 px-2.5 py-1 rounded-full animate-pulse shadow-lg shadow-amber-950">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              <span className="font-bold">Microphone Active (Speaking...)</span>
            </div>
          )}

          {mode === 'freeform' && (
            <div className="flex items-center gap-2">
              {detectedVariables.length > 0 && (
                <span className="text-[11px] font-mono text-amber-400/90 bg-amber-950/40 border border-amber-800/50 px-1.5 py-0.5 rounded">
                  {detectedVariables.length} variable{detectedVariables.length > 1 ? 's' : ''} detected
                </span>
              )}
              <span className="font-mono text-[11px] text-slate-400">
                ~{tokenEstimate} tokens
              </span>
            </div>
          )}

          {mode === 'structured' && (
            <button
              onClick={onRunAllTestCases}
              disabled={isEvaluatingBatch || testCases.length === 0}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 rounded text-xs font-medium transition-colors"
            >
              <Play size={11} className="fill-current" />
              <span>{isEvaluatingBatch ? 'Evaluating...' : 'Run All Test Cases'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Editor Body based on selected Mode */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col min-h-0">
        {/* Helper Banner pointing directly to the Send Prompt and Speech to Text buttons */}
        <div className="mb-3 px-3 py-1.5 bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/30 rounded-lg flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-bold flex items-center gap-1">
              <Sparkles size={13} />
              <span>Controls Guide:</span>
            </span>
            <span className="text-slate-300">
              Find <strong className="text-amber-300">"Speech to Text" (🎙️)</strong> and <strong className="text-amber-300">"Send Prompt" (➤)</strong> right below the text area.
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 hidden md:inline">
            Active Mode: <span className="text-amber-400 uppercase font-semibold">{mode}</span>
          </span>
        </div>

        {/* FREEFORM MODE */}
        {mode === 'freeform' && (
          <div className="flex-1 flex flex-col gap-3 min-h-0">
            <div className="flex-1 flex flex-col min-h-0 bg-[#090b10] border border-slate-800/90 focus-within:border-amber-500/60 rounded-xl overflow-hidden shadow-inner transition-colors">
              <textarea
                ref={freeformInputRef}
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                onKeyDown={handleFreeformKeyDown}
                placeholder="Enter your prompt here... Tip: use {{variable_name}} to inject dynamic test variables or click the Speech to Text button below to dictate your prompt."
                className="flex-1 w-full bg-transparent p-3.5 pb-3 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none font-mono leading-relaxed resize-none"
              />

              {/* Dedicated High-Visibility Bottom Action Toolbar */}
              <div className="px-3 py-2.5 border-t border-slate-800 bg-[#0e111a] flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <span className="hidden sm:inline font-mono text-[11px] text-slate-400">
                    Keyboard: <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-amber-300 font-bold text-[10px]">⌘↵</kbd> or <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-amber-300 font-bold text-[10px]">Ctrl+Enter</kbd>
                  </span>
                  {userPrompt && (
                    <button
                      onClick={() => setUserPrompt('')}
                      className="text-slate-500 hover:text-slate-300 text-[11px] transition-colors ml-1"
                    >
                      Clear prompt
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2.5">
                  {/* SPEECH TO TEXT / MICROPHONE BUTTON */}
                  <button
                    type="button"
                    onClick={() => toggleSpeechRecognition('freeform')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all shadow-sm ${
                      isRecording && activeSpeechTarget === 'freeform'
                        ? 'bg-rose-900 hover:bg-rose-800 text-rose-100 border border-rose-500 animate-pulse shadow-md shadow-rose-950'
                        : 'bg-[#151928] hover:bg-slate-800 text-amber-300 border border-amber-500/40 hover:border-amber-400 hover:text-amber-200'
                    }`}
                    title={
                      isRecording && activeSpeechTarget === 'freeform'
                        ? 'Microphone recording in progress! Click to stop listening'
                        : 'Speech to Text: Click to speak and dictate your prompt'
                    }
                  >
                    {isRecording && activeSpeechTarget === 'freeform' ? (
                      <>
                        <MicOff size={15} className="text-rose-300" />
                        <span>Stop Listening</span>
                      </>
                    ) : (
                      <>
                        <Mic size={15} className="text-amber-400 fill-amber-400/20" />
                        <span>Speech to Text</span>
                      </>
                    )}
                  </button>

                  {/* SEND PROMPT / ENTER BUTTON */}
                  {onRun && (
                    <button
                      type="button"
                      onClick={onRun}
                      disabled={isGenerating || !userPrompt.trim()}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-md ${
                        isGenerating
                          ? 'bg-amber-600/50 text-slate-200 cursor-not-allowed animate-pulse'
                          : !userPrompt.trim()
                          ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                          : 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 shadow-amber-500/25 active:scale-95 ring-1 ring-amber-400/50'
                      }`}
                      title="Send prompt to Gemini AI (Enter / ⌘+Enter)"
                    >
                      {isGenerating ? (
                        <>
                          <Square size={13} className="fill-current" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <Send size={13} className="fill-current" />
                          <span>Send Prompt</span>
                          <span className="text-[10px] bg-slate-950/20 px-1 py-0.2 rounded font-mono font-normal">↵</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Variable Substitutions Panel if {{variables}} present */}
            {detectedVariables.length > 0 && (
              <div className="bg-[#121521] border border-slate-800 rounded-lg p-3">
                <div className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Sparkles size={12} className="text-amber-400" />
                    <span>Dynamic Prompt Variables</span>
                  </span>
                  <span className="text-[10px] text-slate-400 lowercase font-normal">
                    interpolated at execution time
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {detectedVariables.map((v) => (
                    <div key={v} className="flex items-center gap-2 bg-[#090b10] border border-slate-800 rounded px-2.5 py-1.5">
                      <span className="text-xs font-mono text-amber-400 select-none">
                        {'{{' + v + '}}'}
                      </span>
                      <ArrowRight size={11} className="text-slate-600" />
                      <input
                        type="text"
                        placeholder={`Value for ${v}...`}
                        value={variables[v] || ''}
                        onChange={(e) => setVariables((prev) => ({ ...prev, [v]: e.target.value }))}
                        className="flex-1 bg-transparent text-xs text-slate-200 focus:outline-none font-mono"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* CHAT MODE */}
        {mode === 'chat' && (
          <div className="flex-1 flex flex-col min-h-0 gap-3">
            {/* Conversation Feed */}
            <div
              ref={chatScrollRef}
              className="flex-1 overflow-y-auto space-y-3.5 pr-1 min-h-0"
            >
              {turns.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-800 rounded-xl text-slate-500">
                  <MessageSquare size={32} className="mb-2 text-slate-600" />
                  <p className="text-xs font-medium text-slate-300">Start a Conversation</p>
                  <p className="text-[11px] text-slate-400 max-w-sm mt-1 leading-relaxed">
                    Type your message in the chat box below or click the microphone to speak. Adinkra Studio will stream responses with multi-turn context.
                  </p>
                </div>
              ) : (
                turns.map((turn, idx) => {
                  const isUser = turn.role === 'user';
                  return (
                    <div
                      key={turn.id}
                      className={`flex flex-col gap-1 ${
                        isUser ? 'items-end' : 'items-start'
                      }`}
                    >
                      <div className="flex items-center gap-2 px-1 text-[10px] text-slate-400 font-mono">
                        {isUser ? (
                          <>
                            <span>You (User)</span>
                            <span>·</span>
                            <span>Turn #{idx + 1}</span>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-1 text-amber-400 font-medium">
                              <AdinkraGlyph name="nyansapo" size={11} />
                              <span>Adinkra AI</span>
                            </div>
                            <span>·</span>
                            <span>Turn #{idx + 1}</span>
                          </>
                        )}
                      </div>

                      <div
                        className={`max-w-[85%] rounded-2xl p-3.5 text-xs shadow-sm transition-colors relative group ${
                          isUser
                            ? 'bg-gradient-to-br from-slate-900 to-[#141b2d] border border-blue-900/40 text-slate-100 rounded-tr-sm'
                            : 'bg-[#101422] border border-slate-800 text-slate-200 rounded-tl-sm'
                        }`}
                      >
                        <div className="whitespace-pre-wrap leading-relaxed font-sans select-text">
                          {turn.content || <span className="italic text-slate-500">Empty message</span>}
                        </div>

                        {/* Turn Actions on Hover */}
                        <div className="flex items-center gap-1.5 mt-2 pt-1.5 border-t border-slate-800/60 text-[10px] text-slate-400 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => copyTurnContent(turn.id, turn.content)}
                            className="hover:text-white flex items-center gap-1 p-0.5"
                            title="Copy message text"
                          >
                            {copiedTurnId === turn.id ? (
                              <Check size={11} className="text-emerald-400" />
                            ) : (
                              <Copy size={11} />
                            )}
                            <span>{copiedTurnId === turn.id ? 'Copied' : 'Copy'}</span>
                          </button>

                          <button
                            onClick={() => toggleTurnRole(turn.id)}
                            className="hover:text-amber-300 font-mono text-[9px] px-1 rounded bg-slate-900 border border-slate-800"
                            title="Switch turn role (User/Model)"
                          >
                            Flip Role
                          </button>

                          <button
                            onClick={() => removeTurn(turn.id)}
                            className="hover:text-rose-400 p-0.5 ml-auto"
                            title="Delete this message turn"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Streaming typing indicator if generating */}
              {isGenerating && (
                <div className="flex flex-col items-start gap-1 animate-in fade-in">
                  <div className="flex items-center gap-1 text-[10px] text-amber-400 font-mono px-1">
                    <AdinkraGlyph name="nyansapo" size={11} />
                    <span>Adinkra AI is thinking & typing...</span>
                  </div>
                  <div className="bg-[#101422] border border-amber-500/30 rounded-2xl rounded-tl-sm p-3.5 text-xs text-amber-200/90 shadow-inner flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    <span className="font-mono text-[11px] text-slate-300">Streaming tokens from Gemini...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Interactive Input Bar (Textarea + Microphone + Enter/Send Button) */}
            <div className="pt-2 border-t border-slate-800/80 bg-[#0c0e14]">
              <div className="bg-[#090b10] border border-slate-700/80 focus-within:border-amber-500/70 rounded-xl overflow-hidden shadow-lg transition-colors">
                <textarea
                  ref={chatInputRef}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={handleChatKeyDown}
                  placeholder={
                    isRecording && activeSpeechTarget === 'chat'
                      ? '🎙️ Listening to your voice... Speak now into your microphone'
                      : 'Type your message to Adinkra Studio AI... Press Enter to send, or click Speech to Text below to speak'
                  }
                  rows={2}
                  className="w-full bg-transparent p-3 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none font-sans leading-relaxed resize-none"
                />

                {/* Bottom Action Bar with explicitly labeled Speech to Text and Send Prompt buttons */}
                <div className="px-3 py-2 border-t border-slate-800 bg-[#0e111a] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <span className="hidden sm:inline font-mono">
                      Press <kbd className="px-1 py-0.5 bg-slate-800 border border-slate-700 rounded text-amber-300 font-bold text-[10px]">Enter ↵</kbd> to send
                    </span>
                    <span className="hidden sm:inline">·</span>
                    <span className="text-[10px] text-slate-500">Shift + Enter for new line</span>
                  </div>

                  {/* Right Input Action Buttons: Microphone and Enter / Send Button */}
                  <div className="flex items-center gap-2">
                    {/* SPEECH TO TEXT / MICROPHONE BUTTON */}
                    <button
                      type="button"
                      onClick={() => toggleSpeechRecognition('chat')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm ${
                        isRecording && activeSpeechTarget === 'chat'
                          ? 'bg-rose-900 text-rose-100 border border-rose-500 animate-pulse shadow-md shadow-rose-950'
                          : 'bg-[#151928] hover:bg-slate-800 text-amber-300 border border-amber-500/40 hover:border-amber-400'
                      }`}
                      title={
                        isRecording && activeSpeechTarget === 'chat'
                          ? 'Microphone active! Click to stop listening'
                          : 'Speech to Text: Click to speak and dictate your message using microphone'
                      }
                    >
                      {isRecording && activeSpeechTarget === 'chat' ? (
                        <>
                          <MicOff size={14} className="text-rose-300" />
                          <span>Stop Listening</span>
                        </>
                      ) : (
                        <>
                          <Mic size={14} className="text-amber-400 fill-amber-400/20" />
                          <span>Speech to Text</span>
                        </>
                      )}
                    </button>

                    {/* SEND PROMPT / ENTER BUTTON */}
                    <button
                      type="button"
                      onClick={handleSendChat}
                      disabled={!chatInput.trim() || isGenerating}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md ${
                        !chatInput.trim() || isGenerating
                          ? 'bg-slate-800/80 text-slate-500 border border-slate-700/60 cursor-not-allowed'
                          : 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 shadow-amber-500/25 active:scale-95 ring-1 ring-amber-400/50'
                      }`}
                      title="Send message to AI (Enter ↵)"
                    >
                      <Send size={13} className="fill-current" />
                      <span>Send Prompt</span>
                      <span className="text-[10px] bg-slate-950/20 px-1 py-0.2 rounded font-mono font-normal">↵</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Chat Helper Subtitle */}
              <div className="flex items-center justify-between px-1 pt-1.5 text-[10px] text-slate-500">
                <span className="text-amber-400/80 font-mono">
                  Adinkra AI responses stream with multi-turn context
                </span>
                {turns.length > 0 && (
                  <button
                    onClick={() => setTurns([])}
                    className="text-slate-500 hover:text-rose-400 transition-colors"
                  >
                    Clear chat history
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STRUCTURED TEST MATRIX */}
        {mode === 'structured' && (
          <div className="flex-1 flex flex-col gap-3 min-h-0">
            <div className="flex items-center justify-between">
              <div className="text-xs text-slate-400">
                Evaluate prompt resilience across diverse inputs and verify output schemas.
              </div>
              <button
                onClick={addTestCase}
                className="flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded text-xs font-medium transition-colors"
              >
                <Plus size={12} className="text-amber-400" />
                <span>Add Test Case</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3">
              {testCases.map((tc, index) => (
                <div
                  key={tc.id}
                  className="bg-[#121622] border border-slate-800 rounded-lg p-3 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono font-semibold text-amber-400">
                        Case #{index + 1}
                      </span>
                      <input
                        type="text"
                        value={tc.category || ''}
                        onChange={(e) => updateTestCase(tc.id, 'category', e.target.value)}
                        placeholder="Category (e.g. Edge Case)"
                        className="bg-slate-900/80 border border-slate-800 rounded px-2 py-0.5 text-[11px] text-slate-300 font-mono w-36"
                      />
                      {tc.passed !== undefined && (
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded flex items-center gap-1 ${
                            tc.passed
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : 'bg-rose-950 text-rose-300 border border-rose-800'
                          }`}
                        >
                          {tc.passed ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                          {tc.passed ? 'Passed' : 'Failed'}
                        </span>
                      )}
                      {tc.latencyMs && (
                        <span className="text-[10px] font-mono text-slate-400">
                          {tc.latencyMs}ms
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onRunTestCase(tc)}
                        disabled={tc.running}
                        className="p-1 text-slate-400 hover:text-amber-300 hover:bg-slate-800 rounded transition-colors"
                        title="Run This Test Case"
                      >
                        <Play size={13} className={tc.running ? 'animate-spin' : ''} />
                      </button>
                      <button
                        onClick={() => removeTestCase(tc.id)}
                        className="p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                        title="Delete Test Case"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Input & Expected Output Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="text-[10px] text-slate-400 mb-1">Test Input:</div>
                      <textarea
                        value={tc.input}
                        onChange={(e) => updateTestCase(tc.id, 'input', e.target.value)}
                        placeholder="Test input payload..."
                        rows={2}
                        className="w-full bg-[#090b10] border border-slate-800 focus:border-amber-500/50 rounded p-2 text-xs text-slate-200 focus:outline-none font-mono resize-none"
                      />
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 mb-1">Expected Output (or validation criteria):</div>
                      <textarea
                        value={tc.expectedOutput || ''}
                        onChange={(e) => updateTestCase(tc.id, 'expectedOutput', e.target.value)}
                        placeholder="Expected string or regex pattern..."
                        rows={2}
                        className="w-full bg-[#090b10] border border-slate-800 focus:border-amber-500/50 rounded p-2 text-xs text-slate-200 focus:outline-none font-mono resize-none"
                      />
                    </div>
                  </div>

                  {/* Actual Output if evaluated */}
                  {tc.actualOutput && (
                    <div className="mt-2 pt-2 border-t border-slate-800/80">
                      <div className="text-[10px] text-slate-400 mb-0.5">Actual Model Output:</div>
                      <div className="bg-[#090b10] border border-slate-800/80 rounded p-2 text-xs text-slate-300 font-mono whitespace-pre-wrap max-h-32 overflow-y-auto">
                        {tc.actualOutput}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
