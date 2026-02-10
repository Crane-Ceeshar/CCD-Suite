/**
 * Simple formula evaluator for custom metrics.
 * Supports basic arithmetic: +, -, *, /, and parentheses.
 * Variables are referenced by name (e.g., "revenue / deals_won").
 */

const ALLOWED_OPERATORS = /^[\d\s+\-*/().]+$/;
const VARIABLE_PATTERN = /[a-zA-Z_][a-zA-Z0-9_]*/g;

/**
 * Extract variable names from a formula string.
 */
export function extractVariables(formula: string): string[] {
  const matches = formula.match(VARIABLE_PATTERN);
  if (!matches) return [];
  // Deduplicate
  return [...new Set(matches)];
}

/**
 * Validate that a formula string is safe to evaluate.
 * Returns { valid: true } or { valid: false, error: string }.
 */
export function validateFormula(
  formula: string
): { valid: true } | { valid: false; error: string } {
  if (!formula || formula.trim().length === 0) {
    return { valid: false, error: 'Formula cannot be empty' };
  }

  // Extract variables and replace with placeholder numbers for syntax check
  const variables = extractVariables(formula);
  let testExpr = formula;
  for (const v of variables) {
    testExpr = testExpr.replace(new RegExp(`\\b${v}\\b`, 'g'), '1');
  }

  // After replacing variables, the expression should only contain numbers and operators
  if (!ALLOWED_OPERATORS.test(testExpr)) {
    return { valid: false, error: 'Formula contains invalid characters' };
  }

  // Check balanced parentheses
  let depth = 0;
  for (const ch of testExpr) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (depth < 0) return { valid: false, error: 'Unbalanced parentheses' };
  }
  if (depth !== 0) {
    return { valid: false, error: 'Unbalanced parentheses' };
  }

  // Try evaluating with dummy values to check syntax
  try {
    const fn = new Function(`"use strict"; return (${testExpr});`);
    const result = fn();
    if (typeof result !== 'number' || isNaN(result)) {
      // Division by zero etc. is OK at validation time
    }
  } catch {
    return { valid: false, error: 'Formula has invalid syntax' };
  }

  return { valid: true };
}

/**
 * Evaluate a formula string with a context object mapping variable names to values.
 * Returns the numeric result.
 */
export function evaluateFormula(
  formula: string,
  context: Record<string, number>
): number {
  const variables = extractVariables(formula);
  let expr = formula;

  for (const v of variables) {
    const value = context[v] ?? 0;
    expr = expr.replace(new RegExp(`\\b${v}\\b`, 'g'), String(value));
  }

  try {
    const fn = new Function(`"use strict"; return (${expr});`);
    const result = fn();
    if (typeof result !== 'number' || !isFinite(result)) {
      return 0;
    }
    return result;
  } catch {
    return 0;
  }
}
