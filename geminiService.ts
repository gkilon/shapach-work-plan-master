
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
      setError(err.message || "שגיאת תקשורת");
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
          setError(err.message || "שגיאה בייצור הדו\"ח");
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
      <div className="min-h-screen luxury-gradient text-slate-100 flex items-center justify-center p-6 text-center relative overflow-hidden">
        <div className="glass-card max-w-4xl w-full p-12 md:p-24 rounded-[4rem] border-slate-800 shadow-2xl relative z-10 animate-in zoom-in-95 duration-1000">
          <div className="flex flex-col items-center space-y-10">
            <div className="bg-gradient-to-br from-amber-500 to-amber-700 p-6 rounded-[2rem] shadow-xl transform -rotate-6">
              <BrainCircuit className="text-slate-950 w-16 h-16" />
            </div>
            <div className="space-y-4">
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white">
                MIND-PLANNER <span className="text-amber-500">שפ"ח</span>
              </h1>
              <p className="text-xl md:text-2xl text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed italic">
                סדנה אסטרטגית דיגיטלית לבניית תוכניות עבודה מבוססות חזון ופסיכולוגיה.
              </p>
            </div>
            <button 
              onClick={() => setIsStarted(true)}
              className="group relative flex items-center gap-4 px-16 py-6 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-2xl rounded-[2.5rem] transition-all shadow-2xl active:scale-95"
            >
              התחל סדנה
              <PlayCircle className="w-8 h-8 group-hover:translate-x-[-8px] transition-transform" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen luxury-gradient text-slate-100 flex flex-col selection:bg-amber-500/30">
      <header className="p-6 border-b border-slate-800 sticky top-0 z-50 glass-card">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => setIsStarted(false)}>
            <div className="bg-gradient-to-br from-amber-500 to-amber-700 p-2.5 rounded-xl">
              <BrainCircuit className="text-slate-950 w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black text-white">MIND-PLANNER</h1>
          </div>
          <nav className="flex items-center gap-2">
            {STEP_NAMES.map((name, idx) => (
              <div key={idx} className="flex items-center group relative">
                <button 
                  onClick={() => idx < currentStep && setCurrentStep(idx)}
                  className={`w-3.5 h-3.5 rounded-full transition-all duration-500 ${idx === currentStep ? 'bg-amber-500 scale-125 shadow-lg' : idx < currentStep ? 'bg-amber-800' : 'bg-slate-800'}`} 
                />
                {idx < STEP_NAMES.length - 1 && <div className={`w-6 h-[1px] ${idx < currentStep ? 'bg-amber-900' : 'bg-slate-800'}`} />}
              </div>
            ))}
          </nav>
        </div>
      </header>

      {showWorkshopStop && WORKSHOP_STOPS[currentStep] && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="glass-card max-w-2xl w-full p-10 md:p-16 rounded-[3rem] border-amber-500/20 shadow-2xl text-center space-y-8 animate-in zoom-in-95">
            <MessageSquare className="text-amber-500 w-12 h-12 mx-auto" />
            <h2 className="text-3xl font-black text-white">{WORKSHOP_STOPS[currentStep]?.title}</h2>
            <div className="space-y-6">
              {WORKSHOP_STOPS[currentStep]?.questions.map((q, i) => (
                <div key={i} className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800 italic text-xl text-slate-200">
                  "{q}"
                </div>
              ))}
            </div>
            <button onClick={() => setShowWorkshopStop(false)} className="w-full py-5 bg-amber-500 text-slate-950 font-black rounded-2xl transition-all shadow-xl">המשך לתיעוד</button>
          </div>
        </div>
      )}

      <main className="flex-1 container mx-auto p-4 md:p-8 flex flex-col lg:flex-row gap-8">
        <div className="flex-1 space-y-6">
          <div className="glass-card rounded-[2.5rem] p-8 md:p-12 border-slate-700/30 shadow-2xl relative overflow-hidden">
             <div className="relative z-10 space-y-8">
               <div className="flex items-center gap-4">
                 <span className="text-5xl font-black text-slate-800/30">0{currentStep + 1}</span>
                 <h2 className="text-3xl font-black text-white">{STEP_NAMES[currentStep]}</h2>
               </div>
               {renderStepContent(currentStep, data, setData, finalAiReport, activeTab, setActiveTab)}
               {currentStep !== Step.SUMMARY && (
                 <div className="mt-12 p-6 bg-blue-500/5 rounded-3xl border border-blue-500/10">
                    <h4 className="font-black text-blue-400 text-lg mb-2 flex items-center gap-2"><Lightbulb className="w-5 h-5"/> {METHODOLOGY_GUIDANCE[currentStep]?.title}</h4>
                    <p className="text-slate-300 font-medium">{METHODOLOGY_GUIDANCE[currentStep]?.description}</p>
                 </div>
               )}
             </div>
          </div>
          <div className="flex justify-between items-center px-4 no-print">
            <button onClick={prevStep} className={`flex items-center gap-2 px-8 py-4 text-slate-500 hover:text-white transition-all font-bold ${currentStep === Step.CONTEXT ? 'opacity-0' : ''}`}><ChevronRight /> חזרה</button>
            <button onClick={nextStep} disabled={currentStep === Step.SUMMARY} className={`group flex items-center gap-3 px-14 py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-2xl transition-all shadow-xl active:scale-95 ${currentStep === Step.SUMMARY ? 'opacity-0' : ''}`}>הבא <ChevronLeft /></button>
          </div>
        </div>

        <aside className="w-full lg:w-80 shrink-0 space-y-6 no-print">
          <div className="glass-card p-8 rounded-[2.5rem] border-amber-500/10">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="text-amber-500 w-5 h-5" />
              <h3 className="font-bold text-xl text-white">סוכן אסטרטגיה AI</h3>
            </div>
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs flex flex-col gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p>{error}</p>
                <button onClick={fetchSuggestions} className="underline text-right">נסה שוב</button>
              </div>
            )}
            <button onClick={fetchSuggestions} disabled={loadingAi} className="w-full py-4 bg-slate-900 border border-slate-800 rounded-xl mb-6 font-bold flex items-center justify-center gap-3 hover:bg-slate-800 disabled:opacity-50">
              {loadingAi ? <RefreshCcw className="animate-spin" /> : <><Zap className="text-amber-500" /> קבל תובנות</>}
            </button>
            <div className="bg-slate-950/40 p-5 rounded-2xl border border-slate-800 min-h-[300px] text-[13px] leading-relaxed text-slate-300 overflow-y-auto custom-scrollbar">
              {aiSuggestions || <div className="opacity-20 text-center py-10"><BrainCircuit className="mx-auto w-12 h-12 mb-2" /><p>מחכה לנתונים שלך...</p></div>}
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}

