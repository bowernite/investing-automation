import { validateSymbol, validatePrice, validateMarketValue } from "../financial-data-validation";
import { getTableColumnMap } from "./table-utils";

/**
 * Functions for extracting position data from the portfolio table
 */

/**
 * Extract position data (symbol, price, market value) from a table row
 */
export function getPositionData(row: HTMLElement) {
  // Find the table that contains this row
  const table = row.closest("table");
  let columnMap = new Map<string, number>();
  
  if (table) {
    columnMap = getTableColumnMap(table);
  }
  
  // Get symbol using existing method (it's already robust)
  const symbolCell =
    row.querySelector<HTMLElement>(".symbolColumn") ||
    row.querySelector<HTMLElement>("app-column-symbolname");
  if (!symbolCell || !symbolCell.textContent)
    throw new Error("Symbol cell not found");
  const symbol = validateSymbol(symbolCell.textContent.trim());

  // Get cells using column indices when possible
  let priceCell: HTMLElement | null = null;
  let marketValueCell: HTMLElement | null = null;
  
  if (columnMap.size > 0) {
    // Look for exact header text matches
    const priceIndex = columnMap.get("Price");
    const marketValueIndex =
      columnMap.get("Mkt Val") ||
      columnMap.get("Market Value") ||
      columnMap.get("Market Val");
    
    if (priceIndex !== undefined) {
      const cells = row.querySelectorAll("td");
      if (cells.length > priceIndex) {
        priceCell = cells[priceIndex] as HTMLElement;
      }
    }
    
    if (marketValueIndex !== undefined) {
      const cells = row.querySelectorAll("td");
      if (cells.length > marketValueIndex) {
        marketValueCell = cells[marketValueIndex] as HTMLElement;
      }
    }
  }
  
  // Fallback to traditional selectors if needed
  if (!priceCell) {
    priceCell =
      row.querySelector<HTMLElement>("span[title^='Price as of']")
        ?.parentElement ||
      row.querySelector<HTMLElement>(
        "td.sdps-p-horizontal_xx-small.sdps-text-right span[title]"
      )?.parentElement ||
      row.querySelector<HTMLElement>("app-column-price") ||
      row.querySelector<HTMLElement>("[id^='priceColumn']");
  }
  
  if (!marketValueCell) {
    // Try to identify market value cell by content pattern
    const potentialCells = Array.from(
      row.querySelectorAll<HTMLElement>(
        "td.sdps-p-horizontal_xx-small.sdps-text-right"
      )
    );
    
    // Market value typically has a dollar amount with commas (e.g. $1,234.56)
    for (const cell of potentialCells) {
      const text = cell.textContent?.trim() || "";
      if (text.includes("$") && text.includes(",") && !text.includes("%")) {
        marketValueCell = cell;
        break;
      }
    }
    
    // Fall back to traditional selectors if needed
    if (!marketValueCell) {
      marketValueCell =
        row.querySelector<HTMLElement>(
          "td.sdps-p-horizontal_xx-small.sdps-text-right:has(app-superscript)"
        ) ||
        row.querySelector<HTMLElement>("app-column-marketvalue") ||
        row.querySelector<HTMLElement>("[id^='marketValueColumn']");
    }
  }
  
  if (!priceCell) throw new Error("Price cell not found");
  if (!marketValueCell) throw new Error("Market value cell not found");
  
  const priceText = priceCell.textContent?.trim() || "";
  const price = validatePrice(priceText, symbol);
  
  const marketValueText = marketValueCell.textContent?.trim() || "";
  const marketValue = validateMarketValue(marketValueText, symbol);

  const data = { symbol, price, marketValue };
  console.log("Position Data:", data);
  return data;
} 