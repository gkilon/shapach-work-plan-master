import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronRight, ChevronLeft, Sparkles, BrainCircuit, Save, 
  Trash2, AlertCircle, Zap, PlayCircle, RefreshCcw, Target, ClipboardList
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

// --- Types ---
interface SwotData { strengths: string[]; weaknesses: string[]; opportunities: string[]; threats: string[]; }
interface SmartObjective { id: string; goalIndex: number; text: string; }
interface Task { id: string; objectiveId: string; description: string; responsibility: string; timeline: string; }
interface WorkPlanData { selfContext: string; swot: SwotData; vision: string; highLevelGoals: string[]; objectives: SmartObjective[]; tasks: Task[]; constraints: string; }

enum Step { CONTEXT = 0, SWOT = 1, VISION = 2, GOALS = 3, OBJECTIVES = 4, TASKS = 5, CONSTRAINTS = 6, SUMMARY = 7 }
const STEP_NAMES = ['רקע ואתגרים', 'ניתוח SWOT', 'חזון ניהולי', 'מטרות אסטרטגיות', 'יעדי SMART', 'תכנית אופרטיבית', 'ניהול סיכונים', 'דוח מסכם'];

// --- AI Logic ---
const getApiKey = () => {
  try {
    return import.meta.env.VITE_GEMINI_API_KEY || '';
  } catch {
    return '';
  }
};

const runAi = async (prompt: string, modelName: string = 'gemini-3-flash-preview') => {
  const key = getApiKey();
  if (!key) throw new Error("API_KEY_MISSING");
  const ai = new GoogleGenAI({ apiKey: key });
  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
  });
  return response.text;
};

