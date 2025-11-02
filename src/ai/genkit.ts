/**
 * @fileOverview Centralized Genkit configuration.
 */
import { genkit } from 'genkit';
import { vertexAI } from '@genkit-ai/google-genai';
import { devLocalVectorstore, devLocalIndexerRef, devLocalRetrieverRef } from '@genkit-ai/dev-local-vectorstore';


export const documentRAG = devLocalIndexerRef('documentRAG');


export const ai = genkit({
  plugins: [
    vertexAI({ location: 'us-central1' }),
    devLocalVectorstore([
        {
          indexName: 'documentRAG',
          embedder: vertexAI.embedder('text-embedding-004'),
        },
      ]),
  ],
});
