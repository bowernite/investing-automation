import { validateSymbol, validatePrice, validateMarketValue } from "../financial-data-validation";
import { getColumnCell } from "./table-utils";

/**
 * Functions for extracting position data from the portfolio table
 */

/**
 * Extract position data (symbol, price, market value) from a table row
 */
export function getPositionData(row: HTMLElement) {
  const table = row.closest<HTMLElement>("table");

  // Get symbol
  const symbolCell =
    row.querySelector<HTMLElement>(".symbolColumn") ||
    row.querySelector<HTMLElement>("app-column-symbolname");
  if (!symbolCell || !symbolCell.textContent)
    throw new Error("Symbol cell not found");
  const symbol = validateSymbol(symbolCell.textContent.trim());

  // Primary: look up cells by header id (stable across layout changes)
  let priceCell: HTMLElement | null = null;
  let marketValueCell: HTMLElement | null = null;

  if (table) {
    priceCell = getColumnCell(table, row, "price");
    marketValueCell = getColumnCell(table, row, "marketValue");
  }

  // Fallback selectors if header-id lookup fails
  if (!priceCell) {
    priceCell =
      row.querySelector<HTMLElement>("span[title^='Price as of']")
        ?.parentElement ||
      row.querySelector<HTMLElement>("app-column-price") ||
      row.querySelector<HTMLElement>("[id^='priceColumn']");
  }

  if (!marketValueCell) {
    marketValueCell =
      row.querySelector<HTMLElement>("app-column-marketvalue") ||
      row.querySelector<HTMLElement>("[id^='marketValueColumn']");
  }

  if (!priceCell) throw new Error(`Price cell not found for ${symbol}`);
  if (!marketValueCell) throw new Error(`Market value cell not found for ${symbol}`);

  const priceText = priceCell.textContent?.trim() || "";
  const price = validatePrice(priceText, symbol);

  const marketValueText = marketValueCell.textContent?.trim() || "";
  const marketValue = validateMarketValue(marketValueText, symbol);

  const data = { symbol, price, marketValue };
  console.log("Position Data:", data);
  return data;
}
