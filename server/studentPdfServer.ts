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

// Three columns (A=20%, B=20%, C=60%)
const COL_A_W = Math.floor(PAGE_W * 0.20); // 168
const COL_B_W = Math.floor(PAGE_W * 0.20); // 168
const COL_C_X = COL_A_W + COL_B_W;          // 336
const COL_C_W = PAGE_W - COL_C_X;           // 506

// Colors
const GOLD = "#b8922a";
const DARK_BG = "#1a1208";
const PAGE_BG = "#faf8f3";
const PAPER_WHITE = "#fdfbf5";
const TEXT_DARK = "#1a1a1a";
const TEXT_MUTED = "#7a6240";
const BORDER = "#e6dcc1";

// Font sizes
const FS_HERO_NAME = 26;
const FS_HERO_SUB = 13;
const FS_SECTION = 14;
const FS_LABEL = 10;
const FS_VALUE = 13;
const FS_AI_TITLE = 18;
const FS_AI_HEADING = 15;
const FS_AI_BODY = 14;
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

interface CoachNote {
  id: number;
  content: string;
  sessionLabel?: string | null;
  createdAt: Date | string;
}

interface StudentShare {
  id: number;
  content: string;
  sessionLabel?: string | null;
  createdAt: Date | string;
}

interface Props {
  student: Student;
  customFields?: CustomField[];
  customValues?: CustomValue[];
  coachNotes?: CoachNote[];
  studentShares?: StudentShare[];
  aiSummary?: string | null;
}

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

