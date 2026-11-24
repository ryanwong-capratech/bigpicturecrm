import { eq, like, or, and, desc, asc, isNull, isNotNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, students, siteSettings, customFields, studentCustomValues, coachNotes, editLogs, studentGallery, studentShares, aiSummaries, InsertStudent, InsertCoachNote, InsertCustomField, InsertEditLog, InsertStudentGalleryItem, InsertStudentShare } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ===== Site Settings =====
export async function getSiteSetting(key: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(siteSettings).where(eq(siteSettings.key, key)).limit(1);
  return result[0]?.value ?? null;
}

export async function setSiteSetting(key: string, value: string) {
  const db = await getDb();
  if (!db) return;
  await db.insert(siteSettings).values({ key, value }).onDuplicateKeyUpdate({ set: { value } });
}

// ===== Students =====
export async function getStudents(search?: string) {
  const db = await getDb();
  if (!db) return [];
  if (search && search.trim()) {
    const q = `%${search.trim()}%`;
    return db.select().from(students).where(
      and(
        isNull(students.deletedAt),
        or(
          like(students.nickname, q),
          like(students.fullNameChinese, q),
          like(students.igFb, q),
          like(students.businessModel, q),
        )
      )
    ).orderBy(asc(students.id));
  }
  return db.select().from(students).where(isNull(students.deletedAt)).orderBy(asc(students.id));
}

export async function getStudentById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(students).where(
    and(eq(students.id, id), isNull(students.deletedAt))
  ).limit(1);
  return result[0] ?? null;
}

export async function createStudent(data: InsertStudent) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(students).values(data);
  return result;
}

export async function updateStudent(id: number, data: Partial<InsertStudent>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(students).set(data).where(
    and(eq(students.id, id), isNull(students.deletedAt))
  );
}

export async function deleteStudent(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(students).set({ deletedAt: new Date() }).where(
    and(eq(students.id, id), isNull(students.deletedAt))
  );
}

/** 還原先前軟刪除的學員，連同其關聯資料一併恢復可見。 */
export async function restoreStudent(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(students).set({ deletedAt: null }).where(
    and(eq(students.id, id), isNotNull(students.deletedAt))
  );
}

// ===== Custom Fields =====
export async function getCustomFields() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(customFields).where(eq(customFields.isActive, true)).orderBy(asc(customFields.sortOrder));
}

export async function createCustomField(data: InsertCustomField) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(customFields).values(data);
}

export async function updateCustomField(id: number, data: Partial<InsertCustomField>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(customFields).set(data).where(eq(customFields.id, id));
}

export async function deleteCustomField(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(customFields).set({ isActive: false }).where(eq(customFields.id, id));
}

// ===== Student Custom Values =====
export async function getStudentCustomValues(studentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(studentCustomValues).where(eq(studentCustomValues.studentId, studentId));
}

export async function upsertStudentCustomValue(studentId: number, fieldId: number, value: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const existing = await db.select().from(studentCustomValues)
    .where(and(eq(studentCustomValues.studentId, studentId), eq(studentCustomValues.fieldId, fieldId)))
    .limit(1);
  if (existing.length > 0) {
    await db.update(studentCustomValues).set({ value }).where(eq(studentCustomValues.id, existing[0].id));
  } else {
    await db.insert(studentCustomValues).values({ studentId, fieldId, value });
  }
}

// ===== Coach Notes =====
export async function getCoachNotes(studentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(coachNotes).where(eq(coachNotes.studentId, studentId)).orderBy(desc(coachNotes.createdAt));
}

export async function createCoachNote(data: InsertCoachNote) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(coachNotes).values(data);
}

export async function updateCoachNote(id: number, content: string, sessionLabel?: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(coachNotes).set({ content, ...(sessionLabel !== undefined ? { sessionLabel } : {}) }).where(eq(coachNotes.id, id));
}

export async function deleteCoachNote(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(coachNotes).where(eq(coachNotes.id, id));
}

// ===== Student Gallery =====
export async function getStudentGallery(studentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(studentGallery).where(eq(studentGallery.studentId, studentId)).orderBy(asc(studentGallery.sortOrder), desc(studentGallery.createdAt));
}

export async function addGalleryImage(data: InsertStudentGalleryItem) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(studentGallery).values(data);
  return result;
}

export async function updateGalleryCaption(id: number, caption: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(studentGallery).set({ caption }).where(eq(studentGallery.id, id));
}

export async function deleteGalleryImage(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  // Return the imageKey so we know what was deleted
  const result = await db.select().from(studentGallery).where(eq(studentGallery.id, id)).limit(1);
  await db.delete(studentGallery).where(eq(studentGallery.id, id));
  return result[0] ?? null;
}

// ===== Edit Logs =====
export async function createEditLog(data: InsertEditLog) {
  const db = await getDb();
  if (!db) return;
  await db.insert(editLogs).values(data);
}

export async function getEditLogs(studentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(editLogs).where(eq(editLogs.studentId, studentId)).orderBy(desc(editLogs.createdAt));
}
// ===== Student Shares =====
export async function getStudentShares(studentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(studentShares).where(eq(studentShares.studentId, studentId)).orderBy(desc(studentShares.createdAt));
}
export async function createStudentShare(data: InsertStudentShare) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(studentShares).values(data);
}
export async function updateStudentShare(id: number, content: string, sessionLabel?: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(studentShares).set({ content, ...(sessionLabel !== undefined ? { sessionLabel } : {}) }).where(eq(studentShares.id, id));
}
export async function deleteStudentShare(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(studentShares).where(eq(studentShares.id, id));
}
// ===== AI Summaries =====
export async function getAiSummary(studentId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(aiSummaries).where(eq(aiSummaries.studentId, studentId)).limit(1);
  return rows[0] ?? null;
}
export async function upsertAiSummary(studentId: number, summary: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const existing = await getAiSummary(studentId);
  if (existing) {
    await db.update(aiSummaries).set({ summary }).where(eq(aiSummaries.studentId, studentId));
  } else {
    await db.insert(aiSummaries).values({ studentId, summary });
  }
}
