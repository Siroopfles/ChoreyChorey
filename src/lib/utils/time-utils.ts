/**
 * Formats a duration in seconds into a human-readable string (e.g., "1u 23m").
 * @param seconds The total duration in seconds.
 * @returns A formatted string.
 */
export const formatTime = (seconds: number) => {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}u ${remainingMinutes}m`;
};