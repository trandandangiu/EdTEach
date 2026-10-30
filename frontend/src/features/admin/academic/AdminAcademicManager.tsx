import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Plus, FileText, CheckCircle2, Search, Trash2, Edit3, 
  Upload, HelpCircle, ChevronDown, ChevronRight, X, AlertCircle, RefreshCw,
  Gamepad2, Layers, Database, Sparkles, Code
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { api } from '../../../services/api';

interface AssessmentQuestion {
  id: string;
  testId: string;
  type: 'SINGLE_CHOICE' | 'MULTI_CHOICE' | 'SHORT_TEXT' | 'ESSAY';
  content: string;
  options?: any;
  answerKey?: any;
  points: number;
  explanation?: string;
}

interface AssessmentTest {
  id: string;
  code: string;
  title: string;
  kind: 'PEDAGOGY' | 'SUBJECT';
  durationMin: number;
  questionCount: number;
  passPercent: number;
  maxAttempts: number;
  active: boolean;
  questions?: AssessmentQuestion[];
  subjectLevel?: {
    subject?: { name: string };
    gradeLevel?: { name: string };
  };
}

interface MiniGame {
  id: string;
  code: string;
  title: string;
  description?: string;
  gameType: string;
  active: boolean;
  contentSets?: Array<{
    id: string;
    title: string;
    data: any;
    subjectLevel?: {
      subject?: { name: string };
      gradeLevel?: { name: string };
    };
  }>;
}

