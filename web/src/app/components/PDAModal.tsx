import { useState, useEffect, useRef } from 'react';
import { X, Plus, Edit2, Save, User, Calendar, ChevronLeft, Search, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';

interface Task {
  id: string;
  description: string;
  status: 'в работе' | 'провалено' | 'выполнено';
}

interface Character {
  id: string;
  photo: string;
  name: string;
  birthDate: string;
  faction: string;
  rank: string;
  status: string;
  shortInfo: string;
  fullInfo: string;
  notes: string;
  tasks: Task[];
}

interface PDAModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PDAModal({ isOpen, onClose }: PDAModalProps) {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editForm, setEditForm] = useState<Character | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [tasksExpanded, setTasksExpanded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem('pdaCharacters');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Migrate old data
        const migrated = parsed.map((char: any) => ({
          ...char,
          tasks: char.tasks || []
        }));
        setCharacters(migrated);
      } catch (e) {
        console.error('Failed to parse characters:', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('pdaCharacters', JSON.stringify(characters));
  }, [characters]);

  const filteredCharacters = characters.filter(char => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      char.name.toLowerCase().includes(query) ||
      char.faction.toLowerCase().includes(query) ||
      char.rank.toLowerCase().includes(query) ||
      char.status.toLowerCase().includes(query) ||
      char.shortInfo.toLowerCase().includes(query) ||
      char.fullInfo.toLowerCase().includes(query)
    );
  });

  const createNewCharacter = () => {
    const newChar: Character = {
      id: `char-${Date.now()}`,
      photo: 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=400&h=400&fit=crop',
      name: 'Неизвестный',
      birthDate: '01.01.1990',
      faction: 'Нейтрал',
      rank: 'Новичок',
      status: 'Неизвестен',
      shortInfo: 'Краткая информация отсутствует',
      fullInfo: 'Полная информация отсутствует',
      notes: '',
      tasks: []
    };
    setEditForm(newChar);
    setIsCreating(true);
    setIsEditing(true);
  };

  const startEdit = (char: Character) => {
    setEditForm({ ...char });
    setIsEditing(true);
  };

  const saveCharacter = () => {
    if (!editForm) return;

    if (isCreating) {
      setCharacters(prev => [...prev, editForm]);
      setSelectedCharacter(editForm);
      setIsCreating(false);
    } else {
      setCharacters(prev => prev.map(c => c.id === editForm.id ? editForm : c));
      setSelectedCharacter(editForm);
    }

    setIsEditing(false);
    setEditForm(null);
  };

  const deleteCharacter = (id: string) => {
    if (confirm('Удалить персонажа?')) {
      setCharacters(prev => prev.filter(c => c.id !== id));
      if (selectedCharacter?.id === id) {
        setSelectedCharacter(null);
      }
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editForm) {
      const reader = new FileReader();
      reader.onload = () => {
        setEditForm({ ...editForm, photo: reader.result as string });
      };
      reader.readAsDataURL(file);
    } else {
      const url = prompt('Введите URL фотографии:');
      if (url && editForm) {
        setEditForm({ ...editForm, photo: url });
      }
    }
  };

  const addTask = () => {
    if (!editForm) return;
    const newTask: Task = {
      id: `task-${Date.now()}`,
      description: '',
      status: 'в работе'
    };
    setEditForm({
      ...editForm,
      tasks: [...editForm.tasks, newTask]
    });
  };

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    if (!editForm) return;
    setEditForm({
      ...editForm,
      tasks: editForm.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t)
    });
  };

  const deleteTask = (taskId: string) => {
    if (!editForm) return;
    setEditForm({
      ...editForm,
      tasks: editForm.tasks.filter(t => t.id !== taskId)
    });
  };

  const getTaskStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'в работе': return 'bg-yellow-500/20 border-yellow-500 text-yellow-400';
      case 'провалено': return 'bg-red-500/20 border-red-500 text-red-400';
      case 'выполнено': return 'bg-green-500/20 border-green-500 text-green-400';
    }
  };

  const hasActiveTask = (char: Character) => {
    return char.tasks.some(t => t.status === 'в работе');
  };

  if (!isOpen) return null;

  return (
    <div className="w-full h-full bg-transparent flex items-center justify-center relative pointer-events-none">
      {/* PDA Screen Content */}
      <div className="w-[85%] h-[85%] bg-[#0a0a0a] border border-[#1a3a1a] overflow-hidden flex flex-col pointer-events-auto rounded-sm">
        {/* Title Bar */}
        <div className="bg-gradient-to-b from-[#1a3a1a] to-[#0f1f0f] h-8 px-3 flex items-center justify-between border-b border-[#2a4a2a] flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-green-400 text-[10px] font-mono tracking-wider">КОНТАКТЫ</span>
          </div>
          <button 
            className="w-6 h-6 bg-red-900/30 border border-red-800 rounded hover:bg-red-900/50 transition-all flex items-center justify-center"
            onClick={onClose}
          >
            <X className="w-3 h-3 text-red-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Left Panel - List */}
          {!selectedCharacter && !isEditing && (
            <div className="flex-1 flex flex-col overflow-hidden bg-[#050505]">
              <div className="p-2 border-b border-[#1a3a1a] flex items-center gap-2 flex-shrink-0">
                <Search className="w-3 h-3 text-gray-600" />
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Поиск..."
                  className="flex-1 bg-transparent border-none text-green-400 font-mono text-[10px] placeholder:text-gray-700 focus:outline-none"
                />
              </div>

              <div className="flex-1 overflow-y-auto pda-scrollbar">
                {filteredCharacters.map(char => (
                  <div
                    key={char.id}
                    className="p-2 border-b border-[#1a3a1a] cursor-pointer transition-all hover:bg-[#0f0f0f] flex gap-2"
                    onClick={() => setSelectedCharacter(char)}
                  >
                    <img 
                      src={char.photo} 
                      alt={char.name}
                      className="w-16 h-16 object-cover rounded border border-[#2a4a2a] flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-green-400 font-mono text-[10px] mb-1 font-bold truncate">{char.name}</div>
                      <div className="text-gray-500 font-mono text-[8px] mb-1 truncate">
                        {char.rank} • {char.faction}
                      </div>
                      <div className="text-gray-600 font-mono text-[8px] mb-1 line-clamp-1">{char.shortInfo}</div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            char.status === 'Активен' ? 'bg-green-500' :
                            char.status === 'Пропал' ? 'bg-yellow-500' :
                            'bg-red-500'
                          } animate-pulse`}></div>
                          <span className="text-gray-600 font-mono text-[8px]">{char.status}</span>
                        </div>
                        {hasActiveTask(char) && (
                          <div className="text-[8px] font-mono px-1 py-0.5 rounded border border-yellow-500 text-yellow-400 bg-yellow-500/20">
                            выполняет задачу
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={createNewCharacter}
                className="p-2 bg-[#1a3a1a] border-t border-[#2a4a2a] hover:bg-[#2a4a2a] transition-all flex items-center justify-center gap-1 text-green-400 font-mono text-[10px] flex-shrink-0"
              >
                <Plus className="w-3 h-3" />
                ДОБАВИТЬ
              </button>
            </div>
          )}

          {/* Character Detail View */}
          {selectedCharacter && !isEditing && (
            <div className="flex-1 flex flex-col overflow-hidden bg-[#050505]">
              <div className="p-2 border-b border-[#1a3a1a] flex-shrink-0">
                <button
                  onClick={() => setSelectedCharacter(null)}
                  className="px-2 py-1 bg-[#1a3a1a] border border-[#2a4a2a] rounded hover:bg-[#2a4a2a] transition-all flex items-center gap-1 text-green-400 font-mono text-[10px]"
                >
                  <ChevronLeft className="w-3 h-3" />
                  НАЗАД
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pda-scrollbar p-3">
                <div className="flex gap-3">
                  {/* Photo Section */}
                  <div className="flex-shrink-0">
                    <img 
                      src={selectedCharacter.photo}
                      alt={selectedCharacter.name}
                      className="w-40 h-52 object-cover rounded border border-[#2a4a2a] shadow-lg"
                    />
                    <div className="mt-2 flex gap-1">
                      <button
                        onClick={() => startEdit(selectedCharacter)}
                        className="flex-1 px-2 py-1 bg-[#1a3a1a] border border-[#2a4a2a] rounded hover:bg-[#2a4a2a] transition-all flex items-center justify-center gap-1 text-green-400 font-mono text-[8px]"
                      >
                        <Edit2 className="w-2 h-2" />
                        ИЗМЕНИТЬ
                      </button>
                      <button
                        onClick={() => deleteCharacter(selectedCharacter.id)}
                        className="flex-1 px-2 py-1 bg-red-900/20 border border-red-800 rounded hover:bg-red-900/40 transition-all text-red-500 font-mono text-[8px]"
                      >
                        УДАЛИТЬ
                      </button>
                    </div>
                  </div>

                  {/* Info Section */}
                  <div className="flex-1">
                    <h2 className="text-base font-mono text-green-400 mb-2 border-b border-[#2a4a2a] pb-1">
                      {selectedCharacter.name}
                    </h2>

                    <div className="space-y-2">
                      <div className="flex items-start gap-1">
                        <User className="w-3 h-3 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="text-gray-500 text-[8px] font-mono">ЗВАНИЕ / ГРУППИРОВКА</div>
                          <div className="text-green-400 font-mono text-[10px]">{selectedCharacter.rank} • {selectedCharacter.faction}</div>
                        </div>
                      </div>

                      <div className="flex items-start gap-1">
                        <Calendar className="w-3 h-3 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="text-gray-500 text-[8px] font-mono">ДАТА РОЖДЕНИЯ</div>
                          <div className="text-green-400 font-mono text-[10px]">{selectedCharacter.birthDate}</div>
                        </div>
                      </div>

                      <div className="flex items-start gap-1">
                        <div className="w-3 h-3 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <div className={`w-2 h-2 rounded-full ${
                            selectedCharacter.status === 'Активен' ? 'bg-green-500' :
                            selectedCharacter.status === 'Пропал' ? 'bg-yellow-500' :
                            'bg-red-500'
                          } animate-pulse`}></div>
                        </div>
                        <div>
                          <div className="text-gray-500 text-[8px] font-mono">СТАТУС</div>
                          <div className="text-green-400 font-mono text-[10px]">{selectedCharacter.status}</div>
                        </div>
                      </div>

                      {selectedCharacter.tasks.length > 0 && (
                        <div className="mt-3 p-2 bg-[#0a0a0a] border border-[#1a3a1a] rounded">
                          <button
                            onClick={() => setTasksExpanded(!tasksExpanded)}
                            className="w-full flex items-center justify-between text-gray-500 text-[8px] font-mono mb-1 hover:text-green-400 transition-colors"
                          >
                            <span>ЗАДАЧИ ({selectedCharacter.tasks.length})</span>
                            {tasksExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                          
                          {!tasksExpanded && selectedCharacter.tasks.length > 0 && (
                            <div className="mt-1">
                              <div className="text-green-300 text-[9px] line-clamp-1 mb-1">
                                {selectedCharacter.tasks[selectedCharacter.tasks.length - 1].description || 'Без описания'}
                              </div>
                              <div className={`text-[8px] font-mono px-1 py-0.5 rounded border inline-block ${getTaskStatusColor(selectedCharacter.tasks[selectedCharacter.tasks.length - 1].status)}`}>
                                {selectedCharacter.tasks[selectedCharacter.tasks.length - 1].status}
                              </div>
                            </div>
                          )}

                          {tasksExpanded && (
                            <div className="space-y-2 mt-2">
                              {selectedCharacter.tasks.map(task => (
                                <div key={task.id} className="p-2 bg-[#050505] border border-[#1a3a1a] rounded">
                                  <div className="text-green-300 text-[9px] mb-1">{task.description || 'Без описания'}</div>
                                  <div className={`text-[8px] font-mono px-1 py-0.5 rounded border inline-block ${getTaskStatusColor(task.status)}`}>
                                    {task.status}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="mt-3 p-2 bg-[#0a0a0a] border border-[#1a3a1a] rounded">
                      <div className="text-gray-500 text-[8px] font-mono mb-1">КРАТКАЯ ИНФОРМАЦИЯ</div>
                      <div className="text-green-300 text-[9px]">{selectedCharacter.shortInfo}</div>
                    </div>

                    <div className="mt-2 p-2 bg-[#0a0a0a] border border-[#1a3a1a] rounded">
                      <div className="text-gray-500 text-[8px] font-mono mb-1">ПОЛНАЯ ИНФОРМАЦИЯ</div>
                      <div className="text-green-300 text-[9px] whitespace-pre-wrap">{selectedCharacter.fullInfo}</div>
                    </div>

                    {selectedCharacter.notes && (
                      <div className="mt-2 p-2 bg-[#0a0a0a] border border-[#1a3a1a] rounded">
                        <div className="text-gray-500 text-[8px] font-mono mb-1">ЗАМЕТКИ</div>
                        <div className="text-green-300 text-[9px] whitespace-pre-wrap">{selectedCharacter.notes}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Edit Form */}
          {isEditing && editForm && (
            <div className="flex-1 flex flex-col overflow-hidden bg-[#050505]">
              <div className="p-2 border-b border-[#1a3a1a] flex items-center justify-between flex-shrink-0">
                <h2 className="text-sm font-mono text-green-400">
                  {isCreating ? 'НОВЫЙ ПЕРСОНАЖ' : 'РЕДАКТИРОВАНИЕ'}
                </h2>
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setIsCreating(false);
                      setEditForm(null);
                    }}
                    className="px-2 py-1 bg-[#1a3a1a] border border-[#2a4a2a] rounded hover:bg-[#2a4a2a] transition-all text-gray-400 font-mono text-[10px]"
                  >
                    ОТМЕНА
                  </button>
                  <button
                    onClick={saveCharacter}
                    className="px-2 py-1 bg-green-900/30 border border-green-800 rounded hover:bg-green-900/50 transition-all flex items-center gap-1 text-green-400 font-mono text-[10px]"
                  >
                    <Save className="w-3 h-3" />
                    СОХРАНИТЬ
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pda-scrollbar p-3">
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <img 
                      src={editForm.photo}
                      alt="Preview"
                      className="w-32 h-44 object-cover rounded border border-[#2a4a2a] mb-2"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full px-2 py-1 bg-[#1a3a1a] border border-[#2a4a2a] rounded hover:bg-[#2a4a2a] transition-all text-green-400 font-mono text-[8px]"
                    >
                      ФОТО
                    </button>
                  </div>

                  <div className="flex-1 space-y-2">
                    <div>
                      <label className="block text-gray-500 text-[8px] font-mono mb-0.5">ФИО</label>
                      <input 
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                        className="w-full p-1 bg-[#0a0a0a] border border-[#1a3a1a] rounded text-green-400 font-mono text-[10px] focus:border-[#2a4a2a] focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-gray-500 text-[8px] font-mono mb-0.5">ДАТА РОЖДЕНИЯ</label>
                        <input 
                          type="text"
                          value={editForm.birthDate}
                          onChange={(e) => setEditForm({...editForm, birthDate: e.target.value})}
                          className="w-full p-1 bg-[#0a0a0a] border border-[#1a3a1a] rounded text-green-400 font-mono text-[10px] focus:border-[#2a4a2a] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-500 text-[8px] font-mono mb-0.5">СТАТУС</label>
                        <select
                          value={editForm.status}
                          onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                          className="w-full p-1 bg-[#0a0a0a] border border-[#1a3a1a] rounded text-green-400 font-mono text-[10px] focus:border-[#2a4a2a] focus:outline-none"
                        >
                          <option>Активен</option>
                          <option>Пропал</option>
                          <option>Неизвестен</option>
                          <option>Мертв</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-gray-500 text-[8px] font-mono mb-0.5">ЗВАНИЕ</label>
                        <input 
                          type="text"
                          value={editForm.rank}
                          onChange={(e) => setEditForm({...editForm, rank: e.target.value})}
                          className="w-full p-1 bg-[#0a0a0a] border border-[#1a3a1a] rounded text-green-400 font-mono text-[10px] focus:border-[#2a4a2a] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-500 text-[8px] font-mono mb-0.5">ГРУППИРОВКА</label>
                        <input 
                          type="text"
                          value={editForm.faction}
                          onChange={(e) => setEditForm({...editForm, faction: e.target.value})}
                          className="w-full p-1 bg-[#0a0a0a] border border-[#1a3a1a] rounded text-green-400 font-mono text-[10px] focus:border-[#2a4a2a] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-gray-500 text-[8px] font-mono">ЗАДАЧИ</label>
                        <button
                          onClick={addTask}
                          className="px-2 py-0.5 bg-[#1a3a1a] border border-[#2a4a2a] rounded hover:bg-[#2a4a2a] transition-all text-green-400 font-mono text-[8px] flex items-center gap-1"
                        >
                          <Plus className="w-2 h-2" />
                          Добавить
                        </button>
                      </div>
                      <div className="space-y-2">
                        {editForm.tasks.map(task => (
                          <div key={task.id} className="p-2 bg-[#0a0a0a] border border-[#1a3a1a] rounded space-y-1">
                            <div className="flex items-start gap-1">
                              <textarea 
                                value={task.description}
                                onChange={(e) => updateTask(task.id, { description: e.target.value })}
                                placeholder="Описание задачи..."
                                rows={2}
                                className="flex-1 p-1 bg-[#050505] border border-[#1a3a1a] rounded text-green-400 font-mono text-[9px] focus:border-[#2a4a2a] focus:outline-none resize-none"
                              />
                              <button
                                onClick={() => deleteTask(task.id)}
                                className="p-1 bg-red-900/20 border border-red-800 rounded hover:bg-red-900/40 transition-all"
                              >
                                <Trash2 className="w-3 h-3 text-red-500" />
                              </button>
                            </div>
                            <select
                              value={task.status}
                              onChange={(e) => updateTask(task.id, { status: e.target.value as Task['status'] })}
                              className="w-full p-1 bg-[#050505] border border-[#1a3a1a] rounded text-green-400 font-mono text-[9px] focus:border-[#2a4a2a] focus:outline-none"
                            >
                              <option value="в работе">в работе</option>
                              <option value="провалено">провалено</option>
                              <option value="выполнено">выполнено</option>
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-gray-500 text-[8px] font-mono mb-0.5">КРАТКАЯ ИНФОРМАЦИЯ</label>
                      <textarea 
                        value={editForm.shortInfo}
                        onChange={(e) => setEditForm({...editForm, shortInfo: e.target.value})}
                        rows={2}
                        className="w-full p-1 bg-[#0a0a0a] border border-[#1a3a1a] rounded text-green-400 font-mono text-[10px] focus:border-[#2a4a2a] focus:outline-none resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-500 text-[8px] font-mono mb-0.5">ПОЛНАЯ ИНФОРМАЦИЯ</label>
                      <textarea 
                        value={editForm.fullInfo}
                        onChange={(e) => setEditForm({...editForm, fullInfo: e.target.value})}
                        rows={3}
                        className="w-full p-1 bg-[#0a0a0a] border border-[#1a3a1a] rounded text-green-400 font-mono text-[10px] focus:border-[#2a4a2a] focus:outline-none resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-500 text-[8px] font-mono mb-0.5">ЗАМЕТКИ</label>
                      <textarea 
                        value={editForm.notes}
                        onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                        rows={2}
                        className="w-full p-1 bg-[#0a0a0a] border border-[#1a3a1a] rounded text-green-400 font-mono text-[10px] focus:border-[#2a4a2a] focus:outline-none resize-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <input 
        ref={fileInputRef}
        type="file"
        onChange={handlePhotoChange}
        className="hidden"
        accept="image/*"
      />

      <style>
        {`
          .pda-scrollbar::-webkit-scrollbar {
            width: 4px;
          }
          .pda-scrollbar::-webkit-scrollbar-track {
            background: #0a0a0a;
            border-left: 1px solid #1a3a1a;
          }
          .pda-scrollbar::-webkit-scrollbar-thumb {
            background: #1a3a1a;
            border-radius: 1px;
          }
          .pda-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #2a4a2a;
          }
        `}
      </style>
    </div>
  );
}
