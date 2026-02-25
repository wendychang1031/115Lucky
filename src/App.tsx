import React, { useState, useRef, useEffect } from 'react';
import { 
  Users, 
  Trophy, 
  Upload, 
  Trash2, 
  Play, 
  RefreshCw, 
  Settings, 
  LayoutGrid,
  ClipboardList,
  ChevronRight,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Papa from 'papaparse';
import confetti from 'canvas-confetti';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

const NameInput = ({ onNamesUpdate }: { onNamesUpdate: (names: string[]) => void }) => {
  const [text, setText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);
    const names = val.split('\n').map(n => n.trim()).filter(n => n !== '');
    onNamesUpdate(names);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      complete: (results) => {
        const names = results.data
          .flat()
          .map((n: any) => String(n).trim())
          .filter(n => n !== '');
        setText(names.join('\n'));
        onNamesUpdate(names);
      },
      header: false,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
          <ClipboardList size={16} />
          名單來源
        </label>
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="text-xs font-bold flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-brand-primary hover:text-white rounded-full transition-all duration-300"
        >
          <Upload size={14} />
          上傳 CSV
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
          accept=".csv" 
          className="hidden" 
        />
      </div>
      <textarea
        value={text}
        onChange={handleTextChange}
        placeholder="請在此貼上姓名名單，每行一個名字..."
        className="w-full h-48 p-4 bg-white border border-surface-border rounded-2xl focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none transition-all font-mono text-sm resize-none shadow-sm"
      />
    </div>
  );
};

