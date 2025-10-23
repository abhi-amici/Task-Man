import React, { useState, useEffect, useCallback, useRef } from 'react';
import { LiveTranslateIcon } from './Icons';

// Dynamically define types to avoid static analysis by the build system.
// By concatenating the string, we prevent the Firebase build scanner from detecting the module name.
// FIX: The import() type function requires a string literal, so using a variable is not supported.
// This is a type-only import and won't be bundled until the dynamic import() is called at runtime.
type GenaiModule = typeof import('@google/genai');
type LiveServerMessage = GenaiModule['LiveServerMessage'];
type GoogleGenAIClient = InstanceType<GenaiModule['GoogleGenAI']>;
type LiveSession = Awaited<ReturnType<GoogleGenAIClient['live']['connect']>>;


// --- Audio Encoding/Decoding Helpers ---
// Implemented manually as per guidelines to avoid external dependencies.
function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}


const availableLanguages = {
    'Hindi': 'hi',
    'Spanish': 'es',
    'French': 'fr',
    'German': 'de',
    'Japanese': 'ja',
};

type Status = 'idle' | 'connecting' | 'listening' | 'error';

interface LiveTranslationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LiveTranslationModal: React.FC<LiveTranslationModalProps> = ({ isOpen, onClose }) => {
    const [status, setStatus] = useState<Status>('idle');
    const [targetLang, setTargetLang] = useState('Hindi');
    const [userTranscription, setUserTranscription] = useState('');
    const [translatedText, setTranslatedText] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const outputSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const nextStartTimeRef = useRef<number>(0);