function parseAiSections(aiSummary: string | null | undefined): { heading: string; body: string; isIntro?: boolean }[] {
  if (!aiSummary) return [];
  const parts = aiSummary.split(/\n(?=## )/);
  const result: { heading: string; body: string; isIntro?: boolean }[] = [];

  for (let i = 0; i < parts.length; i++) {
    const section = parts[i].trim();
    const lines = section.split("\n");
    let heading = "";
    let bodyStart = 0;
    if (lines[0].startsWith("## ")) {
      heading = lines[0].replace(/^##\s*/, "").replace(/\*+/g, "").trim();
      bodyStart = 1;
    }
    const body = lines
      .slice(bodyStart)
      .join("\n")
      .replace(/\*+/g, "")
      .replace(/^---+$/gm, "")
      .replace(/^#+\s*/gm, "")
      .replace(/-\n/g, "")
      .replace(/\n+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!heading && !body) continue;
    if (heading.includes("教練建議")) continue;

    // First section without heading is treated as intro
    if (!heading && i === 0) {
      result.push({ heading: "", body, isIntro: true });
    } else {
      result.push({ heading, body });
    }
  }
  return result;
}

// ─── Drawing primitives ────────────────────────────────────────────────────────
type Doc = PDFKit.PDFDocument;

function drawField(doc: Doc, x: number, y: number, w: number, label: string, value: string | null | undefined, maxLines: number = 2): number {
  if (!value) return y;
  const labelH = 12;
  doc.font("zh").fontSize(FS_LABEL).fillColor(TEXT_MUTED).text(label, x, y, { width: w, lineBreak: false, ellipsis: true });
  const valY = y + labelH;
  doc.font("zh").fontSize(FS_VALUE).fillColor(TEXT_DARK);
  const maxValueH = FS_VALUE * 1.35 * maxLines + 2;
  const trimmed = value.length > 80 ? value.slice(0, 78) + "…" : value;
  const h = doc.heightOfString(trimmed, { width: w, lineGap: 0.5 });
  const drawH = Math.min(h, maxValueH);
  doc.text(trimmed, x, valY, { width: w, lineGap: 0.5, height: maxValueH, ellipsis: true });
  return valY + drawH + 5;
}

function drawSectionTitle(doc: Doc, x: number, y: number, w: number, title: string): number {
  // small gold bar + title text
  doc.rect(x, y + 3, 3, 14).fill(GOLD);
  doc.font("zh-bold").fontSize(FS_SECTION).fillColor(TEXT_DARK)
    .text(title, x + 8, y + 1, { width: w - 8, lineBreak: false });
  return y + 22;
}

// ─── Main generator ────────────────────────────────────────────────────────────
export async function generateStudentPdf(props: Props): Promise<Buffer> {
  const { student, customFields = [], customValues = [], aiSummary } = props;

  // Pre-fetch photo
  const photoBuf = student.photoUrl ? await fetchImageBuffer(student.photoUrl) : null;

  const displayName = student.nickname || student.fullNameChinese || "未命名";
  const aiSections = parseAiSections(aiSummary);

  const getCustomValue = (fieldId: number) =>
    customValues.find((v) => v.fieldId === fieldId)?.value;

  const customByGroup: Record<string, CustomField[]> = {};
  customFields.forEach((f) => {
    const g = f.groupName || "其他";
    if (!customByGroup[g]) customByGroup[g] = [];
    customByGroup[g].push(f);
  });

  const today = new Date().toLocaleDateString("zh-HK");

  return new Promise<Buffer>((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: [PAGE_W, PAGE_H],
        margin: 0,
        autoFirstPage: true,
        bufferPages: true,
        info: {
          Title: `格局17 - ${displayName}`,
          Creator: "格局17 學員管理系統",
        },
      });
      // Prevent automatic page creation when content overflows
      doc.on('pageAdded', () => {
        // Allow only the first page; ignore overflow content silently
      });

      doc.registerFont("zh", FONT_REGULAR);
      doc.registerFont("zh-bold", FONT_BOLD);

      const chunks: Buffer[] = [];
      doc.on("data", (c: Buffer) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // ── Background ─────────────────────────────────────
      doc.rect(0, 0, PAGE_W, PAGE_H).fill(PAGE_BG);

      // ═══ COLUMN A ═══════════════════════════════════════
      // Reserve space for biz/finance fields below photo, to keep one page only
      const photoBoxH = 260;
      // Photo background
      doc.rect(0, 0, COL_A_W, photoBoxH).fill(DARK_BG);
      if (photoBuf) {
        try {
          // Hard clip to A column box so image cannot overflow into B column
          doc.save();
          doc.rect(0, 0, COL_A_W, photoBoxH).clip();
          doc.image(photoBuf, 0, 0, { cover: [COL_A_W, photoBoxH], align: "center", valign: "center" });
          doc.restore();
        } catch {
          // fallback placeholder
          doc.font("zh-bold").fontSize(60).fillColor(GOLD)
            .text(displayName[0], 0, photoBoxH / 2 - 40, { width: COL_A_W, align: "center" });
        }
      } else {
        doc.font("zh-bold").fontSize(60).fillColor(GOLD)
          .text(displayName[0], 0, photoBoxH / 2 - 40, { width: COL_A_W, align: "center" });
      }
      // Gradient overlay (simulated with semi-transparent rect)
      doc.save();
      doc.fillOpacity(0.75).rect(0, photoBoxH - 95, COL_A_W, 95).fill("#000000");
      doc.restore();
      // Name overlay
      doc.font("zh-bold").fontSize(FS_HERO_NAME).fillColor("#ffffff")
        .text(displayName, 10, photoBoxH - 80, { width: COL_A_W - 20, lineBreak: false, ellipsis: true });
      if (student.fullNameChinese && student.nickname) {
        doc.font("zh").fontSize(FS_HERO_SUB).fillColor("#e8d4a0")
          .text(student.fullNameChinese, 10, photoBoxH - 46, { width: COL_A_W - 20, lineBreak: false, ellipsis: true });
      }
      const badgeText = [student.gender, student.attendanceConfirmed].filter(Boolean).join(" · ");
      if (badgeText) {
        doc.font("zh").fontSize(10).fillColor("#d4af6a")
          .text(badgeText, 10, photoBoxH - 22, { width: COL_A_W - 20, lineBreak: false, ellipsis: true });
      }

      // Bottom box: Business + Finance (only render if has any data)
      let yA = photoBoxH + 12;
      const colAPad = 10;
      const colAW = COL_A_W - colAPad * 2;
      const colABottom = PAGE_H - 22;
      const hasBiz = student.businessModel || student.companyInfo || student.partnersEmployees;
      const hasFin = student.incomeLevel || student.financialSatisfaction || student.financialControl;
      if (hasBiz) {
        yA = drawSectionTitle(doc, colAPad, yA, colAW, "生意資訊");
        yA = drawField(doc, colAPad, yA, colAW, "生意模式", student.businessModel, 3);
        yA = drawField(doc, colAPad, yA, colAW, "公司", student.companyInfo);
        yA = drawField(doc, colAPad, yA, colAW, "拍檔/員工", student.partnersEmployees);
      }
      if (hasFin && yA < colABottom - 60) {
        yA = drawSectionTitle(doc, colAPad, yA + 4, colAW, "財政狀況");
        yA = drawField(doc, colAPad, yA, colAW, "收入水平", student.incomeLevel, 1);
        yA = drawField(doc, colAPad, yA, colAW, "滿意度", student.financialSatisfaction, 1);
        yA = drawField(doc, colAPad, yA, colAW, "掌握度", student.financialControl, 1);
      }

      // ═══ COLUMN B ═══════════════════════════════════════
      const colBPad = 12;
      const colBX = COL_A_W + colBPad;
      const colBW = COL_B_W - colBPad * 2;
      const colBBottom = PAGE_H - 22;
      let yB = 16;
      const hasBasic = student.fullNameChinese || student.nickname || student.birthday || student.phone || student.igFb || student.favoriteSongs;
      if (hasBasic) {
        yB = drawSectionTitle(doc, colBX, yB, colBW, "基本資料");
        yB = drawField(doc, colBX, yB, colBW, "中文全名", student.fullNameChinese, 1);
        yB = drawField(doc, colBX, yB, colBW, "暱稱", student.nickname, 1);
        yB = drawField(doc, colBX, yB, colBW, "生日", student.birthday, 1);
        yB = drawField(doc, colBX, yB, colBW, "電話", student.phone, 1);
        yB = drawField(doc, colBX, yB, colBW, "IG/FB", student.igFb, 1);
        yB = drawField(doc, colBX, yB, colBW, "喜歡的歌", student.favoriteSongs, 2);
      }

      const hasBg = student.maritalStatus || student.familyMembers || student.mostImportantPerson;
      if (hasBg && yB < colBBottom - 90) {
        yB = drawSectionTitle(doc, colBX, yB + 4, colBW, "個人背景");
        yB = drawField(doc, colBX, yB, colBW, "婚姻/感情", student.maritalStatus, 2);
        yB = drawField(doc, colBX, yB, colBW, "家庭成員", student.familyMembers, 1);
        yB = drawField(doc, colBX, yB, colBW, "最重要的人", student.mostImportantPerson, 1);
      }

      const hasCourse = student.whyJoin || student.otherCourses;
      if (hasCourse && yB < colBBottom - 60) {
        yB = drawSectionTitle(doc, colBX, yB + 4, colBW, "課程相關");
        yB = drawField(doc, colBX, yB, colBW, "為什麼來上格局", student.whyJoin, 3);
        yB = drawField(doc, colBX, yB, colBW, "其他課程", student.otherCourses, 2);
      }

      // Vertical separators
      doc.moveTo(COL_A_W, 8).lineTo(COL_A_W, PAGE_H - 18).lineWidth(0.5).strokeColor(BORDER).stroke();
      doc.moveTo(COL_C_X, 8).lineTo(COL_C_X, PAGE_H - 18).lineWidth(0.5).strokeColor(BORDER).stroke();

      // ═══ COLUMN C: AI Analysis ═══════════════════════════
      const colCPad = 14;
      const colCX = COL_C_X + colCPad;
      const colCW = COL_C_W - colCPad * 2;
      const colCBottom = PAGE_H - 22;

      let yC = 16;
      // Title bar
      doc.rect(COL_C_X + 8, yC, 5, 22).fill(GOLD);
      doc.font("zh-bold").fontSize(FS_AI_TITLE).fillColor(TEXT_DARK)
        .text("AI 分析報告", colCX + 4, yC + 2, { width: colCW - 4, lineBreak: false });
      yC += 32;

      if (aiSections.length === 0) {
        doc.font("zh").fontSize(FS_AI_BODY).fillColor(TEXT_MUTED)
          .text("尚未生成 AI 分析。請在學員詳情頁點擊「開始 AI 分析」。",
            colCX, yC, { width: colCW });
      } else {
        // Calculate dynamic body font size to fit all sections in available height
        const availH = colCBottom - yC;
        let bodyFs = FS_AI_BODY;
        const LINE_GAP = 1.5;
        for (let attempt = 0; attempt < 14; attempt++) {
          const headingH = FS_AI_HEADING * 1.3 + 5;
          let totalH = 0;
          for (const s of aiSections) {
            if (s.heading) totalH += headingH;
            doc.font("zh").fontSize(bodyFs);
            const h = doc.heightOfString(s.body, { width: colCW, lineGap: LINE_GAP });
            totalH += h + 7;
          }
          if (totalH <= availH) break;
          bodyFs -= 0.5;
          if (bodyFs < 9) { bodyFs = 9; break; }
        }

        for (const s of aiSections) {
          if (yC > colCBottom - 12) break;
          if (s.heading) {
            doc.font("zh-bold").fontSize(FS_AI_HEADING).fillColor(GOLD)
              .text(s.heading, colCX, yC, { width: colCW, lineBreak: false, ellipsis: true });
            yC += FS_AI_HEADING * 1.3 + 3;
          }
          if (s.body) {
            const isIntro = s.isIntro;
            doc.font(isIntro ? "zh-bold" : "zh").fontSize(bodyFs).fillColor(isIntro ? GOLD : TEXT_DARK);
            const remainH = colCBottom - yC;
            doc.text(s.body, colCX, yC, {
              width: colCW,
              lineGap: LINE_GAP,
              height: remainH,
              ellipsis: true,
            });
            const used = doc.heightOfString(s.body, { width: colCW, lineGap: LINE_GAP });
            yC += Math.min(used, remainH) + (isIntro ? 8 : 6);
          }
        }
      }

      // Switch back to first page for footer (in case overflow created new pages)
      doc.switchToPage(0);
      doc.font("zh").fontSize(FS_FOOTER).fillColor(TEXT_MUTED)
        .text(`格局17 · CONFIDENTIAL  ·  ID: ${student.id}  ·  ${today}`,
          0, PAGE_H - 12, { width: PAGE_W, align: "center", lineBreak: false });

      // Remove any extra pages — enforce single-page output
      const range = doc.bufferedPageRange();
      if (range.count > 1) {
        // PDFKit doesn't support deleting pages directly; we set count via internal _pageBuffer
        // Workaround: build into a new doc OR truncate buffer
        // Simplest: write end-of-document early via removing extra pages reference
        // Use private API since no public deletion exists
        const pdfDoc = doc as PDFKit.PDFDocument & { _pageBuffer?: PDFKit.PDFPage[]; _pageBufferStart?: number };
        if (pdfDoc._pageBuffer) {
          pdfDoc._pageBuffer.splice(1);
        }
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
