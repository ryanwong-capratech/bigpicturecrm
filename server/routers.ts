import { z } from "zod";
import { parse as parseCookieHeader } from "cookie";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import {
  getSiteSetting, setSiteSetting,
  getStudents, getStudentById, createStudent, updateStudent, deleteStudent, restoreStudent,
  getCustomFields, createCustomField, updateCustomField, deleteCustomField,
  getStudentCustomValues, upsertStudentCustomValue,
  getCoachNotes, createCoachNote, updateCoachNote, deleteCoachNote,
  getStudentShares, createStudentShare, updateStudentShare, deleteStudentShare,
  createEditLog, getEditLogs,
  getStudentGallery, addGalleryImage, updateGalleryCaption, deleteGalleryImage,
  getAiSummary, upsertAiSummary,
} from "./db";

// 欄位中文名稱對照表
const FIELD_LABELS: Record<string, string> = {
  nickname: "暱稱",
  fullNameChinese: "中文全名",
  gender: "性別",
  photoUrl: "照片",
  birthday: "生日",
  igFb: "IG / FB",
  email: "電郵",
  phone: "電話",
  favoriteSongs: "喜歡的歌和歌手",
  businessModel: "生意模式",
  partnersEmployees: "拍檔及員工數",
  companyInfo: "公司名稱及網址",
  nextGoal: "下一個目標/遠景",
  businessBottleneck: "生意瓶頸",
  wantToImprove: "想提升的方面",
  mainIncome: "主要收入來源",
  mainExpense: "最大開支",
  financialSatisfaction: "財政滿意度",
  financialControl: "財政掌握度",
  incomeLevel: "收入水平",
  maritalStatus: "婚姻/感情狀態",
  familyMembers: "主要家庭成員",
  mostImportantPerson: "最重要的人",
  whyJoin: "來上格局的原因",
  courseExpectation: "課程期望",
  wantToTakeAway: "希望帶走什麼",
  otherCourses: "其他課程經歷",
  interestedWorkshops: "感興趣的工作坊",
  attendanceConfirmed: "出席安排確認",
};
import { storagePut } from "./storage";
import { invokeLLM } from "./_core/llm";
import { TRPCError } from "@trpc/server";

// Simple session check via cookie (site password)
const PORTAL_SESSION_COOKIE = "portal_session";

function isPortalAuthenticated(req: any): boolean {
  // Check x-portal-token header (localStorage-based auth)
  const headerToken = req.headers?.["x-portal-token"];
  if (headerToken === "authenticated") return true;
  // Fallback: check cookie
  const cookieHeader = req.headers?.cookie || "";
  const cookies = parseCookieHeader(cookieHeader);
  return cookies[PORTAL_SESSION_COOKIE] === "authenticated";
}

