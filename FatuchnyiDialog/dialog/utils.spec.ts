import { describe, expect, it } from "vitest";
import { matchPattern, normalize, tokenize } from "./utils";

describe("normalize", () => {
  it("lowercases, trims, collapses spaces and removes parentheses", () => {
    const nbsp = "\u00A0";
    expect(normalize(`  HeLLo${nbsp}  (World)  `)).toBe("hello world");
  });

  it("keeps punctuation but normalizes case", () => {
    expect(normalize("Привіт, Світ!")).toBe("привіт, світ!");
  });
});

describe("tokenize", () => {
  it("splits by spaces after normalization and filters empties", () => {
    expect(tokenize("  A  (B)   C  ")).toEqual(["a", "b", "c"]);
  });
});

describe("matchPattern - literals", () => {
  it("matches exact literal tokens", () => {
    const { matched, variables } = matchPattern({
      pattern: "hello world",
      input: "HeLLo   (world)",
    });
    expect(matched).toBe(true);
    expect(variables).toEqual({});
  });

  it("fails when literals differ", () => {
    const { matched } = matchPattern({
      pattern: "hello there",
      input: "hello world",
    });
    expect(matched).toBe(false);
  });
});

describe("matchPattern - '*' wildcard", () => {
  it("matches zero tokens for '*'", () => {
    const { matched, variables } = matchPattern({
      pattern: "a * c",
      input: "(a) c",
    });
    expect(matched).toBe(true);
    expect(variables).toEqual({});
  });

  it("matches multiple tokens for '*'", () => {
    const { matched, variables } = matchPattern({
      pattern: "a * c",
      input: "a many different tokens c",
    });
    expect(matched).toBe(true);
    expect(variables).toEqual({});
  });

  it("exercises fallback backtrack path (no match)", () => {
    const { matched, variables } = matchPattern({
      pattern: "* a",
      input: "b",
    });
    expect(matched).toBe(false);
    expect(variables).toEqual({});
  });
});

describe("matchPattern - '?' wildcard", () => {
  it("matches exactly one token for '?'", () => {
    const { matched, variables } = matchPattern({
      pattern: "I ? apples",
      input: "i like apples",
    });
    expect(matched).toBe(true);
    expect(variables).toEqual({});
  });

  it("fails when input lacks a token for '?'", () => {
    const { matched, variables } = matchPattern({
      pattern: "I ?",
      input: "i",
    });
    expect(matched).toBe(false);
    expect(variables).toEqual({});
  });
});

describe("matchPattern - '?->a' variable capture", () => {
  it("captures one token into variables and matches rest", () => {
    const res = matchPattern({
      pattern: "(Я ?->a *)",
      input: "Я люблю яблука",
    });
    expect(res.matched).toBe(true);
    expect(res.variables).toEqual({ a: "люблю" });
  });

  it("works with different captured word", () => {
    const res = matchPattern({
      pattern: "(Я ?->a *)",
      input: "Я ненавиджу дощі",
    });
    expect(res.matched).toBe(true);
    expect(res.variables).toEqual({ a: "ненавиджу" });
  });
});

describe("matchPattern - unsupported '<a>' token", () => {
  it("explicit variable token without preceding '?' is unsupported and fails", () => {
    const res = matchPattern({
      pattern: "<a>",
      input: "будьщо",
    });
    expect(res.matched).toBe(false);
    expect(res.variables).toEqual({});
  });
});
