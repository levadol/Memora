import type { TutorialStep } from "@/lib/games/shared/types";

export type { TutorialStep };

export const CORSI_TUTORIAL_STEPS: TutorialStep[] = [
  {
    titleKey: "games.corsiBlocks.tutorial.step1Title",
    bodyKey: "games.corsiBlocks.tutorial.step1Body",
  },
  {
    titleKey: "games.corsiBlocks.tutorial.step2Title",
    bodyKey: "games.corsiBlocks.tutorial.step2Body",
    demoSequence: [0, 3, 7],
  },
  {
    titleKey: "games.corsiBlocks.tutorial.step3Title",
    bodyKey: "games.corsiBlocks.tutorial.step3Body",
  },
];
