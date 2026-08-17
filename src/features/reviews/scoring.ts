export type ScoredCriterion = {
  criterionId: string;
  score: number;
  maximumPoints: number;
  weight: number;
};

export type ScoreResult = {
  /** 0-1 fraction of the rubric achieved. */
  fraction: number;
  /** Fraction scaled onto the assessment's maximum score. */
  totalScore: number;
  /** Percentage form, used for the badge on the profile. */
  percentage: number;
  passed: boolean;
};

/**
 * Turns rubric criterion scores into a single result.
 *
 * Each criterion contributes its own achieved fraction, weighted by its share
 * of the total weight. Normalising by the sum of weights rather than assuming
 * they add to 100 means a rubric that was authored loosely still scores
 * sensibly instead of silently producing a total above the maximum.
 */
export function calculateScore(
  criteria: ScoredCriterion[],
  maximumScore: number,
  passingScore: number,
): ScoreResult {
  const usable = criteria.filter((item) => item.maximumPoints > 0);

  if (usable.length === 0) {
    return { fraction: 0, totalScore: 0, percentage: 0, passed: false };
  }

  const totalWeight = usable.reduce((sum, item) => sum + item.weight, 0);

  // A rubric with no weights set is treated as equally weighted rather than
  // dividing by zero.
  const fraction =
    totalWeight > 0
      ? usable.reduce(
          (sum, item) => sum + (item.score / item.maximumPoints) * (item.weight / totalWeight),
          0,
        )
      : usable.reduce((sum, item) => sum + item.score / item.maximumPoints, 0) / usable.length;

  const clamped = Math.min(1, Math.max(0, fraction));
  const totalScore = Math.round(clamped * maximumScore * 100) / 100;

  return {
    fraction: clamped,
    totalScore,
    percentage: Math.round(clamped * 100),
    passed: totalScore >= passingScore,
  };
}

/** Clamps a raw reviewer input to the criterion's allowed range. */
export function clampScore(raw: number, maximumPoints: number): number {
  if (!Number.isFinite(raw)) {
    return 0;
  }

  return Math.min(maximumPoints, Math.max(0, raw));
}
