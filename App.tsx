
import React, { useState, useEffect, useCallback } from 'react';
import { 
  ChevronRight, ChevronLeft, Sparkles, BrainCircuit, Save, 
  Trash2, Calendar, User, AlertCircle, Zap, Lightbulb, 
  MessageSquare, Quote, PlayCircle, RefreshCcw
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

// --- TYPES (Internalized to prevent import issues) ---
export interface SwotData {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export interface SmartObjective {
  id: string;
  goalIndex: number;
  text: string;
}

export interface Task {
  id: string;
  objectiveId: string;
  description: string;
  resources: string;
  responsibility: string;
  timeline: string;
}

export interface WorkPlanData {
  selfContext: string;
  swot: SwotData;
  vision: string;
  highLevelGoals: string[];
  objectives: SmartObjective[];
  tasks: Task[];
  constraints: string;
}

export enum Step {
  CONTEXT = 0, SWOT = 1, VISION = 2, GOALS = 3, 
  OBJECTIVES = 4, TASKS = 5, CONSTRAINTS = 6, SUMMARY = 7
}

const STEP_NAMES = [
  'מיפוי ורקע', 'ניתוח SWOT', 'חזון השירות', 
  'מטרות אסטרטגיות', 'יעדי SMART', 'תכנית ביצוע', 
  'אילוצים וסיכונים', 'לוח בקרה סופי'
];

// --- AI SERVICE LOGIC (Internalized) ---
const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API_KEY_MISSING");
  return new GoogleGenAI({ apiKey });
};

const aiGetStepSuggestions = async (stepIndex: number, currentData: Partial<WorkPlanData>) => {
  const ai = getAiClient();
  const stepContexts = [
    "מיפוי ורקע סביבתי לשפ\"ח", "ניתוח SWOT", "חזון מקצועי", 
    "מטרות אסטרטגיות", "יעדי SMART", "משימות ולו\"ז", 
    "אילוצים וסיכונים", "אינטגרציה סופית"
  ];

  const prompt = `תפקידך: יועץ אסטרטגי למנהלי שפ"ח. השלב: ${stepContexts[stepIndex]}. 
נתונים: ${JSON.stringify(currentData)}.
המשימה: תן 2-3 תובנות ניהוליות חכמות והצעה אחת לניסוח מקצועי. ענה בעברית גבוהה.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
  });
  return response.text;
};

const aiGenerateFinalPlan = async (data: WorkPlanData) => {
  const ai = getAiClient();
  const prompt = `בצע אינטגרציה מלאה לתוכנית עבודה שנתית לשפ"ח: ${JSON.stringify(data)}.
כלול: סיכום אסטרטגי, חזון, וטבלת Markdown מפורטת (מטרה | יעד | משימה | אחראי | לו"ז).
ענה בעברית ניהולית משובחת.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
  });
  return response.text;
};

// --- MAIN APP COMPONENT ---
const initialSwot: SwotData = { strengths: [], weaknesses: [], opportunities: [], threats: [] };
const initialPlan: WorkPlanData = {
  selfContext: '', swot: initialSwot, 
  vision: '', highLevelGoals: [], objectives: [], tasks: [], constraints: ''
};

