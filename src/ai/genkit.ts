import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import * as functions from 'firebase-functions';

// Determine if running in Firebase Functions environment
const isFirebaseEnv = !!process.env.FUNCTION_NAME;

// Define a helper to get API keys
const getApiKey = (service: 'gemini' | 'claude') => {
  if (isFirebaseEnv) {
    try {
      // Correctly access secrets in a production environment
      const secret = functions.config()[service];
      if (secret && secret.api_key) {
        return secret.api_key;
      }
    } catch (e) {
      console.warn(`Could not retrieve ${service} API key from Firebase config. Ensure secrets are set by running: firebase functions:secrets:set ${service.toUpperCase()}_API_KEY`);
    }
  }
  // Fallback for local development
  return process.env[service === 'gemini' ? 'GEMINI_API_KEY' : 'CLAUDE_API_KEY'];
};

export const ai = genkit({
  plugins: [
    googleAI({ apiKey: getApiKey('gemini') || 'unknown' }),
    // You would add other AI service plugins here, e.g., anthropic
  ],
  model: 'googleai/gemini-1.5-flash',
});

// Exporting the key retrieval for use in other files if needed
export { getApiKey };
