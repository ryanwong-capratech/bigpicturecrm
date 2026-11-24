import { useState, useRef, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  ArrowLeft, Edit2, Save, X, Camera, MessageSquare, MessageCircle, History, Images, ZoomIn, FileDown, Sparkles, RefreshCw, Archive
} from "lucide-react";
import CoachNotesSection from "@/components/CoachNotesSection";
import StudentSharesSection from "@/components/StudentSharesSection";
import GallerySection from "@/components/GallerySection";
import { compressImage } from "@/lib/imageCompressor";

const FIELD_GROUPS = [
  {
    title: "基本資料",
    fields: [
      { key: "nickname", label: "暱稱" },
      { key: "fullNameChinese", label: "中文全名" },
      { key: "gender", label: "性別" },
      { key: "birthday", label: "生日" },
      { key: "igFb", label: "IG / FB" },
      { key: "email", label: "電郵" },
      { key: "phone", label: "電話" },
      { key: "favoriteSongs", label: "喜歡的歌和歌手" },
    ],
  },
  {
    title: "個人背景",
    fields: [
      { key: "maritalStatus", label: "婚姻/感情狀態" },
      { key: "familyMembers", label: "主要家庭成員" },
      { key: "mostImportantPerson", label: "最重要的人" },
    ],
  },
  {
    title: "生意資訊",
    fields: [
      { key: "businessModel", label: "生意模式" },
      { key: "partnersEmployees", label: "拍檔及員工數" },
      { key: "companyInfo", label: "公司名稱及網址" },
    ],
  },
  {
    title: "目標與瓶頸",
    fields: [
      { key: "nextGoal", label: "下一個目標/遠景" },
      { key: "businessBottleneck", label: "生意瓶頸" },
      { key: "wantToImprove", label: "想提升的方面" },
    ],
  },
  {
    title: "財政狀況",
    fields: [
      { key: "mainIncome", label: "主要收入來源" },
      { key: "mainExpense", label: "最大開支" },
      { key: "incomeLevel", label: "收入水平" },
      { key: "financialSatisfaction", label: "財政滿意度（1-5分）" },
      { key: "financialControl", label: "財政掌握度（1-5分）" },
    ],
  },
  {
    title: "課程相關",
    fields: [
      { key: "whyJoin", label: "為什麼來上格局" },
      { key: "courseExpectation", label: "課程期望" },
      { key: "wantToTakeAway", label: "希望帶走什麼" },
      { key: "otherCourses", label: "其他課程經歷" },
      { key: "interestedWorkshops", label: "有興趣的 Workshop" },
      { key: "attendanceConfirmed", label: "出席安排" },
    ],
  },
];

