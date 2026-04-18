import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const getChatbotResponse = async (message: string, history: any[] = []) => {
  try {
    const chat = ai.chats.create({
      model: "gemini-3.1-pro-preview",
      config: {
        systemInstruction: "You are AquaGrow AI, a specialized AgTech assistant for the AquaGrow Admin platform. You help administrators manage marketplace ads, provider registries, harvest sales, and business intelligence. Provide precise, technical, and helpful advice on agricultural logistics, market trends, and system operations.",
      },
    });

    // Note: sendMessage only accepts message parameter
    const response: GenerateContentResponse = await chat.sendMessage({ message });
    return response.text;
  } catch (error) {
    console.error("Chatbot Error:", error);
    return "I'm sorry, I encountered an error processing your request. Please try again.";
  }
};

export const getMarketInsights = async (query: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: query,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: "You are a market intelligence analyst for AquaGrow. Use Google Search to provide accurate, real-time insights on crop prices, agricultural trends, and market alerts. Always cite your sources if available.",
      },
    });

    return {
      text: response.text,
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  } catch (error) {
    console.error("Market Insights Error:", error);
    return { text: "Failed to fetch market insights.", sources: [] };
  }
};
