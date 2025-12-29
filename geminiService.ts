
import { GoogleGenAI } from "@google/genai";
import { WorkPlanData } from "./types";

// פונקציית עזר לקבלת הקליינט - בדיוק לפי הדוגמה שעובדת לך
const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY_MISSING");
  }
  return new GoogleGenAI({ apiKey });
};

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

  const prompt = `אתה יועץ אסטרטגי בכיר למנהלי שפ"ח. השלב הנוכחי: ${stepContexts[stepIndex]}.
נתונים: ${JSON.stringify(currentData)}.
משימה: תן 2-3 תובנות ניהוליות חכמות והצעה לניסוח מקצועי אחד. ענה בעברית בלבד.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error: any) {
    console.error("Gemini Error:", error);
    if (error.message === "API_KEY_MISSING") {
      throw new Error("מפתח ה-API חסר. יש להגדיר API_KEY במשתני הסביבה של Netlify.");
    }
    throw new Error("נכשלה קבלת תשובה מה-AI. נסה שנית.");
  }
};

export const generateFinalIntegration = async (data: WorkPlanData) => {
  const ai = getClient();
  
  const prompt = `בנה תוכנית עבודה אסטרטגית מקיפה למנהל שפ"ח על בסיס: ${JSON.stringify(data)}.
כלול: סיכום מנהלים, חזון, וטבלת Markdown הכוללת עמודות: מטרה | יעד | משימה | אחראי | לו"ז | מענה לאילוץ.
ענה בעברית ניהולית גבוהה.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Final Integration Error:", error);
    throw new Error("נכשלה יצירת האינטגרציה הסופית.");
  }
};