function InlineCustomField({ field, value, selectOptions, onSave }: {
  field: any;
  value: string | null | undefined;
  selectOptions: string[];
  onSave: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || "");
  const handleSave = () => { onSave(draft); setEditing(false); };
  return (
    <div className="group relative rounded-lg p-3 hover:bg-secondary/40 transition-colors border border-transparent hover:border-border">
      <div className="text-xs text-muted-foreground mb-1.5 tracking-wider uppercase font-medium flex items-center gap-1">
        {field.label}
        <span className="text-primary/50 text-[10px] normal-case tracking-normal">*</span>
      </div>
      {editing ? (
        <div className="flex gap-2 items-start">
          {field.fieldType === "textarea" ? (
            <Textarea value={draft} onChange={(e) => setDraft(e.target.value)}
              className="bg-background border-primary text-sm min-h-[80px] flex-1 focus:ring-1 focus:ring-primary" autoFocus />
          ) : field.fieldType === "select" ? (
            <Select value={draft} onValueChange={(v) => { setDraft(v); }}>
              <SelectTrigger className="bg-background border-primary h-8 text-sm flex-1">
                <SelectValue placeholder="選擇..." />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {selectOptions.map((opt: string) => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input value={draft} onChange={(e) => setDraft(e.target.value)}
              type={field.fieldType === "number" ? "number" : field.fieldType === "date" ? "date" : "text"}
              className="bg-background border-primary text-sm flex-1 h-8 focus:ring-1 focus:ring-primary" autoFocus
              onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") { setEditing(false); setDraft(value || ""); } }} />
          )}
          <div className="flex gap-1 mt-0.5 flex-shrink-0">
            <button onClick={handleSave} className="p-1 text-primary hover:text-primary/80"><Save className="w-3.5 h-3.5" /></button>
            <button onClick={() => { setEditing(false); setDraft(value || ""); }} className="p-1 text-muted-foreground hover:text-foreground"><X className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2">
          <span className={`text-sm ${value ? "text-foreground" : "text-muted-foreground italic"}`}>{value || "未填寫"}</span>
          <button onClick={() => { setDraft(value || ""); setEditing(true); }}
            className="md:opacity-0 md:group-hover:opacity-100 transition-all duration-150 flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-primary bg-primary/10 border border-primary/20 hover:bg-primary/20 flex-shrink-0">
            <Edit2 className="w-3 h-3" />編輯
          </button>
        </div>
      )}
    </div>
  );
}
function EditableField({ label, value, onSave }: {
  label: string;
  value: string | null | undefined;
  onSave: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || "");
  const isLong = (value?.length || 0) > 60;

  const handleSave = () => {
    onSave(draft);
    setEditing(false);
  };

  return (
    <div className="group relative rounded-lg p-3 hover:bg-secondary/40 transition-colors border border-transparent hover:border-border">
      <div className="text-xs text-muted-foreground mb-1.5 tracking-wider uppercase font-medium">{label}</div>
      {editing ? (
        <div className="flex gap-2 items-start">
          {isLong ? (
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="bg-background border-primary text-sm min-h-[80px] flex-1 focus:ring-1 focus:ring-primary"
              autoFocus
            />
          ) : (
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="bg-background border-primary text-sm flex-1 h-8 focus:ring-1 focus:ring-primary"
              autoFocus
              onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") { setEditing(false); setDraft(value || ""); } }}
            />
          )}
          <div className="flex gap-1 mt-0.5">
            <button
              onClick={handleSave}
              className="p-1.5 rounded-md bg-primary text-primary-foreground hover:opacity-80 transition-opacity"
              title="儲存"
            >
              <Save className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => { setEditing(false); setDraft(value || ""); }}
              className="p-1.5 rounded-md bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              title="取消"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-2">
          <span className={`text-sm flex-1 leading-relaxed ${value ? "text-foreground" : "text-muted-foreground italic"}`}>
            {value || "未填寫"}
          </span>
          {/* Edit button — always visible on hover, with clear styling */}
          <button
            onClick={() => { setDraft(value || ""); setEditing(true); }}
            className="flex-shrink-0 md:opacity-0 md:group-hover:opacity-100 transition-all duration-150 flex items-center gap-1 px-2 py-1 rounded-md bg-primary/15 hover:bg-primary/30 text-primary text-xs font-medium border border-primary/30"
            title="編輯此欄位"
          >
            <Edit2 className="w-3 h-3" />
            編輯
          </button>
        </div>
      )}
    </div>
  );
}

function EditLogsTab({ studentId }: { studentId: number }) {
  const { data: logs, isLoading } = trpc.editLogs.list.useQuery({ studentId });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-card rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <History className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
        <p className="text-muted-foreground text-sm">尚未有修改記錄</p>
        <p className="text-muted-foreground/60 text-xs mt-1">每次編輯學員資料後，修改記錄將會顯示於此</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-3 border-b border-border bg-card/80">
        <h2 className="text-xs font-semibold text-primary uppercase tracking-widest">
          修改記錄 · 共 {logs.length} 筆
        </h2>
      </div>
      <div className="divide-y divide-border">
        {logs.map((log) => (
          <div key={log.id} className="px-5 py-4 hover:bg-secondary/20 transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    {log.fieldName}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <div className="rounded-md bg-red-500/10 border border-red-500/20 px-3 py-2">
                    <div className="text-xs text-red-400/70 mb-0.5 font-medium">修改前</div>
                    <div className="text-red-300 break-words">{log.oldValue || <span className="italic text-red-400/50">（空白）</span>}</div>
                  </div>
                  <div className="rounded-md bg-green-500/10 border border-green-500/20 px-3 py-2">
                    <div className="text-xs text-green-400/70 mb-0.5 font-medium">修改後</div>
                    <div className="text-green-300 break-words">{log.newValue || <span className="italic text-green-400/50">（空白）</span>}</div>
                  </div>
                </div>
              </div>
              <div className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0 pt-1">
                {new Date(log.createdAt).toLocaleString("zh-HK", {
                  year: "numeric", month: "2-digit", day: "2-digit",
                  hour: "2-digit", minute: "2-digit",
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function StudentDetailPage() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const studentId = parseInt(params.id || "0");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<"profile" | "notes" | "shares" | "custom" | "logs" | "gallery" | "ai">("profile");
  const [photoLightbox, setPhotoLightbox] = useState(false);
  const [isPdfExporting, setIsPdfExporting] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiStudentName, setAiStudentName] = useState<string>("");
  const [aiSavedAt, setAiSavedAt] = useState<Date | null>(null);

  const { data: student, isLoading, refetch } = trpc.students.get.useQuery(
    { id: studentId },
    { enabled: !!studentId }
  );

  // Auto-load saved summary
  const { data: savedSummary } = trpc.ai.getSummary.useQuery(
    { studentId },
    { enabled: !!studentId }
  );
  // Populate state from saved summary (only if no fresh analysis yet)
  const hasFreshAnalysis = useRef(false);
  useEffect(() => {
    if (savedSummary && !hasFreshAnalysis.current) {
      const summaryText = typeof savedSummary.summary === "string" ? savedSummary.summary : String(savedSummary.summary ?? "");
      setAiSummary(summaryText);
      setAiStudentName(savedSummary.studentName);
      setAiSavedAt(savedSummary.savedAt ? new Date(savedSummary.savedAt as any) : null);
    }
  }, [savedSummary]);

  const aiSummarizeMutation = trpc.ai.summarize.useMutation({
    onSuccess: (data) => {
      const summaryText = typeof data.summary === "string" ? data.summary : String(data.summary ?? "");
      setAiSummary(summaryText);
      setAiStudentName(data.studentName);
      setAiSavedAt(new Date());
      toast.success("分析完成，已自動儲存");
    },
    onError: (err) => toast.error("AI 分析失敗：" + err.message),
  });

  const updateMutation = trpc.students.update.useMutation({
    onSuccess: () => { toast.success("已儲存"); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  const softDeleteMutation = trpc.students.delete.useMutation({
    onSuccess: () => {
      toast.success("學員已移至封存，資料仍會保留於系統內");
      navigate("/students");
    },
    onError: (err) => toast.error(`封存失敗：${err.message}`),
  });

  const uploadPhotoMutation = trpc.students.uploadPhoto.useMutation({
    onSuccess: () => { toast.success("照片已更新"); refetch(); },
    onError: (err) => toast.error(err.message),
  });
  const { data: customFields } = trpc.customFields.list.useQuery();
  const { data: pdfNotes } = trpc.notes.list.useQuery({ studentId });
  const { data: customValues, refetch: refetchCustomValues } = trpc.customValues.getForStudent.useQuery(
    { studentId }, { enabled: !!studentId }
  );
  const upsertCustomValueMutation = trpc.customValues.upsert.useMutation({
    onSuccess: () => { toast.success("已儲存"); refetchCustomValues(); },
    onError: (err) => toast.error(err.message),
  });
  const getCustomValueForField = (fieldId: number) =>
    customValues?.find((v) => v.fieldId === fieldId)?.value;

  const handleFieldSave = (key: string, value: string) => {
    updateMutation.mutate({ id: studentId, data: { [key]: value } });
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { base64, mimeType, originalSize, compressedSize } = await compressImage(file);
      console.log(`[Photo] ${(originalSize/1024).toFixed(0)}KB → ${(compressedSize/1024).toFixed(0)}KB`);
      uploadPhotoMutation.mutate({
        studentId,
        fileName: file.name.replace(/\.[^.]+$/, ".jpg"),
        fileBase64: base64,
        mimeType,
      });
    } catch (err: any) {
      toast.error(err?.message || "圖片壓縮失敗，請重新選擇圖片");
    }
  };

  const downloadPdf = async (path: string, fileName: string, label: string) => {
    if (!student) return;
    setIsPdfExporting(true);
    try {
      const response = await fetch(path);
      if (!response.ok) throw new Error(`PDF generation failed: ${response.status}`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`${label} 已下載`);
    } catch (err) {
      console.error(err);
      toast.error(`${label} 彙出失敗，請重試`);
    } finally {
      setIsPdfExporting(false);
    }
  };

  const handleExportPdf = async () => {
    if (!student) return;
    const name = student.nickname || student.fullNameChinese || `student_${student.id}`;
    await downloadPdf(`/api/pdf/student/${student.id}`, `格局17_${name}.pdf`, "完整 PDF");
  };

  const handleExportPersonalPdf = async () => {
    if (!student) return;
    const name = student.nickname || student.fullNameChinese || `student_${student.id}`;
    await downloadPdf(`/api/pdf/personal/${student.id}`, `格局17_個人資料_${name}.pdf`, "個人資料 PDF");
  };

  const handleSoftDelete = () => {
    if (!student) return;
    const label = student.nickname || student.fullNameChinese || "此學員";
    if (window.confirm(`確定將「${label}」移至封存？\n\n封存後不會再顯示於學員名冊或搜尋結果，但所有資料仍會保留在系統資料庫。`)) {
      softDeleteMutation.mutate({ id: studentId });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-32 bg-card rounded" />
          <div className="h-48 bg-card rounded-xl" />
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">找不到學員資料</p>
        <Button variant="outline" onClick={() => navigate("/students")} className="mt-4">返回列表</Button>
      </div>
    );
  }

  const displayName = student.nickname || student.fullNameChinese || "未命名";

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Top bar: back + PDF export */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate("/students")}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          返回學員名冊
        </button>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPersonalPdf}
            disabled={isPdfExporting}
            className="flex items-center gap-2 border-primary/30 text-primary hover:bg-primary/10"
          >
            <FileDown className="w-4 h-4" />
            {isPdfExporting ? "生成中..." : "個人資料 PDF"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPdf}
            disabled={isPdfExporting}
            className="flex items-center gap-2 border-primary/30 text-primary hover:bg-primary/10"
          >
            <FileDown className="w-4 h-4" />
            {isPdfExporting ? "生成中..." : "完整 PDF"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSoftDelete}
            disabled={softDeleteMutation.isPending}
            className="flex items-center gap-2 border-amber-500/35 text-amber-300 hover:bg-amber-500/10 hover:text-amber-200"
            title="移至封存（保留資料）"
          >
            <Archive className="w-4 h-4" />
            {softDeleteMutation.isPending ? "封存中..." : "移至封存"}
          </Button>
        </div>
      </div>

      {/* Hero section */}
      <div className="rounded-xl border border-border bg-card p-6 mb-6">
        <div className="flex items-start gap-5">
          {/* Photo */}
          <div className="relative flex-shrink-0">
            {student.photoUrl ? (
              <div
                className="relative group cursor-zoom-in"
                onClick={() => setPhotoLightbox(true)}
                title="點擊放大照片"
              >
                <img
                  src={student.photoUrl}
                  alt={displayName}
                  className="w-24 h-24 rounded-xl object-cover border-2 border-border group-hover:border-primary/60 transition-colors"
                />
                <div className="absolute inset-0 rounded-xl bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                  <ZoomIn className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ) : (
              <div className="w-24 h-24 rounded-xl bg-secondary flex items-center justify-center border-2 border-border">
                <span className="text-3xl font-semibold text-muted-foreground">{displayName[0]}</span>
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-primary flex items-center justify-center hover:opacity-80 transition-opacity shadow-lg"
              title="更換照片"
            >
              <Camera className="w-3.5 h-3.5" style={{ color: "oklch(0.12 0.01 260)" }} />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          </div>

          {/* Name & info */}
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-foreground mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
              {displayName}
            </h1>
            {student.fullNameChinese && student.nickname && (
              <p className="text-muted-foreground text-sm mb-2">{student.fullNameChinese}</p>
            )}
            <div className="flex flex-wrap gap-2">
              {student.gender && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${student.gender === "男" ? "bg-blue-500/20 text-blue-300" : "bg-pink-500/20 text-pink-300"}`}>
                  {student.gender}
                </span>
              )}
              {student.businessModel && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  {student.businessModel}
                </span>
              )}
              {student.attendanceConfirmed && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${student.attendanceConfirmed.includes("✅") ? "bg-green-500/20 text-green-300" : student.attendanceConfirmed.includes("❌") ? "bg-red-500/20 text-red-300" : "bg-yellow-500/20 text-yellow-300"}`}>
                  {student.attendanceConfirmed}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-card rounded-lg p-1 border border-border overflow-x-auto">
        {[
          { key: "profile", label: "個人資料", icon: null },
          { key: "notes", label: "教練備註", icon: <MessageSquare className="w-3.5 h-3.5" /> },
          { key: "shares", label: "學員分享", icon: <MessageCircle className="w-3.5 h-3.5" /> },
          { key: "logs", label: "修改記錄", icon: <History className="w-3.5 h-3.5" /> },
          { key: "gallery", label: "圖集", icon: <Images className="w-3.5 h-3.5" /> },
          { key: "ai", label: "AI 分析", icon: <Sparkles className="w-3.5 h-3.5" /> },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex-shrink-0 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "profile" && (
        <div className="space-y-4">
          {/* Edit hint */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-card border border-border rounded-lg px-4 py-2.5">
            <Edit2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            <span className="hidden md:inline">將滑鼠移到任何欄位上，即可看到 <span className="text-primary font-medium">編輯</span> 按鈕進行修改</span><span className="md:hidden">點擊任何欄位旁的 <span className="text-primary font-medium">編輯</span> 按鈕進行修改</span>
          </div>
          {FIELD_GROUPS.map((group) => {
            const groupCustomFields = customFields?.filter(f => (f.groupName || "其他") === group.title) || [];
            return (
              <div key={group.title} className="rounded-xl border border-border bg-card p-5">
                <h2 className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">
                  {group.title}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                  {group.fields.map((field) => (
                    <EditableField
                      key={field.key}
                      label={field.label}
                      value={(student as any)[field.key]}
                      onSave={(v) => handleFieldSave(field.key, v)}
                    />
                  ))}
                  {groupCustomFields.map((cf) => {
                    const cfValue = getCustomValueForField(cf.id);
                    const selectOpts: string[] = cf.fieldType === "select" && cf.options
                      ? JSON.parse(cf.options) : [];
                    return (
                      <InlineCustomField
                        key={cf.id}
                        field={cf}
                        value={cfValue}
                        selectOptions={selectOpts}
                        onSave={(val) => upsertCustomValueMutation.mutate({ studentId, fieldId: cf.id, value: val })}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
          {(() => {
            const otherFields = customFields?.filter(f => !f.groupName || f.groupName === "其他") || [];
            if (otherFields.length === 0) return null;
            return (
              <div className="rounded-xl border border-border bg-card p-5">
                <h2 className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">其他</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                  {otherFields.map((cf) => {
                    const cfValue = getCustomValueForField(cf.id);
                    const selectOpts: string[] = cf.fieldType === "select" && cf.options
                      ? JSON.parse(cf.options) : [];
                    return (
                      <InlineCustomField
                        key={cf.id}
                        field={cf}
                        value={cfValue}
                        selectOptions={selectOpts}
                        onSave={(val) => upsertCustomValueMutation.mutate({ studentId, fieldId: cf.id, value: val })}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {activeTab === "notes" && (
        <CoachNotesSection studentId={studentId} />
      )}

      {activeTab === "shares" && (
        <StudentSharesSection studentId={studentId} />
      )}

      {activeTab === "logs" && (
        <EditLogsTab studentId={studentId} />
      )}

      {activeTab === "gallery" && (
        <GallerySection studentId={studentId} />
      )}
      {activeTab === "ai" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                AI 學員分析
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">根據所有資料、教練備註及學員分享，生成結構化分析報告</p>
              {aiSavedAt && (
                <p className="text-xs text-muted-foreground/60 mt-0.5">上次分析：{aiSavedAt.toLocaleString("zh-HK")}</p>
              )}
            </div>
            <Button
              onClick={() => aiSummarizeMutation.mutate({ studentId })}
              disabled={aiSummarizeMutation.isPending}
              className="flex items-center gap-2"
            >
              {aiSummarizeMutation.isPending ? (
                <><RefreshCw className="w-4 h-4 animate-spin" />分析中...</>
              ) : (
                <><Sparkles className="w-4 h-4" />{aiSummary ? "重新分析" : "開始 AI 分析"}</>
              )}
            </Button>
          </div>

          {aiSummarizeMutation.isPending && (
            <div className="bg-card border border-border rounded-xl p-10 flex flex-col items-center justify-center gap-3 text-muted-foreground">
              <RefreshCw className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm">AI 正在分析 {displayName} 的資料，請稍候...</p>
              <p className="text-xs opacity-60">通常需要 10-20 秒</p>
            </div>
          )}

          {!aiSummarizeMutation.isPending && aiSummary && (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="bg-primary/10 border-b border-border px-5 py-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">{aiStudentName} — AI 分析報告</span>
              </div>
              <div className="p-5 space-y-1 text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {(() => {
                  // Clean markdown symbols from AI output
                  const cleanText = (text: string) =>
                    text
                      .replace(/\*\*\*/g, "")
                      .replace(/\*\*/g, "")
                      .replace(/\*/g, "")
                      .replace(/^---+$/gm, "")
                      .replace(/^#+\s*/gm, "")
                      .trim();

                  return aiSummary.split(/\n(?=## )/).map((section, idx) => {
                    const lines = section.trim().split("\n");
                    const rawHeading = lines[0].replace(/^##\s*/, "").trim();
                    const heading = cleanText(rawHeading);
                    const rawBody = lines.slice(1).join("\n").trim();
                    const body = cleanText(rawBody);
                    if (!heading) return <p key={idx} className="whitespace-pre-wrap text-sm text-foreground leading-relaxed">{body}</p>;
                    return (
                      <div key={idx} className="rounded-lg border border-border bg-background/50 overflow-hidden">
                        <div className="px-4 py-2.5 bg-primary/10 border-b border-border">
                          <h4 className="text-sm font-semibold text-primary">{heading}</h4>
                        </div>
                        <div className="px-4 py-3 text-sm text-foreground whitespace-pre-wrap leading-relaxed">{body}</div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}

          {!aiSummarizeMutation.isPending && !aiSummary && (
            <div className="bg-card border border-border border-dashed rounded-xl p-10 flex flex-col items-center justify-center gap-3 text-muted-foreground">
              <Sparkles className="w-10 h-10 opacity-30" />
              <p className="text-sm">點擊「開始 AI 分析」按鈕，生成學員分析報告</p>
            </div>
          )}
        </div>
      )}
      {/* Profile photo lightbox */}
      {photoLightbox && student.photoUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={() => setPhotoLightbox(false)}
        >
          <button
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            onClick={() => setPhotoLightbox(false)}
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}>
            <img
              src={student.photoUrl}
              alt={displayName}
              className="max-w-[90vw] max-h-[85vh] object-contain rounded-xl shadow-2xl"
            />
            <p className="text-white/70 text-sm">{displayName}</p>
          </div>
        </div>
      )}
    </div>
  );
}
