export function findHighLevelElements() {
  const table =
    getElement<HTMLTableElement>("table") ||
    getElement<HTMLTableElement>(".sdps-table");
  if (!table) throw new Error("Table not found");

  const accountValueElement =
    getElement("#accountSummary-Lbl_AccountValue-totalValue") ||
    getElement("[id$='AccountValue-totalValue']") ||
    getElement(".sdps-display-value__value");

  const cashAvailableElement =
    getElement("#accountSummary-Lbl_CashSymbol-totalValue") ||
    getElement("[id$='CashSymbol-totalValue']") ||
    getElement(".sdps-display-value__value:nth-of-type(2)");

  const positionRows = table.querySelectorAll<HTMLElement>(
    '.position-row:not([id^="Cash"]), tr[appholdingsrow]:not([id^="Cash"])'
  );

  return { table, accountValueElement, cashAvailableElement, positionRows };
}

export function isTaxableAccount() {
  // Check for elements that indicate a taxable account
  const taxableIndicators = [
    getElement<HTMLElement>("#account-selector-label"),
    getElement<HTMLElement>("#account-selector"),
  ];

  for (const indicator of taxableIndicators) {
    if (indicator && indicator.textContent) {
      const accountTypeText = indicator.textContent.toLowerCase();
      if (accountTypeText.includes("taxable account")) {
        return true;
      }
    }
  }
  return false;
}

export function getElement<T extends HTMLElement>(selector: string): T | null {
  return document.querySelector<T>(selector);
}

export function parseCellCash(cell: HTMLElement | null): number {
  if (!cell) return 0;
  cell.querySelector("sup")?.remove();
  const cashText = cell.textContent?.trim() || "0";
  return parseFloat(cashText.replace(/[$,]/g, ""));
}

export function getPositionData(row: HTMLElement) {
  const symbolCell =
    row.querySelector<HTMLElement>(".symbolColumn") ||
    row.querySelector<HTMLElement>("app-column-symbolname");
  if (!symbolCell || !symbolCell.textContent)
    throw new Error("Symbol cell not found");
  const symbol = symbolCell.textContent.trim();

  const priceCell =
    row.querySelector<HTMLElement>("app-column-price") ||
    row.querySelector<HTMLElement>("[id^='priceColumn']");
  if (!priceCell) throw new Error("Price cell not found");
  const price = parseCellCash(priceCell);

  const marketValueCell =
    row.querySelector<HTMLElement>("app-column-marketvalue") ||
    row.querySelector<HTMLElement>("[id^='marketValueColumn']");
  if (!marketValueCell) throw new Error("Market value cell not found");
  const marketValue = parseCellCash(marketValueCell);

  return { symbol, price, marketValue };
}
