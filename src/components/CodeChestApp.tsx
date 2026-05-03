"use client";

import { useState, useEffect, useRef } from 'react';
import { useUserStore } from '@/store/useUserStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, History, LayoutDashboard, Terminal, ExternalLink } from 'lucide-react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';

const QUEST_DB: Record<string, string[]> = {
  'Python': ["Write a list comprehension to filter even numbers", "Create a simple generator function", "Use a lambda function to sort a list of dicts", "Write a decorator that logs execution time"],
  'JavaScript': ["Implement a basic Promise wrapper", "Write a pure function to deep clone an object", "Use Array.reduce to group an array by a property", "Implement debounce for a search input"],
  'Git': ["Create a new branch and switch to it in one command", "Perform an interactive rebase to squash 2 commits", "Stash changes, pull, and pop stash", "Write a meaningful commit message following conventional commits"],
  'DSA': ["Implement Binary Search recursively", "Reverse a linked list", "Write a function to detect a cycle in a graph", "Implement a basic stack using arrays"]
};

const SHOP_ITEMS = [
  { icon: '🧑‍💻', price: 0, label: 'Default' },
  { icon: '🥷', price: 50, label: 'Ninja' },
  { icon: '🧙‍♂️', price: 100, label: 'Wizard' },
  { icon: '🤖', price: 200, label: 'Bot' },
  { icon: '👑', price: 500, label: 'Golden' }
];

const SKILLS = [
  { name: 'Python', icon: '🐍' },
  { name: 'JavaScript', icon: '⚡' },
  { name: 'Git', icon: '🌿' },
  { name: 'DSA', icon: '🧩' },
];

