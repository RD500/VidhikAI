import { generateLegalAnswerFlow } from '@/ai/flows/ask';
import { appRoute } from '@genkit-ai/next';

export const POST = appRoute(generateLegalAnswerFlow);
