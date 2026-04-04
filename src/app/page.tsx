"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import Papa from "papaparse";
import * as LZString from "lz-string";
import ReactMarkdown from "react-markdown";
import { Search, Building2, ExternalLink, Check, Square, CheckSquare, X, List, Hash, HelpCircle, Layers, Info, ChevronLeft, ChevronRight, Tags, ArrowRight, ArrowLeft, Settings, Sparkles, Loader2 } from "lucide-react";

export type Question = {
  Title: string;
  Difficulty: string;
  Frequency: string;
  AcceptanceRate: string;
  Topics: string;
  CompanyCount: string;
  Companies: string;
  Link: string;
};

export default function Home() {
  const [data, setData] = useState<Question[]>([]);
  const [search, setSearch] = useState("");
  const [companySearch, setCompanySearch] = useState("");
  const [doneList, setDoneList] = useState<Record<string, boolean>>({});
  
  // NEW STATES
  const [customLists, setCustomLists] = useState<Record<string, string[]>>({});
  const [difficultyOverrides, setDifficultyOverrides] = useState<Record<string, string>>({});
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());
  
  const [filterDifficulty, setFilterDifficulty] = useState("ALL");
  const [filterDone, setFilterDone] = useState<"ALL" | "DONE" | "TODO">("ALL");
  const [filterList, setFilterList] = useState<string>("ALL");

  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  // Custom dropdown state
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const companyDropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Bulk Action Dropdowns
  const [showListDropdown, setShowListDropdown] = useState(false);
  const [showDiffDropdown, setShowDiffDropdown] = useState(false);
  const [newListName, setNewListName] = useState("");

  const listDropdownRef = useRef<HTMLDivElement>(null);
  const diffDropdownRef = useRef<HTMLDivElement>(null);

  // Modal state
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);

  // AI state
  const [openRouterKey, setOpenRouterKey] = useState("");
  const [openRouterModel, setOpenRouterModel] = useState("google/gemini-2.5-flash");
  const [showSettings, setShowSettings] = useState(false);
  const [aiResponse, setAiResponse] = useState("");
  const [aiHintsCache, setAiHintsCache] = useState<Record<string, string>>({});
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (companyDropdownRef.current && !companyDropdownRef.current.contains(event.target as Node)) {
        setShowCompanyDropdown(false);
      }
      if (listDropdownRef.current && !listDropdownRef.current.contains(event.target as Node)) {
        setShowListDropdown(false);
      }
      if (diffDropdownRef.current && !diffDropdownRef.current.contains(event.target as Node)) {
        setShowDiffDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    fetch("/leetcode_master.csv")
      .then((res) => res.text())
      .then((csvText) => {
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const parsedData = results.data as Record<string, string>[];
            const questions: Question[] = parsedData.map(row => ({
              Title: row["Title"] || "",
              Difficulty: row["Difficulty"] || "",
              Frequency: row["Frequency"] || "",
              AcceptanceRate: row["Acceptance Rate"] || "",
              Topics: row["Topics"] || "",
              CompanyCount: row["Company Count"] || "",
              Companies: row["Companies"] || "",
              Link: row["Link"] || "",
            }));
            setData(questions);
            setLoading(false);
          },
          error: (error: Error) => {
            console.error("Error parsing CSV: ", error);
            setLoading(false);
          }
        });
      })
      .catch((err) => {
        console.error("Failed to fetch CSV: ", err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    try {
      const savedDone = localStorage.getItem("dsa_done_qs");
      if (savedDone) setDoneList(JSON.parse(savedDone));

      const savedLists = localStorage.getItem("dsa_custom_lists");
      if (savedLists) setCustomLists(JSON.parse(savedLists));

      const savedOverrides = localStorage.getItem("dsa_diff_overrides");
      if (savedOverrides) setDifficultyOverrides(JSON.parse(savedOverrides));

      const savedKey = localStorage.getItem("dsa_or_key");
      if (savedKey) setOpenRouterKey(savedKey);

      const savedModel = localStorage.getItem("dsa_or_model");
      if (savedModel) setOpenRouterModel(savedModel);

      const savedHintsRaw = localStorage.getItem("dsa_ai_hints");
      if (savedHintsRaw) {
        const decompressed = LZString.decompressFromUTF16(savedHintsRaw);
        if (decompressed) {
          setAiHintsCache(JSON.parse(decompressed));
        }
      }
    } catch (e) {
      console.error("Error loading from localStorage", e);
    }
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (selectedQuestion) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; }
  }, [selectedQuestion]);

  const allCompanies = useMemo(() => {
    const companiesSet = new Set<string>();
    data.forEach(q => {
      if (q.Companies) {
        q.Companies.split('|').forEach(c => {
          const trimmed = c.trim();
          if (trimmed) companiesSet.add(trimmed);
        });
      }
    });
    return Array.from(companiesSet).sort();
  }, [data]);

  const toggleDone = (title: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDoneList((prev) => {
      const next = { ...prev, [title]: !prev[title] };
      localStorage.setItem("dsa_done_qs", JSON.stringify(next));
      return next;
    });
  };

  const updateCustomLists = (newLists: Record<string, string[]>) => {
    setCustomLists(newLists);
    localStorage.setItem("dsa_custom_lists", JSON.stringify(newLists));
  };

  const updateDifficultyOverrides = (newOverrides: Record<string, string>) => {
    setDifficultyOverrides(newOverrides);
    localStorage.setItem("dsa_diff_overrides", JSON.stringify(newOverrides));
  };

  const createList = (name: string) => {
    if (!name.trim() || customLists[name.trim()]) return;
    const updated = Array.from(selectedQuestions);
    updateCustomLists({ ...customLists, [name.trim()]: updated });
    setNewListName("");
    setShowListDropdown(false);
  };

  const addSelectedToList = (listName: string) => {
    const list = customLists[listName] || [];
    const updated = Array.from(new Set([...list, ...Array.from(selectedQuestions)]));
    updateCustomLists({ ...customLists, [listName]: updated });
    setShowListDropdown(false);
  };
  
  const toggleQuestionInList = (listName: string, title: string) => {
    const list = customLists[listName] || [];
    const isActive = list.includes(title);
    const updated = isActive ? list.filter(t => t !== title) : [...list, title];
    updateCustomLists({ ...customLists, [listName]: updated });
  };

  const setDifficultyForSelected = (diff: string) => {
    const overrides = { ...difficultyOverrides };
    Array.from(selectedQuestions).forEach(title => {
      if (diff === "DEFAULT") {
        delete overrides[title];
      } else {
        overrides[title] = diff;
      }
    });
    updateDifficultyOverrides(overrides);
    setShowDiffDropdown(false);
  };

  const markSelectedDone = (state: boolean) => {
    const prev = { ...doneList };
    Array.from(selectedQuestions).forEach(title => {
      prev[title] = state;
    });
    setDoneList(prev);
    localStorage.setItem("dsa_done_qs", JSON.stringify(prev));
  };

  const openQuestionModal = (q: Question) => {
    setSelectedQuestion(q);
    setAiResponse("");
    setAiError("");
    setAiLoading(false);
  };

  const fetchAiHint = async () => {
    if (!openRouterKey || !selectedQuestion) return;

    if (aiHintsCache[selectedQuestion.Title]) {
      setAiResponse(aiHintsCache[selectedQuestion.Title]);
      return;
    }

    setAiLoading(true);
    setAiResponse("");
    setAiError("");
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openRouterKey}`,
          "HTTP-Referer": window.location.origin,
          "X-Title": "DSA Tracker Canvas",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: openRouterModel || "google/gemini-2.5-flash",
          messages: [{
            role: "system",
            content: "You are an expert algorithms tutor. The user is solving a LeetCode problem. Do NOT write the actual code solution. Provide a high-level conceptual hint, identify the necessary data structures/patterns, and explain the general algorithm approach in simple terms. Keep it short, actionable, and formatted cleanly."
          }, {
            role: "user",
            content: `Title: ${selectedQuestion.Title}\nDifficulty: ${selectedQuestion.Difficulty}\nTopics: ${selectedQuestion.Topics}\n\nPlease give me a conceptual hint and the algorithm approach.`
          }]
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message || "Failed to fetch response");
      if (data.choices && data.choices.length > 0) {
        const hint = data.choices[0].message.content;
        setAiResponse(hint);

        const newCache = { ...aiHintsCache, [selectedQuestion.Title]: hint };
        setAiHintsCache(newCache);

        try {
          const compressed = LZString.compressToUTF16(JSON.stringify(newCache));
          localStorage.setItem('dsa_ai_hints', compressed);
        } catch (e) {
          console.warn('localStorage error', e);
        }
      } else {
        throw new Error("No response from AI");
      }
    } catch (e: any) {
      setAiError(e.message || "An error occurred");
    } finally {
      setAiLoading(false);
    }
  };

  const filteredCompanySuggestions = useMemo(() => {
    if (!companySearch) return allCompanies;
    return allCompanies.filter(c => c.toLowerCase().includes(companySearch.toLowerCase()));
  }, [allCompanies, companySearch]);

  const filteredData = useMemo(() => {
    return data.filter((q) => {
      const textMatch = q.Title.toLowerCase().includes(search.toLowerCase()) || 
                        q.Topics.toLowerCase().includes(search.toLowerCase());
      
      const companyMatch = q.Companies.toLowerCase().includes(companySearch.toLowerCase());

      const activeDiff = difficultyOverrides[q.Title] || q.Difficulty;
      const diffMatch = filterDifficulty === "ALL" || activeDiff === filterDifficulty;

      let doneMatch = true;
      if (filterDone === "DONE") doneMatch = !!doneList[q.Title];
      if (filterDone === "TODO") doneMatch = !doneList[q.Title];

      let listMatch = true;
      if (filterList !== "ALL") {
        const listItems = customLists[filterList] || [];
        listMatch = listItems.includes(q.Title);
      }

      return textMatch && companyMatch && diffMatch && doneMatch && listMatch && q.Title !== "";
    });
  }, [data, search, companySearch, filterDifficulty, filterDone, doneList, filterList, customLists, difficultyOverrides]);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedQuestions(new Set());
  }, [search, companySearch, filterDifficulty, filterDone, filterList]);

  const totalPages = Math.ceil(filteredData.length / pageSize);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'ArrowRight') {
        setCurrentPage(p => Math.min(totalPages, p + 1));
      } else if (e.key === 'ArrowLeft') {
        setCurrentPage(p => Math.max(1, p - 1));
      } else if (e.key === 'Escape') {
        if (selectedQuestion) setSelectedQuestion(null);
        else if (selectedQuestions.size > 0) setSelectedQuestions(new Set());
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [totalPages, selectedQuestion, selectedQuestions.size]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage]);

  const topCompanyTopics = useMemo(() => {
    if (!companySearch || filteredData.length === 0) return [];
    
    const topicCounts: Record<string, number> = {};
    filteredData.forEach(q => {
      if (!q.Topics) return;
      const topics = q.Topics.split(',');
      topics.forEach(t => {
        const trimmed = t.trim();
        if (trimmed) {
          topicCounts[trimmed] = (topicCounts[trimmed] || 0) + 1;
        }
      });
    });

    return Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0]);
  }, [filteredData, companySearch]);

  const progressData = useMemo(() => filterList !== "ALL" ? filteredData : data, [filterList, filteredData, data]);
  
  const totalCompleted = useMemo(() => progressData.filter(q => doneList[q.Title]).length, [progressData, doneList]);
  const progressPercentage = progressData.length > 0 ? Math.round((totalCompleted / progressData.length) * 100) : 0;

  const easyCount = progressData.filter(q => (difficultyOverrides[q.Title] || q.Difficulty) === "EASY").length;
  const mediumCount = progressData.filter(q => (difficultyOverrides[q.Title] || q.Difficulty) === "MEDIUM").length;
  const hardCount = progressData.filter(q => (difficultyOverrides[q.Title] || q.Difficulty) === "HARD").length;

  const easyCompleted = progressData.filter(q => (difficultyOverrides[q.Title] || q.Difficulty) === "EASY" && doneList[q.Title]).length;
  const mediumCompleted = progressData.filter(q => (difficultyOverrides[q.Title] || q.Difficulty) === "MEDIUM" && doneList[q.Title]).length;
  const hardCompleted = progressData.filter(q => (difficultyOverrides[q.Title] || q.Difficulty) === "HARD" && doneList[q.Title]).length;

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'EASY': return 'bg-[#1e3a29] text-[#71ebd2]';
      case 'MEDIUM': return 'bg-[#3b2e14] text-[#ffd966]';
      case 'HARD': return 'bg-[#3f1c19] text-[#ff7369]';
      default: return 'bg-[#2f2f2f] text-[#d4d4d4]';
    }
  };

  return (
    <main className="min-h-screen bg-[#191919] text-[#D4D4D4] font-sans selection:bg-[#2f2f2f] relative pb-32">
      {/* Top Navigation */}
      <nav className="h-12 w-full border-b border-[#2f2f2f] flex items-center justify-between px-4 md:px-6 sticky top-0 bg-[#191919]/90 backdrop-blur-sm z-30">
        <div className="flex items-center text-sm font-medium text-[#9B9A97] cursor-default">
          <span className="mr-2">📚</span>
          workspace / DSA Canvas
        </div>
        <div className="hidden sm:flex items-center text-xs text-[#9B9A97] gap-3">
          <span className="flex items-center gap-1"><kbd className="bg-[#2f2f2f] border border-[#404040] rounded px-1.5 py-0.5">/</kbd> Search</span>
          <span className="flex items-center gap-1"><kbd className="bg-[#2f2f2f] border border-[#404040] rounded px-1.5 py-0.5">Esc</kbd> Clear</span>
          <span className="flex items-center gap-1"><kbd className="bg-[#2f2f2f] border border-[#404040] rounded px-1.5 py-0.5">←→</kbd> Page</span>
          <button onClick={() => setShowSettings(true)} className="ml-2 flex items-center justify-center text-[#9B9A97] hover:text-[#D4D4D4] transition-colors p-1.5 hover:bg-[#2f2f2f] rounded focus:outline-none" title="Settings">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </nav>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-12 space-y-8">
        
        {/* Header Section */}
        <header className="space-y-4">
          <div className="text-5xl sm:text-6xl mb-4 sm:mb-6">💻</div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[#EBEBEB]">
            DSA Database
          </h1>
          <div className="space-y-3 max-w-3xl">
            <p className="text-[#9B9A97] text-[14px] sm:text-[15px] leading-relaxed">
              A comprehensive tracker for your algorithmic journey. Filter by difficulty, company, or topic to focus your practice.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 pb-2 w-full max-w-3xl">
            <div className="flex flex-col p-3 rounded-[4px] border border-[#2f2f2f] bg-[#202020]">
              <span className="text-xs text-[#9B9A97] uppercase tracking-wider mb-1">Total</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-semibold text-[#EBEBEB]">{totalCompleted}</span>
                <span className="text-xs text-[#9B9A97]">/ {progressData.length}</span>
              </div>
            </div>
            <div className="flex flex-col p-3 rounded-[4px] border border-[#1e3a29] bg-[#1e3a29]/10">
              <span className="text-xs text-[#71ebd2] uppercase tracking-wider mb-1">Easy</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-semibold text-[#EBEBEB]">{easyCompleted}</span>
                <span className="text-xs text-[#71ebd2]/70">/ {easyCount}</span>
              </div>
            </div>
            <div className="flex flex-col p-3 rounded-[4px] border border-[#3b2e14] bg-[#3b2e14]/10">
              <span className="text-xs text-[#ffd966] uppercase tracking-wider mb-1">Medium</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-semibold text-[#EBEBEB]">{mediumCompleted}</span>
                <span className="text-xs text-[#ffd966]/70">/ {mediumCount}</span>
              </div>
            </div>
            <div className="flex flex-col p-3 rounded-[4px] border border-[#3f1c19] bg-[#3f1c19]/10">
              <span className="text-xs text-[#ff7369] uppercase tracking-wider mb-1">Hard</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-semibold text-[#EBEBEB]">{hardCompleted}</span>
                <span className="text-xs text-[#ff7369]/70">/ {hardCount}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2 max-w-sm">
            <span className="text-sm font-medium text-[#9B9A97]">Progress Tracker</span>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-[#2f2f2f] h-2 rounded-sm overflow-hidden">
                <div 
                  className="bg-[#D4D4D4] h-full transition-all duration-500 ease-out" 
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <span className="text-xs text-[#9B9A97] w-8 text-right">{progressPercentage}%</span>
            </div>
          </div>
        </header>

        {/* Filters Section */}
        <section className="flex flex-wrap items-center gap-2 sm:gap-3 pt-4 border-t border-[#2f2f2f] select-none">
          <div className="flex w-full sm:w-auto items-center bg-transparent border border-[#2f2f2f] hover:bg-[#2f2f2f]/50 rounded-[4px] px-2.5 py-1.5 focus-within:border-[#454b4e] focus-within:bg-[#202020] transition-colors relative">
            <List className="w-4 h-4 text-[#9B9A97] mr-1.5 shrink-0" />
            <select 
              value={filterList} 
              onChange={e => setFilterList(e.target.value)}
              className="bg-transparent border-none outline-none text-[13px] text-[#EBEBEB] font-medium appearance-none cursor-pointer pr-2 w-full sm:w-[140px]"
            >
              <option value="ALL" className="bg-[#202020]">All Problems</option>
              {Object.keys(customLists).map(list => (
                <option key={list} value={list} className="bg-[#202020]">📋 {list}</option>
              ))}
            </select>
          </div>

          <div className="flex w-full sm:w-auto items-center bg-transparent border border-[#2f2f2f] hover:bg-[#2f2f2f]/50 rounded-[4px] px-2.5 py-1.5 focus-within:border-[#454b4e] focus-within:bg-[#202020] transition-colors">
            <Search className="w-4 h-4 text-[#9B9A97] mr-2 shrink-0" />
            <input 
              ref={searchInputRef}
              type="text" 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Search ( / )"
              className="bg-transparent border-none outline-none text-[13px] text-[#D4D4D4] placeholder-[#9B9A97] w-full sm:w-32 md:w-48"
            />
          </div>
          
          <div 
            ref={companyDropdownRef}
            className="flex flex-1 sm:flex-none w-1/2 sm:w-auto items-center bg-transparent border border-[#2f2f2f] hover:bg-[#2f2f2f]/50 rounded-[4px] px-2.5 py-1.5 focus-within:border-[#454b4e] focus-within:bg-[#202020] transition-colors relative"
          >
            <Building2 className="w-4 h-4 text-[#9B9A97] mr-2 shrink-0" />
            <input 
              type="text" 
              value={companySearch} 
              onChange={e => {
                setCompanySearch(e.target.value);
                setShowCompanyDropdown(true);
              }} 
              onFocus={() => setShowCompanyDropdown(true)}
              placeholder="Company..."
              className="bg-transparent border-none outline-none text-[13px] text-[#D4D4D4] placeholder-[#9B9A97] w-full sm:w-32 md:w-48"
            />
            {showCompanyDropdown && filteredCompanySuggestions.length > 0 && (
              <div className="absolute top-[calc(100%+4px)] left-0 w-full sm:w-[240px] max-h-[300px] overflow-y-auto bg-[#191919] border border-[#2f2f2f] rounded-[4px] shadow-2xl z-50 custom-scrollbar py-1">
                {filteredCompanySuggestions.map((c) => (
                  <div 
                    key={c} 
                    className="px-3 py-1.5 text-[13px] text-[#D4D4D4] hover:bg-[#2f2f2f] cursor-pointer transition-colors"
                    onClick={() => {
                      setCompanySearch(c);
                      setShowCompanyDropdown(false);
                    }}
                  >
                    {c}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-1 sm:flex-none items-center bg-transparent border border-[#2f2f2f] hover:bg-[#2f2f2f]/50 rounded-[4px] px-2 py-1.5 transition-colors">
            <select 
              value={filterDifficulty} 
              onChange={e => setFilterDifficulty(e.target.value)}
              className="bg-transparent border-none outline-none text-[13px] text-[#D4D4D4] appearance-none cursor-pointer pr-2 w-full sm:w-auto"
            >
              <option value="ALL" className="bg-[#202020]">Difficulty</option>
              <option value="EASY" className="bg-[#202020]">Easy</option>
              <option value="MEDIUM" className="bg-[#202020]">Medium</option>
              <option value="HARD" className="bg-[#202020]">Hard</option>
            </select>
          </div>

          <div className="flex flex-1 sm:flex-none items-center bg-transparent border border-[#2f2f2f] hover:bg-[#2f2f2f]/50 rounded-[4px] px-2 py-1.5 transition-colors">
            <select 
              value={filterDone} 
              onChange={e => setFilterDone(e.target.value as any)}
              className="bg-transparent border-none outline-none text-[13px] text-[#D4D4D4] appearance-none cursor-pointer pr-2 w-full sm:w-auto"
            >
              <option value="ALL" className="bg-[#202020]">Status</option>
              <option value="DONE" className="bg-[#202020]">Completed</option>
              <option value="TODO" className="bg-[#202020]">Pending</option>
            </select>
          </div>
        </section>

        {/* Top Topics Section */}
        {companySearch && topCompanyTopics.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-2 animate-in fade-in duration-300">
            <span className="text-[12px] text-[#9B9A97] flex items-center tracking-wide mr-1">
              <Layers className="w-3.5 h-3.5 mr-1.5" />
              ALL TOPICS IN {companySearch.toUpperCase()}:
            </span>
            {topCompanyTopics.map(topic => (
              <button 
                key={topic}
                onClick={() => setSearch(topic)}
                className="px-2 py-1 bg-[#202020] border border-[#2f2f2f] hover:bg-[#2f2f2f] rounded-[4px] text-[12px] text-[#D4D4D4] transition-colors focus:outline-none"
              >
                {topic}
              </button>
            ))}
          </div>
        )}

        {/* Data Table */}
        <section className="pb-12 text-[#D4D4D4]">
          {loading ? (
            <div className="flex flex-col justify-center items-center py-20 space-y-4">
              <div className="animate-pulse flex items-center justify-center p-3 bg-[#2f2f2f] rounded-full">
                 <List className="w-5 h-5 text-[#9B9A97]" />
              </div>
              <p className="text-[13px] text-[#9B9A97] tracking-wide uppercase">Processing Database...</p>
            </div>
          ) : (
            <div className="border border-[#2F2F2F] bg-[#191919] rounded-[4px] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-[#191919] text-[#9B9A97] border-b border-[#2F2F2F] select-none">
                    <tr>
                      <th className="font-normal py-2 px-3 w-8 text-center cursor-pointer hover:bg-[#2f2f2f]/30" 
                          onClick={() => {
                            if (paginatedData.length === 0) return;
                            const allSelected = paginatedData.every(q => selectedQuestions.has(q.Title));
                            const newSet = new Set(selectedQuestions);
                            if (allSelected) {
                              paginatedData.forEach(q => newSet.delete(q.Title));
                            } else {
                              paginatedData.forEach(q => newSet.add(q.Title));
                            }
                            setSelectedQuestions(newSet);
                          }}>
                        <input 
                          type="checkbox" 
                          className="accent-[#D4D4D4] bg-[#2f2f2f] border border-[#404040] rounded-sm focus:ring-0 pointer-events-none"
                          checked={paginatedData.length > 0 && paginatedData.every(q => selectedQuestions.has(q.Title))}
                          readOnly
                        />
                      </th>
                      <th className="font-normal py-2 px-2 w-10 text-center"><span className="text-xs tracking-widest uppercase">Done</span></th>
                      <th className="font-normal py-2 px-3"><span className="text-xs tracking-widest uppercase">Aa Name</span></th>
                      <th className="font-normal py-2 px-3 w-32"><span className="text-xs tracking-widest uppercase">◧ Difficulty</span></th>
                      <th className="font-normal py-2 px-3"><span className="text-xs tracking-widest uppercase"># Topics</span></th>
                      <th className="font-normal py-2 px-3"><span className="text-xs tracking-widest uppercase">🏢 Companies</span></th>
                      <th className="font-normal py-2 px-3 w-12"><span className="text-xs tracking-widest uppercase">↗</span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2F2F2F]">
                    {paginatedData.map((q, idx) => {
                      const isDone = !!doneList[q.Title];
                      const isSelected = selectedQuestions.has(q.Title);
                      const activeDiff = difficultyOverrides[q.Title] || q.Difficulty;
                      return (
                        <tr 
                          key={`${q.Title}-${idx}`} 
                          onClick={(e) => {
                            if (e.ctrlKey || e.metaKey || e.shiftKey) {
                              const newSet = new Set(selectedQuestions);
                              if (newSet.has(q.Title)) newSet.delete(q.Title);
                              else newSet.add(q.Title);
                              setSelectedQuestions(newSet);
                            } else {
                              openQuestionModal(q);
                            }
                          }}
                          className={`group hover:bg-[#202020] transition-colors cursor-pointer text-[13px] ${isSelected ? 'bg-[#202020]/80' : ''}`}
                        >
                          <td className="py-2.5 px-3 text-center border-r border-[#2F2F2F]/40" onClick={(e) => { e.stopPropagation(); const newSet = new Set(selectedQuestions); if (newSet.has(q.Title)) newSet.delete(q.Title); else newSet.add(q.Title); setSelectedQuestions(newSet); }}>
                             <input 
                              type="checkbox" 
                              className="accent-[#D4D4D4] bg-[#2f2f2f] border border-[#404040] rounded-sm focus:ring-0 cursor-pointer pointer-events-none"
                              checked={isSelected}
                              readOnly
                            />
                          </td>
                          <td className="py-2.5 px-2 text-center border-r border-[#2F2F2F]/40" onClick={(e) => toggleDone(q.Title, e)}>
                            <button className="focus:outline-none flex items-center justify-center w-full h-full text-[#9B9A97] hover:text-[#D4D4D4] transition-colors">
                              {isDone ? (
                                <CheckSquare className="w-[18px] h-[18px] text-[#4dffd6]" fill="#1e3a29" />
                              ) : (
                                <Square className="w-[18px] h-[18px]" strokeWidth={1.5} />
                              )}
                            </button>
                          </td>
                          <td className="py-2.5 px-3 border-r border-[#2F2F2F]/40">
                            <span className={`font-medium ${isDone ? "text-[#9B9A97] line-through decoration-[#9B9A97]/50" : "text-[#EBEBEB]"}`}>
                              {q.Title}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 border-r border-[#2F2F2F]/40">
                            <span className={`inline-flex px-1.5 py-0.5 rounded-[3px] text-xs font-semibold tracking-wide ${getDifficultyColor(activeDiff)}`} title={difficultyOverrides[q.Title] ? "Custom Difficulty" : "Default Difficulty"}>
                              {activeDiff.charAt(0) + activeDiff.slice(1).toLowerCase()}
                              {difficultyOverrides[q.Title] && <span className="ml-1 opacity-70">✎</span>}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 border-r border-[#2F2F2F]/40 max-w-[250px] truncate">
                            <div className="flex gap-1.5 overflow-hidden">
                              {q.Topics.split(',').slice(0, 2).map((topic, i) => (
                                <span key={i} className={`inline-flex px-1.5 py-0.5 rounded-[3px] text-[11px] font-medium tracking-wide ${isDone ? 'bg-[#2f2f2f]/50 text-[#9B9A97]' : 'bg-[#2f2f2f] text-[#EBEBEB]'}`}>
                                  {topic.trim()}
                                </span>
                              ))}
                              {q.Topics.split(',').length > 2 && (
                                <span className={`inline-flex px-1.5 py-0.5 rounded-[3px] text-[11px] font-medium tracking-wide ${isDone ? 'bg-[#2f2f2f]/50 text-[#9B9A97]' : 'bg-[#2f2f2f] text-[#EBEBEB]'}`}>
                                  +{q.Topics.split(',').length - 2}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 border-r border-[#2F2F2F]/40 max-w-[200px] truncate">
                            <span className={`text-[12px] whitespace-nowrap ${isDone ? 'text-[#9B9A97]' : 'text-[#D4D4D4]'}`}>
                              {q.Companies.split('|')[0]?.trim() || "-"} 
                              {q.Companies.split('|').length > 1 && <span className="opacity-60 ml-1">+{q.Companies.split('|').length - 1}</span>}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center" onClick={e => e.stopPropagation()}>
                            <a 
                              href={q.Link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-[#9B9A97] hover:text-[#D4D4D4] hover:bg-[#2f2f2f] p-1 rounded-[3px] transition-colors"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              {/* Footer text */}
              <div className="border-t border-[#2f2f2f] p-2 bg-[#191919] flex items-center justify-between">
                <p className="text-[12px] text-[#9B9A97] max-w-full tracking-wide">
                  COUNT <span className="font-mono text-[#D4D4D4]">{filteredData.length}</span>
                </p>
                {totalPages > 1 && (
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-1 flex items-center justify-center rounded bg-[#202020] border border-[#2f2f2f] text-[#9B9A97] hover:text-[#D4D4D4] hover:bg-[#2f2f2f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-[12px] text-[#9B9A97] font-medium">
                      Page <span className="text-[#D4D4D4]">{currentPage}</span> of <span className="text-[#D4D4D4]">{totalPages}</span>
                    </span>
                    <button 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-1 flex items-center justify-center rounded bg-[#202020] border border-[#2f2f2f] text-[#9B9A97] hover:text-[#D4D4D4] hover:bg-[#2f2f2f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Bulk Action Bar */}
      {selectedQuestions.size > 0 && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-40 animate-in slide-in-from-bottom-4 fade-in duration-200">
          <div className="bg-[#2f2f2f] border border-[#555] shadow-2xl rounded-full pl-5 pr-2 py-2 flex items-center gap-2 text-sm text-[#D4D4D4]">
            
            <div className="flex items-center gap-2 pr-3 border-r border-[#555] font-medium text-white">
              <span className="bg-[#454545] text-xs px-2 py-0.5 rounded-full">
                {selectedQuestions.size}
              </span>
              <span className="hidden sm:inline">selected</span>
            </div>

            <button onClick={() => markSelectedDone(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-[#404040] hover:text-white transition-colors font-medium">
              <CheckSquare size={15} />
              <span className="hidden sm:inline">Mark Done</span>
            </button>
            <button onClick={() => markSelectedDone(false)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-[#404040] hover:text-white transition-colors font-medium">
              <Square size={15} />
              <span className="hidden sm:inline">Mark Pending</span>
            </button>

            <div className="relative group" ref={diffDropdownRef}>
              <button 
                onClick={() => setShowDiffDropdown(!showDiffDropdown)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-[#404040] hover:text-white transition-colors font-medium"
              >
                <Layers size={15} />
                <span className="hidden sm:inline">Difficulty</span>
              </button>
              {showDiffDropdown && (
                <div className="absolute bottom-[calc(100%+12px)] left-0 mb-2 w-32 bg-[#2f2f2f] border border-[#555] rounded-md shadow-lg overflow-hidden flex flex-col py-1">
                   <button onClick={() => setDifficultyForSelected("EASY")} className="px-3 py-2 text-left hover:bg-[#404040] text-[#71ebd2] text-sm font-medium">Easy</button>
                   <button onClick={() => setDifficultyForSelected("MEDIUM")} className="px-3 py-2 text-left hover:bg-[#404040] text-[#ffd966] text-sm font-medium">Medium</button>
                   <button onClick={() => setDifficultyForSelected("HARD")} className="px-3 py-2 text-left hover:bg-[#404040] text-[#ff7369] text-sm font-medium">Hard</button>
                   <div className="border-t border-[#555] my-1"></div>
                   <button onClick={() => setDifficultyForSelected("DEFAULT")} className="px-3 py-2 text-left hover:bg-[#404040] text-[#D4D4D4] text-sm font-medium">Reset Default</button>
                </div> 
              )}
            </div>

            <div className="relative group" ref={listDropdownRef}>
              <button 
                onClick={() => setShowListDropdown(!showListDropdown)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-[#404040] hover:text-white transition-colors font-medium"
              >
                <Tags size={15} />
                <span className="hidden sm:inline">Add to List</span>
              </button>
              {showListDropdown && (
                <div className="absolute bottom-[calc(100%+12px)] left-0 mb-2 w-48 bg-[#2f2f2f] border border-[#555] rounded-md shadow-lg overflow-hidden flex flex-col py-1">
                  {Object.keys(customLists).length > 0 && (
                    <div className="max-h-40 overflow-y-auto custom-scrollbar">
                      {Object.keys(customLists).map(listName => (
                        <button key={listName} onClick={() => addSelectedToList(listName)} className="w-full px-3 py-2 text-left hover:bg-[#404040] text-[#D4D4D4] text-sm flex items-center justify-between">
                          <span className="truncate">{listName}</span>
                          <span className="text-xs text-[#9B9A97]">{customLists[listName].length}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {Object.keys(customLists).length > 0 && <div className="border-t border-[#555] my-1"></div>}
                  <div className="px-3 py-2 flex flex-col gap-2">
                    <span className="text-xs text-[#9B9A97] uppercase tracking-wider font-semibold">New List</span>
                    <div className="flex items-center gap-1">
                      <input 
                        type="text" 
                        placeholder="Name..." 
                        value={newListName}
                        onChange={e => setNewListName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') createList(newListName); }}
                        className="w-full bg-[#191919] border border-[#555] outline-none text-xs rounded px-2 py-1 text-[#D4D4D4]"
                      />
                      <button onClick={() => createList(newListName)} className="bg-[#454545] hover:bg-[#555] px-2 py-1 rounded text-xs transition-colors">+</button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="pl-2 border-l border-[#555] ml-1">
              <button 
                onClick={() => setSelectedQuestions(new Set())}
                className="p-1.5 rounded-full hover:bg-[#404040] text-[#8e8e8e] hover:text-white transition-colors flex items-center gap-1"
                title="Clear selection (Esc)"
              >
                <X size={16} />
                <span className="text-xs border border-[#777] rounded px-1 hidden sm:inline text-[#9B9A97]">Esc</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notion-style Modal */}
      {selectedQuestion && (
        <div className="fixed inset-0 z-50 flex justify-center items-center bg-black/40 backdrop-blur-[2px] transition-opacity min-h-screen">
          <div 
            className="fixed inset-0 cursor-pointer w-full h-full"
            onClick={() => setSelectedQuestion(null)}
          />
          
          <div className="relative w-[95vw] h-[90vh] sm:max-w-[720px] sm:h-[85vh] bg-[#191919] sm:rounded-lg shadow-[0_0_40px_rgba(0,0,0,0.5)] flex flex-col animate-in fade-in zoom-in-95 duration-200 border border-[#2f2f2f] overflow-hidden">
            
            {/* Top Bar Navigation */}
            <div className="flex justify-between items-center px-4 py-3 border-b border-[#2f2f2f] shrink-0 bg-[#191919] z-10 w-full">
              <div className="flex items-center text-[13px] font-medium text-[#9B9A97] w-full">
                <span className="mr-2">📄</span>
                Page / {selectedQuestion.Title}
              </div>
              <button 
                onClick={() => setSelectedQuestion(null)} 
                className="p-1 hover:bg-[#2f2f2f] rounded-[4px] text-[#9B9A97] hover:text-[#D4D4D4] transition-colors focus:outline-none flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="overflow-y-auto w-full flex-col flex-1 px-4 sm:px-8 md:px-20 pt-8 sm:pt-12 pb-24 custom-scrollbar bg-[#191919]">
              
              <div className="mb-4">
                <div className="text-5xl sm:text-7xl mb-4 sm:mb-6">📝</div>
                <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-[#EBEBEB] leading-tight break-words px-1">
                  {selectedQuestion.Title}
                </h1>
              </div>
                
              {/* Properties */}
              <div className="mt-6 sm:mt-8 mb-10 w-full space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center text-[13px] sm:text-[14px]">
                  <span className="w-full sm:w-40 flex items-center text-[#9B9A97] mb-1 sm:mb-0">
                    <svg className="w-[16px] h-[16px] sm:w-[18px] sm:h-[18px] mr-2 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                    Difficulty
                  </span>
                  <div className="relative group/diff">
                    <button className={`inline-flex items-center w-fit px-2 py-0.5 rounded-[3px] font-medium text-[12px] tracking-wide cursor-pointer hover:opacity-80 transition-opacity ${getDifficultyColor(difficultyOverrides[selectedQuestion.Title] || selectedQuestion.Difficulty)}`}>
                      {(difficultyOverrides[selectedQuestion.Title] || selectedQuestion.Difficulty)}
                      {difficultyOverrides[selectedQuestion.Title] && <span className="ml-1 opacity-70">✎</span>}
                    </button>
                    {/* Hover to change difficulty in modal */}
                    <div className="absolute top-full left-0 mt-1 w-32 bg-[#2f2f2f] border border-[#555] rounded-md shadow-lg overflow-hidden flex-col py-1 hidden group-hover/diff:flex z-50">
                       <button onClick={() => { const overrides = {...difficultyOverrides}; overrides[selectedQuestion.Title]="EASY"; updateDifficultyOverrides(overrides); }} className="px-3 py-1.5 text-left hover:bg-[#404040] text-[#71ebd2] text-sm">Easy</button>
                       <button onClick={() => { const overrides = {...difficultyOverrides}; overrides[selectedQuestion.Title]="MEDIUM"; updateDifficultyOverrides(overrides); }} className="px-3 py-1.5 text-left hover:bg-[#404040] text-[#ffd966] text-sm">Medium</button>
                       <button onClick={() => { const overrides = {...difficultyOverrides}; overrides[selectedQuestion.Title]="HARD"; updateDifficultyOverrides(overrides); }} className="px-3 py-1.5 text-left hover:bg-[#404040] text-[#ff7369] text-sm">Hard</button>
                       <div className="border-t border-[#555] my-1"></div>
                       <button onClick={() => { const overrides = {...difficultyOverrides}; delete overrides[selectedQuestion.Title]; updateDifficultyOverrides(overrides); }} className="px-3 py-1.5 text-left hover:bg-[#404040] text-[#D4D4D4] text-sm">Reset Default</button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center text-[13px] sm:text-[14px]">
                  <span className="w-full sm:w-40 flex items-center text-[#9B9A97] mb-1 sm:mb-0">
                    <CheckSquare className="w-[16px] h-[16px] sm:w-[18px] sm:h-[18px] mr-2 shrink-0" strokeWidth={1.5} />
                    Status
                  </span>
                  <button 
                    onClick={() => toggleDone(selectedQuestion.Title)} 
                    className={`inline-flex items-center w-fit gap-1.5 px-1.5 py-0.5 rounded-[3px] transition-colors ${
                      doneList[selectedQuestion.Title] 
                        ? 'bg-[#1e3a29] text-[#71ebd2]' 
                        : 'hover:bg-[#2f2f2f] text-[#EBEBEB]'
                    }`}
                  >
                    {doneList[selectedQuestion.Title] ? <CheckSquare className="w-[15px] h-[15px] fill-[#2b593f]" /> : <Square className="w-[15px] h-[15px]" />}
                    {doneList[selectedQuestion.Title] ? 'Done' : 'Not started'}
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row text-[13px] sm:text-[14px] pt-1">
                  <span className="w-full sm:w-40 flex items-center text-[#9B9A97] mb-1 sm:mb-0 shrink-0">
                    <List className="w-[16px] h-[16px] sm:w-[18px] sm:h-[18px] mr-2 shrink-0" strokeWidth={1.5} />
                    Custom Lists
                  </span>
                  <div className="flex flex-wrap gap-2 w-full">
                    {Object.keys(customLists).length === 0 && <span className="text-[#9B9A97] italic text-xs py-0.5 mt-0.5">No lists created</span>}
                    {Object.keys(customLists).map(listName => {
                      const isActive = customLists[listName].includes(selectedQuestion.Title);
                      return (
                        <button 
                          key={listName}
                          onClick={() => toggleQuestionInList(listName, selectedQuestion.Title)}
                          className={`px-2 py-0.5 rounded text-xs font-medium border transition-colors ${isActive ? 'bg-[#D4D4D4] text-[#191919] border-[#D4D4D4]' : 'bg-transparent border-[#404040] text-[#9B9A97] hover:border-[#D4D4D4] hover:text-[#D4D4D4]'}`}
                        >
                          {isActive && <Check size={12} className="inline mr-1 -mt-0.5" />}
                          {listName}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {selectedQuestion.AcceptanceRate && selectedQuestion.AcceptanceRate !== "NaN" && (
                  <div className="flex flex-col sm:flex-row sm:items-center text-[13px] sm:text-[14px] pt-1">
                    <span className="w-full sm:w-40 flex items-center text-[#9B9A97] mb-1 sm:mb-0">
                      <Hash className="w-[16px] h-[16px] sm:w-[18px] sm:h-[18px] mr-2 shrink-0" strokeWidth={1.5} />
                      Acceptance
                    </span>
                    <span className="text-[#EBEBEB] pl-1 sm:pl-0">{selectedQuestion.AcceptanceRate}</span>
                  </div>
                )}

                {selectedQuestion.Frequency && selectedQuestion.Frequency !== "NaN" && (
                  <div className="flex flex-col sm:flex-row sm:items-center text-[13px] sm:text-[14px]">
                    <span className="w-full sm:w-40 flex items-center text-[#9B9A97] mb-1 sm:mb-0">
                      <Layers className="w-[16px] h-[16px] sm:w-[18px] sm:h-[18px] mr-2 shrink-0" strokeWidth={1.5} />
                      Frequency
                    </span>
                    <span className="text-[#EBEBEB] pl-1 sm:pl-0">{selectedQuestion.Frequency}</span>
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row sm:items-center text-[13px] sm:text-[14px]">
                  <span className="w-full sm:w-40 flex items-center text-[#9B9A97] mb-1 sm:mb-0">
                    <ExternalLink className="w-[16px] h-[16px] sm:w-[18px] sm:h-[18px] mr-2 shrink-0" strokeWidth={1.5} />
                    Link
                  </span>
                  <a href={selectedQuestion.Link} target="_blank" rel="noopener noreferrer" className="text-[#EBEBEB] pl-1 sm:pl-0 hover:text-white underline decoration-[#454b4e] underline-offset-4 hover:decoration-[#d4d4d4] transition-colors break-all">
                    leetcode.com ↗
                  </a>
                </div>
              </div>

              <hr className="border-[#2f2f2f] w-full my-8" />

              {/* Topics */}
              <div className="pt-4">
                <h3 className="text-xl font-bold text-[#EBEBEB] mb-4">Topics</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedQuestion.Topics.split(',').filter(Boolean).map((t, i) => (
                    <span key={i} className="px-2 py-1 bg-[#2f2f2f] rounded-[3px] text-[#EBEBEB] text-[13px] font-medium leading-none flex items-center h-7">
                      {t.trim()}
                    </span>
                  ))}
                </div>
              </div>

              {/* Companies */}
              <div className="pt-8">
                <h3 className="text-xl font-bold text-[#EBEBEB] mb-4">Companies</h3>
                
                {selectedQuestion.Companies ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {selectedQuestion.Companies.split('|').filter(c => c.trim()).map((c, i) => (
                      <div key={i} className="flex items-center px-3 py-2 bg-[#202020] border border-[#2f2f2f] rounded-[4px]">
                        <Building2 className="w-[14px] h-[14px] text-[#9B9A97] mr-2 shrink-0" />
                        <span className="text-[#EBEBEB] text-[13px] font-medium truncate">{c.trim()}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[#9B9A97] text-[14px] italic">No company data.</p>
                )}
              </div>

              <hr className="border-[#2f2f2f] w-full my-8" />
              
              {/* AI Assistant */}
              <div className="pt-4 pb-8">
                <h3 className="text-xl font-bold text-[#EBEBEB] mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#ffd966]" /> AI Assistant
                </h3>
                
                {!openRouterKey ? (
                  <div className="bg-[#202020] border border-[#2f2f2f] rounded-[4px] p-4 text-[13px] sm:text-[14px]">
                    <p className="text-[#9B9A97] mb-3">Configure your OpenRouter API key to get conceptual hints and approach explanations without spoilers.</p>
                    <button onClick={() => { setSelectedQuestion(null); setShowSettings(true); }} className="flex items-center gap-2 px-3 py-1.5 bg-[#2f2f2f] hover:bg-[#404040] text-[#EBEBEB] rounded transition-colors w-fit font-medium">
                      <Settings className="w-4 h-4" /> Configure API Key
                    </button>
                  </div>
                ) : (
                  <div className="bg-[#202020] border border-[#2f2f2f] rounded-[4px] p-4 text-[14px] leading-relaxed">
                    {!aiResponse && !aiLoading && !aiError && (
                      <button onClick={fetchAiHint} className="flex items-center gap-2 px-3 py-1.5 bg-[#2f2f2f] hover:bg-[#404040] text-[#EBEBEB] rounded transition-colors w-fit font-medium text-[13px]">
                        <Sparkles className="w-4 h-4 text-[#ffd966]" />
                        Get Conceptual Hint & Approach
                      </button>
                    )}
                    {aiLoading && (
                      <div className="flex items-center gap-2 text-[#9B9A97] text-[13px]">
                        <Loader2 className="w-4 h-4 animate-spin text-[#ffd966]" />
                        Thinking...
                      </div>
                    )}
                    {aiError && (
                      <div className="text-[#ff7369] text-[13px] bg-[#3f1c19]/20 p-3 rounded border border-[#ff7369]/20">
                        <p className="font-semibold mb-1 flex items-center gap-2">Error</p>
                        {aiError}
                      </div>
                    )}
                    {aiResponse && (
                      <div className="prose prose-invert prose-sm max-w-none w-full text-[#EBEBEB]">
                        <ReactMarkdown>
                          {aiResponse}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[60] flex justify-center items-center bg-black/40 backdrop-blur-[2px] transition-opacity min-h-screen">
          <div className="fixed inset-0 cursor-pointer w-full h-full" onClick={() => setShowSettings(false)} />
          <div className="relative w-[90vw] max-w-[400px] bg-[#191919] sm:rounded-lg shadow-[0_0_40px_rgba(0,0,0,0.5)] flex flex-col border border-[#2f2f2f] p-6 animate-in fade-in zoom-in-95 duration-200">
             <h2 className="text-xl font-bold text-[#EBEBEB] mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#9B9A97]" /> Settings
             </h2>
             <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-[13px] font-medium text-[#9B9A97] mb-1.5">OpenRouter API Key</label>
                  <input type="password" value={openRouterKey} onChange={e => { setOpenRouterKey(e.target.value); localStorage.setItem("dsa_or_key", e.target.value); }} className="w-full bg-[#202020] border border-[#2f2f2f] outline-none text-[13px] rounded px-3 py-2 text-[#D4D4D4] focus:border-[#555] transition-colors" placeholder="sk-or-v1-..." />
                  <p className="text-[11px] text-[#9B9A97] mt-1.5">Required for AI Hints. Stored locally in your browser.</p>
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#9B9A97] mb-1.5">AI Model</label>
                  <input type="text" value={openRouterModel} onChange={e => { setOpenRouterModel(e.target.value); localStorage.setItem("dsa_or_model", e.target.value); }} className="w-full bg-[#202020] border border-[#2f2f2f] outline-none text-[13px] rounded px-3 py-2 text-[#D4D4D4] focus:border-[#555] transition-colors" placeholder="google/gemini-2.5-flash" />
                  <p className="text-[11px] text-[#9B9A97] mt-1.5">Default: google/gemini-2.5-flash. Accepts any valid <a href="https://openrouter.ai/docs#models" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#D4D4D4]">OpenRouter model string</a>.</p>
                </div>
             </div>
             <div className="mt-8 flex justify-end">
               <button onClick={() => setShowSettings(false)} className="px-5 py-2 bg-[#EBEBEB] text-[#191919] text-[13px] font-bold rounded-[4px] hover:bg-[#D4D4D4] transition-colors w-full sm:w-auto text-center focus:outline-none">Save & Close</button>
             </div>
          </div>
        </div>
      )}
    </main>
  );
}
