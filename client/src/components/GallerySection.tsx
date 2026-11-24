import { useState, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { compressImage } from "@/lib/imageCompressor";
import { Upload, Trash2, X, ChevronLeft, ChevronRight, ImageIcon, Pencil, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// ===== Lightbox =====
function Lightbox({
  images,
  initialIndex,
  onClose,
}: {
  images: { id: number; imageUrl: string; caption?: string | null }[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [current, setCurrent] = useState(initialIndex);

  const prev = useCallback(() => setCurrent((i) => (i - 1 + images.length) % images.length), [images.length]);
  const next = useCallback(() => setCurrent((i) => (i + 1) % images.length), [images.length]);

  // Keyboard navigation
  const handleKey = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
      if (e.key === "Escape") onClose();
    },
    [prev, next, onClose]
  );

  const img = images[current];
  if (!img) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}
      onKeyDown={handleKey}
      tabIndex={0}
      autoFocus
    >
      {/* Close button */}
      <button
        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        onClick={onClose}
      >
        <X className="w-5 h-5" />
      </button>

      {/* Counter */}
      {images.length > 1 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/60 text-sm bg-black/40 px-3 py-1 rounded-full">
          {current + 1} / {images.length}
        </div>
      )}

      {/* Prev button */}
      {images.length > 1 && (
        <button
          className="absolute left-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          onClick={(e) => { e.stopPropagation(); prev(); }}
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {/* Image */}
      <div className="max-w-[90vw] max-h-[85vh] flex flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}>
        <img
          src={img.imageUrl}
          alt={img.caption || ""}
          className="max-w-full max-h-[78vh] object-contain rounded-lg shadow-2xl"
          style={{ userSelect: "none" }}
        />
        {img.caption && (
          <p className="text-white/80 text-sm text-center max-w-lg">{img.caption}</p>
        )}
      </div>

      {/* Next button */}
      {images.length > 1 && (
        <button
          className="absolute right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          onClick={(e) => { e.stopPropagation(); next(); }}
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}

// ===== Gallery Item Card =====
function GalleryCard({
  item,
  onDelete,
  onCaptionUpdate,
  onClick,
}: {
  item: { id: number; imageUrl: string; caption?: string | null; createdAt: Date };
  onDelete: (id: number) => void;
  onCaptionUpdate: (id: number, caption: string) => void;
  onClick: () => void;
}) {
  const [editingCaption, setEditingCaption] = useState(false);
  const [captionDraft, setCaptionDraft] = useState(item.caption || "");

  const handleSaveCaption = () => {
    onCaptionUpdate(item.id, captionDraft);
    setEditingCaption(false);
  };

  return (
    <div className="group relative rounded-xl overflow-hidden border border-border bg-card hover:border-primary/40 transition-all duration-200">
      {/* Image */}
      <div
        className="relative aspect-square cursor-zoom-in overflow-hidden"
        onClick={onClick}
      >
        <img
          src={item.imageUrl}
          alt={item.caption || "活動照片"}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          decoding="async"
        />
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/50 rounded-full p-2">
            <ImageIcon className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>

      {/* Caption area */}
      <div className="p-2.5">
        {editingCaption ? (
          <div className="flex gap-1.5 items-center">
            <Input
              value={captionDraft}
              onChange={(e) => setCaptionDraft(e.target.value)}
              className="h-7 text-xs bg-background border-primary"
              placeholder="圖片說明..."
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveCaption();
                if (e.key === "Escape") { setEditingCaption(false); setCaptionDraft(item.caption || ""); }
              }}
            />
            <button onClick={handleSaveCaption} className="p-1 rounded bg-primary text-primary-foreground hover:opacity-80">
              <Check className="w-3 h-3" />
            </button>
            <button onClick={() => { setEditingCaption(false); setCaptionDraft(item.caption || ""); }} className="p-1 rounded bg-secondary text-muted-foreground hover:text-foreground">
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1 min-h-[24px]">
            <span
              className={`text-xs flex-1 truncate ${item.caption ? "text-muted-foreground" : "text-muted-foreground/40 italic"}`}
            >
              {item.caption || "點擊新增說明"}
            </span>
            <button
              onClick={() => { setCaptionDraft(item.caption || ""); setEditingCaption(true); }}
              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-secondary transition-all"
              title="編輯說明"
            >
              <Pencil className="w-3 h-3 text-muted-foreground" />
            </button>
          </div>
        )}
        <div className="text-xs text-muted-foreground/40 mt-1">
          {new Date(item.createdAt).toLocaleDateString("zh-HK")}
        </div>
      </div>

      {/* Delete button */}
      <button
        onClick={() => onDelete(item.id)}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-150 p-1.5 rounded-full bg-red-500/80 hover:bg-red-500 text-white shadow-lg"
        title="刪除照片"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ===== Main Gallery Section =====
export default function GallerySection({ studentId }: { studentId: number }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const { data: images, isLoading, refetch } = trpc.gallery.list.useQuery({ studentId });

  const uploadMutation = trpc.gallery.upload.useMutation({
    onSuccess: () => { toast.success("照片已上傳"); refetch(); setUploading(false); },
    onError: (err) => { toast.error(err.message); setUploading(false); },
  });

  const deleteMutation = trpc.gallery.delete.useMutation({
    onSuccess: () => { toast.success("照片已刪除"); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  const captionMutation = trpc.gallery.updateCaption.useMutation({
    onSuccess: () => { toast.success("說明已更新"); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    for (const file of files) {
      await new Promise<void>(async (resolve) => {
        try {
          const { base64, mimeType, originalSize, compressedSize } = await compressImage(file);
          console.log(`[Gallery] ${(originalSize/1024).toFixed(0)}KB → ${(compressedSize/1024).toFixed(0)}KB`);
          uploadMutation.mutate(
            { studentId, fileName: file.name.replace(/\.[^.]+$/, ".jpg"), fileBase64: base64, mimeType },
            { onSettled: () => resolve() }
          );
        } catch (err: any) {
          toast.error(err?.message || "圖片壓縮失敗，請重新選擇圖片");
          resolve();
        }
      });
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDelete = (id: number) => {
    if (confirm("確定刪除這張照片？")) {
      deleteMutation.mutate({ id });
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="aspect-square bg-card rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xs font-semibold text-primary uppercase tracking-widest">
            學員圖集 · {images?.length ?? 0} 張照片
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">記錄學員活動及課程精彩時刻</p>
        </div>
        <Button
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="gap-1.5"
        >
          <Upload className="w-3.5 h-3.5" />
          {uploading ? "上傳中..." : "上傳照片"}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Empty state */}
      {(!images || images.length === 0) && (
        <div
          className="rounded-xl border-2 border-dashed border-border bg-card/50 p-12 text-center cursor-pointer hover:border-primary/40 hover:bg-card transition-all"
          onClick={() => fileInputRef.current?.click()}
        >
          <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
          <p className="text-muted-foreground text-sm font-medium">尚未有活動照片</p>
          <p className="text-muted-foreground/60 text-xs mt-1">點擊此處或使用「上傳照片」按鈕新增</p>
        </div>
      )}

      {/* Grid */}
      {images && images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {images.map((item, idx) => (
            <GalleryCard
              key={item.id}
              item={item}
              onDelete={handleDelete}
              onCaptionUpdate={(id, caption) => captionMutation.mutate({ id, caption })}
              onClick={() => setLightboxIndex(idx)}
            />
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && images && images.length > 0 && (
        <Lightbox
          images={images}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
}