export default function App() {
  const [isStarted, setIsStarted] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step>(Step.CONTEXT);
  const [data, setData] = useState<WorkPlanData>(initialPlan);
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState('');
  const [finalAiReport, setFinalAiReport] = useState('');
  const [activeTab, setActiveTab] = useState<'original' | 'ai'>('original');
  const [error, setError] = useState<string | null>(null);

  const nextStep = () => currentStep < Step.SUMMARY && setCurrentStep(currentStep + 1);
  const prevStep = () => currentStep > Step.CONTEXT && setCurrentStep(currentStep - 1);

  const handleFetchAi = async () => {
    setLoadingAi(true);
    setError(null);
    try {
      const res = await aiGetStepSuggestions(currentStep, data);
      setAiSuggestions(res || '');
    } catch (err: any) {
      setError(err.message === "API_KEY_MISSING" ? "מפתח API חסר בנטליפיי" : "שגיאת תקשורת עם ה-AI");
    } finally {
      setLoadingAi(false);
    }
  };

  useEffect(() => {
    if (isStarted && currentStep === Step.SUMMARY && !finalAiReport) {
      const generateReport = async () => {
        setLoadingAi(true);
        try {
          const res = await aiGenerateFinalPlan(data);
          setFinalAiReport(res || '');
        } catch (err) {
          setError("שגיאה ביצירת הדוח הסופי");
        } finally {
          setLoadingAi(false);
        }
      };
      generateReport();
    }
  }, [currentStep, isStarted]);

  if (!isStarted) {
    return (
      <div className="min-h-screen luxury-gradient text-slate-100 flex items-center justify-center p-6 text-center">
        <div className="glass-card max-w-4xl w-full p-12 md:p-24 rounded-[4rem] border-slate-800 shadow-2xl animate-in fade-in zoom-in duration-700">
          <BrainCircuit className="text-amber-500 w-24 h-24 mx-auto mb-10 animate-pulse" />
          <h1 className="text-6xl md:text-8xl font-black mb-6 tracking-tighter">MIND-PLANNER</h1>
          <p className="text-2xl text-slate-400 mb-12 italic">מערכת אסטרטגית מתקדמת לניהול תוכניות עבודה בשפ"ח</p>
          <button onClick={() => setIsStarted(true)} className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-2xl px-16 py-6 rounded-[2.5rem] shadow-2xl transition-all transform hover:scale-105 active:scale-95 flex items-center gap-4 mx-auto">
            התחל סדנה <PlayCircle />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen luxury-gradient text-slate-100 flex flex-col">
      <header className="p-6 border-b border-slate-800 flex justify-between items-center glass-card sticky top-0 z-50">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setIsStarted(false)}>
          <BrainCircuit className="text-amber-500 w-8 h-8" />
          <h1 className="text-2xl font-black">SHAPACH Master</h1>
        </div>
        <div className="flex gap-2">
          {STEP_NAMES.map((_, i) => (
            <div key={i} className={`w-3 h-3 rounded-full ${i === currentStep ? 'bg-amber-500 scale-125' : i < currentStep ? 'bg-amber-900' : 'bg-slate-800'}`} />
          ))}
        </div>
      </header>

      <main className="flex-1 container mx-auto p-4 md:p-10 flex flex-col lg:flex-row gap-10">
        <div className="flex-1 space-y-8">
          <div className="glass-card rounded-[3rem] p-10 md:p-16 border-slate-700/30 shadow-2xl min-h-[500px]">
             <div className="flex items-center gap-4 mb-10">
               <span className="text-6xl font-black text-slate-800/50 leading-none">0{currentStep + 1}</span>
               <h2 className="text-4xl font-black text-white">{STEP_NAMES[currentStep]}</h2>
             </div>
             {renderStepContent(currentStep, data, setData, finalAiReport, activeTab, setActiveTab)}
          </div>
          <div className="flex justify-between items-center px-4 no-print">
            <button onClick={prevStep} className={`flex items-center gap-2 font-bold text-slate-400 hover:text-white transition-colors ${currentStep === 0 ? 'invisible' : ''}`}><ChevronRight /> חזרה</button>
            <button onClick={nextStep} className={`bg-amber-500 hover:bg-amber-400 text-slate-950 px-14 py-4 rounded-2xl font-black shadow-xl transition-all ${currentStep === Step.SUMMARY ? 'invisible' : ''}`}>המשך לשלב הבא <ChevronLeft className="inline"/></button>
          </div>
        </div>

        <aside className="w-full lg:w-96 space-y-6 no-print">
          <div className="glass-card p-8 rounded-[2.5rem] border-amber-500/10 sticky top-32">
            <h3 className="font-bold text-xl text-white flex items-center gap-2 mb-6"><Sparkles className="text-amber-500"/> סוכן אסטרטגיה AI</h3>
            {error && <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs flex items-center gap-2 animate-bounce"><AlertCircle className="w-4 h-4 shrink-0"/> {error}</div>}
            <button onClick={handleFetchAi} disabled={loadingAi} className="w-full py-5 bg-slate-900 border border-slate-800 rounded-2xl mb-6 font-black flex justify-center items-center gap-3 hover:bg-slate-800 disabled:opacity-50 transition-all shadow-lg">
              {loadingAi ? <RefreshCcw className="animate-spin" /> : <><Zap className="text-amber-500"/> קבל תובנות ניהוליות</>}
            </button>
            <div className="bg-slate-950/40 p-6 rounded-[2rem] border border-slate-800 min-h-[350px] text-sm leading-relaxed text-slate-300 overflow-y-auto custom-scrollbar italic">
              {aiSuggestions || "ממתין למידע שלך כדי להפיק תובנות אסטרטגיות..."}
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}

function renderStepContent(step: Step, data: WorkPlanData, setData: any, finalAiReport: string, activeTab: string, setActiveTab: any) {
  const inputClass = "w-full bg-slate-950/40 border border-slate-800 rounded-[2rem] p-8 focus:ring-2 focus:ring-amber-500 outline-none text-xl leading-relaxed text-slate-200 shadow-inner min-h-[250px]";
  const addItem = (listName: string, item: any) => setData((prev: any) => ({ ...prev, [listName]: [...prev[listName], item] }));
  const removeItem = (listName: string, idOrIdx: any) => setData((prev: any) => ({ ...prev, [listName]: prev[listName].filter((x: any, i: number) => typeof x === 'string' ? i !== idOrIdx : x.id !== idOrIdx) }));

  switch (step) {
    case Step.CONTEXT:
      return <textarea className={inputClass} placeholder="תאר את הרקע והאתגרים העיקריים לשנה הקרובה..." value={data.selfContext} onChange={(e) => setData({...data, selfContext: e.target.value})} />;
    case Step.SWOT:
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {['strengths', 'weaknesses', 'opportunities', 'threats'].map(cat => (
            <div key={cat} className="p-6 rounded-[2rem] border border-slate-800 bg-slate-900/20">
              <h4 className="font-black text-amber-500 mb-4 uppercase tracking-widest text-xs">{cat}</h4>
              <input className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm mb-4 outline-none focus:ring-1 focus:ring-amber-500" placeholder="הוסף פריט..." onKeyDown={(e) => { if(e.key==='Enter' && (e.target as HTMLInputElement).value) { setData({...data, swot: {...data.swot, [cat]: [...(data.swot[cat as keyof SwotData]), (e.target as HTMLInputElement).value]}}); (e.target as HTMLInputElement).value=''; } }} />
              <ul className="space-y-2">
                {(data.swot[cat as keyof SwotData] as string[]).map((item, i) => (
                  <li key={i} className="flex justify-between items-center text-sm bg-slate-900/40 p-3 rounded-xl border border-slate-800">
                    <span>{item}</span>
                    <button onClick={() => { const nl = [...(data.swot[cat as keyof SwotData])]; nl.splice(i,1); setData({...data, swot:{...data.swot, [cat]:nl}}); }}><Trash2 className="w-4 h-4 text-red-500/30 hover:text-red-500"/></button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      );
    case Step.VISION:
      return <textarea className={inputClass + " text-center italic font-serif text-4xl pt-20"} placeholder="חזון השירות..." value={data.vision} onChange={(e) => setData({...data, vision: e.target.value})} />;
    case Step.GOALS:
      return (
        <div className="space-y-6">
          <div className="flex gap-4">
            <input id="goal-in" className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-lg" placeholder="מטרת על אסטרטגית..." />
            <button onClick={() => { const el = document.getElementById('goal-in') as HTMLInputElement; if(el.value) { addItem('highLevelGoals', el.value); el.value=''; } }} className="bg-amber-500 text-slate-950 px-10 rounded-2xl font-black">הוסף</button>
          </div>
          {data.highLevelGoals.map((g, i) => <div key={i} className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800 flex justify-between items-center"><span>{g}</span><button onClick={() => removeItem('highLevelGoals', i)}><Trash2 className="w-5 h-5 text-red-500/40"/></button></div>)}
        </div>
      );
    case Step.OBJECTIVES:
      return (
        <div className="space-y-8">
          {data.highLevelGoals.map((goal, gIdx) => (
            <div key={gIdx} className="p-8 border border-slate-800 rounded-[2.5rem] bg-slate-950/20 shadow-xl">
              <h4 className="text-amber-500 font-bold mb-6 text-xl">מטרה: {goal}</h4>
              <div className="flex gap-3 mb-6">
                <input id={`obj-in-${gIdx}`} className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200" placeholder="יעד SMART (מדיד ותחום בזמן)..." />
                <button onClick={() => { const el = document.getElementById(`obj-in-${gIdx}`) as HTMLInputElement; if(el.value) { addItem('objectives', { id: Date.now().toString(), goalIndex: gIdx, text: el.value }); el.value=''; } }} className="bg-slate-800 px-6 rounded-xl font-bold">הוסף</button>
              </div>
              <ul className="space-y-2">
                {data.objectives.filter(o => o.goalIndex === gIdx).map(obj => <li key={obj.id} className="flex justify-between items-center bg-slate-900/60 p-4 rounded-xl border border-slate-800"><span>{obj.text}</span><button onClick={() => removeItem('objectives', obj.id)}><Trash2 className="w-4 h-4 text-red-500/20"/></button></li>)}
              </ul>
            </div>
          ))}
        </div>
      );
    case Step.TASKS:
      return (
        <div className="space-y-10 max-h-[600px] overflow-y-auto custom-scrollbar pr-4">
          {data.objectives.map(obj => (
            <div key={obj.id} className="p-8 border border-slate-800 rounded-[2rem] bg-slate-950/20 shadow-xl">
              <h4 className="text-white font-bold mb-6">יעד: {obj.text}</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <input id={`t-d-${obj.id}`} className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm" placeholder="משימה" />
                <input id={`t-r-${obj.id}`} className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm" placeholder="אחראי" />
                <input id={`t-t-${obj.id}`} className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm" placeholder="לו''ז" />
                <button onClick={() => { const d = document.getElementById(`t-d-${obj.id}`) as HTMLInputElement; const r = document.getElementById(`t-r-${obj.id}`) as HTMLInputElement; const t = document.getElementById(`t-t-${obj.id}`) as HTMLInputElement; if(d.value) { addItem('tasks', { id: Date.now().toString(), objectiveId: obj.id, description: d.value, responsibility: r.value, resources: '', timeline: t.value }); d.value=''; r.value=''; t.value=''; } }} className="bg-amber-500 text-slate-950 font-black rounded-xl py-3">הוסף</button>
              </div>
              <ul className="space-y-2">
                {data.tasks.filter(t => t.objectiveId === obj.id).map(task => <li key={task.id} className="flex justify-between bg-slate-950/60 p-4 rounded-xl text-xs border border-slate-800"><span>{task.description} | {task.responsibility} | {task.timeline}</span><button onClick={() => removeItem('tasks', task.id)}><Trash2 className="w-3 h-3 text-red-500/20"/></button></li>)}
              </ul>
            </div>
          ))}
        </div>
      );
    case Step.CONSTRAINTS:
      return <textarea className={inputClass + " border-red-500/10"} placeholder="אילוצים וסיכונים מראש..." value={data.constraints} onChange={(e) => setData({...data, constraints: e.target.value})} />;
    case Step.SUMMARY:
      return (
        <div className="space-y-10 animate-in fade-in duration-1000">
          <div className="flex justify-between items-center no-print">
            <h2 className="text-4xl font-black text-white">סיכום תוכנית העבודה</h2>
            <div className="flex bg-slate-950 rounded-2xl p-1.5 border border-slate-800 shadow-2xl">
              <button onClick={() => setActiveTab('original')} className={`px-8 py-3 rounded-xl text-sm font-bold transition-all ${activeTab==='original'?'bg-slate-800 text-white':'text-slate-500'}`}>טיוטה גולמית</button>
              <button onClick={() => setActiveTab('ai')} className={`px-8 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${activeTab==='ai'?'bg-amber-500 text-slate-950':'text-slate-500 hover:text-amber-500'}`}><Sparkles className="w-4 h-4"/> AI Integrated Plan</button>
            </div>
          </div>
          <div className="glass-card rounded-[3.5rem] p-12 min-h-[500px] border border-slate-800 shadow-2xl">
            {activeTab === 'original' ? (
              <div className="space-y-16">
                <p className="text-5xl font-serif italic text-center text-white leading-relaxed">"{data.vision || 'חזון השירות'}"</p>
                <div className="overflow-x-auto rounded-[2rem] border border-slate-800 shadow-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-900 text-slate-400"><tr><th className="p-6 text-right">יעד SMART</th><th className="p-6 text-right">משימה</th><th className="p-6 text-right">אחראי</th><th className="p-6 text-right">לו''ז</th></tr></thead>
                    <tbody>
                      {data.objectives.map(obj => {
                        const objTasks = data.tasks.filter(t => t.objectiveId === obj.id);
                        return objTasks.length === 0 ? <tr key={obj.id} className="border-t border-slate-900"><td className="p-6 font-bold text-amber-500/70">{obj.text}</td><td colSpan={3} className="p-6 text-center opacity-10 italic">טרם הוגדרו משימות</td></tr> :
                        objTasks.map((t, idx) => <tr key={t.id} className="border-t border-slate-900/50 hover:bg-slate-900/10 transition-colors">
                          {idx === 0 && <td rowSpan={objTasks.length} className="p-6 font-black text-amber-500 align-top border-l border-slate-800 w-1/4">{obj.text}</td>}
                          <td className="p-6 text-slate-200">{t.description}</td>
                          <td className="p-6 text-slate-400">{t.responsibility}</td>
                          <td className="p-6 text-slate-500 italic text-xs">{t.timeline}</td>
                        </tr>);
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="prose prose-invert max-w-none prose-amber animate-in fade-in duration-1000">
                {finalAiReport ? <div dangerouslySetInnerHTML={{ __html: formatMarkdown(finalAiReport) }} /> : (
                  <div className="flex flex-col items-center justify-center h-[400px] space-y-8">
                    <Sparkles className="w-20 h-20 text-amber-500 animate-bounce" />
                    <p className="text-3xl font-black text-white tracking-widest animate-pulse">מייצר אינטגרציה אסטרטגית מבוססת AI...</p>
                  </div>
                )}
              </div>
            )}
          </div>
          <button onClick={() => window.print()} className="mx-auto block no-print bg-white text-slate-950 px-20 py-6 rounded-[2rem] font-black shadow-2xl hover:bg-amber-500 transition-all active:scale-95"><Save className="inline ml-3 w-6 h-6"/> הדפס וייצא תוכנית עבודה</button>
        </div>
      );
    default: return null;
  }
}

function formatMarkdown(text: string) {
  return text
    .replace(/^### (.*$)/gim, '<h3 class="text-2xl font-black text-amber-500 mt-10 mb-6">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-3xl font-black text-white mt-14 mb-8 border-b border-slate-800 pb-3">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-5xl font-black text-white mt-20 mb-12 bg-amber-500/10 p-10 rounded-[3rem] text-center border border-amber-500/20 shadow-2xl">$1</h1>')
    .replace(/^\* (.*$)/gim, '<li class="mr-10 mb-4 text-slate-300 text-lg leading-relaxed">$1</li>')
    .replace(/\n/g, '<br />');
}
