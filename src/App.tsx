import { useState, useEffect, useRef, useCallback } from "react";
import {
  Plus, Trash2, Check, Edit3, Search, Calendar, BarChart3, X, Moon, Sun,
  Pin, Archive, RotateCcw, CheckSquare, Square, Download, Upload, StickyNote,
  ChevronDown, ChevronRight, Keyboard, Undo, Star, GripVertical, Clock, Bell,
  Repeat, Tag, Filter, Timer, Target, History, MessageCircle, Users, Share2,
  ChevronLeft, CalendarDays, CalendarRange, Flame, Zap, Brain, Save, Eye,
  MoreHorizontal, PlusCircle, MinusCircle, Play, Pause, RotateCcw as Reset,
  Coffee, Trophy, TrendingUp
} from "lucide-react";

type Priority = "low" | "medium" | "high";
type Filter = "all" | "active" | "completed";
type Category = "work" | "personal" | "shopping" | "health" | "finance" | "study";
type View = "list" | "pinned" | "archived" | "calendar";
type Recurrence = "none" | "daily" | "weekly" | "monthly" | "yearly";
type PomodoroState = "idle" | "working" | "break" | "longBreak";

interface Comment {
  id: string;
  text: string;
  author: string;
  createdAt: string;
}

interface Label {
  id: string;
  name: string;
  color: string;
}

interface Subtask {
  id: string;
  text: string;
  completed: boolean;
}

interface ActivityLog {
  id: string;
  action: string;
  todoText: string;
  timestamp: string;
}

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  priority: Priority;
  category: Category;
  dueDate: string | null;
  dueTime: string | null;
  reminder: string | null;
  notes: string;
  subtasks: Subtask[];
  pinned: boolean;
  archived: boolean;
  createdAt: string;
  completedAt: string | null;
  recurrence: Recurrence;
  labels: string[];
  comments: Comment[];
  assignee: string;
  order: number;
}

