import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Edit2, Save, X, Settings2 } from "lucide-react";
import { Link } from "wouter";

interface Props {
  studentId: number;
}

const GROUP_ORDER = ["基本資料", "生意資訊", "目標與瓶頸", "財政狀況", "個人背景", "課程相關", "其他"];

function CustomValueField({ field, value, onSave }: {
  field: any;
  value: string | null | undefined;
  onSave: (fieldId: number, value: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || "");

  const handleSave = () => {
    onSave(field.id, draft);
    setEditing(false);
  };

  const selectOptions: string[] = field.fieldType === "select" && field.options
    ? JSON.parse(field.options)
    : [];

  return (
    <div className="group relative flex items-start gap-3 px-4 py-3 rounded-lg hover:bg-secondary/40 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="text-xs text-muted-foreground mb-1 tracking-wider uppercase">{field.label}</div>
        {editing ? (
          <div className="flex gap-2 items-start">
            {field.fieldType === "textarea" ? (
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="bg-secondary border-border text-sm min-h-[80px] flex-1"
                autoFocus
              />
            ) : field.fieldType === "select" ? (
              <Select value={draft} onValueChange={(v) => { setDraft(v); }}>
                <SelectTrigger className="bg-secondary border-border h-8 text-sm flex-1">
                  <SelectValue placeholder="選擇..." />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {selectOptions.map((opt: string) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                type={field.fieldType === "number" ? "number" : field.fieldType === "date" ? "date" : "text"}
                className="bg-secondary border-border text-sm flex-1 h-8"
                autoFocus
                onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") { setEditing(false); setDraft(value || ""); } }}
              />
            )}
            <div className="flex gap-1 mt-0.5 flex-shrink-0">
              <button onClick={handleSave} className="p-1 text-primary hover:text-primary/80 transition-colors">
                <Save className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => { setEditing(false); setDraft(value || ""); }} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <span className={`text-sm ${value ? "text-foreground" : "text-muted-foreground italic"}`}>
            {value || "未填寫"}
          </span>
        )}
      </div>
      {!editing && (
        <button
          onClick={() => { setDraft(value || ""); setEditing(true); }}
          className="opacity-0 group-hover:opacity-100 transition-all duration-150 flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-primary bg-primary/10 border border-primary/20 hover:bg-primary/20 mt-1"
        >
          <Edit2 className="w-3 h-3" />
          編輯
        </button>
      )}
    </div>
  );
}

export default function CustomFieldsSection({ studentId }: Props) {
  const { data: fields } = trpc.customFields.list.useQuery();
  const { data: values, refetch: refetchValues } = trpc.customValues.getForStudent.useQuery({ studentId });

  const upsertMutation = trpc.customValues.upsert.useMutation({
    onSuccess: () => { toast.success("已儲存"); refetchValues(); },
    onError: (err) => toast.error(err.message),
  });

  const getValueForField = (fieldId: number) => {
    return values?.find((v) => v.fieldId === fieldId)?.value;
  };

  if (!fields || fields.length === 0) {
    return (
      <div className="text-center py-8 rounded-xl border border-dashed border-border">
        <Settings2 className="w-7 h-7 text-muted-foreground mx-auto mb-2 opacity-30" />
        <p className="text-muted-foreground text-sm">尚未定義自定義欄目</p>
        <Link href="/settings">
          <span className="text-xs text-primary hover:underline cursor-pointer mt-1 block">前往「系統設定」新增欄目</span>
        </Link>
      </div>
    );
  }

  // Group fields by groupName, in defined order
  const grouped = GROUP_ORDER.reduce((acc, group) => {
    const groupFields = fields.filter(f => (f.groupName || "其他") === group);
    if (groupFields.length > 0) acc[group] = groupFields;
    return acc;
  }, {} as Record<string, typeof fields>);

  return (
    <>
      {Object.entries(grouped).map(([group, groupFields]) => (
        <div key={group} className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">
            {group} <span className="text-muted-foreground font-normal normal-case tracking-normal">(自定義)</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            {groupFields.map((field) => (
              <CustomValueField
                key={field.id}
                field={field}
                value={getValueForField(field.id)}
                onSave={(fieldId, value) => upsertMutation.mutate({ studentId, fieldId, value })}
              />
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
