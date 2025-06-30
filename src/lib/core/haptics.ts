'use client';

/**
 * Triggers a haptic feedback vibration on supported devices.
 * @param pattern A number or an array of numbers representing the vibration pattern.
 * See https://developer.mozilla.org/en-US/docs/Web/API/Navigator/vibrate
 */
export function triggerHapticFeedback(pattern: number | number[] = 50): void {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      // Check if another vibration is already active. This is a very basic check.
      // On some devices, calling vibrate() while another is active will fail or do nothing.
      // For our simple use cases, this should be fine.
      navigator.vibrate(pattern);
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }
}
