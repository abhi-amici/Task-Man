import { Language } from '../types';

// Define a type for the AI client instance dynamically to avoid a top-level static import.
// This allows for type safety without triggering the import on module load.
// By concatenating the string, we prevent the build system's static analyzer from finding it.
// FIX: The import() type function requires a string literal, so using a variable is not supported.
// This is a type-only import and won't be bundled until the dynamic import() is called at runtime.
type GoogleGenAIClient = InstanceType<(typeof import('@google/genai'))['GoogleGenAI']>;
type GenAIClientPromise = Promise<GoogleGenAIClient | null>;

let aiClientPromise: GenAIClientPromise | null = null;

const initializeAiClient = async (): Promise<GoogleGenAIClient | null> => {
    // Gracefully handle cases where the API key is not available in the browser's execution context
    // to prevent the application from crashing on load.
    // FIX: API key must be retrieved from process.env.API_KEY.
    const apiKey = process.env.API_KEY;

    // FIX: Updated check for API key presence.
    if (!apiKey) {
        // This warning is only logged once when the service is first used.
        console.warn('API_KEY is not available. Live translation is disabled.');
        return null;
    }

    try {
        // Dynamically import the module ONLY when needed. This is the key fix.
        // It prevents any top-level code in the @google/genai module from breaking the app on initial load.
        // FIX: The dynamic import() function requires a string literal.
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey });
        return ai;
    } catch (error) {
        console.error("Failed to dynamically import or initialize GoogleGenAI module.", error);
        return null;
    }
};

const getAiClient = (): GenAIClientPromise => {
    // Memoize the initialization promise to ensure it only runs once.
    if (!aiClientPromise) {
        aiClientPromise = initializeAiClient();
    }
    return aiClientPromise;
};

const translationCache = new Map<string, string>();

export const translateText = async (text: string, targetLang: Language): Promise<string> => {
    // Don't attempt to translate if the target is English or the text is empty.
    if (targetLang === 'en' || !text || text.trim().length === 0) {
        return text || '';
    }

    const cacheKey = `${targetLang}:${text}`;
    if (translationCache.has(cacheKey)) {
        return translationCache.get(cacheKey)!;
    }
    
    // Await the client promise. This will trigger initialization on the first run.
    const aiClient = await getAiClient();
    
    // If the client is not available (e.g., no API key, import failed), return the original text.
    if (!aiClient) {
        return text;
    }
    
    try {
        const langName = targetLang === 'hi' ? 'Hindi' : 'English';
        const systemInstruction = `You are a professional translator. Translate the user's text from English to ${langName}. Your response must contain only the translated text, without any additional comments, prefixes, explanations, or quotation marks. The output must be the direct translation.`;

        const response = await aiClient.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: text,
            config: {
                systemInstruction: systemInstruction,
            },
        });

        const translated = response.text.trim();
        translationCache.set(cacheKey, translated);
        return translated;
    } catch (error) {
        console.error("Translation API call failed:", error);
        return text; // Fallback to the original text on API error.
    }
};