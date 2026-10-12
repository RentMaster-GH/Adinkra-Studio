import React, { useState } from 'react';
import { X, Copy, Check, Code2, Download } from 'lucide-react';
import { PromptState } from '../types';

interface GetCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  promptState: PromptState;
}

export const GetCodeModal: React.FC<GetCodeModalProps> = ({
  isOpen,
  onClose,
  promptState,
}) => {
  const [activeLang, setActiveLang] = useState<'python' | 'typescript' | 'curl' | 'json'>('typescript');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const { model, systemInstruction, userPrompt, parameters } = promptState;

  // TypeScript (@google/genai)
  const tsCode = `import { GoogleGenAI } from "@google/genai";

// Initialize Gemini client with User-Agent telemetry
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

async function main() {
  const response = await ai.models.generateContent({
    model: "${model}",
    contents: ${JSON.stringify(userPrompt)},
    config: {${systemInstruction ? `\n      systemInstruction: ${JSON.stringify(systemInstruction)},` : ''}
      temperature: ${parameters.temperature},
      topP: ${parameters.topP},
      topK: ${parameters.topK},
      maxOutputTokens: ${parameters.maxOutputTokens},${
    parameters.thinkingLevel ? `\n      thinkingConfig: { thinkingLevel: "${parameters.thinkingLevel}" },` : ''
  }${parameters.enableSearchGrounding ? `\n      tools: [{ googleSearch: {} }],` : ''}${
    parameters.responseFormat === 'json' ? `\n      responseMimeType: "application/json",` : ''
  }
    },
  });

  console.log(response.text);
}

main();`;

  // Python (google-genai)
  const pythonCode = `import os
from google import genai
from google.genai import types

client = genai.Client(
    api_key=os.environ.get("GEMINI_API_KEY"),
    http_options={"headers": {"User-Agent": "aistudio-build"}}
)

config = types.GenerateContentConfig(
${systemInstruction ? `    system_instruction=${JSON.stringify(systemInstruction)},\n` : ''}    temperature=${parameters.temperature},
    top_p=${parameters.topP},
    top_k=${parameters.topK},
    max_output_tokens=${parameters.maxOutputTokens},${
    parameters.enableSearchGrounding ? `\n    tools=[types.Tool(google_search=types.GoogleSearch())],` : ''
  }${parameters.responseFormat === 'json' ? `\n    response_mime_type="application/json",` : ''}
)

response = client.models.generate_content(
    model="${model}",
    contents=${JSON.stringify(userPrompt)},
    config=config
)

print(response.text)`;

  // cURL
  const curlCode = `curl "https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent" \\
  -H "Content-Type: application/json" \\
  -H "x-goog-api-key: $GEMINI_API_KEY" \\
  -d '{
    "contents": [{"parts": [{"text": ${JSON.stringify(userPrompt)}}]}],
    ${systemInstruction ? `"systemInstruction": {"parts": [{"text": ${JSON.stringify(systemInstruction)}}]},` : ''}
    "generationConfig": {
      "temperature": ${parameters.temperature},
      "topP": ${parameters.topP},
      "topK": ${parameters.topK},
      "maxOutputTokens": ${parameters.maxOutputTokens}${parameters.responseFormat === 'json' ? ',\n      "responseMimeType": "application/json"' : ''}
    }
  }'`;

  // JSON Payload
  const jsonCode = JSON.stringify(
    {
      model,
      systemInstruction,
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      config: {
        temperature: parameters.temperature,
        topP: parameters.topP,
        topK: parameters.topK,
        maxOutputTokens: parameters.maxOutputTokens,
        thinkingLevel: parameters.thinkingLevel,
        tools: parameters.enableSearchGrounding ? [{ googleSearch: {} }] : [],
        responseFormat: parameters.responseFormat,
      },
    },
    null,
    2
  );

  const getCodeText = () => {
    switch (activeLang) {
      case 'typescript':
        return tsCode;
      case 'python':
        return pythonCode;
      case 'curl':
        return curlCode;
      case 'json':
        return jsonCode;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getCodeText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#101422] border border-slate-700/80 rounded-2xl w-full max-w-3xl flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-[#131728] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code2 size={16} className="text-amber-400" />
            <div>
              <div className="text-sm font-semibold text-slate-100">Get Code</div>
              <div className="text-[11px] text-slate-400">
                Ready-to-run SDK implementations matching your prompt & parameters
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

        {/* Language Tabs */}
        <div className="px-4 py-2 border-b border-slate-800/80 bg-[#0e111a] flex items-center justify-between text-xs">
          <div className="flex gap-1 p-0.5 bg-slate-950 rounded-lg border border-slate-800 font-mono">
            {(['typescript', 'python', 'curl', 'json'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setActiveLang(lang)}
                className={`px-3 py-1 rounded-md capitalize transition-colors ${
                  activeLang === lang
                    ? 'bg-amber-500/20 text-amber-300 font-medium'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded text-xs font-medium transition-colors"
          >
            {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
            <span>{copied ? 'Copied!' : 'Copy Code'}</span>
          </button>
        </div>

        {/* Code Content */}
        <div className="p-4 bg-[#090b10] max-h-[60vh] overflow-y-auto">
          <pre className="font-mono text-xs text-amber-100/90 leading-relaxed whitespace-pre overflow-x-auto p-2">
            {getCodeText()}
          </pre>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-[#131728] text-[11px] text-slate-400 flex items-center justify-between">
          <span>Remember to install dependencies and configure GEMINI_API_KEY.</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-amber-500 text-slate-950 font-semibold rounded text-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
