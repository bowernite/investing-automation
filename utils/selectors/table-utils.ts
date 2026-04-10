/**
 * Table-specific utility functions for working with HTML tables
 */

/**
 * Get the cell in a data row that corresponds to a given header column.
 *
 * Works by matching child indices: the header row and data rows have the same
 * number of children in the same order (sentinel, symbol, name, qty, price, ...),
 * even though data rows use <th> for some and <td> for others. This is more
 * robust than index-mapping because it doesn't depend on counting <td> vs <th>.
 */
export function getColumnCell(table: HTMLElement, row: HTMLElement, headerId: string): HTMLElement | null {
  const header = table.querySelector<HTMLElement>(`#${headerId}`);
  if (!header?.parentElement) return null;

  const headerIndex = Array.from(header.parentElement.children).indexOf(header);
  if (headerIndex < 0) return null;

  const cell = row.children[headerIndex] as HTMLElement | undefined;
  return cell || null;
}
