
import { GoogleGenAI } from "@google/genai";
import { WorkPlanData } from "./types";

/**
 * פונקציה לקבלת ה-Client של Gemini.
 * משתמשת ב-process.env.API_KEY בדיוק כפי שהוגדר בדוגמה שעובדת לך.
 */
const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY_MISSING");
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * קבלת תובנות AI לשלבי הסדנה
 */
export const getStepSuggestions = async (stepIndex: number, currentData: Partial<WorkPlanData>) => {
  const ai = getClient();
  
  const stepContexts = [
    "מיפוי ורקע סביבתי לשפ\"ח",
    "ניתוח SWOT - חוזקות, חולשות, הזדמנויות ואיומים",
    "בניית חזון מקצועי - לאן שואפים?",
    "קביעת מטרות אסטרטגיות",
    "ניסוח יעדי SMART מדידים",
    "פירוט משימות ולו\"ז אופרטיבי",
    "ניהול אילוצים וסיכונים",
    "אינטגרציה סופית לתוכנית עבודה"
  ];

  const prompt = `אתה יועץ אסטרטגי בכיר למנהלי שירות פסיכולוגי חינוכי (שפ"ח). 
  אנחנו בשלב: ${stepContexts[stepIndex]}.
  המידע שהוזן עד כה: ${JSON.stringify(currentData)}.
  המשימה: ספק 2-3 תובנות ניהוליות חדות והצעה אחת לניסוח מקצועי ויוקרתי לשלב זה.
  ענה בעברית מקצועית וגבוהה בלבד.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error: any) {
    console.error("Gemini Step Error:", error);
    throw new Error(error.message || "נכשלה קבלת תשובה מה-AI");
  }
};

/**
 * יצירת דוח אינטגרציה סופי לתוכנית עבודה
 */
export const generateFinalIntegration = async (data: WorkPlanData) => {
  const ai = getClient();
  
  const prompt = `בצע אינטגרציה מלאה לתוכנית עבודה שנתית עבור מנהל שפ"ח על בסיס הנתונים הבאים: ${JSON.stringify(data)}.
  הפק דוח מרשים בפורמט Markdown הכולל:
  1. סיכום מנהלים אסטרטגי.
  2. חזון השירות המזוקק.
  3. טבלה מסודרת של המטרות והמשימות (מטרה | יעד | משימה | אחראי | לו"ז).
  4. המלצות ליישום.
  ענה בעברית בלבד.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error: any) {
    console.error("Gemini Final Error:", error);
    throw new Error(error.message || "נכשלה יצירת האינטגרציה");
  }
};
