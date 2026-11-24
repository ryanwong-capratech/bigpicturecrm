import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddStudentDialog({ open, onClose, onSuccess }: Props) {
  const [form, setForm] = useState({
    nickname: "",
    fullNameChinese: "",
    gender: "",
  });

  const createMutation = trpc.students.create.useMutation({
    onSuccess: () => {
      toast.success("學員已新增");
      setForm({ nickname: "", fullNameChinese: "", gender: "" });
      onSuccess();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nickname && !form.fullNameChinese) {
      toast.error("請輸入學員名稱");
      return;
    }
    createMutation.mutate(form);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
            新增學員
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-muted-foreground text-xs uppercase tracking-wider">暱稱</Label>
            <Input
              value={form.nickname}
              onChange={(e) => setForm({ ...form, nickname: e.target.value })}
              placeholder="例如：Hanson"
              className="bg-secondary border-border"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-muted-foreground text-xs uppercase tracking-wider">中文全名</Label>
            <Input
              value={form.fullNameChinese}
              onChange={(e) => setForm({ ...form, fullNameChinese: e.target.value })}
              placeholder="例如：陳大文"
              className="bg-secondary border-border"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-muted-foreground text-xs uppercase tracking-wider">性別</Label>
            <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="選擇性別" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="男">男</SelectItem>
                <SelectItem value="女">女</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="border-border">
              取消
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              style={{ background: "oklch(0.78 0.12 75)", color: "oklch(0.12 0.01 260)" }}
            >
              {createMutation.isPending ? "新增中..." : "新增"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
