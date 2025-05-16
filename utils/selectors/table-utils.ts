/**
 * Table-specific utility functions for working with HTML tables
 */

/**
 * Maps table headers to their column indices for more robust selection
 */
export function getTableColumnMap(table: HTMLElement): Map<string, number> {
  const headerMap = new Map<string, number>();
  const headers = Array.from(table.querySelectorAll('th[scope="col"]'));
  
  // Map exact header text to column index
  headers.forEach((header, index) => {
    const text = header.textContent?.trim();
    if (text) {
      headerMap.set(text, index);
    }
  });
  
  return headerMap;
} 