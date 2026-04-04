"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import Papa from "papaparse";
import { Search, Building2, ExternalLink, Check, Square, CheckSquare, X, List, Hash, HelpCircle, Layers, Info, ChevronLeft, ChevronRight } from "lucide-react";

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
  const [filterDifficulty, setFilterDifficulty] = useState("ALL");
  const [filterDone, setFilterDone] = useState<"ALL" | "DONE" | "TODO">("ALL");
  const [loading, setLoading] = useState(true);
  
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  // Custom dropdown state
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const companyDropdownRef = useRef<HTMLDivElement>(null);

  // Modal state
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (companyDropdownRef.current && !companyDropdownRef.current.contains(event.target as Node)) {
        setShowCompanyDropdown(false);
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
      const saved = localStorage.getItem("dsa_done_qs");
      if (saved) {
        setDoneList(JSON.parse(saved));
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

  const filteredCompanySuggestions = useMemo(() => {
    if (!companySearch) return allCompanies;
    return allCompanies.filter(c => c.toLowerCase().includes(companySearch.toLowerCase()));
  }, [allCompanies, companySearch]);

  const filteredData = useMemo(() => {
    return data.filter((q) => {
      const textMatch = q.Title.toLowerCase().includes(search.toLowerCase()) || 
                        q.Topics.toLowerCase().includes(search.toLowerCase());
      
      const companyMatch = q.Companies.toLowerCase().includes(companySearch.toLowerCase());

      const diffMatch = filterDifficulty === "ALL" || q.Difficulty === filterDifficulty;

      let doneMatch = true;
      if (filterDone === "DONE") doneMatch = !!doneList[q.Title];
      if (filterDone === "TODO") doneMatch = !doneList[q.Title];

      return textMatch && companyMatch && diffMatch && doneMatch && q.Title !== "";
    });
  }, [data, search, companySearch, filterDifficulty, filterDone, doneList]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, companySearch, filterDifficulty, filterDone]);

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage]);

  const totalCompleted = Object.values(doneList).filter(Boolean).length;
  const progressPercentage = data.length > 0 ? Math.round((totalCompleted / data.length) * 100) : 0;

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

  const easyCount = data.filter(q => q.Difficulty === "EASY").length;

  const mediumCount = data.filter(q => q.Difficulty === "MEDIUM").length;
  const hardCount = data.filter(q => q.Difficulty === "HARD").length;

  const easyCompleted = data.filter(q => q.Difficulty === "EASY" && doneList[q.Title]).length;
  const mediumCompleted = data.filter(q => q.Difficulty === "MEDIUM" && doneList[q.Title]).length;
  const hardCompleted = data.filter(q => q.Difficulty === "HARD" && doneList[q.Title]).length;

  // Notion-inspired styling helpers
  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'EASY': return 'bg-[#1e3a29] text-[#71ebd2]';
      case 'MEDIUM': return 'bg-[#3b2e14] text-[#ffd966]';
      case 'HARD': return 'bg-[#3f1c19] text-[#ff7369]';
      default: return 'bg-[#2f2f2f] text-[#d4d4d4]';
    }
  };

  return (
    <main className="min-h-screen bg-[#191919] text-[#D4D4D4] font-sans selection:bg-[#2f2f2f]">
      {/* Top Navigation / Breadcrumb area */}
      <nav className="h-12 w-full border-b border-[#2f2f2f] flex items-center px-4 md:px-6 sticky top-0 bg-[#191919]/90 backdrop-blur-sm z-30">
        <div className="flex items-center text-sm font-medium text-[#9B9A97] hover:text-[#D4D4D4] cursor-default transition-colors">
          <span className="mr-2">📚</span>
          workspace / DSA Canvas
        </div>
      </nav>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-12 md:py-16 space-y-8 sm:space-y-10">
        
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
            <div className="flex bg-[#202020] border border-[#2f2f2f] rounded-[4px] px-3 sm:px-4 py-3 items-start gap-3">
              <span className="flex items-center justify-center p-1 bg-[#2f2f2f] rounded-[4px] mt-0.5">
                <Info className="w-4 h-4 text-[#9B9A97]" />
              </span>
              <div className="text-[12px] sm:text-[13px] text-[#9B9A97] leading-relaxed">
                <p className="text-[#D4D4D4]">List of questions on LeetCode for a specific company based on the LeetCode company tags.</p>
                <p className="mt-1 text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold opacity-60">Updated as of 20 June, 2025</p>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 pb-2 w-full max-w-3xl">
            <div className="flex flex-col p-3 rounded-[4px] border border-[#2f2f2f] bg-[#202020]">
              <span className="text-xs text-[#9B9A97] uppercase tracking-wider mb-1">Total</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-semibold text-[#EBEBEB]">{totalCompleted}</span>
                <span className="text-xs text-[#9B9A97]">/ {data.length}</span>
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

          {/* Filters Section (Notion Database Views style) */}
        <section className="flex flex-wrap items-center gap-2 sm:gap-3 pt-4 border-t border-[#2f2f2f] select-none">
          <div className="flex w-full sm:w-auto items-center bg-transparent border border-[#2f2f2f] hover:bg-[#2f2f2f]/50 rounded-[4px] px-2.5 py-1.5 focus-within:border-[#454b4e] focus-within:bg-[#202020] transition-colors">
            <Search className="w-4 h-4 text-[#9B9A97] mr-2 shrink-0" />
            <input 
              type="text" 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Search..."
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
        <section className="pb-24">
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
                  <thead className="bg-[#191919] text-[#9B9A97] border-b border-[#2F2F2F]">
                    <tr>
                      <th className="font-normal py-2 px-3 w-10 text-center"><span className="text-xs tracking-widest uppercase">Done</span></th>
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
                      return (
                        <tr 
                          key={`${q.Title}-${idx}`} 
                          onClick={() => setSelectedQuestion(q)}
                          className={`group hover:bg-[#202020] transition-colors cursor-pointer text-[13px]`}
                        >
                          <td className="py-2.5 px-3 text-center border-r border-[#2F2F2F]/40" onClick={(e) => toggleDone(q.Title, e)}>
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
                            <span className={`inline-flex px-1.5 py-0.5 rounded-[3px] text-xs font-semibold tracking-wide ${getDifficultyColor(q.Difficulty)}`}>
                              {q.Difficulty.charAt(0) + q.Difficulty.slice(1).toLowerCase()}
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

      {/* Notion-style Modal (Side-Peek/Center popup) */}
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
              
              {/* Emoji Icon + Title Area */}
              <div className="mb-4">
                <div className="text-5xl sm:text-7xl mb-4 sm:mb-6">📝</div>
                <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-[#EBEBEB] leading-tight break-words px-1">
                  {selectedQuestion.Title}
                </h1>
              </div>
                
              {/* Notion-style Properties block */}
              <div className="mt-6 sm:mt-8 mb-10 w-full space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center text-[13px] sm:text-[14px]">
                  <span className="w-full sm:w-40 flex items-center text-[#9B9A97] mb-1 sm:mb-0">
                    <svg className="w-[16px] h-[16px] sm:w-[18px] sm:h-[18px] mr-2 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                    Difficulty
                  </span>
                  <span className={`inline-flex w-fit px-1.5 py-0.5 rounded-[3px] font-medium text-[12px] tracking-wide ${getDifficultyColor(selectedQuestion.Difficulty)}`}>
                    {selectedQuestion.Difficulty}
                  </span>
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

                {selectedQuestion.AcceptanceRate && selectedQuestion.AcceptanceRate !== "NaN" && (
                  <div className="flex flex-col sm:flex-row sm:items-center text-[13px] sm:text-[14px]">
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

              {/* Topics block */}
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

              {/* Companies block */}
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
            </div>
          </div>
        </div>
      )}
    </main>
  );
}