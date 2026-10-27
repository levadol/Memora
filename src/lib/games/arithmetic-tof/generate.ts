import type { Difficulty } from "@/lib/storage/types";
import { generateProblem } from "@/lib/arithmetic/generate";
import { DEFAULT_OPS } from "@/lib/arithmetic/constants";
import type { TofItem } from "./types";
import { TOTAL_ITEMS, TRUE_ITEMS, FALSE_ITEMS } from "./constants";

type PerturbType = "off1" | "off2" | "off10" | "digitSwap";

function perturbAnswer(answer: number, rng: () => number): number {
  const str = String(Math.abs(answer));
  const canSwap = str.length >= 2;

  const types: PerturbType[] = ["off1", "off2", "off10"];
  if (canSwap) types.push("digitSwap");

  for (let attempt = 0; attempt < 30; attempt++) {
    const t = types[Math.floor(rng() * types.length)] as PerturbType;
    let result: number;

    if (t === "off1") {
      result = answer + (rng() < 0.5 ? 1 : -1);
    } else if (t === "off2") {
      result = answer + (rng() < 0.5 ? 2 : -2);
    } else if (t === "off10") {
      result = answer + (rng() < 0.5 ? 10 : -10);
    } else {
      const arr = str.split("");
      const i = Math.floor(rng() * (arr.length - 1));
      const tmp = arr[i]!;
      arr[i] = arr[i + 1]!;
      arr[i + 1] = tmp;
      const swapped = parseInt(arr.join(""));
      result = answer < 0 ? -swapped : swapped;
    }

    if (result !== answer && result > 0) return result;
  }

  return answer + 1;
}

export function isFalsePatternValid(correct: number, perturbed: number): boolean {
  const diff = Math.abs(perturbed - correct);
  if (diff === 1 || diff === 2 || diff === 10) return true;
  // Check if it is a digit rearrangement of the correct answer (digit swap may produce leading zero)
  const corrStr = String(Math.abs(correct));
  const pertStr = String(Math.abs(perturbed)).padStart(corrStr.length, "0");
  if (corrStr.length !== pertStr.length) return false;
  const sortedCorrect = corrStr.split("").sort().join("");
  const sortedPerturbed = pertStr.split("").sort().join("");
  return sortedCorrect === sortedPerturbed;
}

export function generateTofSession(
  difficulty: Difficulty,
  subLevelIndex: number,
  rng: () => number
): TofItem[] {
  const ops = DEFAULT_OPS[difficulty];
  const trueItems: TofItem[] = [];
  const falseItems: TofItem[] = [];

  for (let i = 0; i < TRUE_ITEMS; i++) {
    const problem = generateProblem(difficulty, subLevelIndex, ops, rng);
    trueItems.push({
      text: `${problem.text} = ${problem.answer}`,
      isTrue: true,
      correctAnswer: problem.answer,
      displayedAnswer: problem.answer,
    });
  }

  for (let i = 0; i < FALSE_ITEMS; i++) {
    const problem = generateProblem(difficulty, subLevelIndex, ops, rng);
    const perturbed = perturbAnswer(problem.answer, rng);
    falseItems.push({
      text: `${problem.text} = ${perturbed}`,
      isTrue: false,
      correctAnswer: problem.answer,
      displayedAnswer: perturbed,
    });
  }

  const combined = [...trueItems, ...falseItems];
  // Fisher-Yates shuffle
  for (let i = combined.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = combined[i]!;
    combined[i] = combined[j]!;
    combined[j] = tmp;
  }

  return combined;
}

export { TOTAL_ITEMS };
