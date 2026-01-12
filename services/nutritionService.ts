
import { GoogleGenAI, Type } from "@google/genai";
import { NutritionValues } from "../types";

/**
 * AI Nutrition estimation service using Gemini.
 * The API key is retrieved strictly from process.env.API_KEY as per guidelines.
 */

// Estimating nutrition for a specific quantity and unit of a food item.
export const estimateNutrition = async (
  name: string,
  quantity: number,
  unit: string
): Promise<NutritionValues & { reasoning: string }> => {
  // Use process.env.API_KEY directly as required by the coding guidelines
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("MISSING_API_KEY");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `Schat de voedingswaarden voor ${quantity} ${unit} van "${name}". 
                  Geef realistische waarden voor calorieën (kcal), eiwitten (g), koolhydraten (g) en vetten (g).
                  Geef ook een korte uitleg (reasoning) in het Nederlands waarom je deze waarden hebt gekozen.`;

  try {
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

    // Access text property directly as per guidelines
    const text = response.text;
    if (!text) {
      throw new Error("EMPTY_RESPONSE");
    }

    return JSON.parse(text);
  } catch (error: any) {
    if (error.message === "MISSING_API_KEY") throw error;
    console.error("Gemini API Error:", error);
    throw new Error("AI_ESTIMATION_FAILED");
  }
};

// Analyzing a freeform meal description to estimate its total nutritional value.
export const estimateFreeformRecipe = async (description: string): Promise<NutritionValues & { reasoning: string }> => {
  // Use process.env.API_KEY directly as required by the coding guidelines
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("MISSING_API_KEY");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `Analyseer dit recept of maaltijd: "${description}". 
                  Schat de totale voedingswaarden voor de hele portie zoals beschreven.
                  Geef ook een korte uitleg in het Nederlands.`;

  try {
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

    // Access text property directly as per guidelines
    const text = response.text;
    if (!text) {
      throw new Error("EMPTY_RESPONSE");
    }

    return JSON.parse(text);
  } catch (error: any) {
    if (error.message === "MISSING_API_KEY") throw error;
    console.error("Gemini API Error:", error);
    throw new Error("AI_ESTIMATION_FAILED");
  }
};
