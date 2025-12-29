
import { GoogleGenAI } from "@google/genai";
import { WorkPlanData } from "./types";

/**
 * Creates a fresh instance of the Gemini API client.
 * Uses the environment-injected API_KEY.
 */
const getAI = () => {
  // Directly use the environment variable as per instructions.
  // Must use a named parameter: { apiKey: process.env.API_KEY }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const getStepSuggestions = async (stepIndex: number, currentData: Partial<WorkPlanData>) => {
  const ai = getAI();
  const stepContext = [
    "Environmental and background mapping for a psychological service (SHAPACH).",
    "SWOT Analysis - Strengths, Weaknesses, Opportunities, Threats for the unit.",
    "Vision building for the SHAPACH - where do we want to be?",
    "Strategic Goals setting - the main pillars for next year.",
    "Defining SMART objectives for each strategic goal.",
    "Detailed task management - turning goals into action.",
    "Risk assessment and management of constraints.",
    "Final plan integration and roadmap construction."
  ][stepIndex];

  const prompt = `אתה יועץ אסטרטגי מומחה לניהול שירותים פסיכולוגיים חינוכיים (שפ"ח). 
  אנחנו נמצאים בסדנה לבניית תוכנית עבודה. השלב הנוכחי הוא: ${stepContext}. 
  הנתונים שהוזנו עד כה: ${JSON.stringify(currentData)}. 
  
  משימה: 
  1. ספק 2-3 תובנות עמוקות ופרקטיות שיעזרו למנהל למלא את השלב הזה בצורה מקצועית יותר.
  2. תן דוגמה לניסוח איכותי של אחד הפריטים בשלב הזה (חזון/מטרה/יעד וכו') בהתאם להקשר שהמשתמש הזין.
  3. השתמש בשפה ניהולית-פסיכולוגית מרהיבה ומעצימה.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    
    // .text is a property, not a method
    return response.text || "לא התקבל מענה מהמודל.";
  } catch (error: any) {
    console.error("AI Error Details:", error);
    throw error;
  }
};

export const generateFinalIntegration = async (data: WorkPlanData) => {
  const ai = getAI();
  const prompt = `משימה: בנה תוכנית עבודה שנתית אסטרטגית (SHAPACH Master Work Plan) עבור מנהל השירות.
  עליך לבצע אינטגרציה מלאה בין הרקע הסביבתי, ה-SWOT, החזון, המטרות והמשימות.
  
  נתונים: ${JSON.stringify(data)}.
  
  הפלט חייב להיות בפורמט Markdown מקצועי ויוקרתי הכולל:
  1. סיכום מנהלים אסטרטגי המקשר בין הרקע לבין הכיוון החדש של השירות.
  2. החזון המלוטש של השירות.
  3. טבלת תוכנית עבודה מלאה ומרשימה הכוללת:
     - מטרה אסטרטגית
     - יעד SMART
     - משימה אופרטיבית
     - גורם אחראי
     - לו"ז ומשאבים
     - מענה לאילוץ אפשרי (איך מתמודדים עם חסמים שהוגדרו)
  4. המלצות ל"ניהול שינוי" בצוות לצורך הטמעת התוכנית בצורה מיטבית.
  
  שפה: עברית גבוהה, מקצועית, פסיכולוגית וניהולית.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
    });
    
    // .text is a property, not a method
    return response.text || "לא ניתן היה ליצור את הדוח הסופי.";
  } catch (error: any) {
    console.error("AI Integration Error Details:", error);
    throw error;
  }
};
