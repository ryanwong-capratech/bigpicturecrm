import path from "path";
import { fileURLToPath } from "url";
import PDFDocument from "pdfkit";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FONT_DIR = path.join(__dirname, "fonts");
const FONT_REGULAR = path.join(FONT_DIR, "NotoSansTC-Regular.otf");
const FONT_BOLD = path.join(FONT_DIR, "NotoSansTC-Bold.otf");

// ─── Design tokens ────────────────────────────────────────────────────────────
const PAGE_W = 842;
const PAGE_H = 595;

// Layout: Photo column (left) + 3 data columns
const PHOTO_W = 200;
const DATA_X = PHOTO_W;
const DATA_W = PAGE_W - PHOTO_W;
const COLS_PER_ROW = 3;
const COL_GAP = 0;
const DATA_COL_W = Math.floor((DATA_W - COL_GAP * (COLS_PER_ROW - 1)) / COLS_PER_ROW);

// Colors
const GOLD = "#b8922a";
const DARK_BG = "#1a1208";
const PAGE_BG = "#faf8f3";
const TEXT_DARK = "#1a1a1a";
const TEXT_MUTED = "#7a6240";
const BORDER = "#e6dcc1";

// Font sizes
const FS_HERO_NAME = 26;
const FS_HERO_SUB = 13;
const FS_TITLE = 18;
const FS_SECTION = 13;
const FS_LABEL = 9.5;
const FS_VALUE = 11;
const FS_FOOTER = 8;

// ─── Types ─────────────────────────────────────────────────────────────────────
interface Student {
  id: number;
  nickname?: string | null;
  fullNameChinese?: string | null;
  gender?: string | null;
  photoUrl?: string | null;
  birthday?: string | null;
  igFb?: string | null;
  email?: string | null;
  phone?: string | null;
  favoriteSongs?: string | null;
  businessModel?: string | null;
  partnersEmployees?: string | null;
  companyInfo?: string | null;
  nextGoal?: string | null;
  businessBottleneck?: string | null;
  wantToImprove?: string | null;
  whyJoin?: string | null;
  courseExpectation?: string | null;
  wantToTakeAway?: string | null;
  otherCourses?: string | null;
  interestedWorkshops?: string | null;
  attendanceConfirmed?: string | null;
  maritalStatus?: string | null;
  familyMembers?: string | null;
  mostImportantPerson?: string | null;
  mainIncome?: string | null;
  mainExpense?: string | null;
  incomeLevel?: string | null;
  financialSatisfaction?: string | null;
  financialControl?: string | null;
}

interface CustomField {
  id: number;
  label: string;
  groupName?: string | null;
}

interface CustomValue {
  fieldId: number;
  value: string | null;
}

interface Props {
  student: Student;
  customFields?: CustomField[];
  customValues?: CustomValue[];
}

// ─── Field groups (mirrors client/src/pages/StudentDetailPage.tsx FIELD_GROUPS) ─
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

// ─── Helpers ───────────────────────────────────────────────────────────────────
async function fetchImageBuffer(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const arr = await res.arrayBuffer();
    return Buffer.from(arr);
  } catch {
    return null;
  }
}

interface FieldItem {
  label: string;
  value: string;
}

interface SectionData {
  title: string;
  items: FieldItem[];
}

function buildSections(props: Props): SectionData[] {
  const { student, customFields = [], customValues = [] } = props;
  const getCustomValue = (fieldId: number) =>
    customValues.find((v) => v.fieldId === fieldId)?.value || "";

  const customByGroup: Record<string, CustomField[]> = {};
  customFields.forEach((f) => {
    const g = f.groupName || "其他";
    if (!customByGroup[g]) customByGroup[g] = [];
    customByGroup[g].push(f);
  });

  const sections: SectionData[] = [];
  for (const group of FIELD_GROUPS) {
    const items: FieldItem[] = [];
    for (const f of group.fields) {
      const v = (student as any)[f.key];
      if (v != null && String(v).trim() !== "") {
        items.push({ label: f.label, value: String(v) });
      }
    }
    const cf = customByGroup[group.title] || [];
    for (const c of cf) {
      const v = getCustomValue(c.id);
      if (v.trim() !== "") items.push({ label: c.label, value: v });
    }
    if (items.length > 0) sections.push({ title: group.title, items });
  }
  // "其他" group from custom fields with no/unknown groupName
  const otherCf = customByGroup["其他"] || [];
  if (otherCf.length > 0) {
    const items: FieldItem[] = [];
    for (const c of otherCf) {
      const v = getCustomValue(c.id);
      if (v.trim() !== "") items.push({ label: c.label, value: v });
    }
    if (items.length > 0) sections.push({ title: "其他", items });
  }
  return sections;
}

