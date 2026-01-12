
import { GoogleGenAI, Type } from "@google/genai";
import { NutritionValues } from "../types";

export const estimateNutrition = async (
  name: string,
  quantity: number,
  unit: string
): Promise<NutritionValues & { reasoning: string }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `Schat de voedingswaarden voor ${quantity} ${unit} van "${name}". 
                  Geef realistische waarden voor calorieën, eiwitten, koolhydraten en vetten.
                  Geef ook een korte uitleg (reasoning) in het Nederlands waarom je deze waarden hebt gekozen.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          calories: { type: Type.NUMBER, description: "Totaal aantal calorieën" },
          protein: { type: Type.NUMBER, description: "Gram eiwitten" },
          carbs: { type: Type.NUMBER, description: "Gram koolhydraten" },
          fat: { type: Type.NUMBER, description: "Gram vetten" },
          reasoning: { type: Type.STRING, description: "Uitleg van de schatting" }
        },
        required: ["calories", "protein", "carbs", "fat", "reasoning"],
      },
    },
  });

  const result = JSON.parse(response.text || '{}');
  return result;
};

export const estimateFreeformRecipe = async (description: string): Promise<NutritionValues & { reasoning: string }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `Analyseer dit recept of maaltijd: "${description}". 
                  Schat de totale voedingswaarden voor de hele portie zoals beschreven.
                  Geef ook een korte uitleg in het Nederlands.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          calories: { type: Type.NUMBER },
          protein: { type: Type.NUMBER },
          carbs: { type: Type.NUMBER },
          fat: { type: Type.NUMBER },
          reasoning: { type: Type.STRING }
        },
        required: ["calories", "protein", "carbs", "fat", "reasoning"],
      },
    },
  });

  return JSON.parse(response.text || '{}');
};
