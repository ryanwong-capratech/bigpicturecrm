import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, Settings2, Lock, GripVertical, Upload, X, Tag, Download, FileUp, CheckCircle, AlertCircle } from "lucide-react";

// Standard field groups and their keys for bulk import
const STANDARD_FIELDS = [
  { key: "nickname", label: "暱稱", group: "基本資料" },
  { key: "fullNameChinese", label: "中文全名", group: "基本資料" },
  { key: "gender", label: "性別", group: "基本資料" },
  { key: "birthday", label: "生日", group: "基本資料" },
  { key: "igFb", label: "IG / FB", group: "基本資料" },
  { key: "email", label: "電郵", group: "基本資料" },
  { key: "phone", label: "電話", group: "基本資料" },
  { key: "businessModel", label: "生意模式", group: "生意資訊" },
  { key: "partnersEmployees", label: "拍檔及員工數", group: "生意資訊" },
  { key: "companyInfo", label: "公司名稱及網址", group: "生意資訊" },
  { key: "nextGoal", label: "下一個目標/遠景", group: "目標與瓶頸" },
  { key: "businessBottleneck", label: "生意瓶頸", group: "目標與瓶頸" },
  { key: "mainIncome", label: "主要收入來源", group: "財政狀況" },
  { key: "incomeLevel", label: "收入水平", group: "財政狀況" },
  { key: "maritalStatus", label: "婚姻/感情狀態", group: "個人背景" },
  { key: "whyJoin", label: "來上格局的原因", group: "課程相關" },
];

const GROUP_OPTIONS = ["基本資料", "生意資訊", "目標與瓶頸", "財政狀況", "個人背景", "課程相關", "其他"];

const FIELD_TYPE_LABELS: Record<string, string> = {
  text: "短文字",
  textarea: "長文字",
  number: "數字",
  date: "日期",
  select: "選項",
};

