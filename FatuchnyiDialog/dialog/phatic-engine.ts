import type { RuleType } from "./types";
import { matchPattern, normalize } from "./utils";

export class PhaticEngine {
  private rules: RuleType[];

  constructor(rules: RuleType[]) {
    this.rules = rules.slice().sort((a, b) => b.priority - a.priority);
  }

  respond(input: string): string {
    const normalized = normalize(input);

    for (const rule of this.rules) {
      const patternNormalized = normalize(rule.pattern);
      if (
        !patternNormalized.includes("*") &&
        !patternNormalized.includes("?") &&
        patternNormalized === normalized
      ) {
        return typeof rule.response === "function"
          ? rule.response({})
          : rule.response;
      }
    }

    const matches: { rule: RuleType; vars: Record<string, string> }[] = [];
    for (const rule of this.rules) {
      const hasWild = /\*|\?|\?->/i.test(rule.pattern);
      console.log(rule.pattern);
      const { matched, variables } = hasWild
        ? matchPattern({ pattern: rule.pattern, input })
        : { matched: false, variables: {} };
      console.log(matched, variables);
      if (matched) matches.push({ rule, vars: variables });
    }

    if (matches.length > 0) {
      matches.sort((a, b) => b.rule.priority - a.rule.priority);
      const chosen = matches[0];
      return typeof chosen.rule.response === "function"
        ? chosen.rule.response(chosen.vars)
        : chosen.rule.response;
    }

    const universal = this.rules.find((r) => normalize(r.pattern) === "*");
    if (universal) {
      return typeof universal.response === "function"
        ? universal.response({})
        : universal.response;
    }

    return "Я Вас не дуже розумію.";
  }
}