const LuckyDraw = ({ names }: { names: string[] }) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [allowRepeat, setAllowRepeat] = useState(false);
  const [tempName, setTempName] = useState('');

  const availableNames = allowRepeat 
    ? names 
    : names.filter(n => !history.includes(n));

  const draw = () => {
    if (availableNames.length === 0) {
      alert('沒有可抽取的名單了！');
      return;
    }

    setIsDrawing(true);
    setWinner(null);

    let count = 0;
    const maxCount = 20;
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * availableNames.length);
      setTempName(availableNames[randomIndex]);
      count++;

      if (count >= maxCount) {
        clearInterval(interval);
        const finalWinner = availableNames[Math.floor(Math.random() * availableNames.length)];
        setWinner(finalWinner);
        setHistory(prev => [finalWinner, ...prev]);
        setIsDrawing(false);
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#18181b', '#3f3f46', '#71717a']
        });
      }
    }, 100);
  };

  const reset = () => {
    setHistory([]);
    setWinner(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-slate-50 border border-surface-border rounded-3xl p-12 flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden shadow-inner">
          <div className="absolute top-6 left-6 flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div 
                onClick={() => setAllowRepeat(!allowRepeat)}
                className={cn(
                  "w-10 h-5 rounded-full transition-colors relative",
                  allowRepeat ? "bg-brand-primary" : "bg-slate-300"
                )}
              >
                <div className={cn(
                  "absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform",
                  allowRepeat ? "translate-x-5" : "translate-x-0"
                )} />
              </div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">重複抽取</span>
            </label>
          </div>

          <AnimatePresence mode="wait">
            {isDrawing ? (
              <motion.div
                key="drawing"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.2 }}
                className="text-6xl font-black tracking-tighter text-brand-secondary italic"
              >
                {tempName}
              </motion.div>
            ) : winner ? (
              <motion.div
                key="winner"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center gap-4"
              >
                <div className="text-sm font-bold text-slate-400 uppercase tracking-[0.3em]">恭喜獲獎者</div>
                <div className="text-7xl font-black tracking-tighter text-brand-secondary">{winner}</div>
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-slate-300 flex flex-col items-center gap-4"
              >
                <Trophy size={64} strokeWidth={1} />
                <p className="text-sm font-medium uppercase tracking-widest">準備好開始抽獎了嗎？</p>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={draw}
            disabled={isDrawing || names.length === 0}
            className="mt-12 group relative px-12 py-4 bg-brand-secondary text-white rounded-full font-bold uppercase tracking-widest overflow-hidden transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 shadow-xl shadow-brand-secondary/20"
          >
            <span className="relative z-10 flex items-center gap-2">
              {isDrawing ? <RefreshCw className="animate-spin" size={20} /> : <Play size={20} fill="currentColor" />}
              {isDrawing ? '抽取中...' : '開始抽籤'}
            </span>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">中獎紀錄 ({history.length})</h3>
          <button 
            onClick={reset}
            className="text-slate-400 hover:text-brand-primary transition-colors"
            title="清除紀錄"
          >
            <Trash2 size={16} />
          </button>
        </div>
        <div className="bg-white border border-surface-border rounded-2xl overflow-hidden shadow-sm h-[400px] overflow-y-auto">
          {history.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-300 text-xs uppercase tracking-widest italic">
              尚無紀錄
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {history.map((name, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={`${name}-${i}`} 
                  className="p-4 flex items-center justify-between group hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-slate-300">#{history.length - i}</span>
                    <span className="font-semibold text-brand-secondary">{name}</span>
                  </div>
                  <CheckCircle2 size={14} className="text-slate-200 group-hover:text-brand-accent transition-colors" />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Grouping = ({ names }: { names: string[] }) => {
  const [groupSize, setGroupSize] = useState(3);
  const [groups, setGroups] = useState<string[][]>([]);

  const generateGroups = () => {
    if (names.length === 0) return;
    
    const shuffled = [...names].sort(() => Math.random() - 0.5);
    const result: string[][] = [];
    
    for (let i = 0; i < shuffled.length; i += groupSize) {
      result.push(shuffled.slice(i, i + groupSize));
    }
    
    setGroups(result);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end gap-6 bg-slate-50 p-6 rounded-3xl border border-surface-border">
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">每組人數</label>
          <div className="flex items-center gap-3">
            <input 
              type="number" 
              min="1" 
              max={names.length}
              value={groupSize}
              onChange={(e) => setGroupSize(parseInt(e.target.value) || 1)}
              className="w-20 px-4 py-2 bg-white border border-surface-border rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none font-mono font-bold"
            />
            <span className="text-sm font-medium text-slate-500">人 / 組</span>
          </div>
        </div>
        <button
          onClick={generateGroups}
          disabled={names.length === 0}
          className="px-8 py-2.5 bg-brand-secondary text-white rounded-xl font-bold uppercase tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-brand-secondary/10"
        >
          立即分組
        </button>
        <div className="ml-auto text-right">
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">預計組數</div>
          <div className="text-xl font-black text-brand-secondary">{Math.ceil(names.length / groupSize)} 組</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {groups.map((group, idx) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            key={idx}
            className="bg-white border border-surface-border rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 group-hover:text-brand-primary transition-colors">Group {idx + 1}</span>
              <Users size={14} className="text-slate-200 group-hover:text-brand-primary transition-colors" />
            </div>
            <div className="space-y-2">
              {group.map((name, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-brand-primary transition-colors" />
                  <span className="font-medium text-slate-700">{name}</span>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
        {groups.length === 0 && (
          <div className="col-span-full py-24 flex flex-col items-center justify-center text-slate-300 gap-4">
            <LayoutGrid size={48} strokeWidth={1} />
            <p className="text-sm font-medium uppercase tracking-widest italic">設定人數並點擊開始分組</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default function App() {
  const [names, setNames] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'draw' | 'group'>('draw');

  return (
    <div className="min-h-screen bg-surface-bg text-brand-secondary font-sans selection:bg-brand-primary selection:text-white">
      {/* Header */}
      <header className="border-b border-surface-border bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-secondary rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-secondary/20">
              <Settings size={20} />
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-brand-secondary">DESIGNER TOOLS</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Draw & Group Utility</p>
            </div>
          </div>
          
          <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl">
            <button
              onClick={() => setActiveTab('draw')}
              className={cn(
                "px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
                activeTab === 'draw' ? "bg-white text-brand-primary shadow-sm" : "text-slate-500 hover:text-brand-secondary"
              )}
            >
              獎品抽籤
            </button>
            <button
              onClick={() => setActiveTab('group')}
              className={cn(
                "px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
                activeTab === 'group' ? "bg-white text-brand-primary shadow-sm" : "text-slate-500 hover:text-brand-secondary"
              )}
            >
              自動分組
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
          {/* Sidebar / Input */}
          <aside className="xl:col-span-4 space-y-8">
            <div className="bg-white border border-surface-border rounded-3xl p-8 shadow-sm">
              <NameInput onNamesUpdate={setNames} />
              <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">當前名單人數</div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-brand-secondary">{names.length}</span>
                  <span className="text-xs font-medium text-slate-400 uppercase">人</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-brand-secondary to-slate-800 rounded-3xl p-8 text-white space-y-4 shadow-xl shadow-brand-secondary/10">
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] opacity-50">使用提示</h4>
              <ul className="space-y-3">
                {[
                  '支援 CSV 檔案匯入',
                  '名單每行一個姓名',
                  '抽籤可設定是否重複',
                  '分組結果即時視覺化'
                ].map((tip, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm font-medium">
                    <div className="w-1 h-1 rounded-full bg-brand-primary" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Content Area */}
          <section className="xl:col-span-8">
            <div className="mb-8">
              <h2 className="text-4xl font-extrabold tracking-tight text-brand-secondary mb-2">
                {activeTab === 'draw' ? 'Lucky Draw' : 'Auto Grouping'}
              </h2>
              <p className="text-slate-500 font-medium">
                {activeTab === 'draw' 
                  ? '專業的抽籤動畫，為您的活動增添儀式感。' 
                  : '快速、公平的隨機分組工具，支援自定義每組人數。'}
              </p>
            </div>

            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              {activeTab === 'draw' ? (
                <LuckyDraw names={names} />
              ) : (
                <Grouping names={names} />
              )}
            </motion.div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-surface-border py-12 mt-12 bg-white">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            © 2024 Designer Tools Utility. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-brand-primary transition-colors">Privacy</a>
            <a href="#" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-brand-primary transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