    const stopSession = useCallback(() => {
        if (sessionPromiseRef.current) {
            sessionPromiseRef.current.then(session => session.close());
            sessionPromiseRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }
        if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
            inputAudioContextRef.current.close();
        }
        if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
            outputAudioContextRef.current.close();
        }
        for (const source of outputSourcesRef.current.values()) {
            source.stop();
        }
        outputSourcesRef.current.clear();
        nextStartTimeRef.current = 0;
        setStatus('idle');
    }, []);

    const startSession = useCallback(async () => {
        setStatus('connecting');
        setUserTranscription('');
        setTranslatedText('');
        setErrorMessage('');

        try {
            // FIX: API key must be retrieved from process.env.API_KEY.
            const apiKey = process.env.API_KEY;
            if (!apiKey) {
                console.warn('API_KEY is not available. Live translation is disabled.');
                setErrorMessage('API key not configured. Live translation is unavailable.');
                setStatus('error');
                return;
            }

            // FIX: The dynamic import() function requires a string literal.
            const { GoogleGenAI, Modality } = await import('@google/genai');
            const ai = new GoogleGenAI({ apiKey });

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            
            inputAudioContextRef.current = new (window.AudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new (window.AudioContext)({ sampleRate: 24000 });

            const sessionPromise = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
                        const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
                        scriptProcessorRef.current = scriptProcessor;

                        scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const l = inputData.length;
                            const int16 = new Int16Array(l);
                            for (let i = 0; i < l; i++) {
                                int16[i] = inputData[i] * 32768;
                            }
                            const pcmBlob = {
                                data: encode(new Uint8Array(int16.buffer)),
                                mimeType: 'audio/pcm;rate=16000',
                            };
                            sessionPromise.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };
                        source.connect(scriptProcessor);
                        scriptProcessor.connect(inputAudioContextRef.current!.destination);
                        setStatus('listening');
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        if (message.serverContent?.inputTranscription) {
                            setUserTranscription(prev => prev + message.serverContent.inputTranscription.text);
                        }
                        if (message.serverContent?.outputTranscription) {
                            setTranslatedText(prev => prev + message.serverContent.outputTranscription.text);
                        }
                        const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData.data;
                        if (audioData) {
                            const outputCtx = outputAudioContextRef.current!;
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
                            const audioBuffer = await decodeAudioData(decode(audioData), outputCtx, 24000, 1);
                            const source = outputCtx.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputCtx.destination);
                            source.addEventListener('ended', () => { outputSourcesRef.current.delete(source); });
                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += audioBuffer.duration;
                            outputSourcesRef.current.add(source);
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Session error:', e);
                        setErrorMessage('A connection error occurred.');
                        setStatus('error');
                        stopSession();
                    },
                    onclose: (e: CloseEvent) => {
                        stopSession();
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    systemInstruction: `You are a real-time translator. The user is speaking English. Transcribe what they say and immediately translate it into ${targetLang}. Your audio response must contain only the spoken translation. Your transcribed output must contain only the translated text. Do not add any conversational filler.`,
                },
            });
            sessionPromiseRef.current = sessionPromise;
        } catch (err) {
            console.error('Failed to start session:', err);
            if (err instanceof Error) {
                if (err.message.includes("Could not find worker") || err.message.includes("module")) {
                    setErrorMessage('Failed to load AI module.');
                } else if (err.name === 'NotAllowedError' || err.name === 'NotFoundError' || err.name === 'PermissionDeniedError') {
                    setErrorMessage('Could not access microphone. Please check permissions.');
                } else {
                    setErrorMessage('An unexpected error occurred during setup.');
                }
            } else {
                setErrorMessage('An unknown error occurred.');
            }
            setStatus('error');
        }
    }, [stopSession, targetLang]);

    useEffect(() => {
        if (!isOpen) {
            stopSession();
        }
    }, [isOpen, stopSession]);

    const handleToggleListening = () => {
        if (status === 'listening' || status === 'connecting') {
            stopSession();
        } else {
            startSession();
        }
    };
    
    if (!isOpen) return null;

    const statusText = {
        idle: 'Click the button to start live translation.',
        connecting: 'Connecting and accessing microphone...',
        listening: 'Listening... Speak now.',
        error: `Error: ${errorMessage}`
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl h-[70vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center shrink-0">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <LiveTranslateIcon className="w-6 h-6 text-primary" />
                        Live Translation
                    </h2>
                    <div className="flex items-center gap-4">
                        <label htmlFor="target-lang" className="text-sm font-medium text-medium">Translate to:</label>
                        <select
                            id="target-lang"
                            value={targetLang}
                            onChange={e => setTargetLang(e.target.value)}
                            disabled={status === 'listening' || status === 'connecting'}
                            className="p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary text-sm"
                        >
                            {Object.keys(availableLanguages).map(lang => <option key={lang} value={lang}>{lang}</option>)}
                        </select>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" aria-label="Close modal">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </header>
                <main className="p-6 flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-hidden">
                    <div className="flex flex-col bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                        <h3 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-300">You said:</h3>
                        <div className="flex-1 overflow-y-auto text-gray-800 dark:text-gray-200 text-lg leading-relaxed pr-2">{userTranscription || <span className="text-gray-400">...</span>}</div>
                    </div>
                    <div className="flex flex-col bg-primary/5 dark:bg-primary/10 rounded-lg p-4 border border-primary/20">
                        <h3 className="text-lg font-semibold mb-2 text-primary dark:text-primary/90">Translation:</h3>
                        <div className="flex-1 overflow-y-auto text-primary/90 dark:text-primary/80 font-medium text-lg leading-relaxed pr-2">{translatedText || <span className="text-primary/40">...</span>}</div>
                    </div>
                </main>
                <footer className="p-4 border-t border-gray-200 dark:border-gray-700 flex flex-col items-center shrink-0">
                    <button 
                        onClick={handleToggleListening}
                        className={`px-6 py-3 rounded-full font-bold text-white flex items-center gap-3 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-70
                            ${status === 'listening' || status === 'connecting' ? 'bg-red-600 hover:bg-red-700' : 'bg-primary hover:bg-primary/90'}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className={`w-6 h-6 ${status === 'listening' && 'animate-pulse'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                        {status === 'listening' || status === 'connecting' ? 'Stop Listening' : 'Start Listening'}
                    </button>
                    <p className={`mt-3 text-sm h-5 ${status === 'error' ? 'text-red-500' : 'text-medium'}`}>{statusText[status]}</p>
                </footer>
            </div>
        </div>
    );
};

export default LiveTranslationModal;