import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// 網站設定（含登入密碼）
export const siteSettings = mysqlTable("site_settings", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 64 }).notNull().unique(),
  value: text("value"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SiteSetting = typeof siteSettings.$inferSelect;

// 學員資料表
export const students = mysqlTable("students", {
  id: int("id").autoincrement().primaryKey(),
  // 基本資料
  nickname: varchar("nickname", { length: 100 }),
  fullNameChinese: varchar("fullNameChinese", { length: 100 }),
  gender: varchar("gender", { length: 10 }),
  photoUrl: text("photoUrl"),
  birthday: varchar("birthday", { length: 50 }),
  igFb: varchar("igFb", { length: 200 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 50 }),
  // 喜好
  favoriteSongs: text("favoriteSongs"),
  // 生意資訊
  businessModel: text("businessModel"),
  partnersEmployees: varchar("partnersEmployees", { length: 100 }),
  companyInfo: text("companyInfo"),
  // 目標與瓶頸
  nextGoal: text("nextGoal"),
  businessBottleneck: text("businessBottleneck"),
  wantToImprove: text("wantToImprove"),
  // 財政
  mainIncome: text("mainIncome"),
  mainExpense: text("mainExpense"),
  financialSatisfaction: varchar("financialSatisfaction", { length: 200 }),
  financialControl: varchar("financialControl", { length: 50 }),
  incomeLevel: varchar("incomeLevel", { length: 100 }),
  // 個人背景
  maritalStatus: varchar("maritalStatus", { length: 50 }),
  familyMembers: text("familyMembers"),
  mostImportantPerson: text("mostImportantPerson"),
  // 課程相關
  whyJoin: text("whyJoin"),
  courseExpectation: text("courseExpectation"),
  wantToTakeAway: text("wantToTakeAway"),
  otherCourses: text("otherCourses"),
  interestedWorkshops: text("interestedWorkshops"),
  attendanceConfirmed: text("attendanceConfirmed"),
  // 系統欄位
  // 軟刪除時間；非空代表此學員不在一般名冊及搜尋結果顯示，但所有資料仍保留。
  deletedAt: timestamp("deletedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Student = typeof students.$inferSelect;
export type InsertStudent = typeof students.$inferInsert;

// 自定義欄目定義
export const customFields = mysqlTable("custom_fields", {
  id: int("id").autoincrement().primaryKey(),
  fieldKey: varchar("fieldKey", { length: 100 }).notNull().unique(),
  label: varchar("label", { length: 200 }).notNull(),
  fieldType: mysqlEnum("fieldType", ["text", "textarea", "number", "date", "select"]).default("text").notNull(),
  options: text("options"), // JSON array for select type
  groupName: varchar("groupName", { length: 100 }).default("其他"), // 所屬分類
  sortOrder: int("sortOrder").default(0),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CustomField = typeof customFields.$inferSelect;
export type InsertCustomField = typeof customFields.$inferInsert;

// 自定義欄目值
export const studentCustomValues = mysqlTable("student_custom_values", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(),
  fieldId: int("fieldId").notNull(),
  value: text("value"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StudentCustomValue = typeof studentCustomValues.$inferSelect;

// 教練備註
export const coachNotes = mysqlTable("coach_notes", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(),
  content: text("content").notNull(),
  sessionLabel: varchar("sessionLabel", { length: 100 }), // 例如：第一堂、第二堂
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CoachNote = typeof coachNotes.$inferSelect;
export type InsertCoachNote = typeof coachNotes.$inferInsert;

// 修改記錄 Log
export const editLogs = mysqlTable("edit_logs", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(),
  fieldName: varchar("fieldName", { length: 200 }).notNull(), // 欄位名稱（中文顯示名）
  fieldKey: varchar("fieldKey", { length: 100 }).notNull(),   // 欄位 key
  oldValue: text("oldValue"),
  newValue: text("newValue"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EditLog = typeof editLogs.$inferSelect;
export type InsertEditLog = typeof editLogs.$inferInsert;

// 學員圖集
export const studentGallery = mysqlTable("student_gallery", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(),
  imageUrl: text("imageUrl").notNull(),
  imageKey: varchar("imageKey", { length: 500 }).notNull(), // S3 key
  caption: varchar("caption", { length: 300 }), // 圖片說明
  sortOrder: int("sortOrder").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type StudentGalleryItem = typeof studentGallery.$inferSelect;
export type InsertStudentGalleryItem = typeof studentGallery.$inferInsert;
// 學員分享
export const studentShares = mysqlTable("student_shares", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(),
  content: text("content").notNull(),
  sessionLabel: varchar("sessionLabel", { length: 100 }), // 例如：第一堂、第二堂
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type StudentShare = typeof studentShares.$inferSelect;
export type InsertStudentShare = typeof studentShares.$inferInsert;

// AI 分析摘要
export const aiSummaries = mysqlTable("ai_summaries", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull().unique(),
  summary: text("summary").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type AiSummary = typeof aiSummaries.$inferSelect;
export type InsertAiSummary = typeof aiSummaries.$inferInsert;
