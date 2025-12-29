
import { GoogleGenAI } from "@google/genai";
import { WorkPlanData } from "./types";

/**
 * Creates an AI client instance using the environment variable.
 */
const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY_MISSING");
  }
  return new GoogleGenAI({ apiKey });
};

export const getStepSuggestions = async (stepIndex: number, currentData: Partial<WorkPlanData>) => {
  try {
    const ai = getAiClient();
    
    const stepContext = [
      "מיפוי ורקע סביבתי לשפ\"ח",
      "ניתוח SWOT - חוזקות, חולשות, הזדמנויות ואיומים",
      "בניית חזון ליחידה - לאן אנחנו שואפים?",
      "הגדרת מטרות אסטרטגיות לשנה הקרובה",
      "ניסוח יעדי SMART מדידים",
      "ניהול משימות מפורט ותוכנית אופרטיבית",
      "אילוצים, חסמים וניהול סיכונים",
      "אינטגרציה סופית ובניית תוכנית עבודה"
    ][stepIndex];

    const prompt = `אתה יועץ אסטרטגי בכיר למנהלי שירותים פסיכולוגיים חינוכיים (שפ"ח). 
    אנחנו בסדנה לבניית תוכנית עבודה. השלב הנוכחי: ${stepContext}. 
    הנתונים שהוזנו עד כה: ${JSON.stringify(currentData)}. 
    
    משימה: 
    1. ספק 2-3 תובנות ניהוליות-פסיכולוגיות מעמיקות שיעזרו למנהל לדייק את השלב הזה בצורה מקצועית.
    2. תן דוגמה לניסוח מרשים ומקצועי לאחד הפריטים בשלב הזה (חזון/מטרה/יעד/משימה).
    השתמש בשפה מעצימה, יוקרתית ומקצועית המתאימה לפסיכולוגים ומנהלים.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    
    return response.text || "לא התקבל מענה מהמודל.";
  } catch (error: any) {
    if (error.message === "API_KEY_MISSING") throw new Error("מפתח ה-API חסר. יש להגדיר API_KEY במשתני הסביבה של Netlify.");
    console.error("AI Error:", error);
    throw error;
  }
};

export const generateFinalIntegration = async (data: WorkPlanData) => {
  try {
    const ai = getAiClient();
    
    const prompt = `משימה: בנה תוכנית עבודה שנתית אסטרטגית מקיפה ומלוטשת עבור מנהל שפ"ח על בסיס כל הנתונים שנאספו בסדנה.
    בצע אינטגרציה מלאה בין הרקע, ה-SWOT, החזון, המטרות והמשימות. התייחס גם לאילוצים ולחסמים שהוגדרו.
    
    נתונים: ${JSON.stringify(data)}.
    
    הפלט חייב להיות בפורמט Markdown הכולל:
    1. סיכום מנהלים אסטרטגי (Executive Summary).
    2. החזון המקצועי המזוקק.
    3. טבלת תוכנית עבודה מרשימה בפורמט "אקסל" (טבלת Markdown) הכוללת עמודות עבור: 
       מטרה אסטרטגית | יעד SMART | משימה אופרטיבית | אחריות | לו"ז ומשאבים | מענה לאילוצים/חסמים.
    4. המלצות לניהול השינוי בתוך הצוות ודגשים ליישום.
    
    שפה: עברית גבוהה, ניהולית, מקצועית ומרשימה.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
    });
    
    return response.text || "לא ניתן היה ליצור את האינטגרציה הסופית.";
  } catch (error: any) {
    console.error("Integration Error:", error);
    throw error;
  }
};