interface FavoriteFilter {
  id: string;
  name: string;
  filter: { filter: Filter; category: Category | "all"; priority: Priority | "all" };
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

const defaultLabels: Label[] = [
  { id: "urgent", name: "เร่งด่วน", color: "bg-red-500" },
  { id: "meeting", name: "ประชุม", color: "bg-blue-500" },
  { id: "call", name: "โทร", color: "bg-green-500" },
  { id: "email", name: "อีเมล", color: "bg-yellow-500" },
  { id: "travel", name: "เดินทาง", color: "bg-purple-500" },
  { id: "home", name: "บ้าน", color: "bg-pink-500" },
];

const recurrenceLabels = {
  none: "ไม่ทำซ้ำ",
  daily: "ทุกวัน",
  weekly: "ทุกสัปดาห์",
  monthly: "ทุกเดือน",
  yearly: "ทุกปี",
};

function App() {
  const [todos, setTodos] = useState<Todo[]>([
    {
      id: "1", text: "ประชุมทีมงาน", completed: false, priority: "high", category: "work",
      dueDate: new Date().toISOString().split("T")[0], dueTime: "14:00", reminder: "30",
      notes: "เตรียม slide และรายงานความคืบหน้า",
      subtasks: [{ id: "s1", text: "เตรียม slide", completed: true }, { id: "s2", text: "ส่ง agenda", completed: false }],
      pinned: true, archived: false, createdAt: new Date().toISOString(), completedAt: null,
      recurrence: "weekly", labels: ["meeting"], comments: [], assignee: "คุณทดสอบ", order: 0,
    },
    {
      id: "2", text: "ออกกำลังกาย 30 นาที", completed: false, priority: "medium", category: "health",
      dueDate: new Date().toISOString().split("T")[0], dueTime: "07:00", reminder: "15",
      notes: "วิ่งหรือเวทเทรนนิ่ง", subtasks: [], pinned: false, archived: false,
      createdAt: new Date().toISOString(), completedAt: null, recurrence: "daily",
      labels: ["urgent"], comments: [], assignee: "", order: 1,
    },
    {
      id: "3", text: "ซื้อของในครัว", completed: true, priority: "low", category: "shopping",
      dueDate: null, dueTime: null, reminder: null, notes: "ผัก, เนื้อ, ไข่",
      subtasks: [], pinned: false, archived: false, createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(), recurrence: "weekly", labels: [],
      comments: [{ id: "c1", text: "ซื้อเพิ่ม: น้ำปลา", author: "แม่", createdAt: new Date().toISOString() }],
      assignee: "", order: 2,
    },
    {
      id: "4", text: "จ่ายบิลค่าไฟ", completed: false, priority: "high", category: "finance",
      dueDate: new Date(Date.now() - 86400000).toISOString().split("T")[0], dueTime: "18:00", reminder: "60",
      notes: "วงเงิน 2000 บาท", subtasks: [], pinned: false, archived: false,
      createdAt: new Date().toISOString(), completedAt: null, recurrence: "monthly",
      labels: ["urgent", "email"], comments: [], assignee: "ผม", order: 3,
    },
    {
      id: "5", text: "อ่านหนังสือ React", completed: false, priority: "medium", category: "study",
      dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0], dueTime: "20:00", reminder: "30",
      notes: "Chapter 5-7", subtasks: [{ id: "s3", text: "Chapter 5", completed: true }, { id: "s4", text: "Chapter 6", completed: false }, { id: "s5", text: "Chapter 7", completed: false }],
      pinned: false, archived: false, createdAt: new Date().toISOString(), completedAt: null,
      recurrence: "none", labels: ["home"], comments: [], assignee: "", order: 4,
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
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState<Priority | "all">("all");
  const [darkMode, setDarkMode] = useState(false);
  const [autoDarkMode, setAutoDarkMode] = useState(false);
  const [selectedTodos, setSelectedTodos] = useState<Set<string>>(new Set());
  const [expandedSubtasks, setExpandedSubtasks] = useState<Set<string>>(new Set());
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [newSubtaskText, setNewSubtaskText] = useState<{ [key: string]: string }>({});
  const [newCommentText, setNewCommentText] = useState<{ [key: string]: string }>({});
  const [deletedTodos, setDeletedTodos] = useState<DeletedTodo[]>([]);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [favoriteFilters, setFavoriteFilters] = useState<FavoriteFilter[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [draggedTodo, setDraggedTodo] = useState<string | null>(null);
  const [dragOverTodo, setDragOverTodo] = useState<string | null>(null);
  const [labels] = useState<Label[]>(defaultLabels);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [showLabelPicker, setShowLabelPicker] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [dailyGoal, setDailyGoal] = useState(5);
  const [pomodoroActive, setPomodoroActive] = useState(false);
  const [pomodoroState, setPomodoroState] = useState<PomodoroState>("idle");
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60);
  const [pomodoroSessions, setPomodoroSessions] = useState(0);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([
    "💡 ลองแบ่งงานใหญ่เป็นงานย่อยๆ",
    "💡 งานที่ต้องทำทุกวันควรตั้งเวลาคงที่",
    "💡 พยายามทำงานยากก่อนตอนเช้า",
  ]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto Dark Mode
  useEffect(() => {
    if (autoDarkMode) {
      const hour = new Date().getHours();
      setDarkMode(hour >= 18 || hour < 6);
    }
  }, [autoDarkMode]);

  // Pomodoro Timer
  useEffect(() => {
    let interval: number;
    if (pomodoroActive && pomodoroTime > 0) {
      interval = setInterval(() => setPomodoroTime(t => t - 1), 1000);
    } else if (pomodoroTime === 0) {
      if (pomodoroState === "working") {
        setPomodoroSessions(s => s + 1);
        if ((pomodoroSessions + 1) % 4 === 0) {
          setPomodoroState("longBreak");
          setPomodoroTime(15 * 60);
        } else {
          setPomodoroState("break");
          setPomodoroTime(5 * 60);
        }
      } else {
        setPomodoroState("working");
        setPomodoroTime(25 * 60);
      }
      setPomodoroActive(false);
      if (Notification.permission === "granted") {
        new Notification("🍅 Pomodoro", { body: pomodoroState === "working" ? "เริ่มทำงานได้เลย!" : "พักผ่อนสักครู่" });
      }
    }
    return () => clearInterval(interval);
  }, [pomodoroActive, pomodoroTime, pomodoroState, pomodoroSessions]);

  // Reminder notifications
  useEffect(() => {
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
    const checkReminders = setInterval(() => {
      const now = new Date();
      todos.forEach(todo => {
        if (!todo.completed && todo.archived && !todo.dueDate) return;
        if (todo.dueDate && todo.dueTime && todo.reminder) {
          const due = new Date(`${todo.dueDate}T${todo.dueTime}`);
          const reminderTime = new Date(due.getTime() - parseInt(todo.reminder) * 60000);
          if (Math.abs(now.getTime() - reminderTime.getTime()) < 60000) {
            new Notification(`🔔 การแจ้งเตือน: ${todo.text}`, { body: `ถึงกำหนดในอีก ${todo.reminder} นาที` });
          }
        }
      });
    }, 60000);
    return () => clearInterval(checkReminders);
  }, [todos]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case "n": e.preventDefault(); inputRef.current?.focus(); break;
          case "f": e.preventDefault(); document.querySelector<HTMLInputElement>('[placeholder="🔍 ค้นหารายการ..."]')?.focus(); break;
          case "d": e.preventDefault(); setDarkMode(d => !d); break;
          case "z": e.preventDefault(); handleUndo(); break;
          case "p": e.preventDefault(); setPomodoroActive(a => !a); break;
        }
      }
      if (e.key === "Escape") { setEditingId(null); setEditingNotes(null); setShowLabelPicker(null); }
      if (e.key === "?") setShowShortcuts(s => !s);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const logActivity = (action: string, todoText: string) => {
    setActivityLog(prev => [{ id: Date.now().toString(), action, todoText, timestamp: new Date().toISOString() }, ...prev.slice(0, 49)]);
  };

  const generateId = () => Math.random().toString(36).substring(2, 9);

  const getDueDateStatus = (dueDate: string | null, dueTime: string | null) => {
    if (!dueDate) return null;
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    if (dueDate < today) return "overdue";
    if (dueDate === today) {
      if (dueTime) {
        const [h, m] = dueTime.split(":").map(Number);
        const due = new Date(now);
        due.setHours(h, m, 0);
        if (due < now) return "overdue";
        if (due.getTime() - now.getTime() < 3600000) return "soon";
      }
      return "today";
    }
    return "upcoming";
  };

  const addTodo = () => {
    const trimmedText = inputValue.trim();
    if (!trimmedText) return;
    const newTodo: Todo = {
      id: generateId(), text: trimmedText, completed: false,
      priority: selectedPriority, category: selectedCategory,
      dueDate: null, dueTime: null, reminder: null, notes: "",
      subtasks: [], pinned: false, archived: false, createdAt: new Date().toISOString(),
      completedAt: null, recurrence: "none", labels: [...selectedLabels],
      comments: [], assignee: "", order: todos.length,
    };
    setTodos([newTodo, ...todos]);
    setInputValue("");
    setSelectedLabels([]);
    logActivity("สร้างรายการ", trimmedText);
    inputRef.current?.focus();
  };

  const toggleTodo = (id: string) => {
    setTodos(todos.map(todo => {
      if (todo.id !== id) return todo;
      const newCompleted = !todo.completed;
      if (newCompleted && todo.recurrence !== "none") {
        const nextDate = new Date(todo.dueDate || new Date());
        if (todo.recurrence === "daily") nextDate.setDate(nextDate.getDate() + 1);
        else if (todo.recurrence === "weekly") nextDate.setDate(nextDate.getDate() + 7);
        else if (todo.recurrence === "monthly") nextDate.setMonth(nextDate.getMonth() + 1);
        else if (todo.recurrence === "yearly") nextDate.setFullYear(nextDate.getFullYear() + 1);
        setTimeout(() => {
          setTodos(prev => [...prev, { ...todo, id: generateId(), dueDate: nextDate.toISOString().split("T")[0], completed: false, completedAt: null, createdAt: new Date().toISOString() }]);
        }, 100);
      }
      logActivity(newCompleted ? "ทำเสร็จ" : "ยกเลิกเสร็จ", todo.text);
      return { ...todo, completed: newCompleted, completedAt: newCompleted ? new Date().toISOString() : null };
    }));
  };

  const deleteTodo = (id: string) => {
    const todo = todos.find(t => t.id === id);
    if (todo) {
      setDeletedTodos(prev => [...prev, { ...todo, deletedAt: Date.now() }]);
      logActivity("ลบ", todo.text);
    }
    setDeletingId(id);
    setTimeout(() => {
      setTodos(todos.filter(t => t.id !== id));
      setDeletingId(null);
      setSelectedTodos(prev => { const next = new Set(prev); next.delete(id); return next; });
    }, 400);
  };

  const handleUndo = () => {
    if (deletedTodos.length === 0) return;
    const lastDeleted = deletedTodos[deletedTodos.length - 1];
    setDeletedTodos(prev => prev.slice(0, -1));
    setTodos(prev => [lastDeleted, ...prev]);
    logActivity("กู้คืน", lastDeleted.text);
  };

  const startEditing = (todo: Todo) => { setEditingId(todo.id); setEditValue(todo.text); };
  const saveEdit = (id: string) => {
    const trimmed = editValue.trim();
    if (trimmed) {
      setTodos(todos.map(t => t.id === id ? { ...t, text: trimmed } : t));
      logActivity("แก้ไข", trimmed);
    }
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

  const addComment = (todoId: string) => {
    const text = newCommentText[todoId]?.trim();
    if (!text) return;
    setTodos(todos.map(t => {
      if (t.id !== todoId) return t;
      return { ...t, comments: [...t.comments, { id: generateId(), text, author: "ผม", createdAt: new Date().toISOString() }] };
    }));
    setNewCommentText(prev => ({ ...prev, [todoId]: "" }));
  };

  const toggleLabel = (todoId: string, labelId: string) => {
    setTodos(todos.map(t => {
      if (t.id !== todoId) return t;
      const hasLabel = t.labels.includes(labelId);
      return { ...t, labels: hasLabel ? t.labels.filter(l => l !== labelId) : [...t.labels, labelId] };
    }));
  };

  const handleDragStart = (e: React.DragEvent, todoId: string) => {
    setDraggedTodo(todoId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, todoId: string) => {
    e.preventDefault();
    setDragOverTodo(todoId);
  };

  const handleDragEnd = () => {
    if (draggedTodo && dragOverTodo && draggedTodo !== dragOverTodo) {
      const draggedIndex = todos.findIndex(t => t.id === draggedTodo);
      const overIndex = todos.findIndex(t => t.id === dragOverTodo);
      const newTodos = [...todos];
      const [removed] = newTodos.splice(draggedIndex, 1);
      newTodos.splice(overIndex, 0, removed);
      setTodos(newTodos.map((t, i) => ({ ...t, order: i })));
    }
    setDraggedTodo(null);
    setDragOverTodo(null);
  };

  const saveFavoriteFilter = () => {
    const name = prompt("ตั้งชื่อชุดกรอง:");
    if (!name) return;
    setFavoriteFilters(prev => [...prev, {
      id: generateId(), name,
      filter: { filter, category: selectedCategoryFilter, priority: selectedPriorityFilter }
    }]);
  };

  const applyFavoriteFilter = (f: FavoriteFilter) => {
    setFilter(f.filter.filter);
    setSelectedCategoryFilter(f.filter.category);
    setSelectedPriorityFilter(f.filter.priority);
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
        if (Array.isArray(data)) {
          setTodos(data);
          logActivity("นำเข้าไฟล์", `${data.length} รายการ`);
        }
      } catch { alert("Invalid JSON file"); }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const toggleSelect = (id: string) => {
    setSelectedTodos(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    const visibleIds = filteredTodos.map(t => t.id);
    setSelectedTodos(new Set(selectedTodos.size === visibleIds.length && filteredTodos.length > 0 ? [] : visibleIds));
  };

  const bulkDelete = () => {
    selectedTodos.forEach(id => {
      const todo = todos.find(t => t.id === id);
      if (todo) { setDeletedTodos(prev => [...prev, { ...todo, deletedAt: Date.now() }]); logActivity("ลบ", todo.text); }
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
    completed.forEach(t => { setDeletedTodos(prev => [...prev, { ...t, deletedAt: Date.now() }]); logActivity("ลบ", t.text); });
    setTodos(todos.filter(t => !t.completed));
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
      if (selectedPriorityFilter !== "all" && t.priority !== selectedPriorityFilter) return false;
      if (searchQuery && !t.text.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (selectedLabels.length > 0 && !selectedLabels.some(l => t.labels.includes(l))) return false;
      return true;
    })
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return a.order - b.order;
    });

  const remainingCount = todos.filter(t => !t.completed && !t.archived).length;
  const completedCount = todos.filter(t => t.completed && !t.archived).length;
  const overdueCount = todos.filter(t => !t.completed && getDueDateStatus(t.dueDate, t.dueTime) === "overdue").length;
  const pinnedCount = todos.filter(t => t.pinned && !t.archived).length;
  const todayCompleted = todos.filter(t => t.completed && t.completedAt?.startsWith(new Date().toISOString().split("T")[0])).length;

  const chartData = {
    total: todos.filter(t => !t.archived).length,
    completed: todos.filter(t => t.completed && !t.archived).length,
    get percent() { return this.total ? Math.round((this.completed / this.total) * 100) : 0; },
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const getCalendarDays = () => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: { date: number; month: number; year: number; isCurrentMonth: boolean; todos: Todo[] }[] = [];
    const prevMonth = new Date(year, month, 0);
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = prevMonth.getDate() - i;
      const dateStr = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({ date: d, month: prevMonth.getMonth(), year: prevMonth.getFullYear(), isCurrentMonth: false, todos: todos.filter(t => t.dueDate === dateStr) });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({ date: d, month, year, isCurrentMonth: true, todos: todos.filter(t => t.dueDate === dateStr) });
    }
    const remaining = 42 - days.length;
    const nextMonth = new Date(year, month + 2, 0);
    for (let d = 1; d <= remaining; d++) {
      const dateStr = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({ date: d, month: nextMonth.getMonth(), year: nextMonth.getFullYear(), isCurrentMonth: false, todos: todos.filter(t => t.dueDate === dateStr) });
    }
    return days;
  };

  const weekDays = ["อา", "จ", "อัง", "พ", "พฤ", "ศ", "ส"];
  const monthNames = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];

  return (
    <div className={`min-h-screen py-6 px-4 transition-colors ${darkMode ? "bg-slate-900" : "bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100"}`}>
      {/* Modals */}
      {showShortcuts && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowShortcuts(false)}>
          <div className={`${darkMode ? "bg-slate-800" : "bg-white"} rounded-2xl shadow-2xl p-6 max-w-md w-full`} onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Keyboard size={20} className="text-indigo-500" /> Keyboard Shortcuts</h2>
            <div className="space-y-2 text-sm">
              {[
                ["Ctrl + N", "เพิ่มรายการใหม่"], ["Ctrl + F", "ค้นหา"], ["Ctrl + D", "Dark/Light Mode"],
                ["Ctrl + Z", "ยกเลิกการลบล่าสุด"], ["Ctrl + P", "Pomodoro Play/Pause"], ["Esc", "ปิดโหมดแก้ไข"],
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

      {showActivityLog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowActivityLog(false)}>
          <div className={`${darkMode ? "bg-slate-800" : "bg-white"} rounded-2xl shadow-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto`} onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><History size={20} className="text-indigo-500" /> ประวัติการทำรายการ</h2>
            {activityLog.length === 0 ? (
              <p className={`text-center py-8 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>ยังไม่มีประวัติ</p>
            ) : (
              <div className="space-y-2">
                {activityLog.map(log => (
                  <div key={log.id} className={`p-3 rounded-xl ${darkMode ? "bg-slate-700" : "bg-gray-50"}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-medium">{log.action}</span>
                        <span className={darkMode ? "text-gray-300" : "text-gray-600"}> "{log.todoText}"</span>
                      </div>
                      <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-400"}`}>{new Date(log.timestamp).toLocaleString("th-TH")}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className={`text-3xl font-bold mb-2 ${darkMode ? "text-white" : "text-gray-800"}`}>📝 รายการสิ่งที่ต้องทำ v3.0</h1>
          <p className={darkMode ? "text-gray-400" : "text-gray-500"}>จัดการงานของคุณอย่างมีประสิทธิภาพ</p>
        </div>

        {/* Pomodoro Timer */}
        <div className={`${darkMode ? "bg-slate-800" : "bg-white"} rounded-2xl shadow-lg p-4 mb-4 flex items-center justify-between flex-wrap gap-4`}>
          <div className="flex items-center gap-4">
            <div className={`text-3xl font-mono font-bold ${pomodoroState === "working" ? "text-red-500" : pomodoroState === "break" ? "text-green-500" : "text-blue-500"}`}>
              {formatTime(pomodoroTime)}
            </div>
            <div>
              <div className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                {pomodoroState === "idle" ? "🍅 พร้อมเริ่ม" : pomodoroState === "working" ? "⚡ ทำงาน" : pomodoroState === "break" ? "☕ พัก" : "🛋️ พักยาว"}
              </div>
              <div className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-400"}`}>Sessions: {pomodoroSessions}</div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setPomodoroActive(a => !a)} className={`p-2 rounded-xl ${pomodoroActive ? "bg-yellow-500 text-white" : "bg-indigo-500 text-white"} hover:opacity-80 transition-opacity`}>
              {pomodoroActive ? <Pause size={20} /> : <Play size={20} />}
            </button>
            <button onClick={() => { setPomodoroActive(false); setPomodoroState("idle"); setPomodoroTime(25 * 60); }} className={`p-2 rounded-xl ${darkMode ? "bg-slate-700 text-gray-300" : "bg-gray-100 text-gray-600"} hover:opacity-80`}><Reset size={20} /></button>
          </div>
        </div>

        {/* Daily Goal */}
        <div className={`${darkMode ? "bg-slate-800" : "bg-white"} rounded-2xl shadow-lg p-4 mb-4`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target size={20} className="text-indigo-500" />
              <span className={`font-medium ${darkMode ? "text-white" : "text-gray-700"}`}>เป้าหมายวันนี้</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{todayCompleted}/{dailyGoal}</span>
              <button onClick={() => setShowGoalModal(true)} className={`p-1.5 rounded-lg ${darkMode ? "bg-slate-700 text-gray-400" : "bg-gray-100 text-gray-500"} hover:opacity-80`}><Edit3 size={14} /></button>
            </div>
          </div>
          <div className={`h-3 rounded-full overflow-hidden ${darkMode ? "bg-slate-700" : "bg-gray-100"}`}>
            <div className={`h-full rounded-full transition-all ${todayCompleted >= dailyGoal ? "bg-green-500" : "bg-gradient-to-r from-indigo-500 to-purple-500"}`} style={{ width: `${Math.min((todayCompleted / dailyGoal) * 100, 100)}%` }} />
          </div>
          {todayCompleted >= dailyGoal && <div className="text-center mt-2 text-green-500 font-medium">🎉 บรรลุเป้าหมายแล้ว!</div>}
        </div>

        {showGoalModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowGoalModal(false)}>
            <div className={`${darkMode ? "bg-slate-800" : "bg-white"} rounded-2xl shadow-2xl p-6 w-full max-w-sm`} onClick={e => e.stopPropagation()}>
              <h3 className="font-bold mb-4">ตั้งเป้าหมายวันนี้</h3>
              <input type="number" min="1" max="50" value={dailyGoal} onChange={e => setDailyGoal(parseInt(e.target.value) || 1)} className={`w-full px-4 py-2 border-2 rounded-xl mb-4 ${darkMode ? "border-slate-600 bg-slate-700 text-white" : "border-gray-200 text-gray-800"}`} />
              <button onClick={() => setShowGoalModal(false)} className="w-full py-2 bg-indigo-500 text-white rounded-xl">บันทึก</button>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-72 flex-shrink-0 space-y-4">
            {/* Dark Mode Toggle */}
            <div className={`${darkMode ? "bg-slate-800" : "bg-white"} rounded-2xl shadow-lg p-4`}>
              <div className="flex items-center justify-between mb-3">
                <span className={`font-medium ${darkMode ? "text-white" : "text-gray-700"}`}>{darkMode ? "🌙 โหมดกลางคืน" : "☀️ โหมดกลางวัน"}</span>
                <button onClick={() => setDarkMode(d => !d)} className={`p-2 rounded-xl ${darkMode ? "bg-slate-700 text-yellow-400" : "bg-gray-100 text-gray-600"}`}>{darkMode ? <Sun size={18} /> : <Moon size={18} />}</button>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={autoDarkMode} onChange={e => setAutoDarkMode(e.target.checked)} className="w-4 h-4 rounded" />
                <span className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Auto (18:00-06:00)</span>
              </label>
            </div>

            {/* Pomodoro */}
            <div className={`${darkMode ? "bg-slate-800" : "bg-white"} rounded-2xl shadow-lg p-4`}>
              <h3 className={`font-semibold mb-3 ${darkMode ? "text-white" : "text-gray-700"}`}>🍅 Pomodoro</h3>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className={`p-2 rounded-lg ${darkMode ? "bg-slate-700" : "bg-gray-50"}`}><div className="text-xs text-gray-400">25m</div><div className="text-lg">⚡</div></div>
                <div className={`p-2 rounded-lg ${darkMode ? "bg-slate-700" : "bg-gray-50"}`}><div className="text-xs text-gray-400">5m</div><div className="text-lg">☕</div></div>
                <div className={`p-2 rounded-lg ${darkMode ? "bg-slate-700" : "bg-gray-50"}`}><div className="text-xs text-gray-400">15m</div><div className="text-lg">🛋️</div></div>
              </div>
            </div>

            {/* Categories */}
            <div className={`${darkMode ? "bg-slate-800" : "bg-white"} rounded-2xl shadow-lg p-4`}>
              <h3 className={`font-semibold mb-3 flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-700"}`}><BarChart3 size={18} className="text-indigo-500" /> หมวดหมู่</h3>
              <div className="space-y-1">
                <button onClick={() => setSelectedCategoryFilter("all")} className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all ${selectedCategoryFilter === "all" ? "bg-indigo-100 text-indigo-700" : `${darkMode ? "text-gray-300 hover:bg-slate-700" : "text-gray-600 hover:bg-gray-100"}`}`}>
                  <span>📋 ทั้งหมด</span><span className="bg-gray-200 px-2 py-0.5 rounded-full text-xs">{todos.filter(t => !t.archived).length}</span>
                </button>
                {(Object.keys(categoryConfig) as Category[]).map(cat => (
                  <button key={cat} onClick={() => setSelectedCategoryFilter(cat)} className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all ${selectedCategoryFilter === cat ? `${categoryConfig[cat].bg} ${categoryConfig[cat].text}` : `${darkMode ? "text-gray-300 hover:bg-slate-700" : "text-gray-600 hover:bg-gray-100"}`}`}>
                    <span>{categoryConfig[cat].icon} {categoryConfig[cat].label}</span><span className={`px-2 py-0.5 rounded-full text-xs ${selectedCategoryFilter === cat ? "" : "bg-gray-200"}`}>{todos.filter(t => t.category === cat && !t.archived).length}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Priority Filter */}
            <div className={`${darkMode ? "bg-slate-800" : "bg-white"} rounded-2xl shadow-lg p-4`}>
              <h3 className={`font-semibold mb-3 ${darkMode ? "text-white" : "text-gray-700"}`}>🔥 ความสำคัญ</h3>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setSelectedPriorityFilter("all")} className={`px-3 py-1.5 rounded-lg text-sm transition-all ${selectedPriorityFilter === "all" ? "bg-indigo-500 text-white" : `${darkMode ? "bg-slate-700 text-gray-300" : "bg-gray-100 text-gray-600"}`}`}>ทั้งหมด</button>
                {(Object.keys(priorityConfig) as Priority[]).map(p => (
                  <button key={p} onClick={() => setSelectedPriorityFilter(p)} className={`px-3 py-1.5 rounded-lg text-sm transition-all ${selectedPriorityFilter === p ? `${priorityConfig[p].bg} ${priorityConfig[p].text}` : `${darkMode ? "bg-slate-700 text-gray-300" : "bg-gray-100 text-gray-600"}`}`}>{priorityConfig[p].label}</button>
                ))}
              </div>
            </div>

            {/* Labels */}
            <div className={`${darkMode ? "bg-slate-800" : "bg-white"} rounded-2xl shadow-lg p-4`}>
              <h3 className={`font-semibold mb-3 flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-700"}`}><Tag size={18} className="text-indigo-500" /> ป้ายกำกับ</h3>
              <div className="flex flex-wrap gap-2">
                {labels.map(label => (
                  <button key={label.id} onClick={() => { setSelectedLabels(prev => prev.includes(label.id) ? prev.filter(l => l !== label.id) : [...prev, label.id]); }} className={`px-2.5 py-1 rounded-full text-xs text-white transition-all ${label.color} ${selectedLabels.includes(label.id) ? "ring-2 ring-offset-1 ring-gray-400" : "opacity-70 hover:opacity-100"}`}>{label.name}</button>
                ))}
              </div>
            </div>

            {/* View Tabs */}
            <div className={`${darkMode ? "bg-slate-800" : "bg-white"} rounded-2xl shadow-lg p-2`}>
              {[
                { key: "list", icon: "📝", label: "รายการ" },
                { key: "pinned", icon: "📌", label: "ปักหมุด" },
                { key: "archived", icon: "📦", label: "คลัง" },
                { key: "calendar", icon: "📅", label: "ปฏิทิน" },
              ].map(v => (
                <button key={v.key} onClick={() => setView(v.key as View)} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${view === v.key ? "bg-indigo-500 text-white" : `${darkMode ? "text-gray-300 hover:bg-slate-700" : "text-gray-600 hover:bg-gray-100"}`}`}>
                  <span>{v.icon} {v.label}</span>
                  {v.key === "pinned" && pinnedCount > 0 && <span className={`px-2 py-0.5 rounded-full text-xs ${view === v.key ? "bg-white/20" : "bg-gray-200"}`}>{pinnedCount}</span>}
                </button>
              ))}
            </div>

            {/* Stats */}
            <div className={`${darkMode ? "bg-slate-800" : "bg-white"} rounded-2xl shadow-lg p-4`}>
              <h3 className={`font-semibold mb-3 ${darkMode ? "text-white" : "text-gray-700"}`}>📊 สถิติ</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-indigo-50 dark:bg-indigo-900/30 rounded-xl p-3 text-center"><div className="text-2xl font-bold text-indigo-600">{remainingCount}</div><div className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>ยังไม่เสร็จ</div></div>
                <div className="bg-green-50 dark:bg-green-900/30 rounded-xl p-3 text-center"><div className="text-2xl font-bold text-green-600">{completedCount}</div><div className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>เสร็จแล้ว</div></div>
                {overdueCount > 0 && <div className="bg-red-50 dark:bg-red-900/30 rounded-xl p-3 col-span-2 text-center"><div className="text-2xl font-bold text-red-600">{overdueCount}</div><div className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>เลยกำหนด!</div></div>}
              </div>
              {chartData.total > 0 && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs mb-1"><span className={darkMode ? "text-gray-400" : "text-gray-500"}>ความคืบหน้า</span><span className={darkMode ? "text-gray-400" : "text-gray-500"}>{chartData.percent}%</span></div>
                  <div className={`h-3 rounded-full overflow-hidden ${darkMode ? "bg-slate-700" : "bg-gray-100"}`}>
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all" style={{ width: `${chartData.percent}%` }} />
                  </div>
                </div>
              )}
            </div>

            {/* Favorite Filters */}
            <div className={`${darkMode ? "bg-slate-800" : "bg-white"} rounded-2xl shadow-lg p-4`}>
              <h3 className={`font-semibold mb-3 flex items-center justify-between ${darkMode ? "text-white" : "text-gray-700"}`}><span className="flex items-center gap-2"><Star size={18} className="text-yellow-500" /> กรองที่บันทึก</span><button onClick={saveFavoriteFilter} className={`p-1 rounded ${darkMode ? "bg-slate-700 text-gray-400" : "bg-gray-100 text-gray-500"}`}><Plus size={16} /></button></h3>
              {favoriteFilters.length === 0 ? (
                <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>ยังไม่มีการกรองที่บันทึก</p>
              ) : (
                <div className="space-y-1">
                  {favoriteFilters.map(f => (
                    <button key={f.id} onClick={() => applyFavoriteFilter(f)} className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm ${darkMode ? "text-gray-300 hover:bg-slate-700" : "text-gray-600 hover:bg-gray-100"}`}>
                      <span>{f.name}</span><button onClick={e => { e.stopPropagation(); setFavoriteFilters(prev => prev.filter(p => p.id !== f.id)); }} className="text-red-400 hover:text-red-600"><X size={14} /></button>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className={`${darkMode ? "bg-slate-800" : "bg-white"} rounded-2xl shadow-lg p-4`}>
              <h3 className={`font-semibold mb-3 ${darkMode ? "text-white" : "text-gray-700"}`}>⚡ คำสั่งด่วน</h3>
              <div className="space-y-2">
                <button onClick={handleUndo} disabled={deletedTodos.length === 0} className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl transition-all disabled:opacity-50 ${darkMode ? "bg-amber-900/30 text-amber-400 hover:bg-amber-900/50" : "bg-amber-50 text-amber-700 hover:bg-amber-100"}`}><Undo size={16} /> ยกเลิก ({deletedTodos.length})</button>
                <button onClick={() => setShowActivityLog(true)} className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${darkMode ? "bg-slate-700 text-gray-300 hover:bg-slate-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}><History size={16} /> ประวัติ</button>
                <button onClick={exportData} className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${darkMode ? "bg-green-900/30 text-green-400 hover:bg-green-900/50" : "bg-green-50 text-green-700 hover:bg-green-100"}`}><Download size={16} /> Export</button>
                <label className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition-all ${darkMode ? "bg-blue-900/30 text-blue-400 hover:bg-blue-900/50" : "bg-blue-50 text-blue-700 hover:bg-blue-100"}`}><Upload size={16} /> Import<input type="file" accept=".json" onChange={importData} className="hidden" /></label>
                <button onClick={() => setShowShortcuts(true)} className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${darkMode ? "bg-slate-700 text-gray-300 hover:bg-slate-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}><Keyboard size={16} /> Shortcuts</button>
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
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-600"}`}>ความสำคัญ:</span>
                    {(Object.keys(priorityConfig) as Priority[]).map(p => (
                      <button key={p} onClick={() => setSelectedPriority(p)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${selectedPriority === p ? `${priorityConfig[p].bg} ${priorityConfig[p].text} ring-2 ring-offset-1 ring-${p === "high" ? "red" : p === "medium" ? "yellow" : "green"}-400` : `${darkMode ? "bg-slate-700 text-gray-300" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}`}>{priorityConfig[p].label}</button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-600"}`}>หมวดหมู่:</span>
                    {(Object.keys(categoryConfig) as Category[]).map(cat => (
                      <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${selectedCategory === cat ? `${categoryConfig[cat].bg} ${categoryConfig[cat].text}` : `${darkMode ? "bg-slate-700 text-gray-300" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}`}>{categoryConfig[cat].icon}</button>
                    ))}
                  </div>
                </div>
                {selectedLabels.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>ป้ายกำกับ:</span>
                    {selectedLabels.map(lId => {
                      const l = labels.find(l => l.id === lId);
                      return l ? <span key={lId} className={`px-2 py-0.5 rounded-full text-xs text-white ${l.color}`}>{l.name}</span> : null;
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* AI Suggestions */}
            <div className={`${darkMode ? "bg-gradient-to-r from-purple-900/50 to-indigo-900/50" : "bg-gradient-to-r from-purple-100 to-indigo-100"} rounded-2xl shadow-lg p-4 mb-4 border ${darkMode ? "border-purple-700" : "border-purple-200"}`}>
              <div className="flex items-center gap-2 mb-2"><Brain size={18} className="text-purple-500" /><span className={`font-medium ${darkMode ? "text-purple-300" : "text-purple-700"}`}>AI แนะนำ</span></div>
              <div className="space-y-1">{aiSuggestions.map((s, i) => <p key={i} className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{s}</p>)}</div>
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

            {/* Search & Filter */}
            <div className={`${darkMode ? "bg-slate-800" : "bg-white"} rounded-2xl shadow-lg p-2 mb-4 flex flex-wrap gap-2`}>
              <div className="relative flex-1 min-w-[200px]">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="🔍 ค้นหารายการ..." className={`w-full pl-10 pr-10 py-2 border-2 rounded-xl focus:outline-none transition-colors ${darkMode ? "border-slate-600 bg-slate-700 text-white placeholder-gray-400 focus:border-indigo-400" : "border-gray-200 focus:border-indigo-400 text-gray-800"}`} />
                {searchQuery && <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={16} /></button>}
              </div>
              <div className="flex gap-1">
                {(["all", "active", "completed"] as Filter[]).map(f => (
                  <button key={f} onClick={() => setFilter(f)} className={`py-2 px-4 rounded-xl text-sm font-medium transition-all ${filter === f ? "bg-indigo-500 text-white" : `${darkMode ? "text-gray-300 hover:bg-slate-700" : "text-gray-600 hover:bg-gray-100"}`}`}>{f === "all" ? "ทั้งหมด" : f === "active" ? "ยังไม่เสร็จ" : "เสร็จแล้ว"}</button>
                ))}
              </div>
              <button onClick={selectAll} className={`p-2 rounded-xl transition-all ${selectedTodos.size === filteredTodos.length && filteredTodos.length > 0 ? "bg-indigo-500 text-white" : `${darkMode ? "text-gray-300 hover:bg-slate-700" : "text-gray-600 hover:bg-gray-100"}`}`}>{selectedTodos.size === filteredTodos.length && filteredTodos.length > 0 ? <CheckSquare size={18} /> : <Square size={18} />}</button>
            </div>

            {/* Calendar View */}
            {view === "calendar" && (
              <div className={`${darkMode ? "bg-slate-800" : "bg-white"} rounded-2xl shadow-lg p-5 mb-4`}>
                <div className="flex items-center justify-between mb-4">
                  <button onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1))} className={`p-2 rounded-lg ${darkMode ? "bg-slate-700 text-gray-300" : "bg-gray-100 text-gray-600"}`}><ChevronLeft size={20} /></button>
                  <h3 className={`text-lg font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>{monthNames[calendarDate.getMonth()]} {calendarDate.getFullYear() + 543}</h3>
                  <button onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1))} className={`p-2 rounded-lg ${darkMode ? "bg-slate-700 text-gray-300" : "bg-gray-100 text-gray-600"}`}><ChevronRight size={20} /></button>
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {weekDays.map(day => <div key={day} className={`text-center text-sm font-medium py-2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{day}</div>)}
                  {getCalendarDays().map((day, i) => (
                    <div key={i} className={`min-h-[80px] p-1 rounded-lg border ${day.isCurrentMonth ? (darkMode ? "border-slate-600 bg-slate-700/30" : "border-gray-200") : (darkMode ? "border-slate-700 bg-slate-800/30 opacity-50" : "border-gray-100 bg-gray-50")}`}>
                      <div className={`text-sm font-medium mb-1 ${day.date === new Date().getDate() && day.isCurrentMonth ? "bg-indigo-500 text-white rounded-full w-6 h-6 flex items-center justify-center" : darkMode ? "text-gray-300" : "text-gray-700"}`}>{day.date}</div>
                      {day.todos.slice(0, 2).map(t => (
                        <div key={t.id} className={`text-xs px-1 py-0.5 rounded mb-0.5 truncate ${t.completed ? "line-through opacity-50" : ""} ${t.priority === "high" ? "bg-red-100 text-red-700" : t.priority === "medium" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}>{t.text}</div>
                      ))}
                      {day.todos.length > 2 && <div className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>+{day.todos.length - 2} รายการ</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Todo List */}
            <div className="space-y-3">
              {filteredTodos.length === 0 ? (
                <div className={`${darkMode ? "bg-slate-800" : "bg-white"} rounded-2xl shadow-lg p-12 text-center`}>
                  <div className="text-6xl mb-4">{searchQuery ? "🔍" : view === "pinned" ? "📌" : view === "archived" ? "📦" : "🎉"}</div>
                  <p className={`text-lg ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{searchQuery ? "ไม่พบรายการที่ค้นหา" : "ยังไม่มีรายการ ลองเพิ่มดูสิ!"}</p>
                </div>
              ) : filteredTodos.map(todo => (
                <div key={todo.id} draggable onDragStart={e => handleDragStart(e, todo.id)} onDragOver={e => handleDragOver(e, todo.id)} onDragEnd={handleDragEnd} className={`${darkMode ? "bg-slate-800" : "bg-white"} rounded-2xl shadow-md p-4 transition-all duration-300 ${deletingId === todo.id ? "opacity-0 scale-95 translate-x-8" : ""} ${todo.completed ? "opacity-70" : ""} ${dragOverTodo === todo.id ? "ring-2 ring-indigo-500" : ""} ${draggedTodo === todo.id ? "opacity-50" : ""}`}>
                  {editingId === todo.id ? (
                    <div className="flex gap-2">
                      <input type="text" value={editValue} onChange={e => setEditValue(e.target.value)} onKeyDown={e => { if (e.key === "Enter") saveEdit(todo.id); if (e.key === "Escape") setEditingId(null); }} onBlur={() => saveEdit(todo.id)} className={`flex-1 px-3 py-2 border-2 rounded-lg focus:outline-none ${darkMode ? "border-indigo-400 bg-slate-700 text-white" : "border-indigo-300 text-gray-800"}`} />
                      <button onClick={() => saveEdit(todo.id)} className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg"><Check size={18} /></button>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <div className={`cursor-grab ${darkMode ? "text-gray-500" : "text-gray-300"} hover:text-indigo-500`}><GripVertical size={18} /></div>
                      <button onClick={() => toggleSelect(todo.id)} className={`flex-shrink-0 w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all mt-0.5 ${selectedTodos.has(todo.id) ? "bg-indigo-500 border-indigo-500 text-white" : `${darkMode ? "border-slate-600" : "border-gray-300"} hover:border-indigo-400`}`}>{selectedTodos.has(todo.id) && <Check size={14} />}</button>
                      <button onClick={() => toggleTodo(todo.id)} className={`flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${todo.completed ? "bg-green-500 border-green-500 text-white" : `${darkMode ? "border-slate-500" : "border-gray-300"} hover:border-indigo-400`}`}>{todo.completed && <Check size={16} />}</button>
                      <button onClick={() => togglePin(todo.id)} className={`flex-shrink-0 p-1 transition-all ${todo.pinned ? "text-red-500" : `${darkMode ? "text-gray-500 hover:text-red-400" : "text-gray-300 hover:text-red-400"}`}`}>{todo.pinned ? <Pin size={16} fill="currentColor" /> : <Pin size={16} />}</button>
                      <div className="flex-1 min-w-0">
                        <p className={`transition-all cursor-pointer ${todo.completed ? "line-through opacity-60" : ""} ${darkMode ? "text-white" : "text-gray-800"}`} onDoubleClick={() => startEditing(todo)}>{todo.text}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityConfig[todo.priority].bg} ${priorityConfig[todo.priority].text}`}><span className={`w-1.5 h-1.5 rounded-full ${priorityConfig[todo.priority].dot} mr-1.5`}></span>{priorityConfig[todo.priority].label}</span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${categoryConfig[todo.category].bg} ${categoryConfig[todo.category].text}`}>{categoryConfig[todo.category].icon} {categoryConfig[todo.category].label}</span>
                          {todo.dueDate && (
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getDueDateStatus(todo.dueDate, todo.dueTime) === "overdue" ? "bg-red-100 text-red-700" : getDueDateStatus(todo.dueDate, todo.dueTime) === "today" ? "bg-yellow-100 text-yellow-700" : getDueDateStatus(todo.dueDate, todo.dueTime) === "soon" ? "bg-orange-100 text-orange-700" : `${darkMode ? "bg-slate-700 text-gray-300" : "bg-gray-100 text-gray-600"}`}`}>
                              <Calendar size={12} />{getDueDateStatus(todo.dueDate, todo.dueTime) === "overdue" ? "เลยกำหนด" : getDueDateStatus(todo.dueDate, todo.dueTime) === "today" ? "วันนี้" : new Date(todo.dueDate).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}
                              {todo.dueTime && ` ${todo.dueTime}`}
                            </span>
                          )}
                          {todo.reminder && <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700"><Bell size={12} />{todo.reminder}m</span>}
                          {todo.recurrence !== "none" && <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700"><Repeat size={12} />{recurrenceLabels[todo.recurrence]}</span>}
                          {todo.labels.map(lId => {
                            const l = labels.find(l => l.id === lId);
                            return l ? <span key={lId} className={`px-2 py-0.5 rounded-full text-xs text-white ${l.color}`}>{l.name}</span> : null;
                          })}
                          {todo.assignee && <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700"><Users size={12} />{todo.assignee}</span>}
                        </div>

                        {/* Subtasks */}
                        {todo.subtasks.length > 0 && (
                          <div className="mt-3">
                            <button onClick={() => { setExpandedSubtasks(prev => { const next = new Set(prev); next.has(todo.id) ? next.delete(todo.id) : next.add(todo.id); return next; }); }} className={`flex items-center gap-1 text-xs ${darkMode ? "text-gray-400 hover:text-gray-300" : "text-gray-500 hover:text-gray-600"}`}>{expandedSubtasks.has(todo.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />} ลิสย่อย ({todo.subtasks.filter(s => s.completed).length}/{todo.subtasks.length})</button>
                            {expandedSubtasks.has(todo.id) && (
                              <div className="mt-2 space-y-1 pl-4 border-l-2 border-indigo-200">
                                {todo.subtasks.map(sub => (
                                  <div key={sub.id} className="flex items-center gap-2">
                                    <button onClick={() => toggleSubtask(todo.id, sub.id)} className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${sub.completed ? "bg-green-500 border-green-500 text-white" : `${darkMode ? "border-slate-500" : "border-gray-300"}`}`}>{sub.completed && <Check size={12} />}</button>
                                    <span className={`text-sm flex-1 ${sub.completed ? "line-through opacity-50" : ""} ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{sub.text}</span>
                                    <button onClick={() => deleteSubtask(todo.id, sub.id)} className={`p-1 ${darkMode ? "text-gray-500 hover:text-red-400" : "text-gray-400 hover:text-red-500"}`}><X size={14} /></button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Comments */}
                        {todo.comments.length > 0 && (
                          <div className="mt-3">
                            <button onClick={() => { setExpandedComments(prev => { const next = new Set(prev); next.has(todo.id) ? next.delete(todo.id) : next.add(todo.id); return next; }); }} className={`flex items-center gap-1 text-xs ${darkMode ? "text-gray-400 hover:text-gray-300" : "text-gray-500 hover:text-gray-600"}`}><MessageCircle size={14} /> ความคิดเห็น ({todo.comments.length})</button>
                            {expandedComments.has(todo.id) && (
                              <div className="mt-2 space-y-2 pl-4 border-l-2 border-green-200">
                                {todo.comments.map(c => (
                                  <div key={c.id} className={`p-2 rounded-lg ${darkMode ? "bg-slate-700" : "bg-gray-50"}`}>
                                    <div className="flex justify-between"><span className="font-medium text-sm">{c.author}</span><span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-400"}`}>{new Date(c.createdAt).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" })}</span></div>
                                    <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{c.text}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Notes */}
                        {editingNotes === todo.id ? (
                          <div className="mt-3"><textarea placeholder="เพิ่มโน้ต..." defaultValue={todo.notes} onBlur={e => { setTodos(todos.map(t => t.id === todo.id ? { ...t, notes: e.target.value } : t)); setEditingNotes(null); }} className={`w-full px-3 py-2 border-2 rounded-lg focus:outline-none resize-none ${darkMode ? "border-indigo-400 bg-slate-700 text-white" : "border-indigo-300 text-gray-800"}`} rows={3} /></div>
                        ) : todo.notes && (
                          <button onClick={() => setEditingNotes(todo.id)} className={`mt-2 text-sm ${darkMode ? "text-gray-400 hover:text-gray-300" : "text-gray-500 hover:text-gray-600"}`}><StickyNote size={14} className="inline mr-1" />{todo.notes.slice(0, 50)}{todo.notes.length > 50 ? "..." : ""}</button>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => { setNewSubtaskText(prev => ({ ...prev, [todo.id]: "" })); setExpandedSubtasks(prev => { const next = new Set(prev); next.add(todo.id); return next; }); }} className={`p-2 ${darkMode ? "text-gray-500 hover:text-indigo-400 hover:bg-slate-700" : "text-gray-400 hover:text-indigo-500 hover:bg-indigo-50"} rounded-lg`} title="เพิ่มลิสย่อย"><Plus size={16} /></button>
                        <button onClick={() => { setShowLabelPicker(showLabelPicker === todo.id ? null : todo.id); }} className={`p-2 ${darkMode ? "text-gray-500 hover:text-purple-400 hover:bg-slate-700" : "text-gray-400 hover:text-purple-500 hover:bg-purple-50"} rounded-lg`}><Tag size={16} /></button>
                        <button onClick={() => setEditingNotes(todo.id)} className={`p-2 ${darkMode ? "text-gray-500 hover:text-yellow-400 hover:bg-slate-700" : "text-gray-400 hover:text-yellow-500 hover:bg-yellow-50"} rounded-lg`}><StickyNote size={16} /></button>
                        <button onClick={() => startEditing(todo)} className={`p-2 ${darkMode ? "text-gray-500 hover:text-indigo-400 hover:bg-slate-700" : "text-gray-400 hover:text-indigo-500 hover:bg-indigo-50"} rounded-lg`}><Edit3 size={16} /></button>
                        <button onClick={() => toggleArchive(todo.id)} className={`p-2 ${darkMode ? "text-gray-500 hover:text-blue-400 hover:bg-slate-700" : "text-gray-400 hover:text-blue-500 hover:bg-blue-50"} rounded-lg`}><Archive size={16} /></button>
                        <button onClick={() => deleteTodo(todo.id)} className={`p-2 ${darkMode ? "text-gray-500 hover:text-red-400 hover:bg-slate-700" : "text-gray-400 hover:text-red-500 hover:bg-red-50"} rounded-lg`}><Trash2 size={16} /></button>
                      </div>
                    </div>
                  )}

                  {/* Label Picker */}
                  {showLabelPicker === todo.id && (
                    <div className={`mt-3 p-3 rounded-xl ${darkMode ? "bg-slate-700" : "bg-gray-50"}`}>
                      <div className="flex flex-wrap gap-2">
                        {labels.map(label => (
                          <button key={label.id} onClick={() => toggleLabel(todo.id, label.id)} className={`px-2.5 py-1 rounded-full text-xs text-white transition-all ${label.color} ${todo.labels.includes(label.id) ? "ring-2 ring-white" : "opacity-60 hover:opacity-100"}`}>{label.name}</button>
                        ))}
                      </div>
                      <div className="mt-3">
                        <input type="text" placeholder="เพิ่มผู้รับผิดชอบ..." value={todo.assignee} onChange={e => setTodos(todos.map(t => t.id === todo.id ? { ...t, assignee: e.target.value } : t))} className={`w-full px-3 py-1.5 border rounded-lg text-sm ${darkMode ? "border-slate-600 bg-slate-600 text-white" : "border-gray-200 text-gray-800"}`} />
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <input type="date" value={todo.dueDate || ""} onChange={e => setTodos(todos.map(t => t.id === todo.id ? { ...t, dueDate: e.target.value || null } : t))} className={`px-3 py-1.5 border rounded-lg text-sm ${darkMode ? "border-slate-600 bg-slate-600 text-white" : "border-gray-200 text-gray-800"}`} />
                        <input type="time" value={todo.dueTime || ""} onChange={e => setTodos(todos.map(t => t.id === todo.id ? { ...t, dueTime: e.target.value || null } : t))} className={`px-3 py-1.5 border rounded-lg text-sm ${darkMode ? "border-slate-600 bg-slate-600 text-white" : "border-gray-200 text-gray-800"}`} />
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <select value={todo.recurrence} onChange={e => setTodos(todos.map(t => t.id === todo.id ? { ...t, recurrence: e.target.value as Recurrence } : t))} className={`px-3 py-1.5 border rounded-lg text-sm ${darkMode ? "border-slate-600 bg-slate-600 text-white" : "border-gray-200 text-gray-800"}`}>
                          {(Object.keys(recurrenceLabels) as Recurrence[]).map(r => <option key={r} value={r}>{recurrenceLabels[r]}</option>)}
                        </select>
                        <select value={todo.reminder || ""} onChange={e => setTodos(todos.map(t => t.id === todo.id ? { ...t, reminder: e.target.value || null } : t))} className={`px-3 py-1.5 border rounded-lg text-sm ${darkMode ? "border-slate-600 bg-slate-600 text-white" : "border-gray-200 text-gray-800"}`}>
                          <option value="">ไม่แจ้งเตือน</option>
                          <option value="5">5 นาที</option>
                          <option value="15">15 นาที</option>
                          <option value="30">30 นาที</option>
                          <option value="60">1 ชั่วโมง</option>
                        </select>
                      </div>
                      <div className="mt-3">
                        <input type="text" placeholder="เพิ่มความคิดเห็น..." value={newCommentText[todo.id] || ""} onChange={e => setNewCommentText(prev => ({ ...prev, [todo.id]: e.target.value }))} onKeyDown={e => { if (e.key === "Enter") addComment(todo.id); }} className={`w-full px-3 py-1.5 border rounded-lg text-sm ${darkMode ? "border-slate-600 bg-slate-600 text-white" : "border-gray-200 text-gray-800"}`} />
                      </div>
                      <button onClick={() => setShowLabelPicker(null)} className="mt-3 w-full py-1.5 bg-indigo-500 text-white rounded-lg text-sm">ปิด</button>
                    </div>
                  )}

                  {/* Inline Subtask Input */}
                  {expandedSubtasks.has(todo.id) && (
                    <div className="mt-3 flex gap-2">
                      <input type="text" placeholder="เพิ่มลิสย่อย..." value={newSubtaskText[todo.id] || ""} onChange={e => setNewSubtaskText(prev => ({ ...prev, [todo.id]: e.target.value }))} onKeyDown={e => { if (e.key === "Enter") addSubtask(todo.id); }} className={`flex-1 px-3 py-1.5 border rounded-lg text-sm ${darkMode ? "border-slate-600 bg-slate-700 text-white" : "border-gray-200 text-gray-800"}`} />
                      <button onClick={() => addSubtask(todo.id)} className="px-3 py-1.5 bg-indigo-500 text-white rounded-lg text-sm"><Plus size={14} /></button>
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
