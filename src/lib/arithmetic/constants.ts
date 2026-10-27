import type { Difficulty } from "@/lib/storage/types";

export type Op = "+" | "-" | "×" | "÷";

export interface SubLevelSpec {
  addSubMax: number;
  mulAMax: number;
  mulBMax: number;
  divQuotientMax: number;
  divDivisorMax: number;
  allowNegative: boolean;
}

export const LEVEL_TABLE: Record<Difficulty, SubLevelSpec[]> = {
  easy: [
    { addSubMax: 10, mulAMax: 0, mulBMax: 0, divQuotientMax: 0, divDivisorMax: 0, allowNegative: false },
    { addSubMax: 15, mulAMax: 0, mulBMax: 0, divQuotientMax: 0, divDivisorMax: 0, allowNegative: false },
    { addSubMax: 20, mulAMax: 0, mulBMax: 0, divQuotientMax: 0, divDivisorMax: 0, allowNegative: false },
  ],
  medium: [
    { addSubMax: 50, mulAMax: 5, mulBMax: 5, divQuotientMax: 0, divDivisorMax: 0, allowNegative: false },
    { addSubMax: 75, mulAMax: 7, mulBMax: 7, divQuotientMax: 0, divDivisorMax: 0, allowNegative: false },
    { addSubMax: 100, mulAMax: 10, mulBMax: 10, divQuotientMax: 0, divDivisorMax: 0, allowNegative: false },
  ],
  hard: [
    { addSubMax: 300, mulAMax: 9, mulBMax: 9, divQuotientMax: 6, divDivisorMax: 9, allowNegative: false },
    { addSubMax: 500, mulAMax: 12, mulBMax: 12, divQuotientMax: 9, divDivisorMax: 12, allowNegative: false },
    { addSubMax: 1000, mulAMax: 19, mulBMax: 9, divQuotientMax: 12, divDivisorMax: 12, allowNegative: false },
  ],
};

export const SUB_LEVEL_COUNT = 3;
export const CONSECUTIVE_CORRECT_WIDEN = 3;
export const CONSECUTIVE_WRONG_NARROW = 2;

export const DEFAULT_OPS: Record<Difficulty, Op[]> = {
  easy: ["+", "-"],
  medium: ["+", "-", "×"],
  hard: ["+", "-", "×", "÷"],
};
