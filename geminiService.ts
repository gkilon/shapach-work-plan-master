
import { GoogleGenAI } from "@google/genai";
import { WorkPlanData } from "./types";

/**
 * Senior Engineering approach: 
 * We don't store the AI instance as a global to avoid stale environment variables.
 * We initialize it right before the call to ensure process.env.API_KEY is captured correctly.
 */
const getModel = (modelName: 'gemini-3-flash-preview' | 'gemini-3-pro-preview') => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY_NOT_FOUND");
  }
  const ai = new GoogleGenAI({ apiKey });
  return ai;
};

export const getStepSuggestions = async (stepIndex: number, currentData: Partial<WorkPlanData>) => {
  const stepContexts = [
    "מיפוי ורקע סביבתי לשירות פסיכולוגי (שפ\"ח)",
    "ניתוח SWOT - חוזקות, חולשות, הזדמנויות ואיומים",
    "בניית חזון מקצועי ליחידה - לאן אנחנו רוצים להגיע?",
    "קביעת מטרות אסטרטגיות לשנת העבודה",
    "ניסוח יעדי SMART מדידים מתוך המטרות",
    "פירוט משימות אופרטיביות, לו\"ז ומשאבים",
    "ניהול אילוצים, חסמים וסיכונים בדרך",
    "אינטגרציה סופית ובניית תוכנית עבודה מלאה"
  ];

  const prompt = `אתה יועץ אסטרטגי בכיר למנהלי שפ"ח (שירות פסיכולוגי חינוכי). 
אנחנו בתהליך בניית תוכנית עבודה. השלב הנוכחי הוא: ${stepContexts[stepIndex]}.
נתונים שהוזנו עד כה: ${JSON.stringify(currentData)}.

משימה:
1. ספק 2-3 תובנות ניהוליות-פסיכולוגיות מעמיקות שיעזרו למנהל לדייק את השלב הזה.
2. הצע ניסוח מקצועי ומרשים (High-End) לאחד הפריטים בשלב הזה.
ענה בעברית מקצועית, מעצימה ויוקרתית.`;

  try {
    const ai = getModel('gemini-3-flash-preview');
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error: any) {
    console.error("SDK Call Error:", error);
    if (error.message === "API_KEY_NOT_FOUND") {
      throw new Error("מפתח ה-API לא זוהה במערכת. יש לוודא שהגדרת API_KEY ב-Netlify וביצעת Deploy מחדש.");
    }
    throw new Error("נכשלה התקשורת עם שרת ה-AI. נסה שנית בעוד מספר רגעים.");
  }
};

export const generateFinalIntegration = async (data: WorkPlanData) => {
  const prompt = `משימה: בנה תוכנית עבודה שנתית אסטרטגית מקיפה עבור מנהל שפ"ח על בסיס כל המידע שנאסף.
בצע אינטגרציה מלאה בין הרקע, ה-SWOT, החזון, המטרות והמשימות.

נתונים גולמיים: ${JSON.stringify(data)}.

הפלט חייב להיות בפורמט Markdown הכולל:
1. סיכום מנהלים אסטרטגי (Executive Summary).
2. חזון השירות המזוקק.
3. טבלה מרשימה בפורמט Markdown (מוכנה להעתקה לאקסל) הכוללת עמודות: 
מטרה | יעד SMART | משימה | אחראי | לו"ז | משאבים | מענה לאילוץ/חסם.
4. דגשים ליישום וניהול שינוי בצוות.

השתמש בשפה ניהולית-פסיכולוגית ברמה הגבוהה ביותר.`;

  try {
    const ai = getModel('gemini-3-pro-preview');
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error: any) {
    console.error("Integration Error:", error);
    throw error;
  }
};
