import type { MatchedResultType } from "./types";

export function normalize(text: string): string {
  return text
    .trim()
    .replace(/[\s\u00A0]+/g, " ")
    .replace(/[\(\)]/g, "")
    .toLowerCase();
}

export function tokenize(text: string): string[] {
  return normalize(text).split(/\s+/).filter(Boolean);
}

type MatchPatternArgsType = {
  pattern: string;
  input: string;
};

export function matchPattern(args: MatchPatternArgsType): MatchedResultType {
  const { pattern, input } = args;

  const variables: Record<string, string> = {};
  const patternTokens = tokenize(pattern);
  const inputTokens = tokenize(input);

  function matchWithCapture(patternIndex: number, inputIndex: number): boolean {
    if (patternIndex === patternTokens.length)
      return inputIndex === inputTokens.length;

    const token = patternTokens[patternIndex];

    if (token === "*") {
      for (let span = inputTokens.length - inputIndex; span >= 0; span--) {
        if (matchWithCapture(patternIndex + 1, inputIndex + span)) return true;
      }
      return false;
    }

    if (token === "?") {
      if (inputIndex >= inputTokens.length) return false;
      return matchWithCapture(patternIndex + 1, inputIndex + 1);
    }

    const capture = token.match(/^\?->([a-z])$/i);
    if (capture) {
      const varName = capture[1];
      if (inputIndex >= inputTokens.length) return false;

      variables[varName] = inputTokens[inputIndex];

      return matchWithCapture(patternIndex + 1, inputIndex + 1);
    }

    if (inputIndex >= inputTokens.length) return false;
    if (token !== inputTokens[inputIndex]) return false;

    return matchWithCapture(patternIndex + 1, inputIndex + 1);
  }

  const START_INDEX = 0;

  const matched = matchWithCapture(START_INDEX, START_INDEX);

  return { matched, variables };
}