export default function CodeChestApp() {
  const store = useUserStore();
  const [mounted, setMounted] = useState(false);
  const [activeScreen, setActiveScreen] = useState<'home' | 'quest' | 'chest' | 'shop' | 'archive'>('home');
  const [activeSkill, setActiveSkill] = useState<string | null>(null);
  const [submissionContent, setSubmissionContent] = useState('');
  const [showReward, setShowReward] = useState(false);
  const [rewardContent, setRewardContent] = useState<{ xp: number, coins: number, rare?: string } | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    setMounted(true);
    store.checkStreak();
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = 'en-US';
      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript.toLowerCase();
        if (text.includes('complete') || text.includes('done')) {
          handleCompleteQuest();
        }
      };
      recognitionRef.current = recognition;
    }
  }, []);

  if (!mounted) return null;

  const level = Math.floor(store.totalXP / 500) + 1;
  const currentXP = store.totalXP % 500;
  const xpPercent = (currentXP / 500) * 100;

  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const hasCompletedToday = (skill: string) => {
    const today = getTodayStr();
    return store.todayCompletedSkills[today]?.includes(skill) || false;
  };

  const getQuestForToday = (skill: string) => {
    const today = getTodayStr();
    let seed = 0;
    for(let i=0; i<today.length; i++) seed += today.charCodeAt(i);
    for(let i=0; i<skill.length; i++) seed += skill.charCodeAt(i);
    const quests = QUEST_DB[skill];
    return quests[seed % quests.length];
  };

  const getLanguageExtension = (skill: string) => {
    if (skill === 'Python') return [python()];
    if (skill === 'JavaScript' || skill === 'DSA') return [javascript({ jsx: true })];
    return [];
  };

  const handleCompleteQuest = () => {
    if (!activeSkill || hasCompletedToday(activeSkill)) return;
    setActiveScreen('chest');
  };

  const openChest = () => {
    const xpAmount = Math.floor(Math.random() * 41) + 10;
    const coinsAmount = Math.floor(Math.random() * 26) + 5;
    const isUltraRare = Math.random() < 0.01;
    let rareItem;
    if (isUltraRare && !store.inventory.includes('👑')) {
      rareItem = '👑';
    }

    store.completeQuest(activeSkill!, submissionContent, xpAmount, coinsAmount, rareItem);
    setRewardContent({ xp: xpAmount, coins: coinsAmount, rare: rareItem });
    setShowReward(true);
    setSubmissionContent('');
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-[600px] mx-auto p-5 w-full flex flex-col flex-1 relative min-h-screen text-white">
      <header className="flex justify-between items-center py-4 mb-6">
        <div className="cursor-pointer group" onClick={() => setActiveScreen('home')}>
          <h1 className="text-[26px] font-black tracking-[-1.5px] uppercase">
            Code<span className="text-primary">Chest</span>
          </h1>
        </div>
        <div className="flex gap-4 items-center">
          <button 
            onClick={() => setActiveScreen('archive')}
            className={`p-2 rounded-full transition-colors ${activeScreen === 'archive' ? 'text-primary bg-primary/10' : 'text-text-muted hover:text-white'}`}
          >
            <History size={24} />
          </button>
          <div 
            className="text-gold font-bold flex items-center gap-2 cursor-pointer bg-gold/10 px-3 py-1 rounded-full border border-gold/20"
            onClick={() => setActiveScreen('shop')}
          >
            <span>{store.coins}</span> 🪙
          </div>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {activeScreen === 'home' && (
          <motion.div 
            key="home"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex-1 flex flex-col"
          >
            <div className="flex gap-5 items-center mb-8">
              <motion.div 
                whileTap={{ scale: 0.9 }}
                className="w-[90px] h-[90px] rounded-[24px] flex justify-center items-center text-[45px] bg-surface border-2 border-[#333] cursor-pointer hover:border-primary transition-colors"
                onClick={() => setActiveScreen('shop')}
              >
                {store.avatar}
              </motion.div>
              <div className="flex-1">
                <div className="flex justify-between mb-2 text-[14px] font-semibold text-text-muted uppercase tracking-[0.5px]">
                  <span>Level <span className="text-white font-extrabold">{level}</span></span>
                  <span><span className="text-white font-extrabold">{currentXP}</span> / 500 XP</span>
                </div>
                <div className="h-3 bg-[#222] rounded-full overflow-hidden mt-1">
                  <motion.div 
                    className="h-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${xpPercent}%` }}
                    transition={{ type: 'spring', bounce: 0 }}
                  />
                </div>
                <div className="flex justify-between mt-3 text-[14px] font-semibold text-text-muted uppercase tracking-[0.5px]">
                  <span>Total Quests</span>
                  <span className="text-white font-extrabold">{store.questsCompleted}</span>
                </div>
              </div>
            </div>

            <motion.div 
              className="p-[30px] text-center mb-[30px] bg-primary text-black rounded-[24px] shadow-[0_10px_30px_rgba(204,255,0,0.2)]"
            >
              <div className="text-[14px] font-extrabold uppercase tracking-[1px] text-black/60">Current Streak</div>
              <div className="text-[72px] font-black m-0 tracking-[-4px] leading-[1.1]">{store.streak} <span className="text-[50px] align-bottom">🔥</span></div>
              <div className="text-[14px] font-extrabold mt-1 uppercase">Don't break the chain</div>
            </motion.div>

            <div className="flex justify-between items-center mb-5">
              <div className="text-[20px] font-extrabold tracking-[-0.5px] uppercase text-[#888]">Daily Quests</div>
            </div>
            
            <div className="grid grid-cols-2 gap-[15px]">
              {SKILLS.map(skill => (
                <motion.button
                  key={skill.name}
                  whileHover={{ y: -3, backgroundColor: '#1a1a1a', borderColor: '#444' }}
                  whileTap={{ scale: 0.95 }}
                  className={`p-[25px_20px] rounded-[20px] border-2 bg-surface text-white text-[16px] font-bold cursor-pointer flex flex-col items-center gap-3 transition-colors ${hasCompletedToday(skill.name) ? 'border-primary/50 opacity-60' : 'border-[#222]'}`}
                  onClick={() => {
                    setActiveSkill(skill.name);
                    setActiveScreen('quest');
                  }}
                >
                  <span className="text-[36px]">{skill.icon}</span>
                  <span>{skill.name}</span>
                  {hasCompletedToday(skill.name) && <span className="text-[10px] bg-primary text-black px-2 py-0.5 rounded-full uppercase font-black">Done</span>}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {activeScreen === 'quest' && activeSkill && (
          <motion.div 
            key="quest"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex-1 flex flex-col"
          >
            <div className="p-8 text-center glass-card mb-6">
              <div className="text-primary font-bold mb-3 uppercase tracking-wider">{activeSkill}</div>
              <div className="text-[24px] leading-[1.3] font-extrabold tracking-[-1px]">
                {hasCompletedToday(activeSkill) 
                  ? "Mastered for today!" 
                  : getQuestForToday(activeSkill)}
              </div>
            </div>

            {!hasCompletedToday(activeSkill) ? (
              <div className="flex-1 flex flex-col gap-4">
                <div 
                  className="relative flex-1 min-h-[300px] bg-[#111] border-2 border-[#222] rounded-[20px] overflow-hidden focus-within:border-primary transition-colors text-left"
                  onPasteCapture={(e) => { e.preventDefault(); e.stopPropagation(); alert("Pasting is disabled! You must type the code yourself."); }}
                  onCopyCapture={(e) => { e.preventDefault(); e.stopPropagation(); alert("Copying is disabled!"); }}
                  onCutCapture={(e) => { e.preventDefault(); e.stopPropagation(); alert("Cutting is disabled!"); }}
                >
                  <CodeMirror
                    value={submissionContent}
                    height="100%"
                    theme="dark"
                    extensions={getLanguageExtension(activeSkill)}
                    onChange={(value) => setSubmissionContent(value)}
                    placeholder="// Type your code here...&#10;// (Copy/Paste disabled)"
                    className="h-full w-full text-[14px] absolute inset-0 [&>.cm-editor]:h-full [&>.cm-editor]:bg-transparent"
                    basicSetup={{
                      lineNumbers: true,
                      highlightActiveLineGutter: true,
                      foldGutter: true,
                      dropCursor: false,
                      allowMultipleSelections: false,
                      indentOnInput: true,
                    }}
                  />
                  <div className="absolute top-4 right-4 text-[#444] pointer-events-none z-10">
                    <Terminal size={20} />
                  </div>
                </div>

                <div className="flex flex-col gap-3 mt-4">
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    className="bg-primary text-black border-none p-5 rounded-[16px] text-[16px] font-extrabold uppercase tracking-[1px] disabled:opacity-30"
                    disabled={!submissionContent.trim()}
                    onClick={handleCompleteQuest}
                  >
                    Complete & Open Chest
                  </motion.button>
                  
                  <button 
                    className="bg-transparent border-none text-text-muted text-[14px] font-bold uppercase tracking-[1px] p-3 hover:text-white"
                    onClick={() => setActiveScreen('home')}
                  >
                    Maybe later
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
                <div className="text-primary mb-4"><Check size={64} /></div>
                <h3 className="text-2xl font-black uppercase mb-2">Great work!</h3>
                <p className="text-text-muted mb-8">You've already submitted your solution for today.</p>
                <button 
                  className="bg-surface border-2 border-[#222] p-4 rounded-[16px] text-[14px] font-black uppercase tracking-widest px-10"
                  onClick={() => setActiveScreen('home')}
                >
                  Back to dashboard
                </button>
              </div>
            )}
          </motion.div>
        )}

        {activeScreen === 'chest' && (
          <motion.div 
            key="chest"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center"
          >
            <motion.div 
              className="text-[140px] cursor-pointer drop-shadow-[0_20px_40px_rgba(204,255,0,0.3)] select-none"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.9 }}
              onClick={openChest}
              animate={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 0.4, ease: "easeInOut", repeatDelay: 1 }}
            >
              🎁
            </motion.div>
            <motion.div 
              className="mt-10 text-[18px] font-black text-primary uppercase tracking-[2px]"
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            >
              TAP TO CLAIM REWARD
            </motion.div>
          </motion.div>
        )}

        {activeScreen === 'archive' && (
          <motion.div 
            key="archive"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex-1 flex flex-col"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black uppercase tracking-tight">Your Journey</h2>
              <button onClick={() => setActiveScreen('home')} className="text-text-muted hover:text-white transition-colors">
                <LayoutDashboard size={24} />
              </button>
            </div>

            {Object.keys(store.questSubmissions).length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-10 opacity-40">
                <History size={64} className="mb-4" />
                <p className="font-bold uppercase tracking-widest">No submissions yet.</p>
                <p className="text-xs mt-2">Complete a quest to start your archive.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4 pb-10">
                {Object.entries(store.questSubmissions).sort().reverse().map(([key, content]) => {
                  const [date, skill] = key.split(/-(?=[^-]+$)/); // handles cases where skill might have hyphen
                  return (
                    <div key={key} className="glass-card overflow-hidden">
                      <div className="p-4 bg-[#1a1a1a] flex justify-between items-center border-b border-[#222]">
                        <div className="flex items-center gap-3">
                          <span className="text-primary font-black uppercase text-xs tracking-tighter bg-primary/10 px-2 py-1 rounded">{skill}</span>
                          <span className="text-[10px] font-bold text-text-muted uppercase">{date}</span>
                        </div>
                        <button 
                          onClick={() => handleCopy(key, content)}
                          className="p-2 hover:bg-white/5 rounded-lg transition-colors text-text-muted hover:text-white"
                        >
                          {copiedId === key ? <Check size={16} className="text-primary" /> : <Copy size={16} />}
                        </button>
                      </div>
                      <div className="p-5 font-mono text-xs whitespace-pre-wrap overflow-x-auto max-h-[200px] scrollbar-hide text-[#ccc]">
                        {content}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {activeScreen === 'shop' && (
          <motion.div 
            key="shop"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex-1 flex flex-col"
          >
            <h2 className="mb-5 text-2xl font-black uppercase tracking-tight">Customization</h2>
            <div className="glass-card p-6 flex flex-col items-center mb-8 border-primary/20 bg-primary/[0.02]">
              <div className="w-[100px] h-[100px] rounded-[28px] flex justify-center items-center text-[50px] bg-surface border-2 border-primary mb-4 shadow-[0_0_30px_rgba(204,255,0,0.15)]">
                {store.avatar}
              </div>
              <div className="font-black text-primary uppercase text-xs tracking-[2px]">Currently Equipped</div>
            </div>
            
            <h3 className="text-lg font-black mb-4 uppercase tracking-tight text-text-muted">Available Styles</h3>
            <div className="grid grid-cols-3 gap-4">
              {SHOP_ITEMS.map((item) => {
                const isOwned = store.inventory.includes(item.icon);
                const isActive = store.avatar === item.icon;
                
                return (
                  <motion.div
                    key={item.icon}
                    whileTap={{ scale: 0.95 }}
                    className={`p-5 text-center rounded-[20px] bg-surface border-2 cursor-pointer transition-all ${isActive ? 'border-primary bg-primary/5' : isOwned ? 'border-[#444]' : 'border-[#222] hover:border-[#333]'}`}
                    onClick={() => {
                      if (isOwned) {
                        store.equipAvatar(item.icon);
                      } else {
                        if(!store.buyAvatar(item.icon, item.price)) {
                          alert("Not enough coins!");
                        }
                      }
                    }}
                  >
                    <div className="text-[36px] mb-3">{item.icon}</div>
                    <div className={`text-[12px] font-black tracking-tighter ${isActive ? 'text-primary' : isOwned ? 'text-white' : 'text-gold'}`}>
                      {isOwned ? (isActive ? 'ACTIVE' : 'SELECT') : `${item.price} 🪙`}
                    </div>
                  </motion.div>
                );
              })}
            </div>
            
            <button 
              className="mt-10 text-text-muted font-black uppercase tracking-[2px] text-xs hover:text-white transition-colors"
              onClick={() => setActiveScreen('home')}
            >
              Return to Dashboard
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showReward && rewardContent && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-5"
          >
            <motion.div 
              initial={{ scale: 0.8, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 30 }}
              className="bg-[#050505] p-10 rounded-[32px] border-2 border-[#222] text-center shadow-[0_30px_60px_rgba(0,0,0,1)] w-full max-w-[400px] relative overflow-hidden"
            >
              <h2 className={`text-3xl font-black uppercase tracking-tight mb-8 ${rewardContent.rare ? 'text-gold' : 'text-primary'}`}>
                {rewardContent.rare ? 'LEGENDARY PULL!' : 'QUEST COMPLETE'}
              </h2>
              
              <div className="flex gap-4 justify-center my-10">
                <div className="bg-surface border border-[#222] p-5 rounded-[20px] min-w-[100px] font-black text-xl">
                  <div className="text-4xl mb-2">⭐</div>
                  <div className="text-primary">+{rewardContent.xp}</div>
                  <div className="text-[10px] text-text-muted mt-1 uppercase">XP</div>
                </div>
                <div className="bg-surface border border-[#222] p-5 rounded-[20px] min-w-[100px] font-black text-xl">
                  <div className="text-4xl mb-2">🪙</div>
                  <div className="text-gold">+{rewardContent.coins}</div>
                  <div className="text-[10px] text-text-muted mt-1 uppercase">COINS</div>
                </div>
              </div>
              
              <motion.button 
                whileTap={{ scale: 0.95 }}
                className="w-full bg-primary text-black font-black py-5 rounded-[20px] uppercase tracking-[3px] text-sm"
                onClick={() => {
                  setShowReward(false);
                  setActiveScreen('home');
                }}
              >
                LETS GO
              </motion.button>
            </motion.div>
            
            {rewardContent.rare && (
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                {[...Array(50)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-3 h-3 rounded-sm"
                    style={{
                      left: `${Math.random() * 100}%`,
                      backgroundColor: ['#ccff00', '#ffbb00', '#ff0055', '#fff'][Math.floor(Math.random() * 4)],
                      top: '-5%'
                    }}
                    animate={{
                      y: ['0vh', '110vh'],
                      rotate: [0, 720 * (Math.random() > 0.5 ? 1 : -1)]
                    }}
                    transition={{
                      duration: 2 + Math.random() * 2,
                      ease: "linear",
                      repeat: Infinity
                    }}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
