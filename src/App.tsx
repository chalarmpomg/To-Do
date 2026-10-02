import { useState, useEffect, useRef } from "react";
import {
  Plus,
  Trash2,
  Check,
  Edit3,
  Search,
  Calendar,
  BarChart3,
  X,
} from "lucide-react";

type Priority = "low" | "medium" | "high";
type Filter = "all" | "active" | "completed";
type Category = "work" | "personal" | "shopping" | "health";

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  priority: Priority;
  category: Category;
  dueDate: string | null;
}

const priorityConfig = {
  low: {
    label: "ต่ำ",
    bg: "bg-green-100",
    text: "text-green-700",
    border: "border-green-300",
    dot: "bg-green-500",
  },
  medium: {
    label: "ปานกลาง",
    bg: "bg-yellow-100",
    text: "text-yellow-700",
    border: "border-yellow-300",
    dot: "bg-yellow-500",
  },
  high: {
    label: "สูง",
    bg: "bg-red-100",
    text: "text-red-700",
    border: "border-red-300",
    dot: "bg-red-500",
  },
};

const categoryConfig = {
  work: { label: "งาน", bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-500", icon: "💼" },
  personal: { label: "ส่วนตัว", bg: "bg-purple-100", text: "text-purple-700", dot: "bg-purple-500", icon: "🏠" },
  shopping: { label: "ซื้อของ", bg: "bg-orange-100", text: "text-orange-700", dot: "bg-orange-500", icon: "🛒" },
  health: { label: "สุขภาพ", bg: "bg-pink-100", text: "text-pink-700", dot: "bg-pink-500", icon: "💪" },
};

const filterLabels = {
  all: "ทั้งหมด",
  active: "ยังไม่เสร็จ",
  completed: "เสร็จแล้ว",
};

function App() {
  const [todos, setTodos] = useState<Todo[]>([
    {
      id: "1",
      text: "ออกแบบ UI สำหรับโทรศัพท์มือถือ",
      completed: false,
      priority: "high",
      category: "work",
      dueDate: new Date().toISOString().split("T")[0],
    },
    {
      id: "2",
      text: "เขียนเอกสาร API",
      completed: false,
      priority: "medium",
      category: "work",
      dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0],
    },
    {
      id: "3",
      text: "ทดสอบระบบ Login",
      completed: true,
      priority: "low",
      category: "work",
      dueDate: new Date(Date.now() - 86400000).toISOString().split("T")[0],
    },
    {
      id: "4",
      text: "ซื้อผักสด",
      completed: false,
      priority: "medium",
      category: "shopping",
      dueDate: new Date().toISOString().split("T")[0],
    },
    {
      id: "5",
      text: "ออกกำลังกาย",
      completed: false,
      priority: "high",
      category: "health",
      dueDate: new Date().toISOString().split("T")[0],
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [selectedPriority, setSelectedPriority] = useState<Priority>("medium");
  const [selectedCategory, setSelectedCategory] = useState<Category>("work");
  const [filter, setFilter] = useState<Filter>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<Category | "all">("all");
  const [showStats, setShowStats] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

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
      id: generateId(),
      text: trimmedText,
      completed: false,
      priority: selectedPriority,
      category: selectedCategory,
      dueDate: null,
    };

    setTodos([newTodo, ...todos]);
    setInputValue("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      addTodo();
    }
  };

  const toggleTodo = (id: string) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const deleteTodo = (id: string) => {
    setDeletingId(id);
    setTimeout(() => {
      setTodos(todos.filter((todo) => todo.id !== id));
      setDeletingId(null);
    }, 400);
  };

  const startEditing = (todo: Todo) => {
    setEditingId(todo.id);
    setEditValue(todo.text);
  };

  const saveEdit = (id: string) => {
    const trimmed = editValue.trim();
    if (trimmed) {
      setTodos(
        todos.map((todo) => (todo.id === id ? { ...todo, text: trimmed } : todo))
      );
    }
    setEditingId(null);
    setEditValue("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue("");
  };

  const handleEditKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === "Enter") {
      saveEdit(id);
    } else if (e.key === "Escape") {
      cancelEdit();
    }
  };

  const clearCompleted = () => {
    setTodos(todos.filter((todo) => !todo.completed));
  };

  const filteredTodos = todos.filter((todo) => {
    if (filter === "active") return !todo.completed;
    if (filter === "completed") return todo.completed;
    return true;
  }).filter((todo) => {
    if (selectedCategoryFilter !== "all" && todo.category !== selectedCategoryFilter) return false;
    if (searchQuery && !todo.text.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const remainingCount = todos.filter((todo) => !todo.completed).length;
  const completedCount = todos.filter((todo) => todo.completed).length;
  const overdueCount = todos.filter((todo) => !todo.completed && getDueDateStatus(todo.dueDate) === "overdue").length;
  const todayCount = todos.filter((todo) => !todo.completed && getDueDateStatus(todo.dueDate) === "today").length;

  const getCategoryCount = (cat: Category) => todos.filter((t) => t.category === cat).length;

  const getDonutChart = () => {
    const total = todos.length;
    if (total === 0) return { completed: 0, active: 0, circumference: 0, completedOffset: 0 };
    const completedPercent = (completedCount / total) * 100;
    const circumference = 2 * Math.PI * 40;
    const completedDash = (completedPercent / 100) * circumference;
    return {
      completed: Math.round(completedPercent),
      active: 100 - Math.round(completedPercent),
      circumference,
      completedOffset: circumference - completedDash,
    };
  };

  const chartData = getDonutChart();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 py-4 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">📝 รายการสิ่งที่ต้องทำ</h1>
          <p className="text-gray-500">จัดการงานของคุณอย่างมีประสิทธิภาพ</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar - Categories */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-lg p-4 mb-4">
              <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <BarChart3 size={18} className="text-indigo-500" />
                หมวดหมู่
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedCategoryFilter("all")}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all ${
                    selectedCategoryFilter === "all"
                      ? "bg-indigo-100 text-indigo-700"
                      : "hover:bg-gray-100 text-gray-600"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>📋</span> ทั้งหมด
                  </span>
                  <span className="bg-gray-200 px-2 py-0.5 rounded-full text-xs">{todos.length}</span>
                </button>
                {(Object.keys(categoryConfig) as Category[]).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategoryFilter(cat)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all ${
                      selectedCategoryFilter === cat
                        ? `${categoryConfig[cat].bg} ${categoryConfig[cat].text}`
                        : "hover:bg-gray-100 text-gray-600"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span>{categoryConfig[cat].icon}</span> {categoryConfig[cat].label}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      selectedCategoryFilter === cat ? "bg-white/50" : "bg-gray-200"
                    }`}>{getCategoryCount(cat)}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-2xl shadow-lg p-4">
              <h3 className="font-semibold text-gray-700 mb-3">📊 สถิติด่วน</h3>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-indigo-50 rounded-xl p-3">
                  <div className="text-2xl font-bold text-indigo-600">{remainingCount}</div>
                  <div className="text-xs text-gray-500">ยังไม่เสร็จ</div>
                </div>
                <div className="bg-green-50 rounded-xl p-3">
                  <div className="text-2xl font-bold text-green-600">{completedCount}</div>
                  <div className="text-xs text-gray-500">เสร็จแล้ว</div>
                </div>
                {overdueCount > 0 && (
                  <div className="bg-red-50 rounded-xl p-3 col-span-2">
                    <div className="text-2xl font-bold text-red-600">{overdueCount}</div>
                    <div className="text-xs text-gray-500">เลยกำหนด!</div>
                  </div>
                )}
                {todayCount > 0 && (
                  <div className="bg-yellow-50 rounded-xl p-3 col-span-2">
                    <div className="text-2xl font-bold text-yellow-600">{todayCount}</div>
                    <div className="text-xs text-gray-500">ถึงวันวันนี้</div>
                  </div>
                )}
              </div>
            </div>

            {/* Donut Chart */}
            {todos.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-4 mt-4">
                <h3 className="font-semibold text-gray-700 mb-3">📈 ความคืบหน้า</h3>
                <div className="flex items-center justify-center">
                  <svg className="w-32 h-32" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="12"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="url(#gradient)"
                      strokeWidth="12"
                      strokeDasharray={chartData.circumference}
                      strokeDashoffset={chartData.completedOffset}
                      strokeLinecap="round"
                      transform="rotate(-90 50 50)"
                      style={{ transition: "stroke-dashoffset 0.5s ease" }}
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#a855f7" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-2xl font-bold text-gray-800">{chartData.completed}%</span>
                    <span className="text-xs text-gray-500">เสร็จแล้ว</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Add Todo Card */}
            <div className="bg-white rounded-2xl shadow-lg p-5 mb-4">
              <div className="flex flex-col gap-3">
                <div className="relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="เพิ่มรายการใหม่..."
                    className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl focus:border-indigo-400 focus:outline-none transition-colors text-gray-800 placeholder-gray-400"
                  />
                  <button
                    onClick={addTodo}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors"
                  >
                    <Plus size={20} />
                  </button>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ค้นหารายการ..."
                    className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-xl focus:border-indigo-400 focus:outline-none transition-colors text-gray-800 placeholder-gray-400"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                {/* Priority & Category */}
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-gray-600 font-medium">ความสำคัญ:</span>
                    {(Object.keys(priorityConfig) as Priority[]).map((priority) => (
                      <button
                        key={priority}
                        onClick={() => setSelectedPriority(priority)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          selectedPriority === priority
                            ? `${priorityConfig[priority].bg} ${priorityConfig[priority].text} ring-2 ring-offset-1 ring-${priority === "high" ? "red" : priority === "medium" ? "yellow" : "green"}-400`
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        <span className={`inline-block w-2 h-2 rounded-full ${priorityConfig[priority].dot} mr-1.5`}></span>
                        {priorityConfig[priority].label}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-gray-600 font-medium">หมวดหมู่:</span>
                    {(Object.keys(categoryConfig) as Category[]).map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          selectedCategory === cat
                            ? `${categoryConfig[cat].bg} ${categoryConfig[cat].text} ring-2 ring-offset-1 ring-${cat === "work" ? "blue" : cat === "personal" ? "purple" : cat === "shopping" ? "orange" : "pink"}-400`
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {categoryConfig[cat].icon} {categoryConfig[cat].label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="bg-white rounded-2xl shadow-lg p-2 mb-4">
              <div className="flex gap-1">
                {(Object.keys(filterLabels) as Filter[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${
                      filter === f
                        ? "bg-indigo-500 text-white shadow-md"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {filterLabels[f]}
                  </button>
                ))}
              </div>
            </div>

            {/* Todo List */}
            <div className="space-y-3">
              {filteredTodos.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                  <div className="text-6xl mb-4">{searchQuery ? "🔍" : "🎉"}</div>
                  <p className="text-gray-500 text-lg">
                    {searchQuery
                      ? "ไม่พบรายการที่ค้นหา"
                      : filter === "all"
                      ? "ยังไม่มีรายการ ลองเพิ่มดูสิ!"
                      : filter === "active"
                      ? "ไม่มีรายการที่ยังไม่เสร็จ"
                      : "ไม่มีรายการที่เสร็จแล้ว"}
                  </p>
                </div>
              ) : (
                filteredTodos.map((todo) => (
                  <div
                    key={todo.id}
                    className={`bg-white rounded-2xl shadow-md p-4 transition-all duration-300 ${
                      deletingId === todo.id
                        ? "opacity-0 scale-95 translate-x-8"
                        : "opacity-100 scale-100 translate-x-0"
                    } ${todo.completed ? "bg-gray-50" : ""}`}
                  >
                    {editingId === todo.id ? (
                      <div className="flex gap-2">
                        <input
                          ref={editInputRef}
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => handleEditKeyDown(e, todo.id)}
                          onBlur={() => saveEdit(todo.id)}
                          className="flex-1 px-3 py-2 border-2 border-indigo-300 rounded-lg focus:border-indigo-500 focus:outline-none text-gray-800"
                        />
                        <button
                          onClick={() => saveEdit(todo.id)}
                          className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                        >
                          <Check size={18} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        {/* Checkbox */}
                        <button
                          onClick={() => toggleTodo(todo.id)}
                          className={`flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
                            todo.completed
                              ? "bg-green-500 border-green-500 text-white"
                              : "border-gray-300 hover:border-indigo-400"
                          }`}
                        >
                          {todo.completed && <Check size={16} />}
                        </button>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-gray-800 transition-all ${
                              todo.completed ? "line-through text-gray-400" : ""
                            }`}
                          >
                            {todo.text}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${priorityConfig[todo.priority].bg} ${priorityConfig[todo.priority].text} ${priorityConfig[todo.priority].border}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${priorityConfig[todo.priority].dot} mr-1.5`}></span>
                              {priorityConfig[todo.priority].label}
                            </span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${categoryConfig[todo.category].bg} ${categoryConfig[todo.category].text}`}>
                              {categoryConfig[todo.category].icon} {categoryConfig[todo.category].label}
                            </span>
                            {todo.dueDate && (
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                getDueDateStatus(todo.dueDate) === "overdue"
                                  ? "bg-red-100 text-red-700"
                                  : getDueDateStatus(todo.dueDate) === "today"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-gray-100 text-gray-600"
                              }`}>
                                <Calendar size={12} />
                                {getDueDateStatus(todo.dueDate) === "overdue"
                                  ? "เลยกำหนด"
                                  : getDueDateStatus(todo.dueDate) === "today"
                                  ? "วันนี้"
                                  : new Date(todo.dueDate).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => startEditing(todo)}
                            className="p-2 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            <Edit3 size={18} />
                          </button>
                          <button
                            onClick={() => deleteTodo(todo.id)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Footer Stats */}
            <div className="bg-white rounded-2xl shadow-lg p-4 mt-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <p className="text-gray-600 font-medium">
                  <span className="text-indigo-600 font-bold text-lg">{remainingCount}</span> รายการที่ยังไม่เสร็จ
                </p>
                <div className="flex items-center gap-4">
                  {completedCount > 0 && (
                    <button
                      onClick={clearCompleted}
                      className="text-sm text-red-500 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors font-medium"
                    >
                      ลบรายการที่เสร็จแล้ว ({completedCount})
                    </button>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              {todos.length > 0 && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>ความคืบหน้า</span>
                    <span>{Math.round((completedCount / todos.length) * 100)}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                      style={{ width: `${(completedCount / todos.length) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
