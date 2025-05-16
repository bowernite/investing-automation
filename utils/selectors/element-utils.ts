/**
 * Basic DOM element utilities for selection and parsing
 */

/**
 * Gets an element by selector
 */
export function getElement<T extends HTMLElement>(selector: string): T | null {
  return document.querySelector<T>(selector);
}

/**
 * Parses a cell that contains a cash value
 */
export function parseCellCash(cell: HTMLElement | null): number {
  if (!cell) return 0;
  cell.querySelector("sup")?.remove();
  const cashText = cell.textContent?.trim() || "0";
  return parseFloat(cashText.replace(/[$,]/g, ""));
} 