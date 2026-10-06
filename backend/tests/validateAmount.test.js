import { describe, it, expect } from "vitest";
import { validateAmount } from "../src/validateAmount.js";

describe("validateAmount", () => {
  it("should return valid for positive numbers", () => {
    const result = validateAmount(100);
    expect(result.valid).toBe(true);
    expect(result.value).toBe(100);
  });

  it("should return valid for positive string numbers", () => {
    const result = validateAmount("0");
    expect(result.valid).toBe(false);
    expect(result.message).toBe("Amount must be greater than zero");
  });

  it("should return invalid for negative numbers", () => {
    const result = validateAmount(-50);
    expect(result.valid).toBe(false);
    expect(result.message).toBe("Amount must be greater than zero");
  });

  it("should deny non-numeric strings such as NaN, infinity and strings", () => {
    expect(validateAmount(NaN).valid).toBe(false);
    expect(validateAmount(Infinity).valid).toBe(false);
    expect(validateAmount("abc").valid).toBe(false);
    expect(validateAmount(-Infinity).valid).toBe(false);
  });
});