// --- App ---
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

  const goNext = () => currentStep < Step.SUMMARY && setCurrentStep(currentStep + 1);
  const goPrev = () => currentStep > Step.CONTEXT && setCurrentStep(currentStep - 1);

  const handleAiInsight = async () => {
    setLoadingAi(true);
    setError(null);
    try {
      const prompt = `אתה יועץ אסטרטגי למנהלי שירות פסיכולוגי חינוכי. בשלב ${STEP_NAMES[currentStep]}, על סמך הנתונים הבאים: ${JSON.stringify(data)}, ספק 2-3 עצות ניהוליות קצרות וחדות. ענה בעברית מקצועית.`;
      const result = await runAi(prompt);
      setAiSuggestions(result || '');
    } catch (err) {
      setError("שגיאת תקשורת עם ה-AI. וודא הגדרות מערכת.");
    } finally {
      setLoadingAi(false);
    }
  };

  useEffect(() => {
    if (isStarted && currentStep === Step.SUMMARY && !finalReport) {
      const runFinal = async () => {
        setLoadingAi(true);
        try {
          const prompt = `צור תוכנית עבודה אסטרטגית מלאה ומלוטשת למנהל שפ"ח על בסיס הנתונים הללו: ${JSON.stringify(data)}. הפק דוח בפורמט Markdown הכולל חזון, ניתוח מצב, מטרות והמלצות יישומיות. ענה בעברית ניהולית רהוטה.`;
          const res = await runAi(prompt, 'gemini-3-pro-preview');
          setFinalReport(res || '');
        } catch (e) {
          setError("נכשלה יצירת דוח ה-AI הסופי.");
        } finally {
          setLoadingAi(false);
        }
      };
      runFinal();
    }
  }, [currentStep, isStarted]);

  if (!isStarted) {
    return (
      <div className="min-h-screen luxury-gradient flex items-center justify-center p-6 text-center">
        <div className="glass-card max-w-2xl w-full p-12 md:p-20 rounded-[3rem] space-y-10 animate-in fade-in zoom-in duration-500">
          <BrainCircuit className="text-amber-500 w-20 h-20 mx-auto animate-pulse" />
          <div className="space-y-4">
            <h1 className="text-5xl font-black text-white tracking-tight">MIND-PLANNER</h1>
            <p className="text-xl text-slate-400 font-light italic">Executive Strategic Suite for SHAPACH Managers</p>
          </div>
          <button 
            onClick={() => setIsStarted(true)}
            className="w-full py-6 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xl rounded-2xl transition-all transform hover:scale-[1.02] shadow-2xl flex items-center justify-center gap-3"
          >
            התחל בניית תוכנית אסטרטגית <PlayCircle />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen luxury-gradient text-slate-100 flex flex-col">
      <header className="p-4 border-b border-white/5 flex justify-between items-center glass-card sticky top-0 z-50">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setIsStarted(false)}>
          <BrainCircuit className="text-amber-500 w-6 h-6" />
          <h1 className="text-lg font-black tracking-tighter uppercase">SHAPACH Master</h1>
        </div>
        <div className="flex gap-1.5">
          {STEP_NAMES.map((_, i) => (
            <div key={i} className={`h-1 rounded-full transition-all duration-500 ${i === currentStep ? 'w-8 bg-amber-500' : i < currentStep ? 'w-2 bg-amber-900' : 'w-2 bg-slate-800'}`} />
          ))}
        </div>
      </header>

      <main className="flex-1 container mx-auto p-4 md:p-8 flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-6">
          <div className="glass-card rounded-[2.5rem] p-8 md:p-12 border-white/5 shadow-2xl min-h-[550px] relative">
            <div className="flex items-center gap-3 mb-8">
              <span className="text-5xl font-black text-white/5">0{currentStep + 1}</span>
              <h2 className="text-3xl font-black text-white">{STEP_NAMES[currentStep]}</h2>
            </div>
            {renderStepUI(currentStep, data, setData, finalReport, activeTab, setActiveTab)}
          </div>
          
          <div className="flex justify-between items-center px-2 no-print">
            <button onClick={goPrev} disabled={currentStep === 0} className="font-bold text-slate-500 hover:text-white disabled:opacity-0 flex items-center gap-1">
              <ChevronRight className="w-5 h-5" /> שלב קודם
            </button>
            <button onClick={goNext} disabled={currentStep === Step.SUMMARY} className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-10 py-4 rounded-xl font-black shadow-lg transition-all flex items-center gap-2">
              המשך <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
        </div>

        <aside className="w-full lg:w-72 space-y-4 no-print">
          <div className="glass-card p-6 rounded-[2rem] border-white/5 sticky top-24">
            <h3 className="font-bold text-white flex items-center gap-2 mb-4 text-sm">
              <Sparkles className="text-amber-500 w-4 h-4" /> ייעוץ AI
            </h3>
            {error && <div className="p-2 bg-red-500/10 text-red-400 text-[10px] rounded-lg mb-4">{error}</div>}
            <button 
              onClick={handleAiInsight} 
              disabled={loadingAi || currentStep === Step.SUMMARY} 
              className="w-full py-3 bg-slate-900 border border-white/10 rounded-xl mb-4 font-bold flex justify-center items-center gap-2 hover:bg-slate-800 text-xs"
            >
              {loadingAi ? <RefreshCcw className="animate-spin w-4 h-4" /> : <><Zap className="text-amber-500 w-4 h-4"/> קבל תובנה</>}
            </button>
            <div className="bg-slate-950/40 p-4 rounded-xl border border-white/5 min-h-[250px] text-[11px] leading-relaxed text-slate-400 italic whitespace-pre-wrap overflow-y-auto max-h-[400px] custom-scrollbar">
              {aiSuggestions || "מלא נתונים ולחץ לקבלת משוב אסטרטגי..."}
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}