// Middleware for portal auth
const portalProcedure = publicProcedure.use(async ({ ctx, next }) => {
  if (!isPortalAuthenticated(ctx.req)) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "請先登入" });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ===== Portal Auth (simple password) =====
  portal: router({
    login: publicProcedure
      .input(z.object({ password: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const storedPassword = await getSiteSetting("site_password");
        if (!storedPassword || input.password !== storedPassword) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "密碼錯誤" });
        }
        // Set session cookie
        ctx.res.cookie(PORTAL_SESSION_COOKIE, "authenticated", {
          httpOnly: true,
          secure: ctx.req.protocol === "https",
          sameSite: "none",
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
          path: "/",
        });
        return { success: true };
      }),

    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie(PORTAL_SESSION_COOKIE, {
        httpOnly: true,
        secure: ctx.req.protocol === "https",
        sameSite: "none",
        path: "/",
      });
      return { success: true };
    }),

    check: publicProcedure.query(({ ctx }) => {
      return { authenticated: isPortalAuthenticated(ctx.req) };
    }),

    updatePassword: portalProcedure
      .input(z.object({ newPassword: z.string().min(4) }))
      .mutation(async ({ input }) => {
        await setSiteSetting("site_password", input.newPassword);
        return { success: true };
      }),
  }),

  // ===== Students =====
  students: router({
    list: portalProcedure
      .input(z.object({ search: z.string().optional() }).optional())
      .query(async ({ input }) => {
        return getStudents(input?.search);
      }),

    get: portalProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const student = await getStudentById(input.id);
        if (!student) throw new TRPCError({ code: "NOT_FOUND" });
        return student;
      }),

    create: portalProcedure
      .input(z.object({
        nickname: z.string().optional(),
        fullNameChinese: z.string().optional(),
        gender: z.string().optional(),
        photoUrl: z.string().optional(),
        birthday: z.string().optional(),
        igFb: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
        favoriteSongs: z.string().optional(),
        businessModel: z.string().optional(),
        partnersEmployees: z.string().optional(),
        companyInfo: z.string().optional(),
        nextGoal: z.string().optional(),
        businessBottleneck: z.string().optional(),
        wantToImprove: z.string().optional(),
        mainIncome: z.string().optional(),
        mainExpense: z.string().optional(),
        financialSatisfaction: z.string().optional(),
        financialControl: z.string().optional(),
        incomeLevel: z.string().optional(),
        maritalStatus: z.string().optional(),
        familyMembers: z.string().optional(),
        mostImportantPerson: z.string().optional(),
        whyJoin: z.string().optional(),
        courseExpectation: z.string().optional(),
        wantToTakeAway: z.string().optional(),
        otherCourses: z.string().optional(),
        interestedWorkshops: z.string().optional(),
        attendanceConfirmed: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await createStudent(input);
        return { success: true };
      }),

    update: portalProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          nickname: z.string().optional(),
          fullNameChinese: z.string().optional(),
          gender: z.string().optional(),
          photoUrl: z.string().optional(),
          birthday: z.string().optional(),
          igFb: z.string().optional(),
          email: z.string().optional(),
          phone: z.string().optional(),
          favoriteSongs: z.string().optional(),
          businessModel: z.string().optional(),
          partnersEmployees: z.string().optional(),
          companyInfo: z.string().optional(),
          nextGoal: z.string().optional(),
          businessBottleneck: z.string().optional(),
          wantToImprove: z.string().optional(),
          mainIncome: z.string().optional(),
          mainExpense: z.string().optional(),
          financialSatisfaction: z.string().optional(),
          financialControl: z.string().optional(),
          incomeLevel: z.string().optional(),
          maritalStatus: z.string().optional(),
          familyMembers: z.string().optional(),
          mostImportantPerson: z.string().optional(),
          whyJoin: z.string().optional(),
          courseExpectation: z.string().optional(),
          wantToTakeAway: z.string().optional(),
          otherCourses: z.string().optional(),
          interestedWorkshops: z.string().optional(),
          attendanceConfirmed: z.string().optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        // Fetch current values to compare
        const current = await getStudentById(input.id);
        if (current) {
          for (const [key, newVal] of Object.entries(input.data)) {
            const oldVal = (current as any)[key];
            const oldStr = oldVal == null ? "" : String(oldVal);
            const newStr = newVal == null ? "" : String(newVal);
            if (oldStr !== newStr) {
              await createEditLog({
                studentId: input.id,
                fieldKey: key,
                fieldName: FIELD_LABELS[key] ?? key,
                oldValue: oldStr || null,
                newValue: newStr || null,
              });
            }
          }
        }
        await updateStudent(input.id, input.data);
        return { success: true };
      }),

    delete: portalProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteStudent(input.id);
        return { success: true, message: "學員已移至封存，資料仍保留於系統內" };
      }),

    restore: portalProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await restoreStudent(input.id);
        return { success: true };
      }),

    uploadPhoto: portalProcedure
      .input(z.object({
        studentId: z.number(),
        fileName: z.string(),
        fileBase64: z.string(),
        mimeType: z.string(),
      }))
      .mutation(async ({ input }) => {
        const buffer = Buffer.from(input.fileBase64, "base64");
        const key = `student-photos/${input.studentId}-${Date.now()}-${input.fileName}`;
        const { url } = await storagePut(key, buffer, input.mimeType);
        await updateStudent(input.studentId, { photoUrl: url });
        return { url };
      }),
  }),

  // ===== Custom Fields =====
  customFields: router({
    list: portalProcedure.query(async () => {
      return getCustomFields();
    }),

    create: portalProcedure
      .input(z.object({
        label: z.string().min(1),
        fieldType: z.enum(["text", "textarea", "number", "date", "select"]).default("text"),
        options: z.string().optional(), // JSON string for select options
        groupName: z.string().optional().default("其他"),
        sortOrder: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const fieldKey = `custom_${Date.now()}`;
        await createCustomField({ ...input, fieldKey });
        return { success: true };
      }),

    update: portalProcedure
      .input(z.object({
        id: z.number(),
        label: z.string().optional(),
        fieldType: z.enum(["text", "textarea", "number", "date", "select"]).optional(),
        options: z.string().optional(),
        groupName: z.string().optional(),
        sortOrder: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateCustomField(id, data);
        return { success: true };
      }),

    delete: portalProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteCustomField(input.id);
        return { success: true };
      }),
  }),

  // ===== Bulk Import =====
  bulkImport: router({
    // Import a single field value for all students from CSV data
    // rows: array of { nickname or fullNameChinese, value }
    importField: portalProcedure
      .input(z.object({
        fieldKey: z.string(), // standard field key (e.g. "phone") or custom field key
        rows: z.array(z.object({
          identifier: z.string(), // nickname or fullNameChinese to match
          value: z.string(),
        })),
      }))
      .mutation(async ({ input }) => {
        const students = await getStudents("");
        const results = { updated: 0, notFound: 0, skipped: 0 };
        for (const row of input.rows) {
          const match = students.find(
            s => s.nickname === row.identifier || s.fullNameChinese === row.identifier
          );
          if (!match) { results.notFound++; continue; }
          if (input.fieldKey.startsWith("custom_")) {
            // custom field
            const fields = await getCustomFields();
            const field = fields.find(f => f.fieldKey === input.fieldKey);
            if (!field) { results.skipped++; continue; }
            await upsertStudentCustomValue(match.id, field.id, row.value);
          } else {
            // standard field
            await updateStudent(match.id, { [input.fieldKey]: row.value });
          }
          results.updated++;
        }
        return results;
      }),
  }),

  // ===== Student Custom Values =====
  customValues: router({
    getForStudent: portalProcedure
      .input(z.object({ studentId: z.number() }))
      .query(async ({ input }) => {
        return getStudentCustomValues(input.studentId);
      }),

    upsert: portalProcedure
      .input(z.object({
        studentId: z.number(),
        fieldId: z.number(),
        value: z.string(),
      }))
      .mutation(async ({ input }) => {
        await upsertStudentCustomValue(input.studentId, input.fieldId, input.value);
        return { success: true };
      }),
  }),

  // ===== Edit Logs =====
  editLogs: router({
    list: portalProcedure
      .input(z.object({ studentId: z.number() }))
      .query(async ({ input }) => {
        return getEditLogs(input.studentId);
      }),
  }),

  // ===== Student Gallery =====
  gallery: router({
    list: portalProcedure
      .input(z.object({ studentId: z.number() }))
      .query(async ({ input }) => {
        return getStudentGallery(input.studentId);
      }),

    upload: portalProcedure
      .input(z.object({
        studentId: z.number(),
        fileName: z.string(),
        fileBase64: z.string(),
        mimeType: z.string(),
        caption: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const buffer = Buffer.from(input.fileBase64, "base64");
        // Sanitize filename: keep only ASCII alphanumeric, dots, hyphens
        const ext = input.fileName.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "") || "jpg";
        const safeKey = `student-gallery/${input.studentId}-${Date.now()}.${ext}`;
        const { key: actualKey, url } = await storagePut(safeKey, buffer, input.mimeType);
        await addGalleryImage({
          studentId: input.studentId,
          imageUrl: url,
          imageKey: actualKey,
          caption: input.caption ?? null,
        });
        return { url };
      }),

    updateCaption: portalProcedure
      .input(z.object({ id: z.number(), caption: z.string() }))
      .mutation(async ({ input }) => {
        await updateGalleryCaption(input.id, input.caption);
        return { success: true };
      }),

    delete: portalProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteGalleryImage(input.id);
        return { success: true };
      }),
  }),

  // ===== CSV Export / Import =====
  csv: router({
    // Export all students with custom fields as CSV string
    export: portalProcedure.query(async () => {
      const allStudents = await getStudents("");
      const fields = await getCustomFields();

      // Build header row
      const standardHeaders = [
        "id", "暱稱", "中文全名", "性別", "生日", "IG/FB", "電郵", "電話",
        "喜歡的歌和歌手", "生意模式", "拍檔及員工數", "公司名稱及網址",
        "下一個目標/遠景", "生意瓶頸", "想提升的方面",
        "主要收入來源", "最大開支", "財政滿意度", "財政掌握度", "收入水平",
        "婚姻/感情狀態", "主要家庭成員", "最重要的人",
        "來上格局的原因", "課程期望", "希望帶走什麼", "其他課程經歷",
        "感興趣的工作坊", "出席安排確認", "照片URL",
      ];
      const customHeaders = fields.map((f: any) => `[自定義]${f.label}`);
      const allHeaders = [...standardHeaders, ...customHeaders];

      // Build rows
      const rows = await Promise.all(allStudents.map(async (s: any) => {
        const customValues = await getStudentCustomValues(s.id);
        const customMap: Record<number, string> = {};
        customValues.forEach((v: any) => { customMap[v.fieldId] = v.value ?? ""; });

        const standardValues = [
          s.id, s.nickname ?? "", s.fullNameChinese ?? "", s.gender ?? "",
          s.birthday ?? "", s.igFb ?? "", s.email ?? "", s.phone ?? "",
          s.favoriteSongs ?? "", s.businessModel ?? "", s.partnersEmployees ?? "",
          s.companyInfo ?? "", s.nextGoal ?? "", s.businessBottleneck ?? "",
          s.wantToImprove ?? "", s.mainIncome ?? "", s.mainExpense ?? "",
          s.financialSatisfaction ?? "", s.financialControl ?? "", s.incomeLevel ?? "",
          s.maritalStatus ?? "", s.familyMembers ?? "", s.mostImportantPerson ?? "",
          s.whyJoin ?? "", s.courseExpectation ?? "", s.wantToTakeAway ?? "",
          s.otherCourses ?? "", s.interestedWorkshops ?? "", s.attendanceConfirmed ?? "",
          s.photoUrl ?? "",
        ];
        const customValues2 = fields.map((f: any) => customMap[f.id] ?? "");
        return [...standardValues, ...customValues2];
      }));

      // Escape CSV cell
      const escapeCell = (val: any) => {
        const str = String(val ?? "");
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      const csvLines = [
        allHeaders.map(escapeCell).join(","),
        ...rows.map(row => row.map(escapeCell).join(",")),
      ];
      return { csv: csvLines.join("\n"), filename: `格局17學員資料_${new Date().toISOString().slice(0, 10)}.csv` };
    }),

    // Import students from CSV string
    import: portalProcedure
      .input(z.object({ csv: z.string() }))
      .mutation(async ({ input }) => {
        const lines = input.csv.split(/\r?\n/).filter(l => l.trim());
        if (lines.length < 2) throw new TRPCError({ code: "BAD_REQUEST", message: "CSV 格式錯誤或無資料" });

        // Parse CSV respecting quoted fields
        const parseCsvLine = (line: string): string[] => {
          const result: string[] = [];
          let cur = "", inQuote = false;
          for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (ch === '"') {
              if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
              else inQuote = !inQuote;
            } else if (ch === "," && !inQuote) {
              result.push(cur); cur = "";
            } else cur += ch;
          }
          result.push(cur);
          return result;
        };

        const headers = parseCsvLine(lines[0]);
        const existingStudents = await getStudents("");
        const existingFields = await getCustomFields();

        // Standard field mapping (Chinese header → DB field)
        const HEADER_TO_FIELD: Record<string, string> = {
          "暱稱": "nickname", "中文全名": "fullNameChinese", "性別": "gender",
          "生日": "birthday", "IG/FB": "igFb", "電郵": "email", "電話": "phone",
          "喜歡的歌和歌手": "favoriteSongs", "生意模式": "businessModel",
          "拍檔及員工數": "partnersEmployees", "公司名稱及網址": "companyInfo",
          "下一個目標/遠景": "nextGoal", "生意瓶頸": "businessBottleneck",
          "想提升的方面": "wantToImprove", "主要收入來源": "mainIncome",
          "最大開支": "mainExpense", "財政滿意度": "financialSatisfaction",
          "財政掌握度": "financialControl", "收入水平": "incomeLevel",
          "婚姻/感情狀態": "maritalStatus", "主要家庭成員": "familyMembers",
          "最重要的人": "mostImportantPerson", "來上格局的原因": "whyJoin",
          "課程期望": "courseExpectation", "希望帶走什麼": "wantToTakeAway",
          "其他課程經歷": "otherCourses", "感興趣的工作坊": "interestedWorkshops",
          "出席安排確認": "attendanceConfirmed", "照片URL": "photoUrl",
        };

        let created = 0, updated = 0, skipped = 0;
        const errors: string[] = [];

        for (let i = 1; i < lines.length; i++) {
          const values = parseCsvLine(lines[i]);
          if (values.length < 2) continue;

          const rowData: Record<string, string> = {};
          headers.forEach((h, idx) => { rowData[h.trim()] = values[idx]?.trim() ?? ""; });

          // Find existing student by id (if present), then nickname, then fullNameChinese
          const rowId = rowData["id"] ? parseInt(rowData["id"]) : null;
          let existing = rowId ? existingStudents.find((s: any) => s.id === rowId) : null;
          if (!existing && rowData["暱稱"]) {
            existing = existingStudents.find((s: any) => s.nickname === rowData["暱稱"]);
          }
          if (!existing && rowData["中文全名"]) {
            existing = existingStudents.find((s: any) => s.fullNameChinese === rowData["中文全名"]);
          }

          // Build student update object
          const studentData: Record<string, string> = {};
          headers.forEach(h => {
            const trimH = h.trim();
            if (HEADER_TO_FIELD[trimH] && rowData[trimH] !== undefined) {
              studentData[HEADER_TO_FIELD[trimH]] = rowData[trimH];
            }
          });

          try {
            let studentId: number;
            if (existing) {
              await updateStudent(existing.id, studentData);
              studentId = existing.id;
              updated++;
            } else {
              if (!rowData["暱稱"] && !rowData["中文全名"]) { skipped++; continue; }
              const newStudentResult = await createStudent(studentData as any);
              studentId = (newStudentResult as any)[0]?.insertId ?? (newStudentResult as any).insertId;
              created++;
            }

            // Handle custom field columns
            for (const h of headers) {
              const trimH = h.trim();
              if (trimH.startsWith("[自定義]")) {
                const fieldName = trimH.replace("[自定義]", "");
                const field = existingFields.find((f: any) => f.label === fieldName);
                if (field && rowData[trimH] !== undefined) {
                  await upsertStudentCustomValue(studentId, field.id, rowData[trimH]);
                }
              }
            }
          } catch (err: any) {
            errors.push(`第 ${i + 1} 行錯誤: ${err.message}`);
          }
        }

        return { created, updated, skipped, errors };
      }),

    // Preview import: return what would be created/updated without saving
    preview: portalProcedure
      .input(z.object({ csv: z.string() }))
      .mutation(async ({ input }) => {
        const lines = input.csv.split(/\r?\n/).filter(l => l.trim());
        if (lines.length < 2) throw new TRPCError({ code: "BAD_REQUEST", message: "CSV 格式錯誤或無資料" });

        const parseCsvLine = (line: string): string[] => {
          const result: string[] = [];
          let cur = "", inQuote = false;
          for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (ch === '"') {
              if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
              else inQuote = !inQuote;
            } else if (ch === "," && !inQuote) {
              result.push(cur); cur = "";
            } else cur += ch;
          }
          result.push(cur);
          return result;
        };

        const headers = parseCsvLine(lines[0]);
        const existingStudents = await getStudents("");
        const preview: Array<{ row: number; action: "create" | "update" | "skip"; identifier: string }> = [];

        for (let i = 1; i < lines.length; i++) {
          const values = parseCsvLine(lines[i]);
          if (values.length < 2) continue;
          const rowData: Record<string, string> = {};
          headers.forEach((h, idx) => { rowData[h.trim()] = values[idx]?.trim() ?? ""; });

          const rowId = rowData["id"] ? parseInt(rowData["id"]) : null;
          let existing = rowId ? existingStudents.find((s: any) => s.id === rowId) : null;
          if (!existing && rowData["暱稱"]) existing = existingStudents.find((s: any) => s.nickname === rowData["暱稱"]);
          if (!existing && rowData["中文全名"]) existing = existingStudents.find((s: any) => s.fullNameChinese === rowData["中文全名"]);

          const identifier = rowData["暱稱"] || rowData["中文全名"] || `第 ${i + 1} 行`;
          if (!rowData["暱稱"] && !rowData["中文全名"]) {
            preview.push({ row: i + 1, action: "skip", identifier });
          } else if (existing) {
            preview.push({ row: i + 1, action: "update", identifier });
          } else {
            preview.push({ row: i + 1, action: "create", identifier });
          }
        }
        return { preview, totalRows: lines.length - 1 };
      }),
  }),

  // ===== Coach Notes =====
  notes: router({
    list: portalProcedure
      .input(z.object({ studentId: z.number() }))
      .query(async ({ input }) => {
        return getCoachNotes(input.studentId);
      }),

    create: portalProcedure
      .input(z.object({
        studentId: z.number(),
        content: z.string().min(1),
        sessionLabel: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await createCoachNote(input);
        return { success: true };
      }),

    update: portalProcedure
      .input(z.object({
        id: z.number(),
        content: z.string().min(1),
        sessionLabel: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await updateCoachNote(input.id, input.content, input.sessionLabel);
        return { success: true };
      }),

     delete: portalProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteCoachNote(input.id);
        return { success: true };
      }),
  }),
  // ===== AI Summarize =====
  ai: router({
    summarize: portalProcedure
      .input(z.object({ studentId: z.number() }))
      .mutation(async ({ input }) => {
        const student = await getStudentById(input.studentId);
        if (!student) throw new TRPCError({ code: "NOT_FOUND" });

        const customFields = await getCustomFields();
        const customValues = await getStudentCustomValues(input.studentId);
        const coachNotes = await getCoachNotes(input.studentId);
        const studentShares = await getStudentShares(input.studentId);

        // Build structured data string
        const fieldLines: string[] = [];
        const addField = (label: string, val: string | null | undefined) => {
          if (val && val.trim()) fieldLines.push(`${label}: ${val.trim()}`);
        };

        addField("暱稱", student.nickname);
        addField("中文全名", student.fullNameChinese);
        addField("性別", student.gender);
        addField("生日", student.birthday);
        addField("IG/FB", student.igFb);
        addField("電郵", student.email);
        addField("電話", student.phone);
        addField("喜歡的歌和歌手", student.favoriteSongs);
        addField("婚姻/感情狀態", student.maritalStatus);
        addField("主要家庭成員", student.familyMembers);
        addField("最重要的人", student.mostImportantPerson);
        addField("行業/生意模式", student.businessModel);
        addField("拍檔及員工數", student.partnersEmployees);
        addField("公司名稱及網址", student.companyInfo);
        addField("下一個目標/遠景", student.nextGoal);
        addField("生意瓶頸", student.businessBottleneck);
        addField("想提升的方面", student.wantToImprove);
        addField("主要收入來源", student.mainIncome);
        addField("最大開支", student.mainExpense);
        addField("收入水平", student.incomeLevel);
        addField("財政滿意度", student.financialSatisfaction);
        addField("財政掌握度", student.financialControl);
        addField("來上格局的原因", student.whyJoin);
        addField("課程期望", student.courseExpectation);
        addField("希望帶走什麼", student.wantToTakeAway);
        addField("其他課程經歷", student.otherCourses);
        addField("感興趣的工作坊", student.interestedWorkshops);
        addField("出席安排確認", student.attendanceConfirmed);

        // Custom fields
        for (const cf of customFields) {
          const cv = customValues.find((v) => v.fieldId === cf.id);
          if (cv?.value?.trim()) {
            fieldLines.push(`${cf.label}: ${cv.value.trim()}`);
          }
        }

        const basicInfo = fieldLines.join("\n");

        const notesText = coachNotes.length > 0
          ? coachNotes.map((n, i) => `[備註${i + 1}${n.sessionLabel ? ` (${n.sessionLabel})` : ""}]\n${n.content}`).join("\n\n")
          : "（無）";

        const sharesText = studentShares.length > 0
          ? studentShares.map((s, i) => `[分享${i + 1}${s.sessionLabel ? ` (${s.sessionLabel})` : ""}]\n${s.content}`).join("\n\n")
          : "（無）";

        const displayName = student.nickname || student.fullNameChinese || `學員 ${student.id}`;

                const prompt = `你是一個對人極度好奇的偵探型教練助理，專門為格局17的教練做課前人物分析。你的任務不是重複資料，而是從資料中發現別人看不到的東西。

分析原則：
- 把不同部份的資料交叉比對，找出隱藏的矛盾、有趣的規律或出人意料的關聯
- 對每個細節問「為什麼」，推測背後的動機和心理
- 用教練之間私下討論的語氣，直接、坦白、有個人觀點
- 重點部份要大膽分析，次要部份可以簡短，不需要每個 Section 都寫相同字數
- 如果某個 Section 的資料很豐富或很有看頭，就大膽寫；如果資料少或不重要，一句帶過就行

格式要求：
- 禁止列點（*、-、•）、粗體（**）、分隔線（---）
- 只用 ## 作為標題
- 語氣要像在跟教練說「你知道嗎，這個人其實...」

學員姓名：${displayName}
【基本資料及自定義欄位】
${basicInfo}
【教練備註】
${notesText}
【學員分享】
${sharesText}

以下是分析的方向 Guideline，不是硬性模板。你要自己判斷哪個部份最値得深挺，哪個部份可以簡短帶過。如果某個方向有很多「花生」或對教練很有用的資訊，就展開寫，不要自我限制。如果某個方向資料少或不重要，可以不出現或只寫一句。請務必先寫「## 學員心理狀態」這一段作為開場，再寫其餘段落。

## 學員心理狀態
根據你提供的資料，學員現在的心理狀態可以歸納為以下幾點。重要規則：絕對不要引用原文、不要複述資料內容、也不要解釋你為什麼有這個判斷（不要寫「因為他提到...」、「從資料可見...」之類）。直接、簡潔地講出結論：他現在的情緒、壓力、動機與心態是什麼。用幾個精簡的自然段落表達（不要列點符號），讓教練一眼掌握這個人現在的內心狀態。

## 1. 學員與其他人的課前關係
（他認識誰？介紹人背後有什麼故事？這個關係對他來格局的動機有什麼影響？）

## 2. 生意
（他的生意表面是什麼，但真正的瓶頸或機會是什麼？有什麼他自己可能沒意識到的問題？）

## 3. 場外資訊
（他的生活狀態透露了什麼？最近有什麼變化或壓力？這些對他上課的狀態有什麼影響？）

## 4. 興趣
（他的興趣和他的事業或性格有什麼有趣的關聯？這些興趣可以怎樣用來跟他建立連結？）

## 5. 八卦野
（這是最重要的部份之一。有什麼「花生」細節？哪些資料放在一起看會特別有意思？有什麼矛盾或出人意料的細節？如果有就展開寫，不要收手。）

## 6. 課程經驗
（他來格局的真正原因是什麼？表面說的和實際行為有沒有落差？他對課程有什麼隱藏期望？）

## 7. 商會網絡
(他的人脈結構是什麼？有什麼潛在的連結機會？他在群體中可能扮演什麼角色？)
## 教練建議
(基於以上分析，教練應該用什麼切入點接觸他？有什麼話題或方式特別有效？)`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: "你是格局17的專業教練助理，擅長分析學員資料並提供深入洞察。請用繁體中文回覆。" },
            { role: "user", content: prompt },
          ],
        });

        const content = typeof (response?.choices?.[0]?.message?.content) === "string"
          ? response.choices[0].message.content
          : "分析失敗，請重試。";
        // Auto-save to database
        await upsertAiSummary(input.studentId, content);
        return { summary: content, studentName: displayName, savedAt: new Date() };
      }),
    getSummary: portalProcedure
      .input(z.object({ studentId: z.number() }))
      .query(async ({ input }) => {
        const row = await getAiSummary(input.studentId);
        if (!row) return null;
        const student = await getStudentById(input.studentId);
        const displayName = student?.nickname || student?.fullNameChinese || `學員 ${input.studentId}`;
        return { summary: row.summary, studentName: displayName, savedAt: row.updatedAt };
      }),
  }),

  // ===== Student Shares =====
  shares: router({
    list: portalProcedure
      .input(z.object({ studentId: z.number() }))
      .query(async ({ input }) => {
        return getStudentShares(input.studentId);
      }),
    create: portalProcedure
      .input(z.object({
        studentId: z.number(),
        content: z.string().min(1),
        sessionLabel: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await createStudentShare(input);
        return { success: true };
      }),
    update: portalProcedure
      .input(z.object({
        id: z.number(),
        content: z.string().min(1),
        sessionLabel: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await updateStudentShare(input.id, input.content, input.sessionLabel);
        return { success: true };
      }),
    delete: portalProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteStudentShare(input.id);
        return { success: true };
      }),
  }),
});
export type AppRouter = typeof appRouter;
