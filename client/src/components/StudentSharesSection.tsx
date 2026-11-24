import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { MessageCircle, Plus, Edit2, Trash2, Clock } from "lucide-react";

interface Props {
  studentId: number;
}

interface Share {
  id: number;
  studentId: number;
  content: string;
  sessionLabel: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface ShareCardProps {
  share: Share;
  onUpdate: (id: number, content: string, sessionLabel?: string) => void;
  onDelete: (id: number) => void;
}

function formatDate(d: Date | string) {
  try {
    return new Date(d).toLocaleString("zh-HK", {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function ShareCard({ share, onUpdate, onDelete }: ShareCardProps) {
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(share.content);
  const [sessionLabel, setSessionLabel] = useState(share.sessionLabel || "");

  const handleSave = () => {
    if (!content.trim()) return;
    onUpdate(share.id, content, sessionLabel || undefined);
    setEditing(false);
  };

  return (
    <div className="group rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30">
      {editing ? (
        <div className="space-y-3">
          <Input
            value={sessionLabel}
            onChange={(e) => setSessionLabel(e.target.value)}
            placeholder="課堂標籤（例如：第一堂、第二堂）"
            className="bg-secondary border-border text-sm h-9"
          />
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="bg-secondary border-border text-sm min-h-[100px]"
            autoFocus
          />
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline" onClick={() => { setEditing(false); setContent(share.content); setSessionLabel(share.sessionLabel || ""); }} className="h-7 text-xs border-border">
              取消
            </Button>
            <Button size="sm" onClick={handleSave} className="h-7 text-xs" style={{ background: "oklch(0.78 0.12 75)", color: "oklch(0.12 0.01 260)" }}>
              儲存
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              {share.sessionLabel && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary font-medium">
                  {share.sessionLabel}
                </span>
              )}
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDate(share.createdAt)}
              </span>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => setEditing(true)} className="p-1 text-muted-foreground hover:text-primary transition-colors">
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => onDelete(share.id)} className="p-1 text-muted-foreground hover:text-destructive transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{share.content}</p>
        </>
      )}
    </div>
  );
}

export default function StudentSharesSection({ studentId }: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const { data: shares, refetch } = trpc.shares.list.useQuery({ studentId });
  const createMutation = trpc.shares.create.useMutation({
    onSuccess: () => { toast.success("分享已新增"); setNewContent(""); setNewLabel(""); setShowAdd(false); refetch(); },
    onError: (err) => toast.error(err.message),
  });
  const updateMutation = trpc.shares.update.useMutation({
    onSuccess: () => { toast.success("分享已更新"); refetch(); },
    onError: (err) => toast.error(err.message),
  });
  const deleteMutation = trpc.shares.delete.useMutation({
    onSuccess: () => { toast.success("分享已刪除"); refetch(); },
    onError: (err) => toast.error(err.message),
  });
  return (
    <div className="space-y-4">
      {/* Add share */}
      {showAdd ? (
        <div className="rounded-xl border border-primary/30 bg-card p-4 space-y-3">
          <h3 className="text-sm font-medium text-primary">新增學員分享</h3>
          <Input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="課堂標籤（例如：第一堂、第二堂）"
            className="bg-secondary border-border text-sm h-9"
          />
          <Textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="記錄學員的分享、感受、突破..."
            className="bg-secondary border-border text-sm min-h-[120px]"
            autoFocus
          />
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline" onClick={() => setShowAdd(false)} className="border-border">取消</Button>
            <Button
              size="sm"
              disabled={!newContent.trim() || createMutation.isPending}
              onClick={() => createMutation.mutate({ studentId, content: newContent, sessionLabel: newLabel || undefined })}
              style={{ background: "oklch(0.78 0.12 75)", color: "oklch(0.12 0.01 260)" }}
            >
              {createMutation.isPending ? "新增中..." : "新增分享"}
            </Button>
          </div>
        </div>
      ) : (
        <Button
          onClick={() => setShowAdd(true)}
          variant="outline"
          className="w-full border-dashed border-border hover:border-primary/50 gap-2"
        >
          <Plus className="w-4 h-4" />
          新增學員分享
        </Button>
      )}
      {/* Shares list */}
      {shares && shares.length > 0 ? (
        <div className="space-y-3">
          {shares.map((share) => (
            <ShareCard
              key={share.id}
              share={share}
              onUpdate={(id, content, sessionLabel) => updateMutation.mutate({ id, content, sessionLabel })}
              onDelete={(id) => deleteMutation.mutate({ id })}
            />
          ))}
        </div>
      ) : !showAdd ? (
        <div className="text-center py-12 rounded-xl border border-dashed border-border">
          <MessageCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-30" />
          <p className="text-muted-foreground text-sm">尚未有學員分享</p>
          <p className="text-muted-foreground text-xs mt-1 opacity-60">點擊上方按鈕新增第一則分享</p>
        </div>
      ) : null}
    </div>
  );
}