// ─── Main renderer ─────────────────────────────────────────────────────────────
export async function generatePersonalInfoPdf(props: Props): Promise<Buffer> {
  const { student } = props;
  const photoBuf = student.photoUrl ? await fetchImageBuffer(student.photoUrl) : null;
  const displayName = student.nickname || student.fullNameChinese || "未命名";
  const sections = buildSections(props);
  const today = new Date().toLocaleDateString("zh-HK");

  return new Promise<Buffer>((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: [PAGE_W, PAGE_H],
        margin: 0,
        autoFirstPage: true,
        bufferPages: true,
        info: {
          Title: `格局17 個人資料 - ${displayName}`,
          Creator: "格局17 學員管理系統",
        },
      });

      doc.registerFont("zh", FONT_REGULAR);
      doc.registerFont("zh-bold", FONT_BOLD);

      const chunks: Buffer[] = [];
      doc.on("data", (c: Buffer) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // ── Background ─────────────────────────────────────
      doc.rect(0, 0, PAGE_W, PAGE_H).fill(PAGE_BG);

      // ═══ PHOTO COLUMN (left) ═══════════════════════════
      doc.rect(0, 0, PHOTO_W, PAGE_H).fill(DARK_BG);
      if (photoBuf) {
        try {
          doc.save();
          doc.rect(0, 0, PHOTO_W, PAGE_H).clip();
          doc.image(photoBuf, 0, 0, { cover: [PHOTO_W, PAGE_H], align: "center", valign: "center" });
          doc.restore();
        } catch {
          doc.font("zh-bold").fontSize(80).fillColor(GOLD)
            .text(displayName[0], 0, PAGE_H / 2 - 60, { width: PHOTO_W, align: "center" });
        }
      } else {
        doc.font("zh-bold").fontSize(80).fillColor(GOLD)
          .text(displayName[0], 0, PAGE_H / 2 - 60, { width: PHOTO_W, align: "center" });
      }

      // Bottom gradient overlay for name
      doc.save();
      doc.fillOpacity(0.78).rect(0, PAGE_H - 120, PHOTO_W, 120).fill("#000000");
      doc.restore();

      doc.font("zh-bold").fontSize(FS_HERO_NAME).fillColor("#ffffff")
        .text(displayName, 12, PAGE_H - 100, { width: PHOTO_W - 24, lineBreak: false, ellipsis: true });
      if (student.fullNameChinese && student.nickname) {
        doc.font("zh").fontSize(FS_HERO_SUB).fillColor("#e8d4a0")
          .text(student.fullNameChinese, 12, PAGE_H - 65, { width: PHOTO_W - 24, lineBreak: false, ellipsis: true });
      }
      const badge = [student.gender, student.attendanceConfirmed ? "已確認出席" : null].filter(Boolean).join(" · ");
      if (badge) {
        doc.font("zh").fontSize(10).fillColor("#d4af6a")
          .text(badge, 12, PAGE_H - 38, { width: PHOTO_W - 24, lineBreak: false, ellipsis: true });
      }

      // ═══ TITLE BAR ═════════════════════════════════════
      const titleY = 14;
      doc.rect(DATA_X + 14, titleY, 5, 24).fill(GOLD);
      doc.font("zh-bold").fontSize(FS_TITLE).fillColor(TEXT_DARK)
        .text("個人資料", DATA_X + 26, titleY + 2, { width: DATA_W - 40, lineBreak: false });
      doc.font("zh").fontSize(9).fillColor(TEXT_MUTED)
        .text(today, DATA_X + 26, titleY + 24, { width: DATA_W - 40, lineBreak: false });

      // ═══ DATA COLUMNS (3-column flow) ══════════════════
      const dataTop = 60;
      const dataBottom = PAGE_H - 22;
      const padX = 14;

      // Compute layout: distribute sections across 3 columns greedily by estimated height
      // First pass: measure each section's needed height with default font
      const sectionHeights: number[] = [];
      const SECTION_GAP = 10;
      const TITLE_H = FS_SECTION * 1.4 + 4;
      const ITEM_GAP = 4;

      const measureItem = (item: FieldItem, maxW: number, valueFs: number): number => {
        doc.font("zh").fontSize(FS_LABEL);
        const labelH = doc.heightOfString(item.label, { width: maxW, lineGap: 0.5 });
        doc.font("zh").fontSize(valueFs);
        const valueH = doc.heightOfString(item.value, { width: maxW, lineGap: 1.5 });
        return labelH + valueH + ITEM_GAP + 2;
      };

      const measureSection = (s: SectionData, maxW: number, valueFs: number): number => {
        let h = TITLE_H;
        for (const it of s.items) h += measureItem(it, maxW, valueFs);
        return h + SECTION_GAP;
      };

      const colInnerW = DATA_COL_W - padX * 2;
      const availColH = dataBottom - dataTop;

      // Try shrinking value font until total fits
      let valueFs = FS_VALUE;
      let columnAssignment: number[][] = [[], [], []];
      for (let attempt = 0; attempt < 8; attempt++) {
        sectionHeights.length = 0;
        for (const s of sections) sectionHeights.push(measureSection(s, colInnerW, valueFs));
        // Greedy: place each section in shortest column
        const colHeights = [0, 0, 0];
        const assignment: number[][] = [[], [], []];
        for (let i = 0; i < sections.length; i++) {
          let best = 0;
          for (let c = 1; c < COLS_PER_ROW; c++) {
            if (colHeights[c] < colHeights[best]) best = c;
          }
          assignment[best].push(i);
          colHeights[best] += sectionHeights[i];
        }
        const maxColH = Math.max(...colHeights);
        if (maxColH <= availColH) {
          columnAssignment = assignment;
          break;
        }
        valueFs -= 0.5;
        if (valueFs < 8) {
          valueFs = 8;
          columnAssignment = assignment;
          break;
        }
      }

      // Render each column
      for (let c = 0; c < COLS_PER_ROW; c++) {
        let y = dataTop;
        const x = DATA_X + c * (DATA_COL_W + COL_GAP);
        const innerX = x + padX;
        // Light divider between columns (except first)
        if (c > 0) {
          doc.save();
          doc.lineWidth(0.5).strokeColor(BORDER)
            .moveTo(x, dataTop - 4).lineTo(x, dataBottom).stroke();
          doc.restore();
        }
        for (const sectionIdx of columnAssignment[c]) {
          const s = sections[sectionIdx];
          if (y > dataBottom - 20) break;
          // Section title with gold accent bar
          doc.rect(innerX - 8, y + 1, 3, FS_SECTION).fill(GOLD);
          doc.font("zh-bold").fontSize(FS_SECTION).fillColor(TEXT_DARK)
            .text(s.title, innerX, y, { width: colInnerW, lineBreak: false });
          y += TITLE_H;
          for (const item of s.items) {
            if (y > dataBottom - 16) break;
            doc.font("zh").fontSize(FS_LABEL).fillColor(TEXT_MUTED);
            const labelH = doc.heightOfString(item.label, { width: colInnerW, lineGap: 0.5 });
            doc.text(item.label, innerX, y, { width: colInnerW, lineGap: 0.5 });
            y += labelH + 2;
            doc.font("zh").fontSize(valueFs).fillColor(TEXT_DARK);
            const remainH = dataBottom - y;
            doc.text(item.value, innerX, y, {
              width: colInnerW,
              lineGap: 1.5,
              height: remainH,
              ellipsis: true,
            });
            const used = doc.heightOfString(item.value, { width: colInnerW, lineGap: 1.5 });
            y += Math.min(used, remainH) + ITEM_GAP;
          }
          y += SECTION_GAP;
        }
      }

      // ═══ FOOTER ═════════════════════════════════════════
      doc.switchToPage(0);
      doc.font("zh").fontSize(FS_FOOTER).fillColor(TEXT_MUTED)
        .text(`格局17 · 個人資料 · ID: ${student.id} · ${today}`,
          0, PAGE_H - 12, { width: PAGE_W, align: "center", lineBreak: false });

      // Enforce single-page output
      const range = doc.bufferedPageRange();
      if (range.count > 1) {
        const pdfDoc = doc as PDFKit.PDFDocument & { _pageBuffer?: PDFKit.PDFPage[] };
        if (pdfDoc._pageBuffer) pdfDoc._pageBuffer.splice(1);
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
