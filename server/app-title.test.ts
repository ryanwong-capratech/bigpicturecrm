import { describe, expect, it } from "vitest";

describe("GEJV17 application title configuration", () => {
  it("uses the GEJV17 brand title from the injected environment", () => {
    expect(process.env.VITE_APP_TITLE).toBe("GEJV17 Coach Portal");
  });
});
