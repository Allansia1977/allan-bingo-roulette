/**
 * Generates an array of numbers from start to end (inclusive).
 */
export const generateRange = (start: number, end: number): number[] => {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
};

/**
 * Shuffles an array in place (Fisher-Yates shuffle) and returns a new copy.
 */
export const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

/**
 * Picks a random number from the array.
 */
export const pickRandom = <T,>(array: T[]): T | undefined => {
  if (array.length === 0) return undefined;
  const index = Math.floor(Math.random() * array.length);
  return array[index];
};

/**
 * Easing function for spin speed (EaseOutCubic).
 * t: current time, b: start value, c: change in value, d: duration
 */
export const easeOutCubic = (t: number): number => {
  return 1 - Math.pow(1 - t, 3);
};