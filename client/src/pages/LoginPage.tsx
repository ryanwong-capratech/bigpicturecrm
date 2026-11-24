import { useState } from "react";
import { usePortalAuth } from "@/contexts/PortalAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Eye, EyeOff, Lock } from "lucide-react";

export default function LoginPage() {
  const { login } = usePortalAuth();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    setLoading(true);
    try {
      await login(password);
    } catch (err: any) {
      toast.error(err?.message || "密碼錯誤，請重試");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-5"
          style={{ background: "radial-gradient(circle, oklch(0.78 0.12 75), transparent)" }} />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full opacity-5"
          style={{ background: "radial-gradient(circle, oklch(0.78 0.12 75), transparent)" }} />
      </div>

      <div className="w-full max-w-sm px-6 relative z-10">
        {/* Logo / Title */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border border-primary/30 mb-5"
            style={{ background: "oklch(0.16 0.01 260)" }}>
            <span className="text-2xl">🔆</span>
          </div>
          <h1 className="text-3xl font-semibold mb-1" style={{ fontFamily: "'Playfair Display', serif", color: "oklch(0.78 0.12 75)" }}>
            格局17
          </h1>
          <p className="text-muted-foreground text-sm tracking-widest uppercase">Coach Portal</p>
        </div>

        {/* Gold divider */}
        <div className="h-px mb-8" style={{ background: "linear-gradient(90deg, transparent, oklch(0.78 0.12 75 / 0.4), transparent)" }} />

        {/* Login form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs text-muted-foreground mb-2 tracking-wider uppercase">
              存取密碼
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="輸入密碼"
                className="pl-10 pr-10 bg-card border-border focus:border-primary h-11"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading || !password.trim()}
            className="w-full h-11 font-medium tracking-wide"
            style={{ background: "oklch(0.78 0.12 75)", color: "oklch(0.12 0.01 260)" }}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                驗證中...
              </span>
            ) : "進入系統"}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-8 opacity-50">
          僅限授權教練及導師使用
        </p>
      </div>
    </div>
  );
}
