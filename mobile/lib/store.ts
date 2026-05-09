import { ParsedReceipt } from './types';

// Simple module-level store for passing parsed receipt data to the review screen.
// No external state library needed for a two-screen handoff.
let _pendingReceipt: ParsedReceipt | null = null;

export const store = {
  setPendingReceipt: (r: ParsedReceipt): void => { _pendingReceipt = r; },
  getPendingReceipt: (): ParsedReceipt | null => _pendingReceipt,
  clearPendingReceipt: (): void => { _pendingReceipt = null; },
};
