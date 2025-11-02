import { demystifyDocumentFlow } from '@/ai/flows/demystify';
import { appRoute } from '@genkit-ai/next';

export const POST = appRoute(demystifyDocumentFlow);
