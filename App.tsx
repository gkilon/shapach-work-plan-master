
import React, { useState, useEffect, useCallback } from 'react';
import { 
  ChevronRight, ChevronLeft, Sparkles, BrainCircuit, Save, 
  Trash2, Zap, PlayCircle, RefreshCcw, Target, Lightbulb, 
  User, Users, X, Users2, Plus, CheckCircle2, Compass, Map, ListChecks, Workflow, Quote, Laptop, PenTool, Info, BookOpen, AlertCircle, Download
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import * as XLSX from 'xlsx';

// --- API Key Helper ---
const getApiKey = () => {
  try {
    // @ts-ignore
    return import.meta.env.VITE_GEMINI_API_KEY || process.env.API_KEY || '';
  } catch {
    // @ts-ignore
    return process.env.API_KEY || '';
  }
};

// --- Types ---
interface SwotData { strengths: string[]; weaknesses: string[]; opportunities: string[]; threats: string[]; }
interface SmartObjective { id: string; goalIndex: number; text: string; }
interface Task { id: string; objectiveId: string; description: string; responsibility: string; timeline: string; }
interface WorkPlanData { selfContext: string; swot: SwotData; vision: string; highLevelGoals: string[]; objectives: SmartObjective[]; tasks: Task[]; constraints: string; }

enum AppMode { WORKSHOP = 'workshop', TOOL = 'tool' }

enum Step { 
  CONTEXT = 0, 
  SWOT = 1, 
  TRANSITION = 2, 
  VISION = 3, 
  GOALS = 4, 
  OBJECTIVES = 5, 
  TASKS = 6, 
  CONSTRAINTS = 7, 
  SUMMARY = 8 
}

const PART_METADATA = [
  { id: 1, name: 'חלק א: הבנת הסיטואציה', icon: <Map className="w-5 h-5" />, steps: [0, 1] },
  { id: 2, name: 'חלק ב: חזון ושאיפות', icon: <Compass className="w-5 h-5" />, steps: [3, 4] },
  { id: 3, name: 'חלק ג: בניית תכנית עבודה', icon: <ListChecks className="w-5 h-5" />, steps: [5, 6, 7] }
];

const STEP_METADATA = [
  { 
    name: 'פתיחה ומיפוי', 
    part: 1,
    reflection: {
      title: 'דיון פתיחה ומיפוי אתגרים',
      icon: <Users2 className="text-amber-500 w-8 h-8" />,
      text: "נתחיל בדיון מליאה: למה לדעתכם תכנית עבודה היא דבר חשוב לדיון במליאה? איך היא מייצרת שפה משותפת ובהירות? \n\n לאחר מכן, שבו בזוגות: עם מה אתם מתמודדים היום? מה האתגרים הכי בוערים בשפ\"ח שלכם כרגע?"
    }
  },
  { name: 'ניתוח SWOT', part: 1, reflection: null },
  { name: 'המסלול הלוגי', part: 0, reflection: null, isTransition: true }, 
  { 
    name: 'חזון השירות', 
    part: 2,
    reflection: {
      title: 'דיאלוג עמיתים למיקוד החזון',
      icon: <Users className="text-amber-500 w-8 h-8" />,
      text: "החזון הוא המצפן. שתפו את בן/בת הזוג בחזון הראשוני שלכם. סייעו זה לזו למקד ולזקק את המשפט - האם הוא מדויק? האם הוא נותן מענה לאתגרים שמיפינו בחלק הראשון?"
    }
  },
  { name: 'מטרות אסטרטגיות', part: 2, reflection: null },
  { 
    name: 'יעדי SMART', 
    part: 3,
    reflection: {
      title: 'בניית יעדים מדידים',
      icon: <Target className="text-amber-500 w-8 h-8" />,
      text: "הופכים את המטרות ליעדים. וודאו שכל יעד הוא ספציפי, מדיד, בר-השגה, רלוונטי ותחום בזמן."
    }
  },
  { name: 'תכנית ביצוע', part: 3, reflection: null },
  { name: 'אילוצים וסיכונים', part: 3, reflection: null },
  { name: 'סיכום התוכנית', part: 0, reflection: null }
];

const HELP_METADATA: Record<number, { title: string, principles: string, example: string }> = {
  [Step.CONTEXT]: {
    title: "מיפוי האתגרים",
    principles: "תיאור המציאות בשטח ללא שיפוטיות. מהם הצרכים המרכזיים של מוסדות החינוך וההורים בשנה האחרונה?",
    example: "עלייה משמעותית בפניות על רקע פוסט-טראומה וצורך בהדרכות צוות אינטנסיביות."
  },
  [Step.SWOT]: {
    title: "ניתוח SWOT",
    principles: "מיפוי פנימי (חוזקות וחולשות של הצוות) וחיצוני (הזדמנויות ואיומים מהרשות או משרד החינוך).",
    example: "חוזקה: צוות עם התמחות בטיפול בגיל הרך. איום: עזיבה של 2 תקנים בחודש הקרוב."
  },
  [Step.VISION]: {
    title: "כתיבת חזון",
    principles: "החזון מגדיר את ה'למה'. הוא צריך להיות משפט קצר, מעורר השראה, רגשי ומכוון עתיד.",
    example: "להיות בית מקצועי המעניק ביטחון נפשי וכלים לחוסן עבור כל קהילת החינוך בעיר."
  },
  [Step.GOALS]: {
    title: "מטרות על",
    principles: "אלו הם תחומי הליבה שבהם תתמקדו השנה. המטרות הן רחבות ונגזרות ישירות מהחזון.",
    example: "פיתוח והטמעה של מודל עבודה קהילתי-חוסני בכל גני הילדים ברשות."
  },
  [Step.OBJECTIVES]: {
    title: "יעדי SMART",
    principles: "תרגום המטרות להישגים קונקרטיים. יעד טוב הוא ספציפי, מדיד, בר-השגה, רלוונטי ותחום בזמן.",
    example: "עד סוף רבעון ב', 80% מצוותי הגנים יעברו סדנת חוסן בת 4 מפגשים."
  },
  [Step.TASKS]: {
    title: "משימות לביצוע",
    principles: "השלבים המעשיים. הגדירו 'מה עושים מחר בבוקר', מי האחראי לכך ומהו לוח הזמנים המדויק.",
    example: "קיום ישיבת התנעה עם מנהלת מחלקת גנים לסנכרון לוחות זמנים ב-15.01."
  },
  [Step.CONSTRAINTS]: {
    title: "ניהול סיכונים",
    principles: "חשיבה פרו-אקטיבית על חסמים. מה עלול להשתבש ואיך ניתן להיערך לכך מראש?",
    example: "חוסר בשעות פסיכולוג פנויות - פתרון: שימוש בקבוצות הדרכה במקום הדרכות פרטניות."
  }
};

const initialPlan: WorkPlanData = {
  selfContext: '',
  swot: { strengths: [], weaknesses: [], opportunities: [], threats: [] },
  vision: '',
  highLevelGoals: [],
  objectives: [],
  tasks: [],
  constraints: ''
};

export default function App() {
  const [appMode, setAppMode] = useState<AppMode | null>(null);
  const [currentStep, setCurrentStep] = useState<Step>(Step.CONTEXT);
  const [data, setData] = useState<WorkPlanData>(initialPlan);
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState('');
  const [finalReport, setFinalReport] = useState('');
  const [activeTab, setActiveTab] = useState<'draft' | 'ai'>('draft');
  const [error, setError] = useState<string | null>(null);
  const [showReflection, setShowReflection] = useState(false);

  useEffect(() => {
    if (appMode === AppMode.WORKSHOP && STEP_METADATA[currentStep]?.reflection) {
      setShowReflection(true);
    } else {
      setShowReflection(false);
    }
  }, [currentStep, appMode]);

  const getGeminiResponse = async (prompt: string, modelName: string = 'gemini-3-flash-preview') => {
    const key = getApiKey();
    if (!key) throw new Error("API Key missing");
    const ai = new GoogleGenAI({ apiKey: key });
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
    });
    return response.text;
  };

  const handleAiInsight = useCallback(async () => {
    setLoadingAi(true);
    setError(null);
    try {
      const prompt = `אתה יועץ אסטרטגי למנהלי שפ"ח. שלב: ${STEP_METADATA[currentStep].name}. נתונים: ${JSON.stringify(data)}. ספק 2 תובנות חדות וקצרות בעברית.`;
      const result = await getGeminiResponse(prompt);
      setAiSuggestions(result || '');
    } catch (err: any) {
      setError("שגיאת AI. בדוק חיבור.");
    } finally {
      setLoadingAi(false);
    }
  }, [currentStep, data]);

  const goNext = () => {
    let next = currentStep + 1;
    if (appMode === AppMode.TOOL && STEP_METADATA[next]?.isTransition) {
      next++;
    }
    if (next <= Step.SUMMARY) {
      setCurrentStep(next);
      setAiSuggestions('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goPrev = () => {
    let prev = currentStep - 1;
    if (appMode === AppMode.TOOL && STEP_METADATA[prev]?.isTransition) {
      prev--;
    }
    if (prev >= 0) {
      setCurrentStep(prev);
      setAiSuggestions('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (appMode && currentStep === Step.SUMMARY && !finalReport) {
      const runFinal = async () => {
        setLoadingAi(true);
        try {
          const prompt = `בצע אינטגרציה מלאה לתוכנית עבודה שנתית עבור מנהל שפ"ח על בסיס הנתונים הבאים: ${JSON.stringify(data)}. הפק Markdown מקצועי ומעוצב בעברית הכולל חזון, ניתוח SWOT, מטרות ויעדים.`;
          const res = await getGeminiResponse(prompt, 'gemini-3-pro-preview');
          setFinalReport(res || '');
        } catch (e) {
          setError("נכשלה יצירת האינטגרציה.");
        } finally {
          setLoadingAi(false);
        }
      };
      runFinal();
    }
  }, [currentStep, appMode, data]);

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Overview
    const overviewData = [
      ["תכנית עבודה שנתית - שפ\"ח"],
      [""],
      ["חזון", data.vision],
      [""],
      ["מטרות על"],
      ...data.highLevelGoals.map((g, i) => [`${i + 1}. ${g}`]),
      [""],
      ["ניתוח SWOT"],
      ["חוזקות", ...data.swot.strengths],
      ["חולשות", ...data.swot.weaknesses],
      ["הזדמנויות", ...data.swot.opportunities],
      ["איומים", ...data.swot.threats],
      [""],
      ["אילוצים וניהול סיכונים", data.constraints]
    ];
    const wsOverview = XLSX.utils.aoa_to_sheet(overviewData);
    // RTL direction for Hebrew
    if(!wsOverview['!cols']) wsOverview['!cols'] = [];
    wsOverview['!cols'] = [{ wch: 20 }, { wch: 50 }, { wch: 20 }, { wch: 20 }];
    wsOverview['!views'] = [{ rightToLeft: true }];
    XLSX.utils.book_append_sheet(wb, wsOverview, "מבט על");

    // Sheet 2: Work Plan
    const planRows = [["מטרת על", "יעד SMART", "משימה", "אחריות", "לו\"ז"]];
    
    data.highLevelGoals.forEach((goal, gIdx) => {
      const objectives = data.objectives.filter(o => o.goalIndex === gIdx);
      if (objectives.length === 0) {
        planRows.push([goal, "", "", "", ""]);
      } else {
        objectives.forEach(obj => {
          const tasks = data.tasks.filter(t => t.objectiveId === obj.id);
          if (tasks.length === 0) {
            planRows.push([goal, obj.text, "", "", ""]);
          } else {
            tasks.forEach(task => {
              planRows.push([goal, obj.text, task.description, task.responsibility, task.timeline]);
            });
          }
        });
      }
    });

    const wsPlan = XLSX.utils.aoa_to_sheet(planRows);
    wsPlan['!views'] = [{ rightToLeft: true }];
    wsPlan['!cols'] = [{ wch: 30 }, { wch: 40 }, { wch: 40 }, { wch: 20 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsPlan, "תכנית עבודה");

    XLSX.writeFile(wb, "Shapach_Work_Plan.xlsx");
  };

  const activePart = PART_METADATA.find(p => p.steps.includes(currentStep))?.id || 0;

  if (!appMode) {
    return (
      <div className="min-h-screen luxury-gradient flex items-center justify-center p-4 md:p-6 text-center overflow-hidden">
        <div className="glass-card max-w-5xl w-full p-8 md:p-16 rounded-[2.5rem] md:rounded-[4rem] space-y-12 animate-in fade-in zoom-in duration-700 shadow-2xl relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -z-10 animate-pulse" />
          <BrainCircuit className="text-amber-500 w-16 h-16 md:w-20 md:h-20 mx-auto" />
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-tight">
              מנהלי שפ״ח | <span className="text-amber-500">תכניות עבודה</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-400 font-light italic">כיצד תרצו להתחיל היום?</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-3xl mx-auto">
            <button 
              onClick={() => setAppMode(AppMode.WORKSHOP)}
              className="group flex flex-col items-center gap-6 p-8 md:p-10 bg-white/5 hover:bg-amber-500/10 border border-white/10 hover:border-amber-500/50 rounded-[2rem] transition-all transform hover:scale-105 active:scale-95 shadow-xl"
            >
              <div className="bg-amber-500/20 p-5 rounded-2xl group-hover:bg-amber-500 group-hover:text-slate-900 transition-colors">
                <Laptop className="w-10 h-10" />
              </div>
              <div className="space-y-2 text-right">
                <h3 className="text-xl md:text-2xl font-black text-white">מצב סדנה (מלא)</h3>
                <p className="text-slate-400 text-sm">כולל דיוני מליאה, שקפי מעבר מתודולוגיים והנחיות לדיאלוג בזוגות.</p>
              </div>
            </button>

            <button 
              onClick={() => setAppMode(AppMode.TOOL)}
              className="group flex flex-col items-center gap-6 p-8 md:p-10 bg-white/5 hover:bg-amber-500/10 border border-white/10 hover:border-amber-500/50 rounded-[2rem] transition-all transform hover:scale-105 active:scale-95 shadow-xl"
            >
              <div className="bg-slate-800 p-5 rounded-2xl group-hover:bg-amber-500 group-hover:text-slate-900 transition-colors">
                <PenTool className="w-10 h-10" />
              </div>
              <div className="space-y-2 text-right">
                <h3 className="text-xl md:text-2xl font-black text-white">כלי עבודה (נקי)</h3>
                <p className="text-slate-400 text-sm">מעבר ישיר להזנת הנתונים ובניית תכנית העבודה בצורה ממוקדת ויעילה.</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentReflection = STEP_METADATA[currentStep]?.reflection;
  const currentHelp = HELP_METADATA[currentStep];

  return (
    <div className="min-h-screen luxury-gradient text-slate-100 flex flex-col pb-24 md:pb-0">
      <header className="p-4 md:p-6 border-b border-white/5 flex flex-col md:flex-row justify-between items-center glass-card sticky top-0 z-50 no-print gap-4">
        <div className="flex items-center gap-3 md:gap-4 cursor-pointer" onClick={() => setAppMode(null)}>
          <BrainCircuit className="text-amber-500 w-6 h-6 md:w-8 md:h-8" />
          <h1 className="text-sm md:text-base font-black tracking-tight uppercase">
            שפ״ח | <span className="text-amber-500">{appMode === AppMode.WORKSHOP ? 'סדנה מלאה' : 'כלי עבודה'}</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-2 md:gap-6">
          {PART_METADATA.map((part) => (
            <div key={part.id} className={`flex items-center gap-2 transition-all duration-500 ${activePart === part.id ? 'opacity-100 scale-105' : 'opacity-40 scale-95'}`}>
              <div className={`p-1.5 md:p-2 rounded-lg ${activePart === part.id ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                {part.icon}
              </div>
              <span className={`hidden md:block text-[10px] font-black uppercase tracking-widest ${activePart === part.id ? 'text-amber-500' : 'text-slate-500'}`}>
                {part.name}
              </span>
            </div>
          ))}
        </div>

        <div className="flex gap-1 md:gap-2">
          {STEP_METADATA.map((_, i) => (
            <div key={i} className={`h-1.5 md:h-2 rounded-full transition-all duration-700 ${i === currentStep ? 'w-4 md:w-8 bg-amber-500' : i < currentStep ? 'w-1.5 md:w-2 bg-amber-900' : 'w-1.5 md:w-2 bg-slate-800'}`} />
          ))}
        </div>
      </header>

      <main className="flex-1 container mx-auto p-4 md:p-10 flex flex-col lg:flex-row gap-6 md:gap-10 overflow-x-hidden">
        <div className="flex-1 space-y-6 md:space-y-8 max-w-full overflow-hidden">
          
          {showReflection && currentReflection && (
            <div className="glass-card rounded-[2rem] md:rounded-[3.5rem] p-6 md:p-16 border-amber-500/20 bg-amber-500/5 shadow-2xl relative animate-in fade-in slide-in-from-bottom-5 duration-500">
              <button onClick={() => setShowReflection(false)} className="absolute top-6 left-6 text-slate-500 hover:text-white transition-colors">
                <X className="w-6 h-6 md:w-8 md:h-8" />
              </button>
              <div className="flex items-center gap-4 mb-6 md:mb-8">
                <Sparkles className="text-amber-500 w-6 h-6 md:w-8 md:h-8" />
                <h2 className="text-lg md:text-2xl font-black text-amber-500 tracking-widest uppercase">{currentReflection.title}</h2>
              </div>
              <div className="flex flex-col md:flex-row items-start gap-6 md:gap-8">
                <div className="bg-slate-900 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-white/5 shadow-inner hidden md:block">
                  {currentReflection.icon}
                </div>
                <div className="space-y-4 flex-1">
                  <p className="text-slate-200 text-lg md:text-xl leading-relaxed italic font-medium whitespace-pre-line text-right">
                    {currentReflection.text}
                  </p>
                </div>
              </div>
              <div className="mt-8 md:mt-12 pt-6 md:pt-8 border-t border-white/5 text-center">
                <button 
                  onClick={() => setShowReflection(false)}
                  className="w-full md:w-auto px-10 md:px-12 py-4 md:py-5 bg-white text-slate-950 font-black rounded-xl md:rounded-2xl hover:bg-amber-500 transition-all text-lg"
                >
                  הבנתי, בואו נתקדם
                </button>
              </div>
            </div>
          )}

          {!showReflection && (
            <div className="glass-card rounded-[2rem] md:rounded-[3.5rem] p-4 md:p-16 border-white/5 shadow-2xl relative min-h-[400px] md:min-h-[500px] animate-in fade-in zoom-in duration-300 w-full overflow-hidden">
              <div className="flex flex-col md:flex-row justify-between items-start mb-6 md:mb-12 gap-4">
                <div className="flex items-center gap-4 md:gap-6">
                  <div className="text-4xl md:text-8xl font-black text-white/5 leading-none select-none">0{currentStep + 1}</div>
                  <h2 className="text-xl md:text-4xl font-black text-white">{STEP_METADATA[currentStep].name}</h2>
                </div>
                {appMode === AppMode.WORKSHOP && currentReflection && (
                   <button onClick={() => setShowReflection(true)} className="flex items-center gap-2 text-amber-500 font-bold hover:underline text-sm md:text-base">
                    <Lightbulb className="w-4 h-4 md:w-5 md:h-5" /> הנחיית הדיון
                   </button>
                )}
              </div>
              {renderStepUI(currentStep, data, setData, finalReport, activeTab, setActiveTab, appMode)}
            </div>
          )}
          
          <div className="hidden md:flex justify-between items-center px-4 no-print">
            <button onClick={goPrev} disabled={currentStep === 0} className="font-bold text-slate-400 hover:text-white transition-colors disabled:opacity-0 flex items-center gap-2">
              <ChevronRight /> שלב קודם
            </button>
            <button onClick={goNext} disabled={currentStep === Step.SUMMARY} className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-16 py-5 rounded-2xl font-black shadow-2xl transition-all disabled:opacity-0 flex items-center gap-2">
              המשך לשלב הבא <ChevronLeft />
            </button>
          </div>
        </div>

        <aside className="w-full lg:w-96 space-y-6 no-print">
          {/* ייעוץ אסטרטגי AI */}
          <div className="glass-card p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border-white/5">
            <h3 className="font-bold text-lg md:text-xl text-white flex items-center gap-3 mb-6 md:mb-8">
              <Zap className="text-amber-500 w-5 h-5 md:w-6 md:h-6" /> ייעוץ אסטרטגי AI
            </h3>
            {error && <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">{error}</div>}
            <button 
              onClick={handleAiInsight} 
              disabled={loadingAi || currentStep === Step.SUMMARY || STEP_METADATA[currentStep]?.isTransition} 
              className="w-full py-4 md:py-5 bg-slate-900 border border-white/10 rounded-xl md:rounded-2xl mb-6 md:mb-8 font-black flex justify-center items-center gap-3 hover:bg-slate-800 transition-all shadow-lg disabled:opacity-50 text-sm md:text-base"
            >
              {loadingAi ? <RefreshCcw className="animate-spin w-5 h-5 md:w-6 md:h-6" /> : "בקשו משוב מה-AI"}
            </button>
            <div className="bg-slate-950/50 p-4 md:p-8 rounded-[1rem] md:rounded-[2rem] border border-white/5 min-h-[150px] md:min-h-[250px] text-sm md:text-base leading-relaxed text-slate-300 italic whitespace-pre-wrap text-right">
              {aiSuggestions || "מלאו נתונים ובקשו ניתוח אסטרטגי..."}
            </div>
          </div>

          {/* מצפן לכתיבה - הועבר לכאן אל מתחת ל-AI */}
          {currentHelp && !STEP_METADATA[currentStep]?.isTransition && currentStep !== Step.SUMMARY && (
             <div className="glass-card p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border-amber-500/10 bg-amber-500/5 animate-in fade-in slide-in-from-top-4 duration-500">
                <h3 className="font-bold text-lg md:text-xl text-white flex items-center gap-3 mb-4 md:mb-6">
                  <BookOpen className="text-amber-500 w-5 h-5" /> {currentHelp.title}
                </h3>
                <div className="space-y-6 text-right">
                  <div>
                    <span className="text-amber-500 font-black text-[10px] uppercase tracking-widest block mb-2 border-r-2 border-amber-500 pr-2">עקרונות כתיבה</span>
                    <p className="text-slate-200 text-sm leading-relaxed font-medium">{currentHelp.principles}</p>
                  </div>
                  <div className="bg-slate-950/50 p-4 rounded-xl border border-white/5">
                    <span className="text-amber-500 font-black text-[10px] uppercase tracking-widest block mb-2">דוגמה תמציתית</span>
                    <p className="text-slate-400 text-sm italic leading-relaxed">"{currentHelp.example}"</p>
                  </div>
                </div>
             </div>
          )}
        </aside>
      </main>

      <footer className="md:hidden fixed bottom-0 left-0 right-0 p-4 glass-card border-t border-white/10 z-50 flex justify-between gap-4 no-print">
        <button onClick={goPrev} disabled={currentStep === 0} className="flex-1 py-4 rounded-xl bg-slate-900 text-slate-400 font-bold disabled:opacity-0 flex items-center justify-center gap-2">
          <ChevronRight className="w-4 h-4" /> קודם
        </button>
        <button onClick={goNext} disabled={currentStep === Step.SUMMARY} className="flex-[2] py-4 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center gap-2 shadow-xl">
          הבא <ChevronLeft className="w-4 h-4" />
        </button>
      </footer>
    </div>
  );
}

function renderStepUI(step: Step, data: WorkPlanData, setData: any, finalReport: string, activeTab: string, setActiveTab: any, mode: AppMode) {
  const inputBase = "w-full bg-slate-950/50 border border-white/10 rounded-[1.5rem] md:rounded-[2.5rem] p-6 md:p-10 focus:ring-2 focus:ring-amber-500 focus:bg-slate-900/80 outline-none text-lg md:text-xl leading-relaxed text-white font-medium shadow-inner transition-all placeholder:text-slate-400 text-right";
  const add = (key: string, val: any) => setData((p: any) => ({ ...p, [key]: [...p[key], val] }));
  const remove = (key: string, idOrIdx: any) => setData((p: any) => ({ ...p, [key]: p[key].filter((_: any, i: number) => typeof _ === 'string' ? i !== idOrIdx : _.id !== idOrIdx) }));

  switch (step) {
    case Step.CONTEXT:
      return (
        <div className="space-y-10">
          {mode === AppMode.WORKSHOP && (
            <div className="bg-amber-500/5 p-6 md:p-10 rounded-3xl border border-amber-500/10 text-right">
              <h4 className="text-amber-500 font-black text-lg mb-4 flex items-center gap-2 justify-end">
                <Quote className="w-5 h-5" /> דיון מליאה פותח
              </h4>
              <p className="text-slate-300 text-xl leading-relaxed italic">
                "למה לדעתכם תכנית עבודה היא כלי כל כך חשוב לדיון במליאה של צוות השפ"ח? איך היא מייצרת שפה משותפת ובהירות?"
              </p>
            </div>
          )}
          <div className="space-y-4">
            <label className="text-amber-500 font-black uppercase tracking-widest text-xs px-2 flex items-center gap-2 justify-end">
               מיפוי אתגרים <Users className="w-4 h-4" />
            </label>
            <textarea 
              className={inputBase + " h-48 md:h-64"} 
              placeholder="עם מה אתם מתמודדים היום? מה האתגרים הכי בוערים בשפ''ח שלכם כרגע?" 
              value={data.selfContext} 
              onChange={(e) => setData({...data, selfContext: e.target.value})} 
            />
          </div>
        </div>
      );
    case Step.SWOT:
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
          {['strengths', 'weaknesses', 'opportunities', 'threats'].map(cat => (
            <div key={cat} className="p-4 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-white/5 bg-white/5 space-y-3 md:space-y-4 shadow-xl text-right">
              <h4 className="font-black text-amber-500 uppercase tracking-widest text-[10px] md:text-xs">
                {cat === 'strengths' ? 'חוזקות' : cat === 'weaknesses' ? 'חולשות' : cat === 'opportunities' ? 'הזדמנויות' : 'איומים'}
              </h4>
              <input className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-base outline-none focus:border-amber-500 text-white font-medium placeholder:text-slate-500 text-right" placeholder="הוסיפו נקודה..." onKeyDown={(e) => { 
                if(e.key === 'Enter' && (e.target as any).value) {
                  setData({...data, swot: {...data.swot, [cat]: [...(data.swot as any)[cat], (e.target as any).value]}});
                  (e.target as any).value = '';
                }
              }} />
              <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                {(data.swot as any)[cat].map((item: string, i: number) => (
                  <div key={i} className="flex justify-between items-center text-sm md:text-base bg-slate-950/40 p-3 md:p-4 rounded-xl border border-white/5">
                    <button onClick={() => {
                      const newList = [...(data.swot as any)[cat]];
                      newList.splice(i, 1);
                      setData({...data, swot: {...data.swot, [cat]: newList}});
                    }}><Trash2 className="w-4 h-4 text-slate-500 hover:text-red-500"/></button>
                    <span className="text-white text-right">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    case Step.TRANSITION:
      return (
        <div className="flex flex-col items-center justify-center space-y-12 py-10">
          <div className="text-center space-y-4 max-w-2xl">
            <h3 className="text-3xl md:text-5xl font-black text-amber-500">המסלול האסטרטגי</h3>
            <p className="text-slate-400 text-xl italic text-center">מסיימים את שלב ההבנה, עוברים לשלב התכנון</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
            <div className="p-8 bg-white/5 rounded-3xl border border-white/10 text-center space-y-4 flex flex-col items-center">
              <Quote className="w-10 h-10 text-amber-500" />
              <h5 className="font-black text-xl">חזון</h5>
              <p className="text-slate-500 text-sm">ה'למה' שלנו והשאיפה המרכזית לשנה הקרובה</p>
            </div>
            <div className="p-8 bg-white/5 rounded-3xl border border-white/10 text-center space-y-4 flex flex-col items-center">
              <Target className="w-10 h-10 text-amber-500" />
              <h5 className="font-black text-xl">מטרות ויעדים</h5>
              <p className="text-slate-500 text-sm">תרגום החזון להישגים מדידים וברורים</p>
            </div>
            <div className="p-8 bg-white/5 rounded-3xl border border-white/10 text-center space-y-4 flex flex-col items-center">
              <Workflow className="w-10 h-10 text-amber-500" />
              <h5 className="font-black text-xl">תכנית פעולה</h5>
              <p className="text-slate-500 text-sm">מי עושה מה, מתי ואיך זה יקרה בפועל</p>
            </div>
          </div>
          <p className="text-amber-500 font-bold animate-pulse">המשך לשלב החזון {'>'}</p>
        </div>
      );
    case Step.VISION:
      return (
        <div className="space-y-8">
           {mode === AppMode.WORKSHOP && (
             <div className="bg-amber-500/5 p-6 md:p-8 rounded-3xl border border-white/5 italic text-slate-300 text-right">
              שתפו את העמית/ה היושב לצדכם. סייעו זה לזו למקד את המשפט - האם הוא מדויק? האם הוא נותן מענה לאתגרים שמיפינו בחלק הראשון?
            </div>
           )}
          <textarea 
            className={inputBase + " h-64 text-center italic font-serif text-3xl md:text-5xl pt-10 md:pt-16 border-amber-500/10 placeholder:text-slate-600"} 
            placeholder="להיות השפ''ח ש..." 
            value={data.vision} 
            onChange={(e) => setData({...data, vision: e.target.value})} 
          />
        </div>
      );
    case Step.GOALS:
      return (
        <div className="space-y-4 md:space-y-6">
          <div className="flex flex-col md:flex-row gap-4">
            <button onClick={() => {
              const el = document.getElementById('goal-in') as HTMLInputElement;
              if(el.value) { add('highLevelGoals', el.value); el.value = ''; }
            }} className="bg-amber-500 text-slate-950 px-8 md:px-12 py-4 rounded-[1rem] md:rounded-[1.5rem] font-black">הוסף</button>
            <input id="goal-in" className="flex-1 bg-slate-950 border border-white/10 rounded-[1rem] md:rounded-[1.5rem] px-6 md:px-8 py-4 md:py-5 text-lg md:text-xl outline-none focus:border-amber-500 text-white font-medium placeholder:text-slate-400 text-right" placeholder="הגדירו מטרת על אסטרטגית..." />
          </div>
          <div className="space-y-3 md:space-y-4">
            {data.highLevelGoals.map((g, i) => (
              <div key={i} className="bg-white/5 p-4 md:p-8 rounded-2xl md:rounded-3xl border border-white/5 flex justify-between items-center text-right">
                <button onClick={() => remove('highLevelGoals', i)}><Trash2 className="w-5 h-5 md:w-6 md:h-6 text-slate-500 hover:text-red-500"/></button>
                <span className="text-lg md:text-2xl font-bold text-white">{g} <span className="text-amber-500 mr-2 md:mr-4">.0{i+1}</span></span>
              </div>
            ))}
          </div>
        </div>
      );
    case Step.OBJECTIVES:
      return (
        <div className="space-y-8 md:space-y-10">
          {data.highLevelGoals.map((goal, gIdx) => (
            <div key={gIdx} className="p-6 md:p-10 border border-white/10 rounded-[1.5rem] md:rounded-[3rem] bg-white/5 space-y-4 md:space-y-6 shadow-xl text-right">
              <h4 className="text-amber-500 font-black text-xl md:text-2xl flex items-center gap-3 md:gap-4 justify-end"> {goal} <Target className="w-6 h-6 md:w-8 md:h-8"/></h4>
              <input className="w-full bg-slate-950 border border-white/10 rounded-xl md:rounded-2xl px-4 md:px-6 py-3 md:py-4 outline-none focus:border-amber-500 text-base text-white font-medium placeholder:text-slate-400 text-right" placeholder="יעד SMART (מדיד, תחום בזמן)..." onKeyDown={e => {
                if(e.key === 'Enter' && (e.target as any).value) {
                  add('objectives', { id: Math.random().toString(), goalIndex: gIdx, text: (e.target as any).value });
                  (e.target as any).value = '';
                }
              }} />
              <ul className="space-y-2 md:space-y-3">
                {data.objectives.filter(o => o.goalIndex === gIdx).map(obj => (
                  <li key={obj.id} className="flex justify-between items-center bg-slate-950/60 p-4 md:p-6 rounded-xl md:rounded-2xl text-base md:text-lg border border-white/5">
                    <button onClick={() => remove('objectives', obj.id)}><Trash2 className="w-4 h-4 md:w-5 md:h-5 text-slate-500 hover:text-red-500"/></button>
                    <span className="text-white font-medium text-right">{obj.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      );
    case Step.TASKS:
      return (
        <div className="space-y-8 md:space-y-12 pb-12 overflow-visible">
          {data.objectives.length === 0 && (
            <div className="text-center p-8 bg-amber-500/5 rounded-2xl border border-dashed border-amber-500/30">
              <p className="text-amber-500 font-bold">אנא הגדירו יעדים בשלב הקודם כדי שנוכל לגזור מהם משימות.</p>
            </div>
          )}
          {data.objectives.map(obj => (
            <div key={obj.id} className="bg-slate-900/40 border border-white/10 rounded-[1.5rem] md:rounded-[3rem] overflow-visible shadow-2xl border-r-4 border-r-amber-500 text-right">
              <div className="bg-amber-500/5 p-4 md:p-6 border-b border-white/5 flex items-center gap-4 justify-end">
                <h4 className="text-white font-black text-lg leading-tight">{obj.text}</h4>
                <Target className="text-amber-500 w-5 h-5 flex-shrink-0" />
              </div>
              <div className="p-4 md:p-8 space-y-4">
                <div className="bg-slate-950/60 p-4 md:p-6 rounded-[1.5rem] space-y-4 border border-white/5">
                  <div className="flex flex-col gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-amber-500 font-black uppercase tracking-widest px-1">מה המשימה?</label>
                      <input id={`t-d-${obj.id}`} className="w-full bg-slate-900 border border-white/10 rounded-xl p-4 text-base text-white font-medium outline-none focus:border-amber-500 placeholder:text-slate-600 shadow-inner text-right" placeholder="לדוגמה: ישיבת צוות חודשית" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] text-amber-500 font-black uppercase tracking-widest px-1 text-right block">לו''ז</label>
                        <input id={`t-t-${obj.id}`} className="w-full bg-slate-900 border border-white/10 rounded-xl p-4 text-base text-white font-medium outline-none focus:border-amber-500 placeholder:text-slate-600 shadow-inner text-right" placeholder="מתי?" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-amber-500 font-black uppercase tracking-widest px-1 text-right block">אחראי</label>
                        <input id={`t-r-${obj.id}`} className="w-full bg-slate-900 border border-white/10 rounded-xl p-4 text-base text-white font-medium outline-none focus:border-amber-500 placeholder:text-slate-600 shadow-inner text-right" placeholder="מי?" />
                      </div>
                    </div>
                  </div>
                  <button onClick={() => {
                    const d = document.getElementById(`t-d-${obj.id}`) as HTMLInputElement;
                    const r = document.getElementById(`t-r-${obj.id}`) as HTMLInputElement;
                    const t = document.getElementById(`t-t-${obj.id}`) as HTMLInputElement;
                    if(d.value) {
                      add('tasks', { id: Math.random().toString(), objectiveId: obj.id, description: d.value, responsibility: r.value, timeline: t.value });
                      d.value = ''; r.value = ''; t.value = '';
                    }
                  }} className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl py-4 transition-all flex items-center justify-center gap-2 shadow-xl active:scale-95">
                    <Plus className="w-5 h-5" /> הוספת משימה
                  </button>
                </div>
                <div className="space-y-2 mt-4">
                  {data.tasks.filter(t => t.objectiveId === obj.id).map(task => (
                    <div key={task.id} className="flex items-center justify-between bg-slate-950/40 p-4 rounded-xl border border-white/5 hover:border-amber-500/20 transition-colors">
                      <button onClick={() => remove('tasks', task.id)} className="p-2 ml-2 text-slate-600 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="flex-1 overflow-hidden text-right">
                        <p className="text-white font-bold text-sm truncate">{task.description}</p>
                        <div className="flex flex-wrap gap-2 text-[10px] text-slate-500 italic mt-1 justify-end">
                          {task.timeline && <span className="bg-slate-900/50 px-2 py-0.5 rounded border border-white/5">מתי: {task.timeline}</span>}
                          {task.responsibility && <span className="bg-slate-900/50 px-2 py-0.5 rounded border border-white/5">אחראי: {task.responsibility}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    case Step.CONSTRAINTS:
      return (
        <textarea className={inputBase + " h-64 md:h-80 border-red-500/10 placeholder:text-slate-500"} placeholder={"אילו חסמים עלולים לעצור אותנו? (תקציב, כ\"א, פוליטיקה)..."} value={data.constraints} onChange={(e) => setData({...data, constraints: e.target.value})} />
      );
    case Step.SUMMARY:
      return (
        <div className="space-y-8 md:space-y-12 animate-in fade-in duration-1000 pb-20 text-right">
          <div className="flex flex-col md:flex-row-reverse justify-between items-center gap-6 no-print">
            <h2 className="text-3xl md:text-5xl font-black text-white">סיכום אסטרטגי</h2>
            <div className="flex bg-slate-950 rounded-2xl md:rounded-[2rem] p-1 md:p-2 border border-white/10 w-full md:w-auto overflow-x-auto">
              <button onClick={() => setActiveTab('ai')} className={`flex-1 md:flex-none px-6 md:px-12 py-3 md:py-4 rounded-xl md:rounded-[1.5rem] text-xs md:text-sm font-black flex items-center justify-center gap-2 transition-all ${activeTab==='ai'?'bg-amber-500 text-slate-950 shadow-xl':'text-slate-500'}`}>AI Master Plan ✨</button>
              <button onClick={() => setActiveTab('draft')} className={`flex-1 md:flex-none px-6 md:px-12 py-3 md:py-4 rounded-xl md:rounded-[1.5rem] text-xs md:text-sm font-black transition-all ${activeTab==='draft'?'bg-slate-800 text-white':'text-slate-500'}`}>טיוטת עבודה</button>
            </div>
          </div>
          <div className="glass-card rounded-[1.5rem] md:rounded-[4rem] p-6 md:p-20 min-h-[500px] shadow-2xl overflow-x-auto">
            {activeTab === 'draft' ? (
              <div className="space-y-12 md:space-y-20">
                <div className="text-center italic font-serif text-3xl md:text-5xl text-white">"{data.vision}"</div>
                
                <div className="space-y-10 md:space-y-16">
                  {data.highLevelGoals.map((goal, i) => (
                    <div key={i} className="space-y-6 md:space-y-8">
                      <h4 className="text-2xl md:text-3xl font-black text-white border-b-2 border-amber-500/20 pb-4 md:pb-6 text-right"><span className="text-amber-500 ml-2 md:ml-4">0{i+1}.</span> {goal}</h4>
                      {data.objectives.filter(o => o.goalIndex === i).map(obj => (
                        <div key={obj.id} className="bg-white/5 p-6 md:p-10 rounded-2xl md:rounded-[2.5rem] border border-white/5 mb-6 md:mb-8 shadow-inner text-right">
                          <p className="text-lg md:text-xl font-bold text-amber-500 mb-6 md:mb-8 border-r-4 border-amber-500 pr-4 md:pr-6">{obj.text}</p>
                          <div className="overflow-x-auto">
                            <table className="w-full text-right text-xs md:text-sm min-w-[400px]">
                              <thead><tr className="text-slate-400 border-b border-white/10 font-bold"><th className="pb-4">לו"ז</th><th className="pb-4">אחריות</th><th className="pb-4">משימה</th></tr></thead>
                              <tbody>
                                {data.tasks.filter(t => t.objectiveId === obj.id).map(t => (
                                  <tr key={t.id} className="border-b border-white/5 last:border-0"><td className="py-4 text-slate-400 italic">{t.timeline}</td><td className="py-4 text-slate-300">{t.responsibility}</td><td className="py-4 text-white font-bold">{t.description}</td></tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="prose prose-invert max-w-none text-base md:text-xl leading-relaxed whitespace-pre-wrap font-medium text-white text-right">
                {finalReport || (
                  <div className="flex flex-col items-center justify-center h-64 gap-4 md:gap-6">
                    <RefreshCcw className="animate-spin w-10 h-10 md:w-12 md:h-12 text-amber-500" />
                    <p className="text-amber-500 font-bold animate-pulse text-sm md:text-base">ה-AI מגבש את תוכנית העבודה המלאה...</p>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex justify-center no-print pb-10 gap-4">
            <button onClick={() => window.print()} className="w-full md:w-auto bg-white text-slate-950 px-8 md:px-12 py-4 md:py-6 rounded-2xl md:rounded-[3rem] font-black text-lg md:text-xl shadow-2xl hover:bg-slate-200 transition-all flex items-center justify-center gap-3 group">
              <Save className="w-6 h-6 md:w-8 md:h-8" /> שמור PDF
            </button>
             <button onClick={handleExportExcel} className="w-full md:w-auto bg-green-600 text-white px-8 md:px-12 py-4 md:py-6 rounded-2xl md:rounded-[3rem] font-black text-lg md:text-xl shadow-2xl hover:bg-green-500 transition-all flex items-center justify-center gap-3 group">
              <Download className="w-6 h-6 md:w-8 md:h-8" /> ייצא לאקסל
            </button>
          </div>
        </div>
      );
    default: return null;
  }
}
