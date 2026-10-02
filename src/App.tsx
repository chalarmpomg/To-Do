import { useState, useEffect, useRef, useCallback } from "react";
import {
  Plus,
  Trash2,
  Check,
  Edit3,
  Search,
  Calendar,
  BarChart3,
  X,
  Moon,
  Sun,
  Pin,
  Archive,
  RotateCcw,
  CheckSquare,
  Square,
  Download,
  Upload,
  StickyNote,
  ChevronDown,
  ChevronRight,
  Keyboard,
  Undo,
  Star,
  GripVertical,
} from "lucide-react";

type Priority = "low" | "medium" | "high";
type Filter = "all" | "active" | "completed";
type Category = "work" | "personal" | "shopping" | "health" | "finance" | "study";
type View = "list" | "pinned" | "archived";

interface Subtask {
  id: string;
  text: string;
  completed: boolean;
}

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  priority: Priority;
  category: Category;
  dueDate: string | null;
  notes: string;
  subtasks: Subtask[];
  pinned: boolean;
  archived: boolean;
  createdAt: string;
  completedAt: string | null;
  reminder: string | null;
}

interface DeletedTodo extends Todo {
  deletedAt: number;
}

const priorityConfig = {
  low: { label: "ต่ำ", bg: "bg-green-100", text: "text-green-700", border: "border-green-300", dot: "bg-green-500" },
  medium: { label: "ปานกลาง", bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-300", dot: "bg-yellow-500" },
  high: { label: "สูง", bg: "bg-red-100", text: "text-red-700", border: "border-red-300", dot: "bg-red-500" },
};

const categoryConfig = {
  work: { label: "งาน", bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-500", icon: "💼" },
  personal: { label: "ส่วนตัว", bg: "bg-purple-100", text: "text-purple-700", dot: "bg-purple-500", icon: "🏠" },
  shopping: { label: "ซื้อของ", bg: "bg-orange-100", text: "text-orange-700", dot: "bg-orange-500", icon: "🛒" },
  health: { label: "สุขภาพ", bg: "bg-pink-100", text: "text-pink-700", dot: "bg-pink-500", icon: "💪" },
  finance: { label: "การเงิน", bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500", icon: "💰" },
  study: { label: "เรียน", bg: "bg-indigo-100", text: "text-indigo-700", dot: "bg-indigo-500", icon: "📚" },
};

const filterLabels = { all: "ทั้งหมด", active: "ยังไม่เสร็จ", completed: "เสร็จแล้ว" };

function App() {
  const [todos, setTodos] = useState<Todo[]>([
    {
      id: "1", text: "ประชุมทีมงาน", completed: false, priority: "high", category: "work",
      dueDate: new Date().toISOString().split("T")[0], notes: "เตรียม slide และรายงานความคืบหน้า",
      subtasks: [{ id: "s1", text: "เตรียม slide", completed: true }, { id: "s2", text: "ส่ง agenda", completed: false }],
      pinned: true, archived: false, createdAt: new Date().toISOString(), completedAt: null, reminder: null,
    },
    {
      id: "2", text: "ออกกำลังกาย 30 นาที", completed: false, priority: "medium", category: "health",
      dueDate: new Date().toISOString().split("T")[0], notes: "วิ่งหรือเวทเทรนนิ่ง",
      subtasks: [], pinned: false, archived: false, createdAt: new Date().toISOString(), completedAt: null, reminder: null,
    },
    {
      id: "3", text: "ซื้อของในครัว", completed: true, priority: "low", category: "shopping",
      dueDate: null, notes: "ผัก, เนื้อ, ไข่", subtasks: [], pinned: false, archived: false,
      createdAt: new Date().toISOString(), completedAt: new Date().toISOString(), reminder: null,
    },
    {
      id: "4", text: "จ่ายบิลค่าไฟ", completed: false, priority: "high", category: "finance",
      dueDate: new Date(Date.now() - 86400000).toISOString().split("T")[0], notes: "วงเงิน 2000 บาท",
      subtasks: [], pinned: false, archived: false, createdAt: new Date().toISOString(), completedAt: null, reminder: null,
    },
    {
      id: "5", text: "อ่านหนังสือ React", completed: false, priority: "medium", category: "study",
      dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0], notes: "Chapter 5-7",
      subtasks: [{ id: "s3", text: "Chapter 5", completed: true }, { id: "s4", text: "Chapter 6", completed: false }, { id: "s5", text: "Chapter 7", completed: false }],
      pinned: false, archived: false, createdAt: new Date().toISOString(), completedAt: null, reminder: null,
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [selectedPriority, setSelectedPriority] = useState<Priority>("medium");
  const [selectedCategory, setSelectedCategory] = useState<Category>("work");
  const [filter, setFilter] = useState<Filter>("all");
  const [view, setView] = useState<View>("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<Category | "all">("all");
  const [showStats, setShowStats] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [selectedTodos, setSelectedTodos] = useState<Set<string>>(new Set());
  const [expandedSubtasks, setExpandedSubtasks] = useState<Set<string>>(new Set());
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [newSubtaskText, setNewSubtaskText] = useState<{ [key: string]: string }>({});
  const [deletedTodos, setDeletedTodos] = useState<DeletedTodo[]>([]);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const notesInputRef = useRef<HTMLTextAreaElement>(null);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case "n": e.preventDefault(); inputRef.current?.focus(); break;
          case "f": e.preventDefault(); document.querySelector<HTMLInputElement>('[placeholder="ค้นหารายการ..."]')?.focus(); break;
          case "d": e.preventDefault(); setDarkMode(d => !d); break;
          case "z": e.preventDefault(); handleUndo(); break;
        }
      }
      if (e.key === "Escape") {
        setEditingId(null);
        setEditingNotes(null);
      }
      if (e.key === "?" && !e.ctrlKey) {
        e.preventDefault();
        setShowShortcuts(s => !s);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  useEffect(() => {
    if (editingNotes && notesInputRef.current) {
      notesInputRef.current.focus();
    }
  }, [editingNotes]);

  const generateId = () => Math.random().toString(36).substring(2, 9);

  const getDueDateStatus = (dueDate: string | null) => {
    if (!dueDate) return null;
    const today = new Date().toISOString().split("T")[0];
    if (dueDate < today) return "overdue";
    if (dueDate === today) return "today";
    return "upcoming";
  };

  const addTodo = () => {
    const trimmedText = inputValue.trim();
    if (!trimmedText) return;

    const newTodo: Todo = {
      id: generateId(), text: trimmedText, completed: false,
      priority: selectedPriority, category: selectedCategory,
      dueDate: null, notes: "", subtasks: [], pinned: false,
      archived: false, createdAt: new Date().toISOString(),
      completedAt: null, reminder: null,
    };

    setTodos([newTodo, ...todos]);
    setInputValue("");
    inputRef.current?.focus();
  };

  const toggleTodo = (id: string) => {
    setTodos(todos.map(todo => {
      if (todo.id !== id) return todo;
      const newCompleted = !todo.completed;
      return { ...todo, completed: newCompleted, completedAt: newCompleted ? new Date().toISOString() : null };
    }));
  };

  const deleteTodo = (id: string) => {
    const todo = todos.find(t => t.id === id);
    if (todo) {
      setDeletedTodos(prev => [...prev, { ...todo, deletedAt: Date.now() }]);
    }
    setDeletingId(id);
    setTimeout(() => {
      setTodos(todos.filter(t => t.id !== id));
      setDeletingId(null);
      setSelectedTodos(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 400);
  };

  const handleUndo = () => {
    if (deletedTodos.length === 0) return;
    const lastDeleted = deletedTodos[deletedTodos.length - 1];
    setDeletedTodos(prev => prev.slice(0, -1));
    setTodos(prev => [lastDeleted, ...prev]);
  };

  const startEditing = (todo: Todo) => { setEditingId(todo.id); setEditValue(todo.text); };
  const saveEdit = (id: string) => {
    const trimmed = editValue.trim();
    if (trimmed) setTodos(todos.map(t => t.id === id ? { ...t, text: trimmed } : t));
    setEditingId(null);
    setEditValue("");
  };

  const togglePin = (id: string) => setTodos(todos.map(t => t.id === id ? { ...t, pinned: !t.pinned } : t));
  const toggleArchive = (id: string) => setTodos(todos.map(t => t.id === id ? { ...t, archived: !t.archived } : t));

  const addSubtask = (todoId: string) => {
    const text = newSubtaskText[todoId]?.trim();
    if (!text) return;
    setTodos(todos.map(t => {
      if (t.id !== todoId) return t;
      return { ...t, subtasks: [...t.subtasks, { id: generateId(), text, completed: false }] };
    }));
    setNewSubtaskText(prev => ({ ...prev, [todoId]: "" }));
  };

  const toggleSubtask = (todoId: string, subtaskId: string) => {
    setTodos(todos.map(t => {
      if (t.id !== todoId) return t;
      return { ...t, subtasks: t.subtasks.map(s => s.id === subtaskId ? { ...s, completed: !s.completed } : s) };
    }));
  };

  const deleteSubtask = (todoId: string, subtaskId: string) => {
    setTodos(todos.map(t => {
      if (t.id !== todoId) return t;
      return { ...t, subtasks: t.subtasks.filter(s => s.id !== subtaskId) };
    }));
  };

  const toggleSelect = (id: string) => {
    setSelectedTodos(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    const visibleIds = filteredTodos.map(t => t.id);
    if (selectedTodos.size === visibleIds.length) setSelectedTodos(new Set());
    else setSelectedTodos(new Set(visibleIds));
  };

  const bulkDelete = () => {
    selectedTodos.forEach(id => {
      const todo = todos.find(t => t.id === id);
      if (todo) setDeletedTodos(prev => [...prev, { ...todo, deletedAt: Date.now() }]);
    });
    setTodos(todos.filter(t => !selectedTodos.has(t.id)));
    setSelectedTodos(new Set());
  };

  const bulkComplete = () => {
    setTodos(todos.map(t => selectedTodos.has(t.id) ? { ...t, completed: true, completedAt: new Date().toISOString() } : t));
    setSelectedTodos(new Set());
  };

  const clearCompleted = () => {
    const completed = todos.filter(t => t.completed);
    completed.forEach(t => setDeletedTodos(prev => [...prev, { ...t, deletedAt: Date.now() }]));
    setTodos(todos.filter(t => !t.completed));
  };

  const exportData = () => {
    const data = JSON.stringify(todos, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `todos-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (Array.isArray(data)) setTodos(data);
      } catch { alert("Invalid JSON file"); }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const filteredTodos = todos
    .filter(t => {
      if (view === "pinned") return t.pinned && !t.archived;
      if (view === "archived") return t.archived;
      return !t.archived;
    })
    .filter(t => {
      if (filter === "active") return !t.completed;
      if (filter === "completed") return t.completed;
      return true;
    })
    .filter(t => {
      if (selectedCategoryFilter !== "all" && t.category !== selectedCategoryFilter) return false;
      if (searchQuery && !t.text.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      if (a.priority === "high" && b.priority !== "high") return -1;
      if (b.priority === "high" && a.priority !== "high") return 1;
      return 0;
    });

  const remainingCount = todos.filter(t => !t.completed && !t.archived).length;
  const completedCount = todos.filter(t => t.completed && !t.archived).length;
  const overdueCount = todos.filter(t => !t.completed && getDueDateStatus(t.dueDate) === "overdue").length;
  const pinnedCount = todos.filter(t => t.pinned && !t.archived).length;

  const chartData = {
    total: todos.filter(t => !t.archived).length,
    completed: todos.filter(t => t.completed && !t.archived).length,
    get percent() { return this.total ? Math.round((this.completed / this.total) * 100) : 0; },
  };

  return (
    <div className={`min-h-screen py-6 px-4 transition-colors ${darkMode ? "bg-slate-900" : "bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100"}`}>
      {/* Shortcuts Modal */}
      {showShortcuts && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowShortcuts(false)}>
          <div className={`${darkMode ? "bg-slate-800" : "bg-white"} rounded-2xl shadow-2xl p-6 max-w-md w-full`} onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Keyboard size={20} className="text-indigo-500" /> Keyboard Shortcuts
            </h2>
            <div className="space-y-2 text-sm">
              {[
                ["Ctrl + N", "เพิ่มรายการใหม่"],
                ["Ctrl + F", "ค้นหา"],
                ["Ctrl + D", "Dark/Light Mode"],
                ["Ctrl + Z", "ยกเลิกการลบล่าสุด"],
                ["Esc", "ปิดโหมดแก้ไข"],
                ["?", "แสดง/ซ่อน Shortcuts"],
              ].map(([key, action]) => (
                <div key={key} className="flex justify-between">
                  <kbd className={`px-2 py-1 rounded ${darkMode ? "bg-slate-700" : "bg-gray-100"} font-mono text-xs`}>{key}</kbd>
                  <span className={darkMode ? "text-gray-300" : "text-gray-600"}>{action}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className={`text-3xl font-bold mb-2 ${darkMode ? "text-white" : "text-gray-800"}`}>
            📝 รายการสิ่งที่ต้องทำ
          </h1>
          <p className={darkMode ? "text-gray-400" : "text-gray-500"}>จัดการงานของคุณอย่างมีประสิทธิภาพ</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-64 flex-shrink-0 space-y-4">
            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(d => !d)}
              className={`w-full flex items-center justify-between p-4 rounded-2xl shadow-lg transition-all ${darkMode ? "bg-slate-800 text-white" : "bg-white text-gray-800"}`}
            >
              <span className="font-medium">{darkMode ? "โหมดกลางคืน 🌙" : "โหมดกลางวัน ☀️"}</span>
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Categories */}
            <div className={`${darkMode ? "bg-slate-800" : "bg-white"} rounded-2xl shadow-lg p-4`}>
              <h3 className={`font-semibold mb-3 flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-700"}`}>
                <BarChart3 size={18} className="text-indigo-500" /> หมวดหมู่
              </h3>
              <div className="space-y-1">
                <button onClick={() => setSelectedCategoryFilter("all")} className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all ${selectedCategoryFilter === "all" ? "bg-indigo-100 text-indigo-700" : `${darkMode ? "text-gray-300 hover:bg-slate-700" : "text-gray-600 hover:bg-gray-100"}`}`}>
                  <span>📋 ทั้งหมด</span>
                  <span className="bg-gray-200 px-2 py-0.5 rounded-full text-xs">{todos.filter(t => !t.archived).length}</span>
                </button>
                {(Object.keys(categoryConfig) as Category[]).map(cat => (
                  <button key={cat} onClick={() => setSelectedCategoryFilter(cat)} className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all ${selectedCategoryFilter === cat ? `${categoryConfig[cat].bg} ${categoryConfig[cat].text}` : `${darkMode ? "text-gray-300 hover:bg-slate-700" : "text-gray-600 hover:bg-gray-100"}`}`}>
                    <span>{categoryConfig[cat].icon} {categoryConfig[cat].label}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${selectedCategoryFilter === cat ? "" : "bg-gray-200"}`}>{todos.filter(t => t.category === cat && !t.archived).length}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* View Tabs */}
            <div className={`${darkMode ? "bg-slate-800" : "bg-white"} rounded-2xl shadow-lg p-2`}>
              {[
                { key: "list", icon: "📝", label: "รายการ" },
                { key: "pinned", icon: "📌", label: "ปักหมุด", badge: pinnedCount },
                { key: "archived", icon: "📦", label: "คลัง", badge: todos.filter(t => t.archived).length },
              ].map(v => (
                <button key={v.key} onClick={() => setView(v.key as View)} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${view === v.key ? "bg-indigo-500 text-white" : `${darkMode ? "text-gray-300 hover:bg-slate-700" : "text-gray-600 hover:bg-gray-100"}`}`}>
                  <span>{v.icon} {v.label}</span>
                  {v.badge !== undefined && v.badge > 0 && <span className={`px-2 py-0.5 rounded-full text-xs ${view === v.key ? "bg-white/20" : "bg-gray-200"}`}>{v.badge}</span>}
                </button>
              ))}
            </div>

            {/* Stats */}
            <div className={`${darkMode ? "bg-slate-800" : "bg-white"} rounded-2xl shadow-lg p-4`}>
              <h3 className={`font-semibold mb-3 ${darkMode ? "text-white" : "text-gray-700"}`}>📊 สถิติ</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-indigo-50 dark:bg-indigo-900/30 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-indigo-600">{remainingCount}</div>
                  <div className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>ยังไม่เสร็จ</div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/30 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-green-600">{completedCount}</div>
                  <div className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>เสร็จแล้ว</div>
                </div>
                {overdueCount > 0 && (
                  <div className="bg-red-50 dark:bg-red-900/30 rounded-xl p-3 col-span-2 text-center">
                    <div className="text-2xl font-bold text-red-600">{overdueCount}</div>
                    <div className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>เลยกำหนด!</div>
                  </div>
                )}
              </div>
              {chartData.total > 0 && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span className={darkMode ? "text-gray-400" : "text-gray-500"}>ความคืบหน้า</span>
                    <span className={darkMode ? "text-gray-400" : "text-gray-500"}>{chartData.percent}%</span>
                  </div>
                  <div className={`h-3 rounded-full overflow-hidden ${darkMode ? "bg-slate-700" : "bg-gray-100"}`}>
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all" style={{ width: `${chartData.percent}%` }} />
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className={`${darkMode ? "bg-slate-800" : "bg-white"} rounded-2xl shadow-lg p-4`}>
              <h3 className={`font-semibold mb-3 ${darkMode ? "text-white" : "text-gray-700"}`}>⚡ คำสั่งด่วน</h3>
              <div className="space-y-2">
                <button onClick={handleUndo} disabled={deletedTodos.length === 0} className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl transition-all disabled:opacity-50 ${darkMode ? "bg-amber-900/30 text-amber-400 hover:bg-amber-900/50" : "bg-amber-50 text-amber-700 hover:bg-amber-100"}`}>
                  <Undo size={16} /> ยกเลิก ({deletedTodos.length})
                </button>
                <button onClick={exportData} className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${darkMode ? "bg-green-900/30 text-green-400 hover:bg-green-900/50" : "bg-green-50 text-green-700 hover:bg-green-100"}`}>
                  <Download size={16} /> Export JSON
                </button>
                <label className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition-all ${darkMode ? "bg-blue-900/30 text-blue-400 hover:bg-blue-900/50" : "bg-blue-50 text-blue-700 hover:bg-blue-100"}`}>
                  <Upload size={16} /> Import JSON
                  <input type="file" accept=".json" onChange={importData} className="hidden" />
                </label>
                <button onClick={() => setShowShortcuts(true)} className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${darkMode ? "bg-slate-700 text-gray-300 hover:bg-slate-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                  <Keyboard size={16} /> Shortcuts
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Add Todo */}
            <div className={`${darkMode ? "bg-slate-800" : "bg-white"} rounded-2xl shadow-lg p-5 mb-4`}>
              <div className="flex flex-col gap-3">
                <div className="relative">
                  <input ref={inputRef} type="text" value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyDown={e => e.key === "Enter" && addTodo()} placeholder="เพิ่มรายการใหม่... (Ctrl+N)" className={`w-full px-4 py-3 pr-12 border-2 rounded-xl focus:outline-none transition-colors ${darkMode ? "border-slate-600 bg-slate-700 text-white placeholder-gray-400 focus:border-indigo-400" : "border-gray-200 focus:border-indigo-400 text-gray-800"}`} />
                  <button onClick={addTodo} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors"><Plus size={20} /></button>
                </div>
                <div className="relative">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="ค้นหารายการ... (Ctrl+F)" className={`w-full pl-10 pr-10 py-2 border-2 rounded-xl focus:outline-none transition-colors ${darkMode ? "border-slate-600 bg-slate-700 text-white placeholder-gray-400 focus:border-indigo-400" : "border-gray-200 focus:border-indigo-400 text-gray-800"}`} />
                  {searchQuery && <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={16} /></button>}
                </div>
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-600"}`}>ความสำคัญ:</span>
                    {(Object.keys(priorityConfig) as Priority[]).map(p => (
                      <button key={p} onClick={() => setSelectedPriority(p)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${selectedPriority === p ? `${priorityConfig[p].bg} ${priorityConfig[p].text} ring-2 ring-offset-1 ring-${p === "high" ? "red" : p === "medium" ? "yellow" : "green"}-400` : `${darkMode ? "bg-slate-700 text-gray-300" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}`}>
                        <span className={`inline-block w-2 h-2 rounded-full ${priorityConfig[p].dot} mr-1.5`}></span>{priorityConfig[p].label}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-600"}`}>หมวดหมู่:</span>
                    {(Object.keys(categoryConfig) as Category[]).map(cat => (
                      <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${selectedCategory === cat ? `${categoryConfig[cat].bg} ${categoryConfig[cat].text} ring-2 ring-offset-1 ring-${cat === "work" ? "blue" : cat === "personal" ? "purple" : cat === "shopping" ? "orange" : cat === "health" ? "pink" : cat === "finance" ? "emerald" : "indigo"}-400` : `${darkMode ? "bg-slate-700 text-gray-300" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}`}>
                        {categoryConfig[cat].icon} {categoryConfig[cat].label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedTodos.size > 0 && (
              <div className={`${darkMode ? "bg-indigo-900" : "bg-indigo-500"} text-white rounded-xl p-3 mb-4 flex items-center justify-between`}>
                <span>{selectedTodos.size} รายการที่เลือก</span>
                <div className="flex gap-2">
                  <button onClick={bulkComplete} className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center gap-1"><Check size={16} />เสร็จ</button>
                  <button onClick={bulkDelete} className="px-3 py-1.5 bg-red-500 hover:bg-red-600 rounded-lg transition-colors flex items-center gap-1"><Trash2 size={16} />ลบ</button>
                </div>
              </div>
            )}

            {/* Filter Tabs */}
            <div className={`${darkMode ? "bg-slate-800" : "bg-white"} rounded-2xl shadow-lg p-2 mb-4 flex items-center justify-between`}>
              <div className="flex gap-1">
                {(Object.keys(filterLabels) as Filter[]).map(f => (
                  <button key={f} onClick={() => setFilter(f)} className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${filter === f ? "bg-indigo-500 text-white" : `${darkMode ? "text-gray-300 hover:bg-slate-700" : "text-gray-600 hover:bg-gray-100"}`}`}>{filterLabels[f]}</button>
                ))}
              </div>
              <button onClick={selectAll} className={`px-3 py-2 rounded-xl text-sm transition-all ${selectedTodos.size === filteredTodos.length && filteredTodos.length > 0 ? "bg-indigo-500 text-white" : `${darkMode ? "text-gray-300 hover:bg-slate-700" : "text-gray-600 hover:bg-gray-100"}`}`}>
                {selectedTodos.size === filteredTodos.length && filteredTodos.length > 0 ? <CheckSquare size={18} /> : <Square size={18} />}
              </button>
            </div>

            {/* Todo List */}
            <div className="space-y-3">
              {filteredTodos.length === 0 ? (
                <div className={`${darkMode ? "bg-slate-800" : "bg-white"} rounded-2xl shadow-lg p-12 text-center`}>
                  <div className="text-6xl mb-4">{searchQuery ? "🔍" : view === "pinned" ? "📌" : view === "archived" ? "📦" : "🎉"}</div>
                  <p className={`text-lg ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    {searchQuery ? "ไม่พบรายการที่ค้นหา" : view === "pinned" ? "ยังไม่มีรายการปักหมุด" : view === "archived" ? "คลังว่างเปล่า" : filter === "all" ? "ยังไม่มีรายการ ลองเพิ่มดูสิ!" : filter === "active" ? "ไม่มีรายการที่ยังไม่เสร็จ" : "ไม่มีรายการที่เสร็จแล้ว"}
                  </p>
                </div>
              ) : filteredTodos.map(todo => (
                <div key={todo.id} className={`${darkMode ? "bg-slate-800" : "bg-white"} rounded-2xl shadow-md p-4 transition-all duration-300 ${deletingId === todo.id ? "opacity-0 scale-95 translate-x-8" : ""} ${todo.completed ? "opacity-70" : ""}`}>
                  {editingId === todo.id ? (
                    <div className="flex gap-2">
                      <input ref={editInputRef} type="text" value={editValue} onChange={e => setEditValue(e.target.value)} onKeyDown={e => { if (e.key === "Enter") saveEdit(todo.id); if (e.key === "Escape") setEditingId(null); }} onBlur={() => saveEdit(todo.id)} className={`flex-1 px-3 py-2 border-2 rounded-lg focus:outline-none ${darkMode ? "border-indigo-400 bg-slate-700 text-white" : "border-indigo-300 text-gray-800"}`} />
                      <button onClick={() => saveEdit(todo.id)} className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg"><Check size={18} /></button>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      {/* Select */}
                      <button onClick={() => toggleSelect(todo.id)} className={`flex-shrink-0 w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all mt-0.5 ${selectedTodos.has(todo.id) ? "bg-indigo-500 border-indigo-500 text-white" : `${darkMode ? "border-slate-600" : "border-gray-300"} hover:border-indigo-400`}`}>
                        {selectedTodos.has(todo.id) && <Check size={14} />}
                      </button>

                      {/* Checkbox */}
                      <button onClick={() => toggleTodo(todo.id)} className={`flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${todo.completed ? "bg-green-500 border-green-500 text-white" : `${darkMode ? "border-slate-500" : "border-gray-300"} hover:border-indigo-400`}`}>
                        {todo.completed && <Check size={16} />}
                      </button>

                      {/* Pin */}
                      <button onClick={() => togglePin(todo.id)} className={`flex-shrink-0 p-1 transition-all ${todo.pinned ? "text-red-500" : `${darkMode ? "text-gray-500 hover:text-red-400" : "text-gray-300 hover:text-red-400"}`}`}>
                        {todo.pinned ? <Pin size={16} fill="currentColor" /> : <Pin size={16} />}
                      </button>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className={`transition-all ${todo.completed ? "line-through opacity-60" : ""} ${darkMode ? "text-white" : "text-gray-800"}`}>{todo.text}</p>

                        {/* Tags */}
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${priorityConfig[todo.priority].bg} ${priorityConfig[todo.priority].text} ${priorityConfig[todo.priority].border}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${priorityConfig[todo.priority].dot} mr-1.5`}></span>{priorityConfig[todo.priority].label}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${categoryConfig[todo.category].bg} ${categoryConfig[todo.category].text}`}>{categoryConfig[todo.category].icon} {categoryConfig[todo.category].label}</span>
                          {todo.dueDate && (
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getDueDateStatus(todo.dueDate) === "overdue" ? "bg-red-100 text-red-700" : getDueDateStatus(todo.dueDate) === "today" ? "bg-yellow-100 text-yellow-700" : `${darkMode ? "bg-slate-700 text-gray-300" : "bg-gray-100 text-gray-600"}`}`}>
                              <Calendar size={12} />{getDueDateStatus(todo.dueDate) === "overdue" ? "เลยกำหนด" : getDueDateStatus(todo.dueDate) === "today" ? "วันนี้" : new Date(todo.dueDate).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}
                            </span>
                          )}
                        </div>

                        {/* Subtasks */}
                        {todo.subtasks.length > 0 && (
                          <div className="mt-3">
                            <button onClick={() => { setExpandedSubtasks(prev => { const next = new Set(prev); next.has(todo.id) ? next.delete(todo.id) : next.add(todo.id); return next; }); }} className={`flex items-center gap-1 text-xs ${darkMode ? "text-gray-400 hover:text-gray-300" : "text-gray-500 hover:text-gray-600"}`}>
                              {expandedSubtasks.has(todo.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                              ลิสย่อย ({todo.subtasks.filter(s => s.completed).length}/{todo.subtasks.length})
                            </button>
                            {expandedSubtasks.has(todo.id) && (
                              <div className="mt-2 space-y-1 pl-4 border-l-2 border-indigo-200">
                                {todo.subtasks.map(sub => (
                                  <div key={sub.id} className="flex items-center gap-2">
                                    <button onClick={() => toggleSubtask(todo.id, sub.id)} className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${sub.completed ? "bg-green-500 border-green-500 text-white" : `${darkMode ? "border-slate-500" : "border-gray-300"}`}`}>
                                      {sub.completed && <Check size={12} />}
                                    </button>
                                    <span className={`text-sm flex-1 ${sub.completed ? "line-through opacity-50" : ""} ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{sub.text}</span>
                                    <button onClick={() => deleteSubtask(todo.id, sub.id)} className={`p-1 ${darkMode ? "text-gray-500 hover:text-red-400" : "text-gray-400 hover:text-red-500"}`}><X size={14} /></button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Notes */}
                        {editingNotes === todo.id ? (
                          <div className="mt-3">
                            <textarea ref={notesInputRef} placeholder="เพิ่มโน้ต..." defaultValue={todo.notes} onBlur={e => { setTodos(todos.map(t => t.id === todo.id ? { ...t, notes: e.target.value } : t)); setEditingNotes(null); }} className={`w-full px-3 py-2 border-2 rounded-lg focus:outline-none resize-none ${darkMode ? "border-indigo-400 bg-slate-700 text-white" : "border-indigo-300 text-gray-800"}`} rows={3} />
                          </div>
                        ) : todo.notes && (
                          <button onClick={() => setEditingNotes(todo.id)} className={`mt-2 text-sm text-left ${darkMode ? "text-gray-400 hover:text-gray-300" : "text-gray-500 hover:text-gray-600"}`}>
                            <StickyNote size={14} className="inline mr-1" />{todo.notes.slice(0, 50)}{todo.notes.length > 50 ? "..." : ""}
                          </button>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {expandedSubtasks.has(todo.id) ? null : (
                          <button onClick={() => { setExpandedSubtasks(prev => { const next = new Set(prev); next.add(todo.id); return next; }); setNewSubtaskText(prev => ({ ...prev, [todo.id]: "" })); }} className={`p-2 ${darkMode ? "text-gray-500 hover:text-indigo-400 hover:bg-slate-700" : "text-gray-400 hover:text-indigo-500 hover:bg-indigo-50"} rounded-lg transition-colors`} title="เพิ่มลิสย่อย">+</button>
                        )}
                        {editingNotes !== todo.id && <button onClick={() => setEditingNotes(todo.id)} className={`p-2 ${darkMode ? "text-gray-500 hover:text-yellow-400 hover:bg-slate-700" : "text-gray-400 hover:text-yellow-500 hover:bg-yellow-50"} rounded-lg transition-colors`}><StickyNote size={18} /></button>}
                        <button onClick={() => startEditing(todo)} className={`p-2 ${darkMode ? "text-gray-500 hover:text-indigo-400 hover:bg-slate-700" : "text-gray-400 hover:text-indigo-500 hover:bg-indigo-50"} rounded-lg transition-colors`}><Edit3 size={18} /></button>
                        <button onClick={() => toggleArchive(todo.id)} className={`p-2 ${darkMode ? "text-gray-500 hover:text-blue-400 hover:bg-slate-700" : "text-gray-400 hover:text-blue-500 hover:bg-blue-50"} rounded-lg transition-colors`} title={todo.archived ? "คืนจากคลัง" : "เก็บเข้าคลัง"}><Archive size={18} /></button>
                        <button onClick={() => deleteTodo(todo.id)} className={`p-2 ${darkMode ? "text-gray-500 hover:text-red-400 hover:bg-slate-700" : "text-gray-400 hover:text-red-500 hover:bg-red-50"} rounded-lg transition-colors`}><Trash2 size={18} /></button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className={`${darkMode ? "bg-slate-800" : "bg-white"} rounded-2xl shadow-lg p-4 mt-4`}>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <p className={`font-medium ${darkMode ? "text-gray-300" : "text-gray-600"}`}><span className="text-indigo-600 font-bold text-lg">{remainingCount}</span> รายการที่ยังไม่เสร็จ</p>
                {completedCount > 0 && <button onClick={clearCompleted} className="text-sm text-red-500 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors font-medium">ลบรายการที่เสร็จแล้ว ({completedCount})</button>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
