
import { GoogleGenAI } from "@google/genai";
import { WorkPlanData } from "./types";

export const getStepSuggestions = async (stepIndex: number, currentData: Partial<WorkPlanData>) => {
  // יצירת קליינט בצורה ישירה - המערכת תזריק את המפתח מנטליפיי בזמן הריצה
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  
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
  2. תן דוגמה לניסוח מרשים ומקצועי לאחד הפריטים בשלב הזה.
  השתמש בשפה מעצימה, יוקרתית ומקצועית.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error: any) {
    console.error("AI Error:", error);
    throw new Error("חלה שגיאה בתקשורת עם ה-AI. וודא שמפתח ה-API תקין ב-Netlify.");
  }
};

export const generateFinalIntegration = async (data: WorkPlanData) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  
  const prompt = `משימה: בנה תוכנית עבודה שנתית אסטרטגית מקיפה עבור מנהל שפ"ח.
  בצע אינטגרציה מלאה בין הרקע, ה-SWOT, החזון, המטרות והמשימות. התייחס גם לאילוצים שהוגדרו.
  
  נתונים: ${JSON.stringify(data)}.
  
  הפלט חייב להיות בפורמט Markdown הכולל:
  1. סיכום מנהלים אסטרטגי.
  2. חזון השירות המלוטש.
  3. טבלה רחבה בפורמט Markdown הכוללת עמודות: 
     מטרה אסטרטגית | יעד SMART | משימה אופרטיבית | אחריות | לו"ז ומשאבים | מענה לאילוצים.
  4. המלצות ליישום וניהול השינוי.
  
  שפה: עברית גבוהה, ניהולית, מקצועית.`;

  try {
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
