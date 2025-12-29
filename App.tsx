
import React, { useState, useEffect, useCallback } from 'react';
import { 
  ChevronRight, ChevronLeft, Sparkles, BrainCircuit, Save, 
  Trash2, Calendar, User, AlertCircle, Zap, Lightbulb, 
  MessageSquare, Quote, PlayCircle, RefreshCcw
} from 'lucide-react';
import { Step, STEP_NAMES, WorkPlanData, SwotData, METHODOLOGY_GUIDANCE, WORKSHOP_STOPS } from './types';
import { getStepSuggestions, generateFinalIntegration } from './geminiService';

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
  const [showWorkshopStop, setShowWorkshopStop] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextStep = () => {
    const nextS = currentStep + 1;
    if (WORKSHOP_STOPS[nextS]) setShowWorkshopStop(true);
    if (currentStep < Step.SUMMARY) setCurrentStep(nextS);
  };
  
  const prevStep = () => {
    if (currentStep > Step.CONTEXT) setCurrentStep(currentStep - 1);
  };

  const fetchSuggestions = useCallback(async () => {
    setLoadingAi(true);
    setError(null);
    try {
      const suggestion = await getStepSuggestions(currentStep, data);
      setAiSuggestions(suggestion || '');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingAi(false);
    }
  }, [currentStep, data]);

  useEffect(() => {
    if (isStarted && currentStep === Step.SUMMARY) {
      const runReport = async () => {
        setLoadingAi(true);
        setError(null);
        try {
          const report = await generateFinalIntegration(data);
          setFinalAiReport(report || '');
        } catch (err: any) {
          setError(err.message);
        } finally {
          setLoadingAi(false);
        }
      };
      runReport();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep, isStarted]);

  if (!isStarted) {
    return (
      <div className="min-h-screen luxury-gradient text-slate-100 flex items-center justify-center p-6 text-center">
        <div className="glass-card max-w-4xl w-full p-12 md:p-24 rounded-[4rem] border-slate-800 shadow-2xl animate-in zoom-in-95 duration-1000">
          <div className="flex flex-col items-center space-y-10">
            <div className="bg-gradient-to-br from-amber-500 to-amber-700 p-6 rounded-[2rem] shadow-xl transform -rotate-6">
              <BrainCircuit className="text-slate-950 w-16 h-16" />
            </div>
            <div className="space-y-4">
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white">MIND-PLANNER</h1>
              <p className="text-xl md:text-2xl text-slate-400 font-medium italic">סדנת תוכניות עבודה למנהלי שפ"ח</p>
            </div>
            <button onClick={() => setIsStarted(true)} className="group flex items-center gap-4 px-16 py-6 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-2xl rounded-[2.5rem] transition-all shadow-2xl active:scale-95">
              התחל סדנה <PlayCircle />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen luxury-gradient text-slate-100 flex flex-col">
      <header className="p-6 border-b border-slate-800 sticky top-0 z-50 glass-card">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => setIsStarted(false)}>
            <BrainCircuit className="text-amber-500 w-8 h-8" />
            <h1 className="text-2xl font-black text-white">SHAPACH Master</h1>
          </div>
          <nav className="flex items-center gap-2">
            {STEP_NAMES.map((name, idx) => (
              <div key={idx} className={`w-3 h-3 rounded-full ${idx === currentStep ? 'bg-amber-500' : idx < currentStep ? 'bg-amber-900' : 'bg-slate-800'}`} />
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1 container mx-auto p-4 md:p-8 flex flex-col lg:flex-row gap-8">
        <div className="flex-1 space-y-6">
          <div className="glass-card rounded-[2.5rem] p-8 md:p-12 border-slate-700/30 shadow-2xl">
             <div className="space-y-8">
               <div className="flex items-center gap-4">
                 <span className="text-4xl font-black text-slate-800">0{currentStep + 1}</span>
                 <h2 className="text-3xl font-black text-white">{STEP_NAMES[currentStep]}</h2>
               </div>
               {renderStepContent(currentStep, data, setData, finalAiReport, activeTab, setActiveTab)}
             </div>
          </div>
          <div className="flex justify-between items-center no-print">
            <button onClick={prevStep} className={`flex items-center gap-2 font-bold ${currentStep === Step.CONTEXT ? 'invisible' : ''}`}><ChevronRight /> חזרה</button>
            <button onClick={nextStep} disabled={currentStep === Step.SUMMARY} className={`px-12 py-4 bg-amber-500 text-slate-950 font-black rounded-2xl shadow-xl ${currentStep === Step.SUMMARY ? 'invisible' : ''}`}>הבא <ChevronLeft className="inline"/></button>
          </div>
        </div>

        <aside className="w-full lg:w-80 space-y-6 no-print">
          <div className="glass-card p-8 rounded-[2rem] border-amber-500/10">
            <h3 className="font-bold text-xl text-white flex items-center gap-2 mb-6"><Sparkles className="text-amber-500"/> סוכן AI</h3>
            {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">{error}</div>}
            <button onClick={fetchSuggestions} disabled={loadingAi} className="w-full py-4 bg-slate-900 border border-slate-800 rounded-xl mb-4 font-bold flex justify-center gap-2 hover:bg-slate-800 disabled:opacity-50">
              {loadingAi ? <RefreshCcw className="animate-spin" /> : <><Zap className="text-amber-500"/> קבל תובנות</>}
            </button>
            <div className="bg-slate-950/40 p-5 rounded-2xl border border-slate-800 min-h-[300px] text-sm leading-relaxed text-slate-300">
              {aiSuggestions || "מחכה לנתונים שלך..."}
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}

function renderStepContent(step: Step, data: WorkPlanData, setData: any, finalAiReport: string, activeTab: string, setActiveTab: any) {
  const inputClass = "w-full bg-slate-950/40 border border-slate-800 rounded-3xl p-8 focus:ring-2 focus:ring-amber-500 outline-none text-xl text-slate-200";
  const addItem = (listName: string, item: any) => setData((prev: any) => ({ ...prev, [listName]: [...prev[listName], item] }));
  const removeItem = (listName: string, idOrIdx: any) => setData((prev: any) => ({ ...prev, [listName]: prev[listName].filter((x: any, i: number) => typeof x === 'string' ? i !== idOrIdx : x.id !== idOrIdx) }));

  switch (step) {
    case Step.CONTEXT:
      return <textarea className={inputClass + " h-64"} placeholder="מיפוי ורקע..." value={data.selfContext} onChange={(e) => setData({...data, selfContext: e.target.value})} />;
    case Step.SWOT:
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {['strengths', 'weaknesses', 'opportunities', 'threats'].map(cat => (
            <div key={cat} className="p-6 rounded-3xl border border-slate-800 bg-slate-900/20">
              <h4 className="font-black text-amber-500 mb-4">{cat}</h4>
              <input className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 mb-4 text-sm" placeholder="הוסף פריט..." onKeyDown={(e) => { if(e.key==='Enter' && (e.target as HTMLInputElement).value) { setData({...data, swot: {...data.swot, [cat]: [...(data.swot[cat as keyof SwotData]), (e.target as HTMLInputElement).value]}}); (e.target as HTMLInputElement).value=''; } }} />
              <ul className="space-y-1">
                {(data.swot[cat as keyof SwotData] as string[]).map((item, i) => (
                  <li key={i} className="flex justify-between items-center text-sm bg-slate-900/40 p-2 rounded-lg">
                    <span>{item}</span>
                    <button onClick={() => { const nl = [...(data.swot[cat as keyof SwotData])]; nl.splice(i,1); setData({...data, swot:{...data.swot, [cat]:nl}}); }}><Trash2 className="w-3 h-3 text-red-400"/></button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      );
    case Step.VISION:
      return <textarea className={inputClass + " h-64 text-center italic font-serif text-3xl"} placeholder="חזון השירות..." value={data.vision} onChange={(e) => setData({...data, vision: e.target.value})} />;
    case Step.GOALS:
      return (
        <div className="space-y-4">
          <div className="flex gap-4">
            <input id="goal-in" className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4" placeholder="מטרת על..." />
            <button onClick={() => { const el = document.getElementById('goal-in') as HTMLInputElement; if(el.value) { addItem('highLevelGoals', el.value); el.value=''; } }} className="bg-amber-500 text-slate-950 px-8 rounded-2xl font-bold">הוסף</button>
          </div>
          {data.highLevelGoals.map((g, i) => <div key={i} className="bg-slate-900/40 p-4 rounded-xl flex justify-between"><span>{g}</span><button onClick={() => removeItem('highLevelGoals', i)}><Trash2 className="w-4 h-4"/></button></div>)}
        </div>
      );
    case Step.OBJECTIVES:
      return (
        <div className="space-y-6">
          {data.highLevelGoals.map((goal, gIdx) => (
            <div key={gIdx} className="p-6 border border-slate-800 rounded-3xl bg-slate-950/20">
              <h4 className="text-amber-500 font-bold mb-4">{goal}</h4>
              <div className="flex gap-2 mb-4">
                <input id={`obj-in-${gIdx}`} className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm" placeholder="יעד SMART..." />
                <button onClick={() => { const el = document.getElementById(`obj-in-${gIdx}`) as HTMLInputElement; if(el.value) { addItem('objectives', { id: Date.now().toString(), goalIndex: gIdx, text: el.value }); el.value=''; } }} className="bg-slate-800 px-4 rounded-xl">הוסף</button>
              </div>
              {data.objectives.filter(o => o.goalIndex === gIdx).map(obj => <div key={obj.id} className="flex justify-between bg-slate-900/60 p-3 rounded-lg text-sm mb-1"><span>{obj.text}</span><button onClick={() => removeItem('objectives', obj.id)}><Trash2 className="w-3 h-3"/></button></div>)}
            </div>
          ))}
        </div>
      );
    case Step.TASKS:
      return (
        <div className="space-y-6 max-h-[500px] overflow-y-auto">
          {data.objectives.map(obj => (
            <div key={obj.id} className="p-6 border border-slate-800 rounded-3xl bg-slate-950/20">
              <h4 className="text-white font-bold mb-4">{obj.text}</h4>
              <div className="grid grid-cols-4 gap-2 mb-4">
                <input id={`t-d-${obj.id}`} className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs" placeholder="משימה" />
                <input id={`t-r-${obj.id}`} className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs" placeholder="אחראי" />
                <input id={`t-t-${obj.id}`} className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs" placeholder="לו''ז" />
                <button onClick={() => { const d = document.getElementById(`t-d-${obj.id}`) as HTMLInputElement; const r = document.getElementById(`t-r-${obj.id}`) as HTMLInputElement; const t = document.getElementById(`t-t-${obj.id}`) as HTMLInputElement; if(d.value) { addItem('tasks', { id: Date.now().toString(), objectiveId: obj.id, description: d.value, responsibility: r.value, resources: '', timeline: t.value }); d.value=''; r.value=''; t.value=''; } }} className="bg-amber-500 text-slate-950 text-xs font-bold rounded-lg">הוסף</button>
              </div>
              {data.tasks.filter(t => t.objectiveId === obj.id).map(task => <div key={task.id} className="flex justify-between bg-slate-950/60 p-3 rounded-lg text-[10px] mb-1"><span>{task.description} ({task.responsibility})</span><button onClick={() => removeItem('tasks', task.id)}><Trash2 className="w-3 h-3"/></button></div>)}
            </div>
          ))}
        </div>
      );
    case Step.CONSTRAINTS:
      return <textarea className={inputClass + " h-64 border-red-500/10"} placeholder="אילוצים וסיכונים..." value={data.constraints} onChange={(e) => setData({...data, constraints: e.target.value})} />;
    case Step.SUMMARY:
      return (
        <div className="space-y-8">
          <div className="flex justify-between items-center no-print">
            <h2 className="text-3xl font-black text-white">תוכנית עבודה מוגמרת</h2>
            <div className="flex bg-slate-950 rounded-xl p-1">
              <button onClick={() => setActiveTab('original')} className={`px-4 py-2 rounded-lg text-sm ${activeTab==='original'?'bg-slate-800':'text-slate-500'}`}>טיוטה</button>
              <button onClick={() => setActiveTab('ai')} className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 ${activeTab==='ai'?'bg-amber-500 text-slate-950':'text-slate-500'}`}><Sparkles className="w-4 h-4"/> AI Master</button>
            </div>
          </div>
          <div className="glass-card rounded-[2rem] p-10 min-h-[400px]">
            {activeTab === 'original' ? (
              <div className="space-y-8">
                <p className="text-3xl font-serif italic text-center text-white">"{data.vision}"</p>
                <table className="w-full text-sm">
                  <thead className="bg-slate-900"><tr><th className="p-4 text-right">יעד</th><th className="p-4 text-right">משימה</th><th className="p-4 text-right">אחראי</th></tr></thead>
                  <tbody>
                    {data.objectives.map(obj => data.tasks.filter(t => t.objectiveId === obj.id).map((t, idx) => (
                      <tr key={t.id} className="border-t border-slate-900">
                        {idx === 0 && <td rowSpan={data.tasks.filter(tk => tk.objectiveId === obj.id).length} className="p-4 font-bold text-amber-500">{obj.text}</td>}
                        <td className="p-4">{t.description}</td>
                        <td className="p-4">{t.responsibility}</td>
                      </tr>
                    )))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="prose prose-invert max-w-none prose-amber">
                {finalAiReport ? <div dangerouslySetInnerHTML={{ __html: formatMarkdown(finalAiReport) }} /> : <div className="text-center animate-pulse py-20 text-xl">מייצר אינטגרציה אסטרטגית...</div>}
              </div>
            )}
          </div>
          <button onClick={() => window.print()} className="mx-auto block no-print bg-white text-slate-950 px-10 py-4 rounded-2xl font-bold"><Save className="inline ml-2"/> הדפס תוכנית</button>
        </div>
      );
    default: return null;
  }
}

function formatMarkdown(text: string) {
  return text
    .replace(/^### (.*$)/gim, '<h3 class="text-xl font-black text-amber-500 mt-6 mb-2">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-black text-white mt-10 mb-4 border-b border-slate-800 pb-2">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-black text-white mt-14 mb-6 bg-amber-500/10 p-4 rounded-xl text-center">$1</h1>')
    .replace(/^\* (.*$)/gim, '<li class="mr-6 mb-1 text-slate-300">$1</li>')
    .replace(/\n/g, '<br />');
}