function CustomFieldsManager() {
  const { data: fields, refetch } = trpc.customFields.list.useQuery();
  const [showAdd, setShowAdd] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newType, setNewType] = useState<"text" | "textarea" | "number" | "date" | "select">("text");
  const [newGroup, setNewGroup] = useState("其他");
  const [selectOptions, setSelectOptions] = useState<string[]>([]);
  const [newOption, setNewOption] = useState("");

  const createMutation = trpc.customFields.create.useMutation({
    onSuccess: () => {
      toast.success("欄目已新增");
      setNewLabel(""); setNewType("text"); setNewGroup("其他");
      setSelectOptions([]); setNewOption(""); setShowAdd(false);
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.customFields.delete.useMutation({
    onSuccess: () => { toast.success("欄目已刪除"); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  const handleAddOption = () => {
    const opt = newOption.trim();
    if (!opt || selectOptions.includes(opt)) return;
    setSelectOptions([...selectOptions, opt]);
    setNewOption("");
  };

  const handleCreate = () => {
    if (!newLabel.trim()) return;
    const optionsJson = newType === "select" && selectOptions.length > 0
      ? JSON.stringify(selectOptions)
      : undefined;
    createMutation.mutate({ label: newLabel, fieldType: newType, groupName: newGroup, options: optionsJson });
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2" style={{ fontFamily: "'Playfair Display', serif" }}>
            <Settings2 className="w-4 h-4 text-primary" />
            自定義欄目管理
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">新增額外欄目，可選擇放入不同資訊分類</p>
        </div>
        <Button
          size="sm"
          onClick={() => setShowAdd(true)}
          style={{ background: "oklch(0.78 0.12 75)", color: "oklch(0.12 0.01 260)" }}
          className="gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          新增欄目
        </Button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="rounded-lg border border-primary/30 bg-secondary/50 p-4 mb-4 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">欄目名稱</Label>
              <Input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="例如：電話號碼"
                className="bg-card border-border text-sm h-9"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">欄目類型</Label>
              <Select value={newType} onValueChange={(v: any) => setNewType(v)}>
                <SelectTrigger className="bg-card border-border h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {Object.entries(FIELD_TYPE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">所屬分類</Label>
              <Select value={newGroup} onValueChange={setNewGroup}>
                <SelectTrigger className="bg-card border-border h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {GROUP_OPTIONS.map((g) => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Select options input */}
          {newType === "select" && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">選項列表</Label>
              <div className="flex gap-2">
                <Input
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddOption(); } }}
                  placeholder="輸入選項後按 Enter 或點擊新增"
                  className="bg-card border-border text-sm h-9 flex-1"
                />
                <Button size="sm" variant="outline" onClick={handleAddOption} className="h-9 border-border px-3">
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>
              {selectOptions.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectOptions.map((opt) => (
                    <span key={opt} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-primary/15 text-primary border border-primary/20">
                      {opt}
                      <button onClick={() => setSelectOptions(selectOptions.filter(o => o !== opt))} className="hover:text-destructive">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {selectOptions.length === 0 && (
                <p className="text-xs text-muted-foreground">尚未新增任何選項</p>
              )}
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline" onClick={() => { setShowAdd(false); setSelectOptions([]); }} className="border-border h-8 text-xs">取消</Button>
            <Button
              size="sm"
              disabled={!newLabel.trim() || (newType === "select" && selectOptions.length === 0) || createMutation.isPending}
              onClick={handleCreate}
              className="h-8 text-xs"
              style={{ background: "oklch(0.78 0.12 75)", color: "oklch(0.12 0.01 260)" }}
            >
              {createMutation.isPending ? "新增中..." : "確認新增"}
            </Button>
          </div>
        </div>
      )}

      {/* Fields list grouped by groupName */}
      {fields && fields.length > 0 ? (
        <div className="space-y-3">
          {GROUP_OPTIONS.filter(g => fields.some(f => (f.groupName || "其他") === g)).map(group => (
            <div key={group}>
              <div className="flex items-center gap-2 mb-1.5">
                <Tag className="w-3 h-3 text-primary" />
                <span className="text-xs font-semibold text-primary uppercase tracking-wider">{group}</span>
              </div>
              <div className="space-y-1.5 pl-4">
                {fields.filter(f => (f.groupName || "其他") === group).map((field) => (
                  <div key={field.id} className="group flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border hover:border-border/80 transition-colors">
                    <GripVertical className="w-4 h-4 text-muted-foreground opacity-30" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-foreground">{field.label}</span>
                      <span className="ml-2 text-xs text-muted-foreground">({FIELD_TYPE_LABELS[field.fieldType]})</span>
                      {field.fieldType === "select" && field.options && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(JSON.parse(field.options) as string[]).map((opt: string) => (
                            <span key={opt} className="px-1.5 py-0.5 rounded text-xs bg-primary/10 text-primary">{opt}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        if (confirm(`確定刪除欄目「${field.label}」？此操作不可復原。`)) {
                          deleteMutation.mutate({ id: field.id });
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : !showAdd ? (
        <div className="text-center py-8 rounded-lg border border-dashed border-border">
          <p className="text-muted-foreground text-sm">尚未定義任何自定義欄目</p>
        </div>
      ) : null}
    </div>
  );
}

function BulkImportManager() {
  const { data: customFields } = trpc.customFields.list.useQuery();
  const [selectedField, setSelectedField] = useState("");
  const [csvText, setCsvText] = useState("");
  const [preview, setPreview] = useState<{ identifier: string; value: string }[]>([]);
  const [parseError, setParseError] = useState("");

  const importMutation = trpc.bulkImport.importField.useMutation({
    onSuccess: (result) => {
      toast.success(`匯入完成：${result.updated} 筆已更新，${result.notFound} 筆找不到學員，${result.skipped} 筆跳過`);
      setCsvText(""); setPreview([]);
    },
    onError: (err) => toast.error(err.message),
  });

  const allFields = [
    ...STANDARD_FIELDS.map(f => ({ key: f.key, label: `${f.label}（${f.group}）` })),
    ...(customFields || []).map(f => ({ key: f.fieldKey, label: `${f.label}（自定義）` })),
  ];

  const parseCsv = (text: string) => {
    setParseError("");
    const lines = text.trim().split("\n").filter(l => l.trim());
    if (lines.length === 0) { setPreview([]); return; }
    try {
      const rows = lines.map((line, i) => {
        const parts = line.split(",");
        if (parts.length < 2) throw new Error(`第 ${i + 1} 行格式錯誤（需要：學員名稱,數值）`);
        return { identifier: parts[0].trim(), value: parts.slice(1).join(",").trim() };
      });
      setPreview(rows);
    } catch (e: any) {
      setParseError(e.message);
      setPreview([]);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2" style={{ fontFamily: "'Playfair Display', serif" }}>
          <Upload className="w-4 h-4 text-primary" />
          批量匯入欄位資料
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">透過 CSV 格式一次過更新所有學員的某一欄位</p>
      </div>

      <div className="space-y-4">
        {/* Field selector */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider">選擇欄位</Label>
          <Select value={selectedField} onValueChange={setSelectedField}>
            <SelectTrigger className="bg-secondary border-border max-w-sm">
              <SelectValue placeholder="選擇要更新的欄位..." />
            </SelectTrigger>
            <SelectContent className="bg-card border-border max-h-60">
              {allFields.map(f => (
                <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* CSV input */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider">
            CSV 資料（格式：學員暱稱或中文全名,數值）
          </Label>
          <div className="relative">
            <textarea
              value={csvText}
              onChange={(e) => { setCsvText(e.target.value); parseCsv(e.target.value); }}
              placeholder={"阿賢,0912345678\n張三,0987654321\n李四,0911222333"}
              rows={6}
              className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>
          {parseError && <p className="text-xs text-destructive">{parseError}</p>}
        </div>

        {/* Preview */}
        {preview.length > 0 && (
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="px-3 py-2 bg-secondary/50 border-b border-border">
              <span className="text-xs font-medium text-muted-foreground">預覽（共 {preview.length} 筆）</span>
            </div>
            <div className="max-h-40 overflow-y-auto divide-y divide-border">
              {preview.slice(0, 20).map((row, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2 text-sm">
                  <span className="text-muted-foreground w-4 text-xs">{i + 1}</span>
                  <span className="font-medium text-foreground min-w-[80px]">{row.identifier}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="text-foreground">{row.value}</span>
                </div>
              ))}
              {preview.length > 20 && (
                <div className="px-3 py-2 text-xs text-muted-foreground text-center">
                  ...還有 {preview.length - 20} 筆
                </div>
              )}
            </div>
          </div>
        )}

        <Button
          disabled={!selectedField || preview.length === 0 || importMutation.isPending}
          onClick={() => importMutation.mutate({ fieldKey: selectedField, rows: preview })}
          style={{ background: "oklch(0.78 0.12 75)", color: "oklch(0.12 0.01 260)" }}
          className="gap-2"
        >
          <Upload className="w-4 h-4" />
          {importMutation.isPending ? "匯入中..." : `確認匯入 ${preview.length} 筆資料`}
        </Button>
      </div>
    </div>
  );
}

function PasswordManager() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  const updateMutation = trpc.portal.updatePassword.useMutation({
    onSuccess: () => { toast.success("密碼已更新"); setNewPassword(""); setConfirmPw(""); },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPw) { toast.error("兩次輸入的密碼不一致"); return; }
    if (newPassword.length < 4) { toast.error("密碼至少需要 4 個字元"); return; }
    updateMutation.mutate({ newPassword });
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h2 className="text-base font-semibold text-foreground flex items-center gap-2 mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
        <Lock className="w-4 h-4 text-primary" />
        修改登入密碼
      </h2>
      <p className="text-xs text-muted-foreground mb-5">修改後所有用戶需使用新密碼登入</p>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider">新密碼</Label>
          <Input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="輸入新密碼"
            className="bg-secondary border-border"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider">確認新密碼</Label>
          <Input
            type="password"
            value={confirmPw}
            onChange={(e) => setConfirmPw(e.target.value)}
            placeholder="再次輸入新密碼"
            className="bg-secondary border-border"
          />
        </div>
        <Button
          type="submit"
          disabled={!newPassword || !confirmPw || updateMutation.isPending}
          style={{ background: "oklch(0.78 0.12 75)", color: "oklch(0.12 0.01 260)" }}
        >
          {updateMutation.isPending ? "更新中..." : "更新密碼"}
        </Button>
      </form>
    </div>
  );
}

function CsvExportImport() {
  const [importCsv, setImportCsv] = useState("");
  const [previewResult, setPreviewResult] = useState<{ preview: Array<{ row: number; action: string; identifier: string }>; totalRows: number } | null>(null);
  const [importDone, setImportDone] = useState<{ created: number; updated: number; skipped: number; errors: string[] } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const exportQuery = trpc.csv.export.useQuery(undefined, { enabled: false });
  const previewMutation = trpc.csv.preview.useMutation({
    onSuccess: (data) => setPreviewResult(data),
    onError: (err) => toast.error(err.message),
  });
  const importMutation = trpc.csv.import.useMutation({
    onSuccess: (data) => {
      setImportDone(data);
      setPreviewResult(null);
      setImportCsv("");
      toast.success(`匯入完成：新增 ${data.created} 筆，更新 ${data.updated} 筆`);
    },
    onError: (err) => toast.error(err.message),
  });

  const handleExport = async () => {
    const result = await exportQuery.refetch();
    if (!result.data) return;
    const blob = new Blob(["\uFEFF" + result.data.csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = result.data.filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV 已下載");
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      let text = e.target?.result as string;
      // Remove BOM if present
      if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
      setImportCsv(text);
      setPreviewResult(null);
      setImportDone(null);
    };
    reader.readAsText(file, "UTF-8");
  };

  const actionColor = (action: string) => {
    if (action === "create") return "text-green-400";
    if (action === "update") return "text-blue-400";
    return "text-muted-foreground";
  };
  const actionLabel = (action: string) => {
    if (action === "create") return "新增";
    if (action === "update") return "更新";
    return "跳過";
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-6">
      <div>
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2 mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
          <Download className="w-4 h-4 text-primary" />
          資料匯出 / 匯入
        </h2>
        <p className="text-xs text-muted-foreground">匯出所有學員完整資料（含自定義欄目）為 CSV，或上傳 CSV 批量更新 / 新增學員</p>
      </div>

      {/* Export */}
      <div className="rounded-lg border border-border bg-secondary/30 p-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-foreground">匯出所有學員資料</p>
          <p className="text-xs text-muted-foreground mt-0.5">包含所有標準欄位及自定義欄目，可用 Excel 開啟</p>
        </div>
        <Button
          onClick={handleExport}
          disabled={exportQuery.isFetching}
          style={{ background: "oklch(0.78 0.12 75)", color: "oklch(0.12 0.01 260)" }}
          className="gap-2 shrink-0"
        >
          <Download className="w-4 h-4" />
          {exportQuery.isFetching ? "匯出中..." : "下載 CSV"}
        </Button>
      </div>

      {/* Import */}
      <div className="space-y-4">
        <p className="text-sm font-medium text-foreground">匯入 / 更新學員資料</p>
        <p className="text-xs text-muted-foreground -mt-2">上傳 CSV 後系統會自動比對（以 ID 或暱稱或中文全名），更新現有學員或新增新學員。建議先匯出再修改後匯入。</p>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFileUpload(f); }}
          className={`rounded-lg border-2 border-dashed p-6 text-center transition-colors cursor-pointer ${
            isDragging ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
          }`}
          onClick={() => document.getElementById("csv-file-input")?.click()}
        >
          <FileUp className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">拖放 CSV 檔案到此處，或點擊選擇檔案</p>
          <p className="text-xs text-muted-foreground/60 mt-1">支援 .csv 格式（UTF-8 編碼）</p>
          <input
            id="csv-file-input"
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }}
          />
        </div>

        {/* CSV text area */}
        {importCsv && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">CSV 內容預覽</Label>
              <button onClick={() => { setImportCsv(""); setPreviewResult(null); setImportDone(null); }} className="text-xs text-muted-foreground hover:text-foreground">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <textarea
              value={importCsv.slice(0, 500) + (importCsv.length > 500 ? "\n...（已截斷顯示）" : "")}
              readOnly
              rows={4}
              className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-xs font-mono text-muted-foreground resize-none"
            />
            <Button
              onClick={() => previewMutation.mutate({ csv: importCsv })}
              disabled={previewMutation.isPending}
              variant="outline"
              className="gap-2"
            >
              {previewMutation.isPending ? "分析中..." : "預覽匯入結果"}
            </Button>
          </div>
        )}

        {/* Preview result */}
        {previewResult && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <span className="text-green-400 font-medium">{previewResult.preview.filter(r => r.action === "create").length} 筆新增</span>
              <span className="text-blue-400 font-medium">{previewResult.preview.filter(r => r.action === "update").length} 筆更新</span>
              <span className="text-muted-foreground">{previewResult.preview.filter(r => r.action === "skip").length} 筆跳過</span>
            </div>
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="px-3 py-2 bg-secondary/50 border-b border-border">
                <span className="text-xs font-medium text-muted-foreground">比對結果（共 {previewResult.totalRows} 筆）</span>
              </div>
              <div className="max-h-48 overflow-y-auto divide-y divide-border">
                {previewResult.preview.slice(0, 30).map((r, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2 text-sm">
                    <span className="text-muted-foreground text-xs w-6">{r.row}</span>
                    <span className="flex-1 font-medium text-foreground">{r.identifier}</span>
                    <span className={`text-xs font-medium ${actionColor(r.action)}`}>{actionLabel(r.action)}</span>
                  </div>
                ))}
                {previewResult.preview.length > 30 && (
                  <div className="px-3 py-2 text-xs text-muted-foreground text-center">...還有 {previewResult.preview.length - 30} 筆</div>
                )}
              </div>
            </div>
            <Button
              onClick={() => importMutation.mutate({ csv: importCsv })}
              disabled={importMutation.isPending}
              style={{ background: "oklch(0.78 0.12 75)", color: "oklch(0.12 0.01 260)" }}
              className="gap-2"
            >
              <Upload className="w-4 h-4" />
              {importMutation.isPending ? "匯入中..." : `確認匯入`}
            </Button>
          </div>
        )}

        {/* Done result */}
        {importDone && (
          <div className="rounded-lg border border-border bg-secondary/30 p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <CheckCircle className="w-4 h-4 text-green-400" />
              匯入完成
            </div>
            <div className="flex gap-4 text-sm">
              <span className="text-green-400">新增 {importDone.created} 筆</span>
              <span className="text-blue-400">更新 {importDone.updated} 筆</span>
              <span className="text-muted-foreground">跳過 {importDone.skipped} 筆</span>
            </div>
            {importDone.errors.length > 0 && (
              <div className="space-y-1">
                {importDone.errors.map((e, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-destructive">
                    <AlertCircle className="w-3 h-3" />{e}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
          系統設定
        </h1>
        <p className="text-muted-foreground text-sm">管理自定義欄目、批量匯入及系統設定</p>
      </div>
      <div className="space-y-6">
        <CustomFieldsManager />
        <CsvExportImport />
        <BulkImportManager />
        <PasswordManager />
      </div>
    </div>
  );
}
