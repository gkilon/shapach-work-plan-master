
import { GoogleGenAI } from "@google/genai";
import { WorkPlanData } from "./types";

/**
 * פונקציה ליצירת מופע AI עם המפתח הנוכחי בסביבה
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
    הנתונים שהוזנו: ${JSON.stringify(currentData)}. 
    
    משימה: 
    1. ספק 2-3 תובנות ניהוליות-פסיכולוגיות מעמיקות שיעזרו למנהל לדייק את השלב הזה.
    2. תן דוגמה לניסוח מרשים ומקצועי לאחד הפריטים בשלב הזה.
    השתמש בשפה מעצימה, יוקרתית ומקצועית.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    
    return response.text || "לא התקבל מענה מהמודל.";
  } catch (error: any) {
    if (error.message === "API_KEY_MISSING") throw new Error("מפתח ה-API לא נמצא במערכת.");
    console.error("AI Error:", error);
    throw error;
  }
};

export const generateFinalIntegration = async (data: WorkPlanData) => {
  try {
    const ai = getAiClient();
    
    const prompt = `משימה: בנה תוכנית עבודה שנתית אסטרטגית מקיפה עבור מנהל שפ"ח.
    בצע אינטגרציה מלאה בין הרקע, ה-SWOT, החזון, המטרות והמשימות. התייחס גם לאילוצים שהוגדרו.
    
    נתונים: ${JSON.stringify(data)}.
    
    הפלט חייב להיות בפורמט Markdown הכולל:
    1. סיכום מנהלים אסטרטגי.
    2. חזון השירות המלוטש.
    3. טבלה מרשימה: מטרה -> יעד -> משימה -> אחריות -> לו"ז -> מענה לאילוץ.
    4. המלצות לניהול השינוי בתוך הצוות.
    
    שפה: עברית גבוהה, ניהולית, מקצועית.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
    });
    
    return response.text || "לא ניתן היה ליצור את הדוח.";
  } catch (error: any) {
    console.error("Integration Error:", error);
    throw error;
  }
};
