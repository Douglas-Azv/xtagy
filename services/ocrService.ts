
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface ExtractedPieceData {
  internalCode: string;
  weight: number;
  baseValue: number;
  confidence: number;
}

export const ocrService = {
  async extractPieceDataFromImage(base64Image: string): Promise<ExtractedPieceData> {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            {
              text: `Analyze this jewelry label image. Extract the following fields into JSON:
              - internalCode: The product reference or code (often labeled as COD, REF, #).
              - weight: The weight in grams (look for GR, G, PESO).
              - baseValue: The raw price of the piece (look for R$, VALOR, PREÇO).
              
              Return ONLY a JSON object. If a field is not found, return an empty string or 0.
              Estimate a confidence score (0-1) based on legibility.`
            },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: base64Image.split(',')[1] || base64Image
              }
            }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            internalCode: { type: Type.STRING },
            weight: { type: Type.NUMBER },
            baseValue: { type: Type.NUMBER },
            confidence: { type: Type.NUMBER }
          },
          required: ["internalCode", "weight", "baseValue", "confidence"]
        }
      }
    });

    try {
      return JSON.parse(response.text || "{}") as ExtractedPieceData;
    } catch (e) {
      console.error("OCR Parse Error", e);
      return { internalCode: "", weight: 0, baseValue: 0, confidence: 0 };
    }
  }
};
