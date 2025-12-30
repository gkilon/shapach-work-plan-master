
import React, { useState, useEffect, useCallback } from 'react';
import { 
  ChevronRight, ChevronLeft, Sparkles, BrainCircuit, Save, 
  Trash2, Zap, PlayCircle, RefreshCcw, Target, Lightbulb, 
  User, Users, X, Users2, Plus, CheckCircle2
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

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

enum Step { CONTEXT = 0, SWOT = 1, VISION = 2, GOALS = 3, OBJECTIVES = 4, TASKS = 5, CONSTRAINTS = 6, SUMMARY = 7 }

const STEP_METADATA = [
  { 
    name: 'פתיחה ומיפוי', 
    reflection: {
      type: 'trio',
      title: 'דיון פתיחה בשלישיות',
      icon: <Users2 className="text-amber-500 w-8 h-8" />,
      text: "לפני הצלילה לפרטים, שבו יחד בשלישיות. מהו האתגר הכי 'בוער' שכל אחד מכם מזהה בשפ\"ח שלו השנה? האם יש קו דמיון בין הערים/ישובים שלכם? נסו לזקק תובנה אחת משותפת על מצב השירות הפסיכולוגי כיום."
    }
  },
  { name: 'ניתוח SWOT', reflection: null },
  { 
    name: 'חזון השירות', 
    reflection: {
      type: 'solo',
      title: 'רגע של חשיבה אישית',
      icon: <User className="text-amber-500 w-8 h-8" />,
      text: "קחו דקה לעצמכם. במילה אחת - מהו הערך הכי חשוב שאתם רוצים שהצוות שלכם יקרין השנה? החזון הוא המצפן שלכם. אל תכתבו מה צריך, תכתבו מה אתם חולמים שיקרה."
    }
  },
  { name: 'מטרות אסטרטגיות', reflection: null },
  { 
    name: 'יעדי SMART', 
    reflection: {
      type: 'pair',
      title: 'דיאלוג עמיתים בזוגות',
      icon: <Users className="text-amber-500 w-8 h-8" />,
      text: "הציגו לבן/בת הזוג יעד אחד שבחרתם. האם הוא באמת מדיד? האם הוא ריאלי לכוח האדם הקיים? עזרו אחד לשני לחדד את הניסוח כך שיהיה חד וברור."
    }
  },
  { name: 'תכנית ביצוע', reflection: null },
  { name: 'אילוצים וסיכונים', reflection: null },
  { name: 'סיכום התוכנית', reflection: null }
];

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
  const [isStarted, setIsStarted] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step>(Step.CONTEXT);
  const [data, setData] = useState<WorkPlanData>(initialPlan);
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState('');
  const [finalReport, setFinalReport] = useState('');
  const [activeTab, setActiveTab] = useState<'draft' | 'ai'>('draft');
  const [error, setError] = useState<string | null>(null);
  const [showReflection, setShowReflection] = useState(false);

  useEffect(() => {
    if (STEP_METADATA[currentStep]?.reflection) {
      setShowReflection(true);
    } else {
      setShowReflection(false);
    }
  }, [currentStep]);

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
    if (currentStep < Step.SUMMARY) {
      setCurrentStep(prev => prev + 1);
      setAiSuggestions('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goPrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      setAiSuggestions('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (isStarted && currentStep === Step.SUMMARY && !finalReport) {
      const runFinal = async () => {
        setLoadingAi(true);
        try {
          const prompt = `בצע אינטגרציה מלאה לתוכנית עבודה שנתית עבור מנהל שפ"ח על בסיס: ${JSON.stringify(data)}. הפק Markdown מקצועי בעברית.`;
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
  }, [currentStep, isStarted, data]);

  if (!isStarted) {
    return (
      <div className="min-h-screen luxury-gradient flex items-center justify-center p-4 md:p-6 text-center overflow-hidden">
        <div className="glass-card max-w-4xl w-full p-8 md:p-20 rounded-[2.5rem] md:rounded-[4rem] space-y-8 md:space-y-12 animate-in fade-in zoom-in duration-700 shadow-2xl relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -z-10 animate-pulse" />
          <BrainCircuit className="text-amber-500 w-16 h-16 md:w-24 md:h-24 mx-auto" />
          <div className="space-y-4 md:space-y-6">
            <h1 className="text-4xl md:text-7xl font-black text-white tracking-tighter leading-tight">
              מנהלי שפ״ח <br className="md:hidden" />
              <span className="text-amber-500">תכניות עבודה</span>
            </h1>
            <p className="text-lg md:text-2xl text-slate-400 font-light italic">מסע אסטרטגי, סדנאי ויישומי לניהול מיטבי</p>
          </div>
          <button 
            onClick={() => setIsStarted(true)}
            className="group flex items-center gap-4 md:gap-6 mx-auto px-10 md:px-16 py-6 md:py-8 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xl md:text-2xl rounded-[1.5rem] md:rounded-[2.5rem] transition-all transform hover:scale-105 active:scale-95 shadow-2xl shadow-amber-500/30"
          >
            התחילו במסע <PlayCircle className="w-8 h-8 md:w-10 md:h-10" />
          </button>
        </div>
      </div>
    );
  }

  const currentReflection = STEP_METADATA[currentStep]?.reflection;

  return (
    <div className="min-h-screen luxury-gradient text-slate-100 flex flex-col pb-24 md:pb-0">
      <header className="p-4 md:p-6 border-b border-white/5 flex justify-between items-center glass-card sticky top-0 z-50 no-print">
        <div className="flex items-center gap-3 md:gap-4 cursor-pointer" onClick={() => setIsStarted(false)}>
          <BrainCircuit className="text-amber-500 w-6 h-6 md:w-8 md:h-8" />
          <h1 className="text-base md:text-xl font-black tracking-tight uppercase">מנהלי שפ״ח | <span className="text-amber-500">תכנית עבודה</span></h1>
        </div>
        <div className="flex gap-1 md:gap-2">
          {STEP_METADATA.map((_, i) => (
            <div key={i} className={`h-1.5 md:h-2 rounded-full transition-all duration-700 ${i === currentStep ? 'w-8 md:w-16 bg-amber-500' : i < currentStep ? 'w-2 md:w-4 bg-amber-900' : 'w-2 md:w-4 bg-slate-800'}`} />
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
                  <p className="text-slate-200 text-lg md:text-xl leading-relaxed italic font-medium">
                    {currentReflection.text}
                  </p>
                </div>
              </div>
              <div className="mt-8 md:mt-12 pt-6 md:pt-8 border-t border-white/5 text-center">
                <button 
                  onClick={() => setShowReflection(false)}
                  className="w-full md:w-auto px-10 md:px-12 py-4 md:py-5 bg-white text-slate-950 font-black rounded-xl md:rounded-2xl hover:bg-amber-500 transition-all text-lg"
                >
                  סיימנו לדון, נעבור לכתיבה
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
                {currentReflection && (
                   <button onClick={() => setShowReflection(true)} className="flex items-center gap-2 text-amber-500 font-bold hover:underline text-sm md:text-base">
                    <Lightbulb className="w-4 h-4 md:w-5 md:h-5" /> הנחיית העמקה
                  </button>
                )}
              </div>
              {renderStepUI(currentStep, data, setData, finalReport, activeTab, setActiveTab)}
            </div>
          )}
          
          {/* Desktop Only Nav */}
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
          <div className="glass-card p-6 md:p-8 rounded-[1.5rem] md:rounded-[3rem] border-white/5 lg:sticky lg:top-32">
            <h3 className="font-bold text-lg md:text-xl text-white flex items-center gap-3 mb-6 md:mb-8">
              <Zap className="text-amber-500 w-5 h-5 md:w-6 md:h-6" /> ייעוץ אסטרטגי AI
            </h3>
            {error && <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">{error}</div>}
            <button 
              onClick={handleAiInsight} 
              disabled={loadingAi || currentStep === Step.SUMMARY} 
              className="w-full py-4 md:py-5 bg-slate-900 border border-white/10 rounded-xl md:rounded-2xl mb-6 md:mb-8 font-black flex justify-center items-center gap-3 hover:bg-slate-800 transition-all shadow-lg disabled:opacity-50 text-sm md:text-base"
            >
              {loadingAi ? <RefreshCcw className="animate-spin w-5 h-5 md:w-6 md:h-6" /> : "בקשו משוב מה-AI"}
            </button>
            <div className="bg-slate-950/50 p-4 md:p-8 rounded-[1rem] md:rounded-[2rem] border border-white/5 min-h-[150px] md:min-h-[300px] text-sm md:text-base leading-relaxed text-slate-300 italic whitespace-pre-wrap">
              {aiSuggestions || "מלאו נתונים ובקשו ניתוח אסטרטגי..."}
            </div>
          </div>
        </aside>
      </main>

      {/* Mobile Sticky Navigation */}
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

function renderStepUI(step: Step, data: WorkPlanData, setData: any, finalReport: string, activeTab: string, setActiveTab: any) {
  const inputBase = "w-full bg-slate-950/50 border border-white/10 rounded-[1.5rem] md:rounded-[2.5rem] p-6 md:p-10 focus:ring-2 focus:ring-amber-500 focus:bg-slate-900/80 outline-none text-lg md:text-xl leading-relaxed text-white font-medium shadow-inner transition-all placeholder:text-slate-400";
  const add = (key: string, val: any) => setData((p: any) => ({ ...p, [key]: [...p[key], val] }));
  const remove = (key: string, idOrIdx: any) => setData((p: any) => ({ ...p, [key]: p[key].filter((_: any, i: number) => typeof _ === 'string' ? i !== idOrIdx : _.id !== idOrIdx) }));

  switch (step) {
    case Step.CONTEXT:
      return (
        <textarea className={inputBase + " h-64 md:h-80"} placeholder="תמצתו כאן את תוצרי הדיון על המיפוי והרקע..." value={data.selfContext} onChange={(e) => setData({...data, selfContext: e.target.value})} />
      );
    case Step.SWOT:
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
          {['strengths', 'weaknesses', 'opportunities', 'threats'].map(cat => (
            <div key={cat} className="p-4 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-white/5 bg-white/5 space-y-3 md:space-y-4 shadow-xl">
              <h4 className="font-black text-amber-500 uppercase tracking-widest text-[10px] md:text-xs">{cat}</h4>
              <input className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-base outline-none focus:border-amber-500 text-white font-medium placeholder:text-slate-500" placeholder="הוסיפו נקודה..." onKeyDown={(e) => { 
                if(e.key === 'Enter' && (e.target as any).value) {
                  setData({...data, swot: {...data.swot, [cat]: [...(data.swot as any)[cat], (e.target as any).value]}});
                  (e.target as any).value = '';
                }
              }} />
              <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                {(data.swot as any)[cat].map((item: string, i: number) => (
                  <div key={i} className="flex justify-between items-center text-sm md:text-base bg-slate-950/40 p-3 md:p-4 rounded-xl border border-white/5">
                    <span className="text-white">{item}</span>
                    <button onClick={() => {
                      const newList = [...(data.swot as any)[cat]];
                      newList.splice(i, 1);
                      setData({...data, swot: {...data.swot, [cat]: newList}});
                    }}><Trash2 className="w-4 h-4 text-slate-500 hover:text-red-500"/></button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    case Step.VISION:
      return (
        <textarea className={inputBase + " h-64 text-center italic font-serif text-3xl md:text-5xl pt-10 md:pt-16 border-amber-500/10 placeholder:text-slate-600"} placeholder="להיות השפ''ח ש..." value={data.vision} onChange={(e) => setData({...data, vision: e.target.value})} />
      );
    case Step.GOALS:
      return (
        <div className="space-y-4 md:space-y-6">
          <div className="flex flex-col md:flex-row gap-4">
            <input id="goal-in" className="flex-1 bg-slate-950 border border-white/10 rounded-[1rem] md:rounded-[1.5rem] px-6 md:px-8 py-4 md:py-5 text-lg md:text-xl outline-none focus:border-amber-500 text-white font-medium placeholder:text-slate-400" placeholder="הגדירו מטרת על אסטרטגית..." />
            <button onClick={() => {
              const el = document.getElementById('goal-in') as HTMLInputElement;
              if(el.value) { add('highLevelGoals', el.value); el.value = ''; }
            }} className="bg-amber-500 text-slate-950 px-8 md:px-12 py-4 rounded-[1rem] md:rounded-[1.5rem] font-black">הוסף</button>
          </div>
          <div className="space-y-3 md:space-y-4">
            {data.highLevelGoals.map((g, i) => (
              <div key={i} className="bg-white/5 p-4 md:p-8 rounded-2xl md:rounded-3xl border border-white/5 flex justify-between items-center">
                <span className="text-lg md:text-2xl font-bold text-white"><span className="text-amber-500 ml-2">0{i+1}.</span> {g}</span>
                <button onClick={() => remove('highLevelGoals', i)}><Trash2 className="w-5 h-5 md:w-6 md:h-6 text-slate-500 hover:text-red-500"/></button>
              </div>
            ))}
          </div>
        </div>
      );
    case Step.OBJECTIVES:
      return (
        <div className="space-y-8 md:space-y-10">
          {data.highLevelGoals.map((goal, gIdx) => (
            <div key={gIdx} className="p-6 md:p-10 border border-white/10 rounded-[1.5rem] md:rounded-[3rem] bg-white/5 space-y-4 md:space-y-6 shadow-xl">
              <h4 className="text-amber-500 font-black text-xl md:text-2xl flex items-center gap-3 md:gap-4"><Target className="w-6 h-6 md:w-8 md:h-8"/> {goal}</h4>
              <input className="w-full bg-slate-950 border border-white/10 rounded-xl md:rounded-2xl px-4 md:px-6 py-3 md:py-4 outline-none focus:border-amber-500 text-base text-white font-medium placeholder:text-slate-400" placeholder="יעד SMART (מדיד, תחום בזמן)..." onKeyDown={e => {
                if(e.key === 'Enter' && (e.target as any).value) {
                  add('objectives', { id: Math.random().toString(), goalIndex: gIdx, text: (e.target as any).value });
                  (e.target as any).value = '';
                }
              }} />
              <ul className="space-y-2 md:space-y-3">
                {data.objectives.filter(o => o.goalIndex === gIdx).map(obj => (
                  <li key={obj.id} className="flex justify-between items-center bg-slate-950/60 p-4 md:p-6 rounded-xl md:rounded-2xl text-base md:text-lg border border-white/5">
                    <span className="text-white font-medium">{obj.text}</span>
                    <button onClick={() => remove('objectives', obj.id)}><Trash2 className="w-4 h-4 md:w-5 md:h-5 text-slate-500 hover:text-red-500"/></button>
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
            <div key={obj.id} className="bg-slate-900/40 border border-white/10 rounded-[1.5rem] md:rounded-[3rem] overflow-visible shadow-2xl border-r-4 border-r-amber-500">
              {/* Objective Header */}
              <div className="bg-amber-500/5 p-4 md:p-6 border-b border-white/5 flex items-center gap-4">
                <Target className="text-amber-500 w-5 h-5 flex-shrink-0" />
                <h4 className="text-white font-black text-lg leading-tight">{obj.text}</h4>
              </div>
              
              {/* Task Creation Form - Stacked for simple mobile usage */}
              <div className="p-4 md:p-8 space-y-4">
                <div className="bg-slate-950/60 p-4 md:p-6 rounded-[1.5rem] space-y-4 border border-white/5">
                  <div className="flex flex-col gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-amber-500 font-black uppercase tracking-widest px-1">מה המשימה?</label>
                      <input id={`t-d-${obj.id}`} className="w-full bg-slate-900 border border-white/10 rounded-xl p-4 text-base text-white font-medium outline-none focus:border-amber-500 placeholder:text-slate-600 shadow-inner" placeholder="לדוגמה: ישיבת צוות חודשית" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] text-amber-500 font-black uppercase tracking-widest px-1">אחראי</label>
                        <input id={`t-r-${obj.id}`} className="w-full bg-slate-900 border border-white/10 rounded-xl p-4 text-base text-white font-medium outline-none focus:border-amber-500 placeholder:text-slate-600 shadow-inner" placeholder="מי?" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-amber-500 font-black uppercase tracking-widest px-1">לו''ז</label>
                        <input id={`t-t-${obj.id}`} className="w-full bg-slate-900 border border-white/10 rounded-xl p-4 text-base text-white font-medium outline-none focus:border-amber-500 placeholder:text-slate-600 shadow-inner" placeholder="מתי?" />
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

                {/* Simplified Task List for clear mobile visibility */}
                <div className="space-y-2 mt-4">
                  {data.tasks.filter(t => t.objectiveId === obj.id).map(task => (
                    <div key={task.id} className="flex items-center justify-between bg-slate-950/40 p-4 rounded-xl border border-white/5 hover:border-amber-500/20 transition-colors">
                      <div className="flex-1 overflow-hidden">
                        <p className="text-white font-bold text-sm truncate">{task.description}</p>
                        <div className="flex flex-wrap gap-2 text-[10px] text-slate-500 italic mt-1">
                          {task.responsibility && <span className="bg-slate-900/50 px-2 py-0.5 rounded border border-white/5">אחראי: {task.responsibility}</span>}
                          {task.timeline && <span className="bg-slate-900/50 px-2 py-0.5 rounded border border-white/5">מתי: {task.timeline}</span>}
                        </div>
                      </div>
                      <button onClick={() => remove('tasks', task.id)} className="p-2 mr-2 text-slate-600 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
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
        <div className="space-y-8 md:space-y-12 animate-in fade-in duration-1000 pb-20">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 no-print">
            <h2 className="text-3xl md:text-5xl font-black text-white">סיכום אסטרטגי</h2>
            <div className="flex bg-slate-950 rounded-2xl md:rounded-[2rem] p-1 md:p-2 border border-white/10 w-full md:w-auto overflow-x-auto">
              <button onClick={() => setActiveTab('draft')} className={`flex-1 md:flex-none px-6 md:px-12 py-3 md:py-4 rounded-xl md:rounded-[1.5rem] text-xs md:text-sm font-black transition-all ${activeTab==='draft'?'bg-slate-800 text-white':'text-slate-500'}`}>טיוטת עבודה</button>
              <button onClick={() => setActiveTab('ai')} className={`flex-1 md:flex-none px-6 md:px-12 py-3 md:py-4 rounded-xl md:rounded-[1.5rem] text-xs md:text-sm font-black flex items-center justify-center gap-2 transition-all ${activeTab==='ai'?'bg-amber-500 text-slate-950 shadow-xl':'text-slate-500'}`}>AI Master Plan ✨</button>
            </div>
          </div>
          <div className="glass-card rounded-[1.5rem] md:rounded-[4rem] p-6 md:p-20 min-h-[500px] shadow-2xl overflow-x-auto">
            {activeTab === 'draft' ? (
              <div className="space-y-12 md:space-y-20">
                <div className="text-center italic font-serif text-3xl md:text-5xl text-white">"{data.vision}"</div>
                <div className="space-y-10 md:space-y-16">
                  {data.highLevelGoals.map((goal, i) => (
                    <div key={i} className="space-y-6 md:space-y-8">
                      <h4 className="text-2xl md:text-3xl font-black text-white border-b-2 border-amber-500/20 pb-4 md:pb-6"><span className="text-amber-500 ml-2 md:ml-4">0{i+1}.</span> {goal}</h4>
                      {data.objectives.filter(o => o.goalIndex === i).map(obj => (
                        <div key={obj.id} className="bg-white/5 p-6 md:p-10 rounded-2xl md:rounded-[2.5rem] border border-white/5 mb-6 md:mb-8 shadow-inner">
                          <p className="text-lg md:text-xl font-bold text-amber-500 mb-6 md:mb-8 border-r-4 border-amber-500 pr-4 md:pr-6">{obj.text}</p>
                          <div className="overflow-x-auto">
                            <table className="w-full text-right text-xs md:text-sm min-w-[400px]">
                              <thead><tr className="text-slate-400 border-b border-white/10 font-bold"><th className="pb-4">משימה</th><th className="pb-4">אחריות</th><th className="pb-4">לו"ז</th></tr></thead>
                              <tbody>
                                {data.tasks.filter(t => t.objectiveId === obj.id).map(t => (
                                  <tr key={t.id} className="border-b border-white/5 last:border-0"><td className="py-4 text-white font-bold">{t.description}</td><td className="py-4 text-slate-300">{t.responsibility}</td><td className="py-4 text-slate-400 italic">{t.timeline}</td></tr>
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
              <div className="prose prose-invert max-w-none text-base md:text-xl leading-relaxed whitespace-pre-wrap font-medium text-white">
                {finalReport || (
                  <div className="flex flex-col items-center justify-center h-64 gap-4 md:gap-6">
                    <RefreshCcw className="animate-spin w-10 h-10 md:w-12 md:h-12 text-amber-500" />
                    <p className="text-amber-500 font-bold animate-pulse text-sm md:text-base">ה-AI מגבש את תוכנית העבודה...</p>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex justify-center no-print pb-10">
            <button onClick={() => window.print()} className="w-full md:w-auto bg-white text-slate-950 px-12 md:px-24 py-5 md:py-8 rounded-2xl md:rounded-[3rem] font-black text-lg md:text-xl shadow-2xl hover:bg-amber-500 transition-all flex items-center justify-center gap-4 group">
              <Save className="w-6 h-6 md:w-8 md:h-8" /> ייצא תוכנית חתומה
            </button>
          </div>
        </div>
      );
    default: return null;
  }
}
