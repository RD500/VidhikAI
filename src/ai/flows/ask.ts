/**
 * @fileOverview Flow for asking a follow-up question about a legal document.
 */
'use server';

import { ai } from '@/ai/genkit';
import { vertexAI } from '@genkit-ai/google-genai';
import { z } from 'zod';
import { Document } from 'genkit/retriever';


// Define a simple schema for chat messages
const MessageSchema = z.object({
  sender: z.enum(['user', 'ai']),
  content: z.string(),
});

const AskQuestionInputSchema = z.object({
  question: z.string(),
  documentText: z.string().describe("The full text content of the document to be queried."),
  chatHistory: z.array(MessageSchema),
});

const AskQuestionOutputSchema = z.string();

export type AskQuestionInput = z.infer<typeof AskQuestionInputSchema>;
export type AskQuestionOutput = z.infer<typeof AskQuestionOutputSchema>;


export const generateLegalAnswerFlow = ai.defineFlow(
  {
    name: 'generateLegalAnswerFlow',
    inputSchema: AskQuestionInputSchema,
    outputSchema: AskQuestionOutputSchema,
  },
  async (input) => {
    
    // 1. Format chat history for the prompt
    const history = input.chatHistory.map(msg => `${msg.sender}: ${msg.content}`).join('\n');

    // 2. Generate a response using the retrieved documents and chat history as context.
    const llmResponse = await ai.generate({
      model: vertexAI.model('gemini-2.5-pro'),
      prompt: `You are "Vidhik," an expert AI legal assistant specializing in document analysis. Your primary goal is to answer questions based *exclusively* on the provided context.

      CRITICAL INSTRUCTIONS:
      1.  **Analyze the Provided Context**: You will be given DOCUMENT CONTEXT from a legal document, a HISTORY of the current conversation, and a new USER QUESTION. Your entire analysis and answer MUST be based exclusively on this information.
      2.  **Use Chat History**: Refer to the conversation HISTORY to understand the context of the new USER QUESTION.
      3.  **If the answer is not in the context, say so**: If the provided document context does not contain the answer, you must state that the information is not available in the document excerpts. Do not try to guess.
      4.  **English Output ONLY (MANDATORY):** Your entire response and the final answer MUST be in **English**.
      5.  **Strict Formatting (MANDATORY):** Format your response using markdown for clarity. Use bold text, bullet points, and headings as needed.
      
      CONVERSATION HISTORY:
      ${history}
      
      USER QUESTION:
      ${input.question}`,
      docs: [Document.fromText(input.documentText, {question: input.question})],
    });

    return llmResponse.text;
  }
);
