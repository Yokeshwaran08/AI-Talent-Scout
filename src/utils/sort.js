// ─── Sort Utility ─────────────────────────────────────────────
// Extracted from ResultsList so the component stays lean.
// All candidate sorting and filtering lives here.

export const SORT_OPTIONS = [
  { value: "rank",     label: "Overall Rank"   },
  { value: "match",    label: "Match Score"    },
  { value: "interest", label: "Interest Score" },
];

export const INTEREST_FILTERS = ["All", "High", "Medium-High", "Medium", "Low"];

/**
 * Filter candidates by interest level.
 * "Low" bucket absorbs "Medium-Low" as well.
 */
export function filterCandidates(candidates, filterInterest) {
  if (filterInterest === "All") return candidates;
  if (filterInterest === "Low") {
    return candidates.filter((c) => ["Low", "Medium-Low"].includes(c.interestLevel));
  }
  return candidates.filter((c) => c.interestLevel === filterInterest);
}

/**
 * Sort an array of candidates by the given key.
 * Returns a new array — never mutates the original.
 */
export function sortCandidates(candidates, sortBy) {
  return [...candidates].sort((a, b) => {
    if (sortBy === "rank")     return (b.rankScore     ?? 0) - (a.rankScore     ?? 0);
    if (sortBy === "match")    return (b.matchScore    ?? 0) - (a.matchScore    ?? 0);
    if (sortBy === "interest") return (b.interestScore ?? 0) - (a.interestScore ?? 0);
    return 0;
  });
}
