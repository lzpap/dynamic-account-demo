type Member = { address: string; weight: number };

/**
 * Find all minimal combinations of members that meet the threshold.
 * A minimal combination is one where removing any member would drop the total weight below the threshold.
 */
export function findThresholdCombinations(members: Member[], threshold: number): Member[][] {
  if (!members || members.length === 0 || threshold <= 0) return [];
  
  const results: Member[][] = [];
  
  // Generate all subsets and filter those that meet threshold
  const findCombos = (index: number, current: Member[], currentWeight: number) => {
    if (currentWeight >= threshold) {
      // Check if this is a minimal combination (removing any member would drop below threshold)
      const isMinimal = current.every(m => currentWeight - m.weight < threshold);
      if (isMinimal) {
        results.push([...current]);
      }
      return;
    }
    
    if (index >= members.length) return;
    
    // Include current member
    findCombos(index + 1, [...current, members[index]], currentWeight + members[index].weight);
    // Skip current member
    findCombos(index + 1, current, currentWeight);
  };
  
  findCombos(0, [], 0);
  
  // Sort by number of members, then by total weight
  return results
    .sort((a, b) => a.length - b.length || a.reduce((s, m) => s + m.weight, 0) - b.reduce((s, m) => s + m.weight, 0))
    .slice(0, 10); // Limit to 10 combinations
}