function renderStepContent(step: Step, data: WorkPlanData, setData: any, finalAiReport: string, activeTab: string, setActiveTab: any) {
  const inputClass = "w-full bg-slate-950/40 border border-slate-800 rounded-3xl p-8 focus:ring-2 focus:ring-amber-500 outline-none text-xl leading-relaxed text-slate-200 shadow-inner";
  const addItem = (listName: string, item: any) => setData((prev: any) => ({ ...prev, [listName]: [...prev[listName], item] }));
  const removeItem = (listName: string, idOrIdx: any) => setData((prev: any) => ({ ...prev, [listName]: prev[listName].filter((x: any, i: number) => typeof x === 'string' ? i !== idOrIdx : x.id !== idOrIdx) }));

  switch (step) {
    case Step.CONTEXT:
      return <textarea className={inputClass + " h-64"} placeholder="תאר את הרקע וההתמודדות הנוכחית..." value={data.selfContext} onChange={(e) => setData({...data, selfContext: e.target.value})} />;
    case Step.SWOT:
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {['strengths', 'weaknesses', 'opportunities', 'threats'].map(cat => (
            <div key={cat} className="p-6 rounded-[2rem] border border-slate-800 bg-slate-900/20">
              <h4 className="font-black text-sm uppercase tracking-widest mb-4 text-amber-500">{cat === 'strengths' ? 'חוזקות' : cat === 'weaknesses' ? 'חולשות' : cat === 'opportunities' ? 'הזדמנויות' : 'איומים'}</h4>
              <input className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm mb-4 text-slate-200 outline-none focus:ring-1 focus:ring-amber-500" placeholder="הוסף פריט..." onKeyDown={(e) => { if(e.key==='Enter' && (e.target as HTMLInputElement).value) { setData({...data, swot: {...data.swot, [cat]: [...(data.swot[cat as keyof SwotData]), (e.target as HTMLInputElement).value]}}); (e.target as HTMLInputElement).value=''; } }} />
              <ul className="space-y-2">
                {(data.swot[cat as keyof SwotData] as string[]).map((item, i) => (
                  <li key={i} className="flex justify-between items-center text-sm bg-slate-900/40 p-3 rounded-xl border border-slate-800 group">
                    <span className="text-slate-200">{item}</span>
                    <button onClick={() => { const nl = [...(data.swot[cat as keyof SwotData])]; nl.splice(i,1); setData({...data, swot:{...data.swot, [cat]:nl}}); }}><Trash2 className="w-4 h-4 text-slate-700 hover:text-red-400" /></button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      );
    case Step.VISION:
      return <textarea className={inputClass + " h-64 font-serif italic text-4xl text-center pt-20"} placeholder="חזון השירות..." value={data.vision} onChange={(e) => setData({...data, vision: e.target.value})} />;
    case Step.GOALS:
      return (
        <div className="space-y-6">
          <div className="flex gap-4">
            <input id="goal-in" className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-lg text-slate-200" placeholder="מטרת על אסטרטגית..." />
            <button onClick={() => { const el = document.getElementById('goal-in') as HTMLInputElement; if(el.value) { addItem('highLevelGoals', el.value); el.value=''; } }} className="bg-amber-500 text-slate-950 px-8 rounded-2xl font-black">הוסף</button>
          </div>
          <div className="space-y-3">
            {data.highLevelGoals.map((g, i) => (
              <div key={i} className="flex justify-between items-center bg-slate-900/40 p-6 rounded-2xl border border-slate-800">
                <span className="text-xl font-bold text-white">{g}</span>
                <button onClick={() => removeItem('highLevelGoals', i)} className="text-slate-700 hover:text-red-400"><Trash2 className="w-5 h-5"/></button>
              </div>
            ))}
          </div>
        </div>
      );
    case Step.OBJECTIVES:
      return (
        <div className="space-y-8">
          {data.highLevelGoals.map((goal, gIdx) => (
            <div key={gIdx} className="p-8 border border-slate-800 rounded-[2rem] bg-slate-950/20 shadow-lg">
              <h4 className="text-amber-500 font-bold mb-4">מטרה: {goal}</h4>
              <div className="flex gap-4 mb-4">
                <input id={`obj-in-${gIdx}`} className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200" placeholder="יעד SMART..." />
                <button onClick={() => { const el = document.getElementById(`obj-in-${gIdx}`) as HTMLInputElement; if(el.value) { addItem('objectives', { id: Date.now().toString(), goalIndex: gIdx, text: el.value }); el.value=''; } }} className="bg-slate-800 text-white px-6 rounded-xl font-bold border border-slate-700">הוסף</button>
              </div>
              <ul className="space-y-2">
                {data.objectives.filter(o => o.goalIndex === gIdx).map(obj => (
                  <li key={obj.id} className="flex justify-between items-center bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                    <span className="text-slate-100">{obj.text}</span>
                    <button onClick={() => removeItem('objectives', obj.id)}><Trash2 className="w-4 h-4 text-slate-700 hover:text-red-400"/></button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      );
    case Step.TASKS:
      return (
        <div className="space-y-8 max-h-[600px] overflow-y-auto custom-scrollbar pr-4">
          {data.objectives.map(obj => (
            <div key={obj.id} className="p-8 border border-slate-800 rounded-[2rem] bg-slate-950/20 shadow-lg">
              <h4 className="font-black text-white mb-6">יעד: {obj.text}</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <input id={`t-d-${obj.id}`} className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-slate-200" placeholder="משימה..." />
                <input id={`t-r-${obj.id}`} className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-slate-200" placeholder="אחראי" />
                <input id={`t-t-${obj.id}`} className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-slate-200" placeholder="לו''ז" />
                <button onClick={() => { const d = document.getElementById(`t-d-${obj.id}`) as HTMLInputElement; const r = document.getElementById(`t-r-${obj.id}`) as HTMLInputElement; const t = document.getElementById(`t-t-${obj.id}`) as HTMLInputElement; if(d.value) { addItem('tasks', { id: Date.now().toString(), objectiveId: obj.id, description: d.value, responsibility: r.value, resources: '', timeline: t.value }); d.value=''; r.value=''; t.value=''; } }} className="bg-amber-500 text-slate-950 font-black rounded-xl py-3 shadow-lg hover:bg-amber-400">הוסף</button>
              </div>
              <ul className="space-y-2">
                {data.tasks.filter(t => t.objectiveId === obj.id).map(task => (
                  <li key={task.id} className="flex justify-between items-center bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-xs shadow-md">
                    <span className="font-bold text-slate-100">{task.description}</span>
                    <span className="text-slate-400 italic">{task.responsibility} | {task.timeline}</span>
                    <button onClick={() => removeItem('tasks', task.id)}><Trash2 className="w-4 h-4 text-slate-700 hover:text-red-400"/></button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      );
    case Step.CONSTRAINTS:
      return <textarea className={inputClass + " h-64 border-red-500/10"} placeholder="פרט אילוצים, חסמים וסיכונים..." value={data.constraints} onChange={(e) => setData({...data, constraints: e.target.value})} />;
    case Step.SUMMARY:
      return (
        <div className="space-y-10 animate-in fade-in duration-1000">
          <div className="flex justify-between items-center no-print">
            <h2 className="text-3xl font-black text-white">תוכנית עבודה מוגמרת</h2>
            <div className="flex p-1 bg-slate-950 rounded-xl border border-slate-800">
              <button onClick={() => setActiveTab('original')} className={`px-6 py-2 rounded-lg text-sm font-bold ${activeTab==='original'?'bg-slate-800 text-white':'text-slate-500'}`}>טיוטה</button>
              <button onClick={() => setActiveTab('ai')} className={`px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 ${activeTab==='ai'?'bg-amber-500 text-slate-950':'text-slate-500'}`}><Sparkles className="w-4 h-4"/> גרסת Master (AI)</button>
            </div>
          </div>
          <div className="glass-card rounded-[3rem] p-10 shadow-2xl bg-slate-950/40 border border-slate-800 min-h-[500px]">
            {activeTab === 'original' ? (
              <div className="space-y-12">
                <section className="text-center"><p className="text-4xl font-serif italic text-white leading-tight">"{data.vision || 'טרם הוגדר חזון'}"</p></section>
                <div className="overflow-x-auto rounded-2xl border border-slate-800">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-900 text-slate-400"><tr><th className="p-4 text-right">יעד</th><th className="p-4 text-right">משימה</th><th className="p-4 text-right">אחראי</th><th className="p-4 text-right">לו''ז</th></tr></thead>
                    <tbody>
                    {data.objectives.map(obj => {
                      const objTasks = data.tasks.filter(t => t.objectiveId === obj.id);
                      return objTasks.length === 0 ? <tr key={obj.id} className="border-t border-slate-900"><td className="p-4 font-black text-amber-500/70">{obj.text}</td><td colSpan={3} className="p-4 text-center opacity-20">-</td></tr> :
                      objTasks.map((t, idx) => <tr key={t.id} className="border-t border-slate-900 hover:bg-slate-900/20 transition-colors">
                        {idx === 0 && <td rowSpan={objTasks.length} className="p-4 font-black text-amber-500 align-top border-l border-slate-900 w-1/4">{obj.text}</td>}
                        <td className="p-4 text-slate-200">{t.description}</td>
                        <td className="p-4 text-slate-400">{t.responsibility}</td>
                        <td className="p-4 text-slate-500 italic text-xs">{t.timeline}</td>
                      </tr>);
                    })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="animate-in fade-in duration-700">
                {finalAiReport ? <div className="prose prose-invert max-w-none prose-amber p-4 leading-relaxed" dangerouslySetInnerHTML={{ __html: formatMarkdown(finalAiReport) }} /> : (
                  <div className="flex flex-col items-center justify-center h-[400px] space-y-6">
                    <Sparkles className="w-16 h-16 text-amber-500 animate-pulse" />
                    <p className="text-2xl font-black text-white">מייצר אינטגרציה אסטרטגית...</p>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex justify-center no-print"><button onClick={() => window.print()} className="flex items-center gap-4 bg-white text-slate-950 hover:bg-amber-500 transition-all px-12 py-5 rounded-3xl font-black shadow-2xl active:scale-95"><Save /> הדפס תוכנית</button></div>
        </div>
      );
    default: return null;
  }
}

function formatMarkdown(text: string) {
  return text
    .replace(/^### (.*$)/gim, '<h3 class="text-xl font-black text-amber-500 mt-8 mb-4">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-black text-white mt-12 mb-6 border-b border-slate-800 pb-2">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-black text-white mt-16 mb-8 bg-amber-500/10 p-6 rounded-2xl text-center">$1</h1>')
    .replace(/^\* (.*$)/gim, '<li class="mr-6 mb-2 text-slate-300">$1</li>')
    .replace(/\*\*(.*)\*\*/gim, '<strong class="text-white font-black">$1</strong>')
    .replace(/\n/g, '<br />');
}