function renderStepUI(step: Step, data: WorkPlanData, setData: any, finalReport: string, activeTab: string, setActiveTab: any) {
  const inputStyle = "w-full bg-slate-950/50 border border-white/10 rounded-2xl p-6 focus:ring-1 focus:ring-amber-500 outline-none text-slate-200 shadow-inner placeholder:text-slate-800";
  
  const addItem = (key: string, item: any) => setData((p: any) => ({ ...p, [key]: [...p[key], item] }));
  const removeItem = (key: string, idOrIdx: any) => setData((p: any) => ({ ...p, [key]: p[key].filter((_: any, i: number) => typeof _ === 'string' ? i !== idOrIdx : _.id !== idOrIdx) }));

  switch (step) {
    case Step.CONTEXT:
      return (
        <div className="space-y-4">
          <p className="text-slate-500 text-sm italic">מהם האתגרים המרכזיים העומדים בפני השפ"ח השנה?</p>
          <textarea className={`${inputStyle} h-64`} placeholder="כתוב כאן על ההקשר הייחודי..." value={data.selfContext} onChange={e => setData({...data, selfContext: e.target.value})} />
        </div>
      );
    case Step.SWOT:
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.keys(data.swot).map(cat => (
            <div key={cat} className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
              <h4 className="text-amber-500 font-bold text-[10px] uppercase tracking-tighter">{cat}</h4>
              <input className="w-full bg-slate-950 border-white/10 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-amber-500" placeholder="הוסף..." onKeyDown={e => {
                if (e.key === 'Enter' && (e.target as any).value) {
                  setData({...data, swot: {...data.swot, [cat]: [...(data.swot as any)[cat], (e.target as any).value]}});
                  (e.target as any).value = '';
                }
              }} />
              <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
                {(data.swot as any)[cat].map((item: string, i: number) => (
                  <div key={i} className="flex justify-between items-center text-[11px] bg-slate-950/50 p-2 rounded-md">
                    <span>{item}</span>
                    <button onClick={() => {
                      const newList = [...(data.swot as any)[cat]];
                      newList.splice(i, 1);
                      setData({...data, swot: {...data.swot, [cat]: newList}});
                    }}><Trash2 className="w-3 h-3 text-slate-700 hover:text-red-500"/></button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    case Step.VISION:
      return (
        <div className="space-y-6 text-center">
          <p className="text-slate-500 italic">כיצד ייראה השירות בעוד שנה? נסח משפט חזון.</p>
          <textarea className={`${inputStyle} h-40 text-center text-2xl font-serif pt-10`} placeholder="להיות העוגן של הקהילה..." value={data.vision} onChange={e => setData({...data, vision: e.target.value})} />
        </div>
      );
    case Step.GOALS:
      return (
        <div className="space-y-4">
          <div className="flex gap-2">
            <input id="goal-in" className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-4 py-3" placeholder="מטרת על..." />
            <button onClick={() => {
              const el = document.getElementById('goal-in') as HTMLInputElement;
              if (el.value) { addItem('highLevelGoals', el.value); el.value = ''; }
            }} className="bg-amber-500 text-slate-950 px-6 rounded-xl font-bold">הוסף</button>
          </div>
          <div className="space-y-2">
            {data.highLevelGoals.map((g, i) => (
              <div key={i} className="bg-white/5 p-4 rounded-xl flex justify-between items-center">
                <span className="text-sm font-bold">{i+1}. {g}</span>
                <button onClick={() => removeItem('highLevelGoals', i)}><Trash2 className="w-4 h-4 text-slate-700"/></button>
              </div>
            ))}
          </div>
        </div>
      );
    case Step.OBJECTIVES:
      return (
        <div className="space-y-6">
          {data.highLevelGoals.map((goal, gIdx) => (
            <div key={gIdx} className="p-4 border border-white/5 rounded-2xl bg-white/5 space-y-3">
              <h4 className="text-amber-500 font-bold text-sm flex items-center gap-2"><Target className="w-4 h-4"/> {goal}</h4>
              <input id={`obj-in-${gIdx}`} className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-xs" placeholder="יעד מדיד (SMART)..." onKeyDown={e => {
                if (e.key === 'Enter' && (e.target as any).value) {
                  addItem('objectives', { id: Math.random().toString(), goalIndex: gIdx, text: (e.target as any).value });
                  (e.target as any).value = '';
                }
              }} />
              <div className="space-y-2">
                {data.objectives.filter(o => o.goalIndex === gIdx).map(obj => (
                  <div key={obj.id} className="bg-slate-900/50 p-2 rounded-lg text-xs flex justify-between">
                    <span>{obj.text}</span>
                    <button onClick={() => removeItem('objectives', obj.id)}><Trash2 className="w-3 h-3 text-slate-700"/></button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    case Step.TASKS:
      return (
        <div className="space-y-4 max-h-[450px] overflow-y-auto custom-scrollbar pr-2">
          {data.objectives.map(obj => (
            <div key={obj.id} className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-3">
              <h4 className="text-white font-bold text-xs border-r-2 border-amber-500 pr-2">{obj.text}</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <input id={`t-d-${obj.id}`} className="bg-slate-950 border-white/10 rounded-md p-2 text-[10px]" placeholder="משימה" />
                <input id={`t-r-${obj.id}`} className="bg-slate-950 border-white/10 rounded-md p-2 text-[10px]" placeholder="אחראי" />
                <input id={`t-t-${obj.id}`} className="bg-slate-950 border-white/10 rounded-md p-2 text-[10px]" placeholder="לו''ז" />
                <button onClick={() => {
                  const d = document.getElementById(`t-d-${obj.id}`) as HTMLInputElement;
                  const r = document.getElementById(`t-r-${obj.id}`) as HTMLInputElement;
                  const t = document.getElementById(`t-t-${obj.id}`) as HTMLInputElement;
                  if (d.value) {
                    addItem('tasks', { id: Math.random().toString(), objectiveId: obj.id, description: d.value, responsibility: r.value, timeline: t.value });
                    d.value = ''; r.value = ''; t.value = '';
                  }
                }} className="bg-amber-500 text-slate-950 font-bold rounded-md text-[10px] py-2">הוסף</button>
              </div>
              <div className="space-y-1">
                {data.tasks.filter(t => t.objectiveId === obj.id).map(task => (
                  <div key={task.id} className="grid grid-cols-4 gap-2 bg-slate-950/50 p-2 rounded text-[10px] items-center">
                    <span className="font-bold">{task.description}</span>
                    <span className="text-slate-500">{task.responsibility}</span>
                    <span className="text-slate-600">{task.timeline}</span>
                    <button onClick={() => removeItem('tasks', task.id)} className="text-right"><Trash2 className="w-3 h-3 inline text-slate-700"/></button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    case Step.CONSTRAINTS:
      return (
        <textarea className={`${inputStyle} h-64 border-red-500/10`} placeholder="חסמי כוח אדם, אילוצי תקציב או סיכונים צפויים..." value={data.constraints} onChange={e => setData({...data, constraints: e.target.value})} />
      );
    case Step.SUMMARY:
      return (
        <div className="space-y-6">
          <div className="flex justify-between items-center no-print">
            <h3 className="text-2xl font-bold">דוח אסטרטגי מסכם</h3>
            <div className="flex bg-slate-900 p-1 rounded-lg">
              <button onClick={() => setActiveTab('draft')} className={`px-4 py-1.5 rounded-md text-[10px] font-bold ${activeTab==='draft'?'bg-slate-700':'text-slate-500'}`}>טיוטה</button>
              <button onClick={() => setActiveTab('ai')} className={`px-4 py-1.5 rounded-md text-[10px] font-bold ${activeTab==='ai'?'bg-amber-500 text-slate-900':'text-slate-500'}`}>AI Master Plan</button>
            </div>
          </div>
          <div className="glass-card rounded-3xl p-8 min-h-[400px]">
            {activeTab === 'draft' ? (
              <div className="space-y-8">
                <div className="text-center italic font-serif text-3xl">"{data.vision}"</div>
                {data.highLevelGoals.map((g, i) => (
                  <div key={i} className="border-t border-white/5 pt-4">
                    <h4 className="font-bold text-amber-500 mb-2">{i+1}. {g}</h4>
                    {data.objectives.filter(o => o.goalIndex === i).map(obj => (
                      <div key={obj.id} className="mr-4 mb-4">
                        <p className="text-sm font-bold text-slate-300">• {obj.text}</p>
                        <div className="mr-6 mt-2 space-y-1">
                          {data.tasks.filter(t => t.objectiveId === obj.id).map(t => (
                            <div key={t.id} className="text-xs text-slate-500 flex justify-between">
                              <span>- {t.description}</span>
                              <span>[{t.responsibility} | {t.timeline}]</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <div className="prose prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap">
                {finalReport || "מעבד את הנתונים ליצירת תוכנית מקיפה..."}
              </div>
            )}
          </div>
          <div className="flex justify-center no-print">
            <button onClick={() => window.print()} className="bg-white text-slate-950 px-8 py-3 rounded-xl font-black text-sm flex items-center gap-2">
              <Save className="w-5 h-5" /> ייצא תוכנית חתומה
            </button>
          </div>
        </div>
      );
    default: return null;
  }
}
