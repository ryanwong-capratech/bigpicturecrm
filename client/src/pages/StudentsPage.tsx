import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, UserPlus, Users } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import AddStudentDialog from "@/components/AddStudentDialog";

function GenderBadge({ gender }: { gender?: string | null }) {
  if (!gender) return null;
  const isMale = gender === "男";
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${isMale ? "bg-blue-500/30 text-blue-200" : "bg-pink-500/30 text-pink-200"}`}>
      {gender}
    </span>
  );
}

function StudentCard({ student, onClick, priority }: { student: any; onClick: () => void; priority?: boolean }) {
  return (
    <div
      onClick={onClick}
      className="group relative rounded-xl overflow-hidden cursor-pointer border border-white/10 hover:border-primary/70 transition-all duration-300 hover:shadow-[0_0_28px_oklch(0.78_0.12_75_/_0.22)]"
      style={{ aspectRatio: "3/4" }}
    >
      {/* Photo */}
      {student.photoUrl ? (
        <img
          src={student.photoUrl}
          alt={student.nickname || student.fullNameChinese || ""}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : "low"}
        />
      ) : (
        <div className="absolute inset-0 bg-secondary flex items-center justify-center">
          <span
            className="text-5xl font-semibold text-muted-foreground"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {(student.nickname || student.fullNameChinese || "?")[0]}
          </span>
        </div>
      )}

      {/* Gradient overlay — always visible at bottom */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />

      {/* Gold top accent on hover */}
      <div className="absolute top-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: "oklch(0.78 0.12 75)" }} />

      {/* Info at bottom */}
      <div className="absolute bottom-0 left-0 right-0 px-3 pb-3 pt-6">
        <div className="flex items-end justify-between gap-1">
          <div className="min-w-0 flex-1">
            {/* Primary: Chinese name; fallback to nickname */}
            <p
              className="font-semibold text-white text-xs leading-tight truncate"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {student.fullNameChinese || student.nickname || "未命名"}
            </p>
            {/* Secondary: nickname if different from Chinese name */}
            {student.nickname && student.fullNameChinese && (
              <p className="text-white/50 text-xs truncate mt-0.5">{student.nickname}</p>
            )}
          </div>
          <GenderBadge gender={student.gender} />
        </div>
      </div>
    </div>
  );
}

export default function StudentsPage() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const debouncedSearch = useDebounce(search, 300);

  const { data: students, isLoading, refetch } = trpc.students.list.useQuery(
    { search: debouncedSearch || undefined },
    { staleTime: 10000 }
  );

  const total = students?.length ?? 0;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
            學員名冊
          </h1>
          <p className="text-muted-foreground text-sm">
            格局17 · 共 <span className="text-primary font-medium">{total}</span> 位學員
          </p>
        </div>
        <Button
          onClick={() => setShowAdd(true)}
          size="sm"
          className="gap-2"
          style={{ background: "oklch(0.78 0.12 75)", color: "oklch(0.12 0.01 260)" }}
        >
          <UserPlus className="w-4 h-4" />
          新增學員
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜尋學員姓名、暱稱、IG、生意模式..."
          className="pl-10 bg-card border-border h-10"
        />
      </div>

      {/* Gold divider */}
      <div className="h-px mb-6" style={{ background: "linear-gradient(90deg, transparent, oklch(0.78 0.12 75 / 0.3), transparent)" }} />

      {/* Student grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-card animate-pulse" style={{ aspectRatio: "3/4" }} />
          ))}
        </div>
      ) : students && students.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {students.map((student, idx) => (
            <StudentCard
              key={student.id}
              student={student}
              onClick={() => navigate(`/students/${student.id}`)}
              priority={idx < 12}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
          <p className="text-muted-foreground">
            {search ? `找不到「${search}」的相關學員` : "暫無學員資料"}
          </p>
        </div>
      )}

      <AddStudentDialog open={showAdd} onClose={() => setShowAdd(false)} onSuccess={() => { setShowAdd(false); refetch(); }} />
    </div>
  );
}
