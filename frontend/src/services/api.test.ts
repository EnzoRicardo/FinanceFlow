import { describe, expect, it } from "vitest";
import { api } from "./api";

describe("api", () => {
  it("uses the backend base URL", () => {
    expect(api.defaults.baseURL).toBe("http://127.0.0.1:8000");
  });
});