export default function AdminAcademicManager() {
  const [activeTab, setActiveTab] = useState<'tests' | 'games' | 'bank'>('tests');

  // ================= TAB 1: TESTS =================
  const [tests, setTests] = useState<AssessmentTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTest, setSelectedTest] = useState<AssessmentTest | null>(null);

  // Modal đề thi
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<AssessmentTest | null>(null);
  const [testForm, setTestForm] = useState({
    code: '',
    title: '',
    kind: 'PEDAGOGY' as 'PEDAGOGY' | 'SUBJECT',
    durationMin: 30,
    passPercent: 70,
    maxAttempts: 2,
  });

  // Modal câu hỏi
  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [questionForm, setQuestionForm] = useState({
    type: 'SINGLE_CHOICE' as 'SINGLE_CHOICE' | 'MULTI_CHOICE' | 'SHORT_TEXT' | 'ESSAY',
    content: '',
    points: 1,
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctAnswer: 'A',
    explanation: '',
  });

  // ================= TAB 2: MINI-GAMES =================
  const [games, setGames] = useState<MiniGame[]>([]);
  const [gamesLoading, setGamesLoading] = useState(false);
  const [gameModalOpen, setGameModalOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<MiniGame | null>(null);
  const [gameForm, setGameForm] = useState({
    code: '',
    title: '',
    description: '',
    gameType: 'TRAC_NGHIEM_NHANH',
  });

  // Modal Content Set
  const [contentSetModalOpen, setContentSetModalOpen] = useState(false);
  const [selectedGameForSet, setSelectedGameForSet] = useState<MiniGame | null>(null);
  const [contentSetForm, setContentSetForm] = useState({
    title: '',
    subjectLevelId: 1,
    dataJson: JSON.stringify([
      { question: '5 + 7 = ?', options: ['10', '11', '12', '13'], answer: '12' },
      { question: '8 x 4 = ?', options: ['24', '32', '36', '40'], answer: '32' }
    ], null, 2),
  });

  // ================= TAB 3: QUESTION BANK =================
  const [bankSearch, setBankSearch] = useState('');
  const [bankTypeFilter, setBankTypeFilter] = useState('ALL');

  const loadTests = async () => {
    try {
      setLoading(true);
      const res = await api.assessments.getTests();
      if (res.data) {
        setTests(res.data);
      }
    } catch (err) {
      console.error('Lỗi tải danh sách đề thi:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadGames = async () => {
    try {
      setGamesLoading(true);
      const res = await api.learning.getGames();
      if (res.data) {
        setGames(res.data);
      }
    } catch (err) {
      console.error('Lỗi tải mini games:', err);
    } finally {
      setGamesLoading(false);
    }
  };

  useEffect(() => {
    loadTests();
  }, []);

  useEffect(() => {
    if (activeTab === 'games') {
      loadGames();
    }
  }, [activeTab]);

  const selectTest = async (test: AssessmentTest) => {
    try {
      const res = await api.assessments.getTestDetail(test.id);
      if (res.data) {
        setSelectedTest(res.data);
      }
    } catch (err) {
      console.error('Lỗi tải chi tiết đề thi:', err);
      setSelectedTest(test);
    }
  };

  const handleSaveTest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTest) {
        const res = await fetch(`/api/assessments/tests/${editingTest.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('viettutor_token')}` },
          body: JSON.stringify(testForm),
        });
        const data = await res.json();
        if (data.success) {
          setTests(tests.map(t => t.id === editingTest.id ? { ...t, ...testForm } : t));
          if (selectedTest?.id === editingTest.id) {
            setSelectedTest({ ...selectedTest, ...testForm });
          }
        }
      } else {
        const res = await fetch(`/api/assessments/tests`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('viettutor_token')}` },
          body: JSON.stringify(testForm),
        });
        const data = await res.json();
        if (data.success && data.data) {
          setTests([data.data, ...tests]);
          selectTest(data.data);
        }
      }
      setTestModalOpen(false);
    } catch (err) {
      console.error('Lỗi lưu đề thi:', err);
      alert('Không thể lưu đề thi');
    }
  };

  const handleDeleteTest = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bộ đề thi này?')) return;
    try {
      await fetch(`/api/assessments/tests/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('viettutor_token')}` },
      });
      setTests(tests.filter(t => t.id !== id));
      if (selectedTest?.id === id) setSelectedTest(null);
    } catch (err) {
      console.error('Lỗi xóa đề thi:', err);
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTest) return;

    try {
      const options = (questionForm.type === 'SINGLE_CHOICE' || questionForm.type === 'MULTI_CHOICE')
        ? [
            { key: 'A', text: questionForm.optionA },
            { key: 'B', text: questionForm.optionB },
            { key: 'C', text: questionForm.optionC },
            { key: 'D', text: questionForm.optionD },
          ].filter(o => o.text.trim())
        : undefined;

      const payload = {
        type: questionForm.type,
        content: questionForm.content,
        points: questionForm.points,
        options,
        answerKey: questionForm.correctAnswer,
        explanation: questionForm.explanation,
      };

      const res = await fetch(`/api/assessments/tests/${selectedTest.id}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('viettutor_token')}` },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success && data.data) {
        const updated = {
          ...selectedTest,
          questions: [...(selectedTest.questions || []), data.data],
          questionCount: (selectedTest.questionCount || 0) + 1,
        };
        setSelectedTest(updated);
        setTests(tests.map(t => t.id === selectedTest.id ? updated : t));
        setQuestionModalOpen(false);
        setQuestionForm({
          type: 'SINGLE_CHOICE',
          content: '',
          points: 1,
          optionA: '',
          optionB: '',
          optionC: '',
          optionD: '',
          correctAnswer: 'A',
          explanation: '',
        });
      }
    } catch (err) {
      console.error('Lỗi thêm câu hỏi:', err);
      alert('Không thể thêm câu hỏi');
    }
  };

  const handleDeleteQuestion = async (qId: string) => {
    if (!selectedTest || !window.confirm('Bạn có chắc muốn xóa câu hỏi này?')) return;
    try {
      await fetch(`/api/assessments/tests/${selectedTest.id}/questions/${qId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('viettutor_token')}` },
      });
      const updated = {
        ...selectedTest,
        questions: (selectedTest.questions || []).filter(q => q.id !== qId),
        questionCount: Math.max(0, (selectedTest.questionCount || 1) - 1),
      };
      setSelectedTest(updated);
      setTests(tests.map(t => t.id === selectedTest.id ? updated : t));
    } catch (err) {
      console.error('Lỗi xóa câu hỏi:', err);
    }
  };

  const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedTest) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rows: any[] = XLSX.utils.sheet_to_json(ws);

        if (!rows || rows.length === 0) {
          alert('File Excel không có dữ liệu!');
          return;
        }

        let importedCount = 0;
        for (const row of rows) {
          const content = row['Nội dung câu hỏi'] || row['Câu hỏi'] || row['content'] || row['Question'];
          if (!content) continue;

          const optA = row['Đáp án A'] || row['A'] || row['Option A'] || '';
          const optB = row['Đáp án B'] || row['B'] || row['Option B'] || '';
          const optC = row['Đáp án C'] || row['C'] || row['Option C'] || '';
          const optD = row['Đáp án D'] || row['D'] || row['Option D'] || '';
          const answerKey = (row['Đáp án đúng'] || row['Đáp án'] || row['Key'] || 'A').toString().trim().toUpperCase();
          const points = Number(row['Điểm'] || row['Points'] || 1);
          const explanation = row['Giải thích'] || row['Gợi ý'] || '';

          const options = [
            { key: 'A', text: String(optA) },
            { key: 'B', text: String(optB) },
            { key: 'C', text: String(optC) },
            { key: 'D', text: String(optD) },
          ].filter(o => o.text.trim());

          const payload = {
            type: 'SINGLE_CHOICE',
            content: String(content),
            points,
            options,
            answerKey,
            explanation: String(explanation),
          };

          await fetch(`/api/assessments/tests/${selectedTest.id}/questions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('viettutor_token')}` },
            body: JSON.stringify(payload),
          });
          importedCount++;
        }

        alert(`Đã import thành công ${importedCount} câu hỏi từ Excel!`);
        selectTest(selectedTest);
      } catch (err) {
        console.error('Lỗi khi đọc file Excel:', err);
        alert('Lỗi xử lý file Excel');
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  // Mini-Game Actions
  const handleSaveGame = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingGame) {
        await api.learning.updateGame(editingGame.id, gameForm);
      } else {
        await api.learning.createGame(gameForm);
      }
      setGameModalOpen(false);
      loadGames();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi lưu Mini-game');
    }
  };

  const handleSaveContentSet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGameForSet) return;
    try {
      const parsedData = JSON.parse(contentSetForm.dataJson);
      await api.learning.createContentSet({
        gameId: selectedGameForSet.id,
        subjectLevelId: Number(contentSetForm.subjectLevelId),
        title: contentSetForm.title,
        data: parsedData,
      });
      alert('Đã tạo bộ nội dung câu hỏi cho game thành công!');
      setContentSetModalOpen(false);
      loadGames();
    } catch (err: any) {
      alert(err.message || 'Lỗi định dạng JSON hoặc server error');
    }
  };

  // Extract all questions for Question Bank
  const allQuestions = tests.flatMap(t => (t.questions || []).map(q => ({ ...q, testTitle: t.title, testCode: t.code })));
  const filteredBankQuestions = allQuestions.filter(q => {
    const matchesSearch = !bankSearch || q.content.toLowerCase().includes(bankSearch.toLowerCase()) || q.testTitle.toLowerCase().includes(bankSearch.toLowerCase());
    const matchesType = bankTypeFilter === 'ALL' || q.type === bankTypeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-700" />
            Ban Học Thuật & Khảo Thí Chuẩn Hóa
          </span>
          <h1 className="text-2xl font-black text-slate-900 mt-1">
            Trung Tâm Học Thuật, Đề Khảo Sát & Mini-Games
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản trị ngân hàng đề thi chuẩn đầu vào gia sư, kho mini-game tương tác và ngân hàng câu hỏi.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl self-start sm:self-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab('tests')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'tests' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Đề Thi Khảo Sát</span>
          </button>
          <button
            onClick={() => setActiveTab('games')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'games' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Gamepad2 className="w-4 h-4" />
            <span>Mini-Games & Nội Dung</span>
          </button>
          <button
            onClick={() => setActiveTab('bank')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'bank' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Kho Câu Hỏi ({allQuestions.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: TESTS & QUESTIONS */}
      {activeTab === 'tests' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">Quản lý các bộ đề khảo sát nghiệp vụ và chuyên môn</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => loadTests()}
                title="Làm mới"
                className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              </button>
              <button
                onClick={() => {
                  setEditingTest(null);
                  setTestForm({
                    code: `TEST_${Date.now().toString().slice(-4)}`,
                    title: '',
                    kind: 'PEDAGOGY',
                    durationMin: 30,
                    passPercent: 70,
                    maxAttempts: 2,
                  });
                  setTestModalOpen(true);
                }}
                className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Tạo Đề Khảo Sát Mới</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Danh sách đề thi */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Danh Sách Bộ Đề ({tests.length})</span>
              </div>

              <div className="space-y-2.5">
                {tests.map((ex) => {
                  const isSelected = selectedTest?.id === ex.id;
                  return (
                    <div
                      key={ex.id}
                      onClick={() => selectTest(ex)}
                      className={`p-4 rounded-2xl border transition cursor-pointer ${
                        isSelected 
                          ? 'bg-emerald-50/80 border-emerald-600 shadow-xs' 
                          : 'bg-white border-slate-200 hover:border-emerald-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded">
                            {ex.code}
                          </span>
                          <h4 className="font-bold text-slate-900 text-xs mt-1">{ex.title}</h4>
                          <p className="text-[11px] text-slate-500">
                            {ex.kind === 'PEDAGOGY' ? 'Khảo sát Nghiệp vụ Sư phạm' : 'Khảo sát Chuyên môn Môn học'}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingTest(ex);
                              setTestForm({
                                code: ex.code,
                                title: ex.title,
                                kind: ex.kind,
                                durationMin: ex.durationMin,
                                passPercent: ex.passPercent,
                                maxAttempts: ex.maxAttempts,
                              });
                              setTestModalOpen(true);
                            }}
                            title="Sửa đề thi"
                            className="p-1 text-slate-400 hover:text-emerald-800 rounded-md transition"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTest(ex.id);
                            }}
                            title="Xóa đề thi"
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <span>⏱ {ex.durationMin} phút</span>
                        <span>📝 {ex.questionCount || ex.questions?.length || 0} câu hỏi</span>
                        <span className="font-bold text-emerald-800">Đạt ≥ {ex.passPercent}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chi tiết câu hỏi trong đề được chọn */}
            <div className="lg:col-span-2">
              {selectedTest ? (
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                          {selectedTest.code}
                        </span>
                        <span className="text-xs font-bold text-slate-400">
                          {selectedTest.questions?.length || 0} câu hỏi trong đề
                        </span>
                      </div>
                      <h3 className="text-lg font-black text-slate-900 mt-1">{selectedTest.title}</h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl transition flex items-center gap-1.5 shadow-xs">
                        <Upload size={14} />
                        <span>Import Excel</span>
                        <input
                          type="file"
                          accept=".xlsx,.xls,.csv"
                          onChange={handleExcelImport}
                          className="hidden"
                        />
                      </label>
                      <button
                        onClick={() => setQuestionModalOpen(true)}
                        className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold px-3 py-2 rounded-xl transition flex items-center gap-1.5 shadow-xs"
                      >
                        <Plus size={14} />
                        <span>Thêm Câu Hỏi</span>
                      </button>
                    </div>
                  </div>

                  {/* Danh sách câu hỏi */}
                  {(!selectedTest.questions || selectedTest.questions.length === 0) ? (
                    <div className="py-16 text-center text-slate-400 text-xs italic space-y-2">
                      <HelpCircle className="w-8 h-8 text-slate-300 mx-auto" />
                      <p>Bộ đề này chưa có câu hỏi nào. Bạn có thể thêm thủ công hoặc import từ Excel.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedTest.questions.map((q, idx) => (
                        <div key={q.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-slate-700">Câu {idx + 1}:</span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                q.type === 'SINGLE_CHOICE' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                                q.type === 'MULTI_CHOICE' ? 'bg-purple-50 text-purple-800 border border-purple-200' :
                                q.type === 'SHORT_TEXT' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                                'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              }`}>
                                {q.type}
                              </span>
                              <span className="text-[10px] font-bold text-slate-500">({q.points} điểm)</span>
                            </div>
                            <button
                              onClick={() => handleDeleteQuestion(q.id)}
                              title="Xóa câu hỏi"
                              className="text-slate-400 hover:text-rose-600 transition"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>

                          <p className="text-slate-900 font-semibold leading-relaxed">{q.content}</p>

                          {Array.isArray(q.options) && q.options.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                              {q.options.map((opt: any) => {
                                const isCorrect = q.answerKey === opt.key;
                                return (
                                  <div
                                    key={opt.key}
                                    className={`p-2.5 rounded-xl border text-[11px] flex items-center gap-2 ${
                                      isCorrect 
                                        ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900 font-bold' 
                                        : 'bg-white border-slate-200 text-slate-700'
                                    }`}
                                  >
                                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                      isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                                    }`}>
                                      {opt.key}
                                    </span>
                                    <span>{opt.text}</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {q.explanation && (
                            <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-[11px] text-slate-600">
                              <span className="font-bold text-emerald-800">Gợi ý chấm: </span>
                              <span>{q.explanation}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-400 text-xs">
                  Chọn một bộ đề thi ở cột bên trái để xem và quản lý danh sách câu hỏi.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MINI-GAMES & CONTENT SETS */}
      {activeTab === 'games' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">
              Quản lý các trò chơi ôn tập giáo dục cho học sinh (Kids Mode) và kho bộ câu hỏi
            </span>
            <button
              onClick={() => {
                setEditingGame(null);
                setGameForm({
                  code: `GAME_${Date.now().toString().slice(-4)}`,
                  title: '',
                  description: '',
                  gameType: 'TRAC_NGHIEM_NHANH',
                });
                setGameModalOpen(true);
              }}
              className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo Game Giáo Dục Mới</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {games.map((g) => (
              <div
                key={g.id}
                className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4 text-xs flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                      {g.code}
                    </span>
                    <span className="px-2 py-0.5 font-bold text-purple-800 bg-purple-50 rounded text-[10px]">
                      {g.gameType}
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900">{g.title}</h3>
                  <p className="text-slate-500 leading-relaxed">{g.description || 'Trò chơi tương tác rèn luyện phản xạ và tư duy.'}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between text-slate-500 font-medium">
                    <span>Bộ nội dung (Content Sets):</span>
                    <strong className="text-slate-900 font-bold">{g.contentSets?.length || 0} bộ</strong>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => {
                        setSelectedGameForSet(g);
                        setContentSetForm({
                          title: `Bộ câu hỏi ${g.title} - Lớp 4`,
                          subjectLevelId: 1,
                          dataJson: JSON.stringify([
                            { question: 'Phép tính: 15 + 25 = ?', options: ['30', '35', '40', '45'], answer: '40' },
                            { question: 'Phép tính: 9 x 6 = ?', options: ['45', '54', '63', '72'], answer: '54' }
                          ], null, 2),
                        });
                        setContentSetModalOpen(true);
                      }}
                      className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold py-2 rounded-xl transition text-center"
                    >
                      + Thêm Bộ Câu Hỏi
                    </button>
                    <button
                      onClick={() => {
                        setEditingGame(g);
                        setGameForm({
                          code: g.code,
                          title: g.title,
                          description: g.description || '',
                          gameType: g.gameType,
                        });
                        setGameModalOpen(true);
                      }}
                      className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition"
                      title="Sửa game"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: QUESTION BANK */}
      {activeTab === 'bank' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm kiếm câu hỏi trong kho theo từ khóa hoặc mã đề..."
                value={bankSearch}
                onChange={(e) => setBankSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-emerald-800"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Loại câu hỏi:</span>
              <select
                value={bankTypeFilter}
                onChange={(e) => setBankTypeFilter(e.target.value)}
                className="border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-700 bg-white focus:outline-emerald-800"
              >
                <option value="ALL">Tất cả định dạng</option>
                <option value="SINGLE_CHOICE">Trắc nghiệm 1 đáp án</option>
                <option value="MULTI_CHOICE">Trắc nghiệm nhiều đáp án</option>
                <option value="SHORT_TEXT">Câu trả lời ngắn</option>
                <option value="ESSAY">Tự luận / Tình huống</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            {filteredBankQuestions.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs bg-white rounded-3xl border border-slate-200">
                Không tìm thấy câu hỏi nào phù hợp với bộ lọc.
              </div>
            ) : (
              filteredBankQuestions.map((q, idx) => (
                <div key={q.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-800">#{idx + 1}</span>
                      <span className="text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded font-mono font-bold text-[10px]">
                        {q.testCode}
                      </span>
                      <span className="text-slate-500 font-medium">({q.testTitle})</span>
                      <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-blue-50 text-blue-800">
                        {q.type}
                      </span>
                    </div>
                    <span className="font-bold text-slate-500">{q.points} điểm</span>
                  </div>

                  <p className="text-slate-900 font-semibold leading-relaxed">{q.content}</p>

                  {Array.isArray(q.options) && q.options.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                      {q.options.map((opt: any) => (
                        <div
                          key={opt.key}
                          className={`p-2 rounded-xl border flex items-center gap-2 ${
                            q.answerKey === opt.key ? 'bg-emerald-50 border-emerald-300 font-bold text-emerald-900' : 'bg-slate-50 border-slate-100 text-slate-600'
                          }`}
                        >
                          <span className="font-bold">{opt.key}.</span>
                          <span>{opt.text}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {q.explanation && (
                    <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg italic">
                      💡 <strong>Hướng dẫn chấm:</strong> {q.explanation}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* MODAL TẠO / SỬA BỘ ĐỀ */}
      {testModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-base font-extrabold text-slate-900">
                {editingTest ? 'Chỉnh Sửa Bộ Đề Khảo Sát' : 'Tạo Đề Khảo Sát Mới'}
              </h3>
              <button onClick={() => setTestModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSaveTest} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Mã đề (Code) *</label>
                <input
                  type="text"
                  required
                  value={testForm.code}
                  onChange={(e) => setTestForm({ ...testForm, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tên bộ đề khảo sát *</label>
                <input
                  type="text"
                  required
                  value={testForm.title}
                  onChange={(e) => setTestForm({ ...testForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Loại khảo sát</label>
                <select
                  value={testForm.kind}
                  onChange={(e) => setTestForm({ ...testForm, kind: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden"
                >
                  <option value="PEDAGOGY">Nghiệp vụ Sư phạm & Tình huống</option>
                  <option value="SUBJECT">Kiểm tra Kiến thức Chuyên môn</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Thời gian (phút)</label>
                  <input
                    type="number"
                    min={5}
                    value={testForm.durationMin}
                    onChange={(e) => setTestForm({ ...testForm, durationMin: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Điểm đạt (%)</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={testForm.passPercent}
                    onChange={(e) => setTestForm({ ...testForm, passPercent: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Lần thi tối đa</label>
                  <input
                    type="number"
                    min={1}
                    value={testForm.maxAttempts}
                    onChange={(e) => setTestForm({ ...testForm, maxAttempts: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setTestModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl shadow-xs"
                >
                  {editingTest ? 'Lưu Thay Đổi' : 'Tạo Đề Thi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL THÊM CÂU HỎI */}
      {questionModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-base font-extrabold text-slate-900">Thêm Câu Hỏi Vào Đề Thi</h3>
              <button onClick={() => setQuestionModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleAddQuestion} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Loại câu hỏi</label>
                  <select
                    value={questionForm.type}
                    onChange={(e) => setQuestionForm({ ...questionForm, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden"
                  >
                    <option value="SINGLE_CHOICE">Trắc nghiệm 1 đáp án</option>
                    <option value="MULTI_CHOICE">Trắc nghiệm nhiều đáp án</option>
                    <option value="SHORT_TEXT">Điền câu trả lời ngắn</option>
                    <option value="ESSAY">Tự luận / Tình huống sư phạm</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Điểm số</label>
                  <input
                    type="number"
                    min={1}
                    value={questionForm.points}
                    onChange={(e) => setQuestionForm({ ...questionForm, points: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nội dung câu hỏi / Tình huống *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Nhập đề bài hoặc câu hỏi khảo sát..."
                  value={questionForm.content}
                  onChange={(e) => setQuestionForm({ ...questionForm, content: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden"
                />
              </div>

              {(questionForm.type === 'SINGLE_CHOICE' || questionForm.type === 'MULTI_CHOICE') && (
                <div className="space-y-2 pt-1 border-t border-slate-100">
                  <span className="font-bold text-slate-700 block">Các lựa chọn đáp án:</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <input
                        type="text"
                        required
                        placeholder="Đáp án A"
                        value={questionForm.optionA}
                        onChange={(e) => setQuestionForm({ ...questionForm, optionA: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        required
                        placeholder="Đáp án B"
                        value={questionForm.optionB}
                        onChange={(e) => setQuestionForm({ ...questionForm, optionB: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Đáp án C"
                        value={questionForm.optionC}
                        onChange={(e) => setQuestionForm({ ...questionForm, optionC: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Đáp án D"
                        value={questionForm.optionD}
                        onChange={(e) => setQuestionForm({ ...questionForm, optionD: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <label className="block font-bold text-slate-700 mb-1">Đáp án đúng</label>
                    <select
                      value={questionForm.correctAnswer}
                      onChange={(e) => setQuestionForm({ ...questionForm, correctAnswer: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden"
                    >
                      <option value="A">Đáp án A</option>
                      <option value="B">Đáp án B</option>
                      <option value="C">Đáp án C</option>
                      <option value="D">Đáp án D</option>
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Gợi ý chấm / Hướng dẫn giải (Rubric)</label>
                <textarea
                  rows={2}
                  placeholder="Ghi chú hướng dẫn chấm hoặc lời giải chi tiết..."
                  value={questionForm.explanation}
                  onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setQuestionModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl shadow-xs"
                >
                  Thêm Vào Đề Thi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TẠO / SỬA MINI-GAME */}
      {gameModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-base font-extrabold text-slate-900">
                {editingGame ? 'Chỉnh Sửa Mini-Game' : 'Tạo Mini-Game Giáo Dục Mới'}
              </h3>
              <button onClick={() => setGameModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSaveGame} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Mã trò chơi (Code) *</label>
                <input
                  type="text"
                  required
                  value={gameForm.code}
                  onChange={(e) => setGameForm({ ...gameForm, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tên trò chơi *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Đố Vui Toán Học Nhanh"
                  value={gameForm.title}
                  onChange={(e) => setGameForm({ ...gameForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Thể loại Game</label>
                <select
                  value={gameForm.gameType}
                  onChange={(e) => setGameForm({ ...gameForm, gameType: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden"
                >
                  <option value="TRAC_NGHIEM_NHANH">Trắc nghiệm đếm ngược (Flashcard)</option>
                  <option value="TIM_CAP_DUNG">Nối cặp từ / Ghép hình tương ứng</option>
                  <option value="DIEN_SO_DUNG">Điền số hoặc ký tự còn thiếu</option>
                  <option value="LAT_THE">Lật thẻ trí nhớ (Memory Card)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mô tả luật chơi</label>
                <textarea
                  rows={2}
                  value={gameForm.description}
                  onChange={(e) => setGameForm({ ...gameForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setGameModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl shadow-xs"
                >
                  {editingGame ? 'Lưu Thay Đổi' : 'Tạo Game'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TẠO BỘ NỘI DUNG (CONTENT SET) */}
      {contentSetModalOpen && selectedGameForSet && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-base font-extrabold text-slate-900">
                Thêm Bộ Nội Dung Cho: {selectedGameForSet.title}
              </h3>
              <button onClick={() => setContentSetModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSaveContentSet} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tên bộ nội dung *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Toán Lớp 4 - Bảng Cửu Chương"
                  value={contentSetForm.title}
                  onChange={(e) => setContentSetForm({ ...contentSetForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mã Môn / Khối lớp (subjectLevelId)</label>
                <input
                  type="number"
                  min={1}
                  value={contentSetForm.subjectLevelId}
                  onChange={(e) => setContentSetForm({ ...contentSetForm, subjectLevelId: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">Dữ liệu JSON câu hỏi / bài tập *</label>
                  <span className="text-[10px] text-slate-400 font-mono">Định dạng JSON chuẩn</span>
                </div>
                <textarea
                  rows={6}
                  required
                  value={contentSetForm.dataJson}
                  onChange={(e) => setContentSetForm({ ...contentSetForm, dataJson: e.target.value })}
                  className="w-full font-mono text-[11px] p-3 border border-slate-200 rounded-xl focus:border-emerald-700 focus:outline-hidden bg-slate-50"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setContentSetModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl shadow-xs"
                >
                  Lưu Bộ Nội Dung
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
