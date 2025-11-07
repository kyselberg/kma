export type MatchedResultType = {
  matched: boolean;
  variables: Record<string, string>;
};

export type RuleType = {
  pattern: string; // e.g. "(Я ? *)" or "(* комп’ютери *)"
  response: string | ((vars: Record<string, string>) => string);
  priority: number; // higher first
};
