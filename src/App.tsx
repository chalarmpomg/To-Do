import { useState, useEffect, useRef } from "react";
import {
  Plus,
  Trash2,
  Check,
  Edit3,
} from "lucide-react";

type Priority = "low" | "medium" | "high";
type Filter = "all" | "active" | "completed";

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  priority: Priority;
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
    },
    {
      id: "2",
      text: "เขียนเอกสาร API",
      completed: false,
      priority: "medium",
    },
    {
      id: "3",
      text: "ทดสอบระบบ Login",
      completed: true,
      priority: "low",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [selectedPriority, setSelectedPriority] = useState<Priority>("medium");
  const [filter, setFilter] = useState<Filter>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  const generateId = () => Math.random().toString(36).substring(2, 9);

  const addTodo = () => {
    const trimmedText = inputValue.trim();
    if (!trimmedText) return;

    const newTodo: Todo = {
      id: generateId(),
      text: trimmedText,
      completed: false,
      priority: selectedPriority,
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
  });

  const remainingCount = todos.filter((todo) => !todo.completed).length;
  const completedCount = todos.filter((todo) => todo.completed).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">📝 รายการสิ่งที่ต้องทำ</h1>
          <p className="text-gray-500">จัดการงานของคุณอย่างมีประสิทธิภาพ</p>
        </div>

        {/* Add Todo Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col gap-4">
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

            {/* Priority Selector */}
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
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-2xl shadow-lg p-2 mb-6">
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
              <div className="text-6xl mb-4">🎉</div>
              <p className="text-gray-500 text-lg">
                {filter === "all"
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
                  <div className="flex items-center gap-4">
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
                      <div className="mt-1.5">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${priorityConfig[todo.priority].bg} ${priorityConfig[todo.priority].text} ${priorityConfig[todo.priority].border}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${priorityConfig[todo.priority].dot} mr-1.5`}
                          ></span>
                          {priorityConfig[todo.priority].label}
                        </span>
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
        <div className="bg-white rounded-2xl shadow-lg p-4 mt-6">
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

        {/* Priority Legend */}
        <div className="mt-6 text-center">
          <div className="flex justify-center gap-6 text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
              <span>ต่ำ</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
              <span>ปานกลาง</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
              <span>สูง</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
