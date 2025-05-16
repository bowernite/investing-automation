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

  const positionRows = Array.from(
    table.querySelectorAll<HTMLElement>('.position-row, tr[appholdingsrow]')
  ).filter(row => !row.textContent?.includes('Cash'));

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
  if (!symbolCell || !symbolCell.textContent) {
    console.log(row);
    throw new Error("Symbol cell not found");
  }
  const symbol = symbolCell.textContent.trim();

  const priceCell =
    row.querySelector<HTMLElement>("span[title^='Price as of']")
      ?.parentElement ||
    row.querySelector<HTMLElement>(
      "td.sdps-p-horizontal_xx-small.sdps-text-right span[title]"
    )?.parentElement ||
    row.querySelector<HTMLElement>("app-column-price") ||
    row.querySelector<HTMLElement>("[id^='priceColumn']");
  if (!priceCell) throw new Error("Price cell not found");
  const price = parseCellCash(priceCell);

  const marketValueCell =
    row.querySelector<HTMLElement>(
      "td.sdps-p-horizontal_xx-small.sdps-text-right:has(app-superscript)"
    ) ||
    row.querySelector<HTMLElement>(
      "td.sdps-p-horizontal_xx-small.sdps-text-right:not(:has(span[title^='Price as of']))"
    ) ||
    row.querySelector<HTMLElement>("app-column-marketvalue") ||
    row.querySelector<HTMLElement>("[id^='marketValueColumn']");
  if (!marketValueCell) throw new Error("Market value cell not found");
  const marketValue = parseCellCash(marketValueCell);

  const positionData = { symbol, price, marketValue };
  validatePositionData(positionData);

  return positionData;
}

/**
 * Validates position data to ensure values are reasonable and consistent
 */
export function validatePositionData(data: {
  symbol: string;
  price: number;
  marketValue: number;
}): void {
  const { symbol, price, marketValue } = data;

  // Validate symbol format (ticker symbols are typically 1-5 uppercase letters)
  if (!/^[A-Z0-9]{1,5}$/.test(symbol)) {
    throw new Error(`Invalid symbol format: ${symbol}`);
  }

  // Validate price is in a reasonable range for ETFs/mutual funds
  if (price < 10 || price > 1000) {
    throw new Error(`Price out of reasonable range: $${price} for ${symbol}`);
  }

  // Validate market value is positive and reasonable
  if (marketValue <= 0) {
    throw new Error(`Invalid market value: $${marketValue} for ${symbol}`);
  }

  // Note: We don't validate price * quantity = market value
  // because price is current price, not purchase price
}
