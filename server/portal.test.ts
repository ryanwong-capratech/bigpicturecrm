import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock db functions
vi.mock("./db", () => ({
  getSiteSetting: vi.fn().mockResolvedValue("unit-test-password-only"),
  setSiteSetting: vi.fn().mockResolvedValue(undefined),
  getStudents: vi.fn().mockResolvedValue([
    { id: 1, nickname: "TestUser", fullNameChinese: "測試用戶", gender: "男" },
  ]),
  getStudentById: vi.fn().mockResolvedValue({
    id: 1, nickname: "TestUser", fullNameChinese: "測試用戶", gender: "男",
  }),
  createStudent: vi.fn().mockResolvedValue({}),
  updateStudent: vi.fn().mockResolvedValue({}),
  deleteStudent: vi.fn().mockResolvedValue({}),
  restoreStudent: vi.fn().mockResolvedValue({}),
  getCustomFields: vi.fn().mockResolvedValue([]),
  createCustomField: vi.fn().mockResolvedValue({}),
  updateCustomField: vi.fn().mockResolvedValue({}),
  deleteCustomField: vi.fn().mockResolvedValue({}),
  getStudentCustomValues: vi.fn().mockResolvedValue([]),
  upsertStudentCustomValue: vi.fn().mockResolvedValue({}),
  getCoachNotes: vi.fn().mockResolvedValue([]),
  createCoachNote: vi.fn().mockResolvedValue({}),
  updateCoachNote: vi.fn().mockResolvedValue({}),
  deleteCoachNote: vi.fn().mockResolvedValue({}),
  upsertUser: vi.fn().mockResolvedValue(undefined),
  getUserByOpenId: vi.fn().mockResolvedValue(undefined),
}));

function createCtx(authenticated = false): TrpcContext {
  const setCookies: Array<{ name: string; value: string; options: any }> = [];
  const clearedCookies: string[] = [];

  return {
    user: null,
    req: {
      protocol: "https",
      headers: authenticated ? { "x-portal-token": "authenticated" } : {},
    } as any,
    res: {
      cookie: (name: string, value: string, options: any) => {
        setCookies.push({ name, value, options });
      },
      clearCookie: (name: string) => {
        clearedCookies.push(name);
      },
    } as any,
  };
}

describe("portal.login", () => {
  it("succeeds with correct password", async () => {
    const ctx = createCtx(false);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.portal.login({ password: "unit-test-password-only" });
    expect(result.success).toBe(true);
  });

  it("fails with wrong password", async () => {
    const { getSiteSetting } = await import("./db");
    vi.mocked(getSiteSetting).mockResolvedValueOnce("unit-test-password-only");
    const ctx = createCtx(false);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.portal.login({ password: "wrongpassword" })).rejects.toThrow();
  });
});

describe("portal.check", () => {
  it("returns authenticated=false when not logged in", async () => {
    const ctx = createCtx(false);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.portal.check();
    expect(result.authenticated).toBe(false);
  });

  it("returns authenticated=true when logged in", async () => {
    const ctx = createCtx(true);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.portal.check();
    expect(result.authenticated).toBe(true);
  });
});

describe("students.list", () => {
  it("returns students when authenticated", async () => {
    const ctx = createCtx(true);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.students.list({});
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it("throws UNAUTHORIZED when not authenticated", async () => {
    const ctx = createCtx(false);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.students.list({})).rejects.toThrow();
  });
});

describe("students soft delete", () => {
  it("archives a student through the delete procedure without a physical DELETE request", async () => {
    const { deleteStudent } = await import("./db");
    const caller = appRouter.createCaller(createCtx(true));

    const result = await caller.students.delete({ id: 1 });

    expect(deleteStudent).toHaveBeenCalledWith(1);
    expect(result).toEqual({ success: true, message: "學員已移至封存，資料仍保留於系統內" });
  });

  it("provides a restore procedure for a previously archived student", async () => {
    const { restoreStudent } = await import("./db");
    const caller = appRouter.createCaller(createCtx(true));

    const result = await caller.students.restore({ id: 1 });

    expect(restoreStudent).toHaveBeenCalledWith(1);
    expect(result).toEqual({ success: true });
  });
});

describe("notes.create", () => {
  it("creates a note when authenticated", async () => {
    const ctx = createCtx(true);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.notes.create({ studentId: 1, content: "Test note" });
    expect(result.success).toBe(true);
  });
});
