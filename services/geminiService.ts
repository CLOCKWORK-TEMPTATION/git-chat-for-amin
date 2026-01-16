
import { GoogleGenAI, Chat } from "@google/genai";
import { AiModelId } from '../types';
import { SYSTEM_INSTRUCTION, REVIEWER_SYSTEM_INSTRUCTION, EMBEDDING_MODEL } from '../constants';

let chatSession: Chat | null = null;
let ai: GoogleGenAI | null = null;

export const initializeGemini = (apiKey: string) => {
  if (!apiKey) return;
  ai = new GoogleGenAI({ apiKey });
};

export const startChatSession = async (
    modelId: AiModelId, 
    initialContext: string = "", 
    isReviewerMode: boolean = false,
    enableThinking: boolean = false
) => {
  if (!ai) throw new Error("AI not initialized. Please check your API Key.");
  
  // Select instruction based on mode
  const baseInstruction = isReviewerMode ? REVIEWER_SYSTEM_INSTRUCTION : SYSTEM_INSTRUCTION;
  
  // RAG context will be injected per-message, but we can put high-level structure here.
  const fullSystemInstruction = `${baseInstruction}\n\n${initialContext}`;

  // Enable Google Search tool for supported models (Gemini 3 and 2.5 series)
  const tools = (modelId.includes('gemini-3') || modelId.includes('gemini-2.5')) 
    ? [{ googleSearch: {} }] 
    : undefined;

  const config: any = {
      systemInstruction: fullSystemInstruction,
      temperature: isReviewerMode ? 0.3 : 0.5,
      tools: tools,
  };

  // Thinking Mode Configuration
  if (enableThinking && modelId === 'gemini-3-pro-preview') {
      config.thinkingConfig = { thinkingBudget: 32768 };
      // Note: Do NOT set maxOutputTokens when using thinkingConfig
  }

  chatSession = ai.chats.create({
    model: modelId,
    config: config,
  });
};

export const embedTexts = async (texts: string[]): Promise<number[][]> => {
  if (!ai) throw new Error("AI not initialized");
  
  try {
    // Determine batch size (Gemini API limit is usually 100 docs per request for embedContent)
    const BATCH_SIZE = 10; 
    const embeddings: number[][] = [];

    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      const batch = texts.slice(i, i + BATCH_SIZE);
      
      const batchPromises = batch.map(text => 
        ai!.models.embedContent({
          model: EMBEDDING_MODEL,
          contents: { parts: [{ text }] }
        })
      );

      const responses = await Promise.all(batchPromises);
      
      responses.forEach(response => {
        // Use 'embeddings' array from response (fix for type error)
        const embeddingValues = response.embeddings?.[0]?.values;
        if (embeddingValues) {
           embeddings.push(embeddingValues);
        } else {
           // Push empty array to maintain index alignment if needed, though robust RAG should handle filtering
           embeddings.push([]); 
        }
      });
    }
    return embeddings;
  } catch (error) {
    console.error("Embedding Error:", error);
    throw new Error("فشل في إنشاء Embeddings للنص. يرجى التأكد من صلاحية مفتاح API.");
  }
};

export const sendMessageToGemini = async (
    message: string, 
    context: string = "", 
    image?: { data: string, mimeType: string }
): Promise<string> => {
  if (!chatSession) throw new Error("Chat session not started");

  try {
    // Inject RAG context into the message
    const msgWithContext = context 
      ? `--- Relevant Context ---\n${context}\n\n--- User Question ---\n${message}` 
      : message;

    let messagePayload: any = msgWithContext;

    if (image) {
        messagePayload = [
            { text: msgWithContext },
            {
                inlineData: {
                    mimeType: image.mimeType,
                    data: image.data
                }
            }
        ];
    }

    const response = await chatSession.sendMessage({ message: messagePayload });
    let text = response.text || "لم أتمكن من توليد إجابة نصية.";

    // Handle Search Grounding (Google Search)
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    if (groundingMetadata?.groundingChunks) {
      const uniqueSources = new Map<string, string>();
      
      groundingMetadata.groundingChunks.forEach((chunk: any) => {
        if (chunk.web?.uri && chunk.web?.title) {
          uniqueSources.set(chunk.web.uri, chunk.web.title);
        }
      });

      if (uniqueSources.size > 0) {
        text += "\n\n**المصادر (Google Search):**\n";
        uniqueSources.forEach((title, uri) => {
          text += `- [${title}](${uri})\n`;
        });
      }
    }

    return text;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error.message?.includes('429')) {
       throw new Error("تم تجاوز حد الطلبات (Rate Limit). يرجى الانتظار قليلاً.");
    }
    throw new Error("حدث خطأ أثناء الاتصال بـ Gemini AI.");
  }
};
