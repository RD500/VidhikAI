import { compareDocumentsFlow } from '@/ai/flows/compare';
import { appRoute } from '@genkit-ai/next';

export const POST = appRoute(compareDocumentsFlow);
