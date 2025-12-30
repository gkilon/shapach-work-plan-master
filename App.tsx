
import React, { useState, useEffect, useCallback } from 'react';
import { 
  ChevronRight, ChevronLeft, Sparkles, BrainCircuit, Save, 
  Trash2, Zap, PlayCircle, RefreshCcw, Target, Lightbulb, 
  User, Users, MessageCircle, X, Users2
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

// מטא-דאטה מעודכן עם 3 תחנות עצירה בלבד במקומות אסטרטגיים
const STEP_METADATA = [
  { name: 'מיפוי ורקע', reflection: null },
  { name: 'ניתוח SWOT', reflection: null },
  { 
    name: 'חזון השירות', 
    reflection: {
      type: 'solo',
      title: 'עצירה לחשיבה אישית',
      icon: <User className="text-amber-500 w-8 h-8" />,
      text: "לפני שכותבים חזון - עצמו עיניים. אם הייתם צריכים לבחור מילה אחת שתתאר את המורשת הניהולית שלכם בשפ\"ח בעוד 3 שנים, מה היא הייתה? אל תחשבו על תקציב, תחשבו על 'הבשורה' שאתם מביאים לעולם הילדים."
    }
  },
  { name: 'מטרות אסטרטגיות', reflection: null },
  { 
    name: 'יעדי SMART', 
    reflection: {
      type: 'pair',
      title: 'דיאלוג בזוגות',
      icon: <Users className="text-amber-500 w-8 h-8" />,
      text: "שתפו את העמית/ה במטרות שבחרתם. בקשו מהם לאתגר אתכם: 'האם המטרה הזו באמת תשנה משהו בשטח, או שהיא רק נשמעת טוב בדו\"ח?'. נסו להפוך יחד משאלת לב לתוצאה שאפשר לראות ולמדוד."
    }
  },
  { name: 'תכנית ביצוע', reflection: null },
  { 
    name: 'אילוצים וסיכונים', 
    reflection: {
      type: 'trio',
      title: 'סיעור מוחות בשלישיות',
      icon: <Users2 className="text-amber-500 w-8 h-8" />,
      text: "שתפו בשלושה את החסם הכי גדול שאתם צופים. חברי הקבוצה צריבים להציע פתרון אחד 'מחוץ לקופסה' שלא חשבתם עליו. המטרה: להפוך אילוץ להזדמנות של שיתוף פעולה קהילתי או פוליטי."
    }
  },
  { name: 'דוח אסטרטגי מסכם', reflection: null }
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

  // הצגת העצירה רק אם קיימת הגדרה כזו לשלב הנוכחי
  useEffect(() => {
    if (STEP_METADATA[currentStep].reflection) {
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
      const prompt = `אתה יועץ אסטרטגי בכיר למנהלי שפ"ח. שלב: ${STEP_METADATA[currentStep].name}. נתונים: ${JSON.stringify(data)}. ספק 2 תובנות עמוקות וקצרות בעברית רהוטה.`;
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
    }
  };

  const goPrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      setAiSuggestions('');
    }
  };

  useEffect(() => {
    if (isStarted && currentStep === Step.SUMMARY && !finalReport) {
      const runFinal = async () => {
        setLoadingAi(true);
        try {
          const prompt = `בצע אינטגרציה מלאה לתוכנית עבודה שנתית עבור מנהל שפ"ח על בסיס: ${JSON.stringify(data)}. הפק Markdown מרשים ומקצועי בעברית.`;
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
      <div className="min-h-screen luxury-gradient flex items-center justify-center p-6 text-center">
        <div className="glass-card max-w-4xl w-full p-16 md:p-24 rounded-[4rem] space-y-12 animate-in fade-in zoom-in duration-700 shadow-2xl">
          <BrainCircuit className="text-amber-500 w-24 h-24 mx-auto animate-pulse" />
          <div className="space-y-6">
            <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter uppercase">MIND-PLANNER</h1>
            <p className="text-2xl text-slate-400 font-light italic">Strategic Workshop Suite for SHAPACH Managers</p>
          </div>
          <button 
            onClick={() => setIsStarted(true)}
            className="group flex items-center gap-6 mx-auto px-16 py-8 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-2xl rounded-[2.5rem] transition-all transform hover:scale-105 shadow-2xl"
          >
            התחילו במסע האסטרטגי <PlayCircle className="w-10 h-10" />
          </button>
        </div>
      </div>
    );
  }

  const currentReflection = STEP_METADATA[currentStep].reflection;

  return (
    <div className="min-h-screen luxury-gradient text-slate-100 flex flex-col">
      <header className="p-6 border-b border-white/5 flex justify-between items-center glass-card sticky top-0 z-50 no-print">
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => setIsStarted(false)}>
          <BrainCircuit className="text-amber-500 w-8 h-8" />
          <h1 className="text-xl font-black tracking-tight uppercase">SHAPACH <span className="text-amber-500">Master</span></h1>
        </div>
        <div className="flex gap-2">
          {STEP_METADATA.map((_, i) => (
            <div key={i} className={`h-2 rounded-full transition-all duration-700 ${i === currentStep ? 'w-16 bg-amber-500' : i < currentStep ? 'w-4 bg-amber-900' : 'w-4 bg-slate-800'}`} />
          ))}
        </div>
      </header>

      <main className="flex-1 container mx-auto p-4 md:p-10 flex flex-col lg:flex-row gap-10">
        <div className="flex-1 space-y-8">
          
          {/* Reflection Modal/Overlay - Only shown for 3 specific steps */}
          {showReflection && currentReflection && (
            <div className="glass-card rounded-[3.5rem] p-10 md:p-16 border-amber-500/20 bg-amber-500/5 shadow-[0_0_50px_rgba(245,158,11,0.1)] relative animate-in fade-in slide-in-from-bottom-10 duration-500">
              <button onClick={() => setShowReflection(false)} className="absolute top-8 left-8 text-slate-500 hover:text-white transition-colors">
                <X className="w-8 h-8" />
              </button>
              <div className="flex items-center gap-4 mb-8">
                <Sparkles className="text-amber-500 w-8 h-8 animate-pulse" />
                <h2 className="text-2xl font-black text-amber-500 tracking-widest uppercase">{currentReflection.title}</h2>
              </div>
              <div className="flex flex-col md:flex-row items-start gap-8">
                <div className="bg-slate-900 p-6 rounded-3xl border border-white/5 shadow-inner">
                  {currentReflection.icon}
                </div>
                <div className="space-y-4 flex-1">
                  <p className="text-slate-200 text-xl leading-relaxed italic font-medium">
                    {currentReflection.text}
                  </p>
                </div>
              </div>
              <div className="mt-12 pt-8 border-t border-white/5 text-center">
                <button 
                  onClick={() => setShowReflection(false)}
                  className="px-12 py-4 bg-white text-slate-950 font-black rounded-2xl hover:bg-amber-500 transition-all transform hover:scale-105"
                >
                  הבנתי, בואו נתקדם לכתיבה
                </button>
              </div>
            </div>
          )}

          {!showReflection && (
            <div className="glass-card rounded-[3.5rem] p-10 md:p-16 border-white/5 shadow-2xl relative min-h-[500px] animate-in fade-in zoom-in duration-300">
              <div className="flex justify-between items-start mb-12">
                <div className="flex items-center gap-6">
                  <div className="text-8xl font-black text-white/5 leading-none select-none">0{currentStep + 1}</div>
                  <h2 className="text-4xl font-black text-white">{STEP_METADATA[currentStep].name}</h2>
                </div>
                {currentReflection && (
                   <button onClick={() => setShowReflection(true)} className="flex items-center gap-2 text-amber-500 font-bold hover:underline">
                    <Lightbulb className="w-5 h-5" /> חזרה להנחיית העמקה
                  </button>
                )}
              </div>
              {renderStepUI(currentStep, data, setData, finalReport, activeTab, setActiveTab)}
            </div>
          )}
          
          <div className="flex justify-between items-center px-4 no-print">
            <button onClick={goPrev} disabled={currentStep === 0} className="font-bold text-slate-400 hover:text-white transition-colors disabled:opacity-0 flex items-center gap-2">
              <ChevronRight /> שלב קודם
            </button>
            <button onClick={goNext} disabled={currentStep === Step.SUMMARY} className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-16 py-5 rounded-2xl font-black shadow-2xl transition-all transform hover:translate-y-[-2px] disabled:opacity-0 flex items-center gap-2">
              המשך לשלב הבא <ChevronLeft />
            </button>
          </div>
        </div>

        <aside className="w-full lg:w-96 space-y-6 no-print">
          <div className="glass-card p-8 rounded-[3rem] border-white/5 sticky top-32">
            <h3 className="font-bold text-xl text-white flex items-center gap-3 mb-8">
              <Zap className="text-amber-500 w-6 h-6" /> ייעוץ אסטרטגי AI
            </h3>
            {error && <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs">{error}</div>}
            <button 
              onClick={handleAiInsight} 
              disabled={loadingAi || currentStep === Step.SUMMARY} 
              className="w-full py-5 bg-slate-900 border border-white/10 rounded-2xl mb-8 font-black flex justify-center items-center gap-3 hover:bg-slate-800 transition-all shadow-lg disabled:opacity-50"
            >
              {loadingAi ? <RefreshCcw className="animate-spin w-6 h-6" /> : "בקשו משוב מה-AI"}
            </button>
            <div className="bg-slate-950/50 p-8 rounded-[2rem] border border-white/5 min-h-[300px] text-sm leading-relaxed text-slate-300 italic whitespace-pre-wrap">
              {aiSuggestions || "מלאו את הנתונים ולחצו לקבלת זווית ראייה ניהולית נוספת..."}
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}

function renderStepUI(step: Step, data: WorkPlanData, setData: any, finalReport: string, activeTab: string, setActiveTab: any) {
  const inputBase = "w-full bg-slate-950/50 border border-white/10 rounded-[2.5rem] p-10 focus:ring-2 focus:ring-amber-500 outline-none text-xl leading-relaxed text-slate-200 shadow-inner transition-all placeholder:text-slate-800";
  const add = (key: string, val: any) => setData((p: any) => ({ ...p, [key]: [...p[key], val] }));
  const remove = (key: string, idOrIdx: any) => setData((p: any) => ({ ...p, [key]: p[key].filter((_: any, i: number) => typeof _ === 'string' ? i !== idOrIdx : _.id !== idOrIdx) }));

  switch (step) {
    case Step.CONTEXT:
      return (
        <textarea className={inputBase + " h-80"} placeholder="תארו כאן את ההקשר, האתגרים וקהל היעד לשנה הקרובה..." value={data.selfContext} onChange={(e) => setData({...data, selfContext: e.target.value})} />
      );
    case Step.SWOT:
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {['strengths', 'weaknesses', 'opportunities', 'threats'].map(cat => (
            <div key={cat} className="p-8 rounded-[2.5rem] border border-white/5 bg-white/5 space-y-4">
              <h4 className="font-black text-amber-500 uppercase tracking-widest text-xs">{cat}</h4>
              <input className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-500" placeholder="הוסיפו נקודה..." onKeyDown={(e) => { 
                if(e.key === 'Enter' && (e.target as any).value) {
                  setData({...data, swot: {...data.swot, [cat]: [...(data.swot as any)[cat], (e.target as any).value]}});
                  (e.target as any).value = '';
                }
              }} />
              <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                {(data.swot as any)[cat].map((item: string, i: number) => (
                  <div key={i} className="flex justify-between items-center text-sm bg-slate-950/40 p-4 rounded-xl border border-white/5">
                    <span>{item}</span>
                    <button onClick={() => {
                      const newList = [...(data.swot as any)[cat]];
                      newList.splice(i, 1);
                      setData({...data, swot: {...data.swot, [cat]: newList}});
                    }}><Trash2 className="w-4 h-4 text-slate-700 hover:text-red-500"/></button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    case Step.VISION:
      return (
        <textarea className={inputBase + " h-64 text-center italic font-serif text-5xl pt-16 border-amber-500/10"} placeholder="להיות השפ''ח ש..." value={data.vision} onChange={(e) => setData({...data, vision: e.target.value})} />
      );
    case Step.GOALS:
      return (
        <div className="space-y-6">
          <div className="flex gap-4">
            <input id="goal-in" className="flex-1 bg-slate-950 border border-white/10 rounded-[1.5rem] px-8 py-5 text-xl outline-none focus:border-amber-500" placeholder="הגדירו מטרת על אסטרטגית..." />
            <button onClick={() => {
              const el = document.getElementById('goal-in') as HTMLInputElement;
              if(el.value) { add('highLevelGoals', el.value); el.value = ''; }
            }} className="bg-amber-500 text-slate-950 px-12 rounded-[1.5rem] font-black transition-all">הוסף</button>
          </div>
          <div className="space-y-4">
            {data.highLevelGoals.map((g, i) => (
              <div key={i} className="bg-white/5 p-8 rounded-3xl border border-white/5 flex justify-between items-center">
                <span className="text-2xl font-bold"><span className="text-amber-500 ml-2">0{i+1}.</span> {g}</span>
                <button onClick={() => remove('highLevelGoals', i)}><Trash2 className="w-6 h-6 text-slate-700 hover:text-red-500"/></button>
              </div>
            ))}
          </div>
        </div>
      );
    case Step.OBJECTIVES:
      return (
        <div className="space-y-10">
          {data.highLevelGoals.map((goal, gIdx) => (
            <div key={gIdx} className="p-10 border border-white/10 rounded-[3rem] bg-white/5 space-y-6">
              <h4 className="text-amber-500 font-black text-2xl flex items-center gap-4"><Target className="w-8 h-8"/> {goal}</h4>
              <input className="w-full bg-slate-950 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-amber-500" placeholder="הגדירו יעד SMART מדיד ותחום בזמן..." onKeyDown={e => {
                if(e.key === 'Enter' && (e.target as any).value) {
                  add('objectives', { id: Math.random().toString(), goalIndex: gIdx, text: (e.target as any).value });
                  (e.target as any).value = '';
                }
              }} />
              <ul className="space-y-3">
                {data.objectives.filter(o => o.goalIndex === gIdx).map(obj => (
                  <li key={obj.id} className="flex justify-between items-center bg-slate-950/60 p-6 rounded-2xl text-lg border border-white/5">
                    <span>{obj.text}</span>
                    <button onClick={() => remove('objectives', obj.id)}><Trash2 className="w-5 h-5 text-slate-700 hover:text-red-500"/></button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      );
    case Step.TASKS:
      return (
        <div className="space-y-10 max-h-[700px] overflow-y-auto custom-scrollbar pr-4">
          {data.objectives.map(obj => (
            <div key={obj.id} className="p-10 border border-white/10 rounded-[3rem] bg-white/5 space-y-6">
              <h4 className="text-white font-black text-xl border-r-4 border-amber-500 pr-6">{obj.text}</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-950/40 p-6 rounded-[2rem]">
                <input id={`t-d-${obj.id}`} className="bg-slate-900 border-white/10 rounded-xl p-4 text-sm outline-none focus:border-amber-500" placeholder="משימה" />
                <input id={`t-r-${obj.id}`} className="bg-slate-900 border-white/10 rounded-xl p-4 text-sm outline-none focus:border-amber-500" placeholder="אחראי" />
                <input id={`t-t-${obj.id}`} className="bg-slate-900 border-white/10 rounded-xl p-4 text-sm outline-none focus:border-amber-500" placeholder="לו''ז" />
                <button onClick={() => {
                  const d = document.getElementById(`t-d-${obj.id}`) as HTMLInputElement;
                  const r = document.getElementById(`t-r-${obj.id}`) as HTMLInputElement;
                  const t = document.getElementById(`t-t-${obj.id}`) as HTMLInputElement;
                  if(d.value) {
                    add('tasks', { id: Math.random().toString(), objectiveId: obj.id, description: d.value, responsibility: r.value, timeline: t.value });
                    d.value = ''; r.value = ''; t.value = '';
                  }
                }} className="bg-amber-500 text-slate-950 font-black rounded-xl py-4 hover:bg-amber-400 transition-all">הוסף</button>
              </div>
              <ul className="space-y-3">
                {data.tasks.filter(t => t.objectiveId === obj.id).map(task => (
                  <li key={task.id} className="grid grid-cols-4 gap-4 bg-slate-950/60 p-6 rounded-2xl text-sm border border-white/5 items-center">
                    <span className="font-bold">{task.description}</span>
                    <span className="text-slate-400">{task.responsibility}</span>
                    <span className="text-slate-500 italic">{task.timeline}</span>
                    <button onClick={() => remove('tasks', task.id)} className="text-left hover:text-red-500"><Trash2 className="w-5 h-5 inline"/></button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      );
    case Step.CONSTRAINTS:
      return (
        // Use curly braces for string with escaped quotes to avoid JSX attribute parsing issues
        <textarea 
          className={inputBase + " h-80 border-red-500/10"} 
          placeholder={"אילו חסמים עלולים לעצור אותנו? (תקציב, כ\"א, פוליטיקה)..."} 
          value={data.constraints} 
          onChange={(e) => setData({...data, constraints: e.target.value})} 
        />
      );
    case Step.SUMMARY:
      return (
        <div className="space-y-12 animate-in fade-in duration-1000">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 no-print">
            <h2 className="text-5xl font-black text-white">סיכום אסטרטגי</h2>
            <div className="flex bg-slate-950 rounded-[2rem] p-2 border border-white/10">
              <button onClick={() => setActiveTab('draft')} className={`px-12 py-4 rounded-[1.5rem] text-sm font-black transition-all ${activeTab==='draft'?'bg-slate-800 text-white':'text-slate-500'}`}>טיוטת עבודה</button>
              <button onClick={() => setActiveTab('ai')} className={`px-12 py-4 rounded-[1.5rem] text-sm font-black flex items-center gap-3 transition-all ${activeTab==='ai'?'bg-amber-500 text-slate-950 shadow-xl':'text-slate-500'}`}>AI Master Plan ✨</button>
            </div>
          </div>
          <div className="glass-card rounded-[4rem] p-12 md:p-20 min-h-[600px] shadow-2xl overflow-x-auto">
            {activeTab === 'draft' ? (
              <div className="space-y-20">
                <div className="text-center italic font-serif text-5xl">"{data.vision}"</div>
                <div className="space-y-16">
                  {data.highLevelGoals.map((goal, i) => (
                    <div key={i} className="space-y-8">
                      <h4 className="text-3xl font-black text-white border-b-2 border-amber-500/20 pb-6"><span className="text-amber-500 ml-4">0{i+1}.</span> {goal}</h4>
                      {data.objectives.filter(o => o.goalIndex === i).map(obj => (
                        <div key={obj.id} className="bg-white/5 p-10 rounded-[2.5rem] border border-white/5 mb-8 shadow-inner">
                          <p className="text-xl font-bold text-amber-500 mb-8 border-r-4 border-amber-500 pr-6">{obj.text}</p>
                          <table className="w-full text-right text-sm">
                            <thead><tr className="text-slate-500 border-b border-white/10"><th className="pb-4">משימה</th><th className="pb-4">אחריות</th><th className="pb-4">לו"ז</th></tr></thead>
                            <tbody>
                              {data.tasks.filter(t => t.objectiveId === obj.id).map(t => (
                                <tr key={t.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors"><td className="py-4 text-slate-100 font-bold">{t.description}</td><td className="py-4 text-slate-400">{t.responsibility}</td><td className="py-4 text-slate-500 italic">{t.timeline}</td></tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="prose prose-invert max-w-none text-xl leading-relaxed whitespace-pre-wrap font-light text-slate-200">
                {finalReport || (
                  <div className="flex flex-col items-center justify-center h-64 gap-6">
                    <RefreshCcw className="animate-spin w-12 h-12 text-amber-500" />
                    <p className="text-amber-500 font-bold animate-pulse">ה-AI שוזר עבורכם את התוכנית המלאה...</p>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex justify-center no-print pb-10">
            <button onClick={() => window.print()} className="bg-white text-slate-950 px-24 py-8 rounded-[3rem] font-black text-xl shadow-2xl hover:bg-amber-500 transition-all flex items-center gap-4 group">
              <Save className="w-8 h-8 group-hover:rotate-12 transition-transform" /> ייצא תוכנית עבודה חתומה
            </button>
          </div>
        </div>
      );
    default: return null;
  }
}
