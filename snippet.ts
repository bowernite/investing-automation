(() => {
  // (updated 6/27/24, based on an average of GPT responses 🤷‍♂️ it really differs)
  const portfolio = {
    // US Stocks
    VTI: 0.58, // curr taxable: (Primary: VTI. Holdovers: VV, SCHA)
    // Int'l stocks
    IXUS: 0.25, // curr taxable: (Primary: IXUS. Holdover: SPDW)
    // US bonds
    BND: 0.07,
    // Int'l bonds
    BNDX: 0.02, // alt: IAGG (iShares)
    // Real estate
    VNQ: 0.08,
  };

  const ALLOCATION_TOLERANCE = 0.0001;

  main();

  function main() {
    const amountToSell = getAmountToSell();

    validatePortfolioAllocation(portfolio);

    const table =
      getElement<HTMLTableElement>("table") ||
      getElement<HTMLTableElement>(".sdps-table");
    if (!table) throw new Error("Table not found");
    const accountValueElement =
      getElement("#accountSummary-Lbl_AccountValue-totalValue") ||
      getElement("[id$='AccountValue-totalValue']") ||
      getElement(".sdps-display-value__value");
    const accountValue = parseCellCash(accountValueElement);
    const desiredAccountValue = accountValue - amountToSell;
    const cashAvailableElement =
      getElement("#accountSummary-Lbl_CashSymbol-totalValue") ||
      getElement("[id$='CashSymbol-totalValue']") ||
      getElement(".sdps-display-value__value:nth-of-type(2)");
    const cashAvailable = parseCellCash(cashAvailableElement);
    const positionRows = table.querySelectorAll<HTMLElement>(
      '.position-row:not([id^="Cash"]), tr[appholdingsrow]:not([id^="Cash"])'
    );

    console.log({
      amountToSell,
      accountValue,
      desiredAccountValue,
      cashAvailable,
      table,
      positionRows,
    });

    const outputString = Array.from(positionRows).reduce((output, row) => {
      const { symbol, price, marketValue } = getPositionData(row);
      console.log({ symbol, price, marketValue });

      const { action, amountToTrade, sharesToTrade, desiredAllocation } =
        calculateTradeAction(symbol, marketValue, price, desiredAccountValue);

      return (
        output +
        generateOutputString(
          symbol,
          action,
          sharesToTrade,
          price,
          amountToTrade,
          desiredAllocation
        )
      );
    }, "");

    alert(outputString);
  }

  function getAmountToSell(): number {
    const isSelling = confirm(
      "Would you like to withdraw money from your taxable account?"
    );
    if (!isSelling) return 0;

    const sellInput = prompt("How much would you like to sell?");
    return sellInput ? parseFloat(sellInput) : 0;
  }

  function validatePortfolioAllocation(
    portfolio: Record<string, number>
  ): void {
    const totalAllocation = Object.values(portfolio).reduce(
      (sum, value) => sum + value,
      0
    );
    if (Math.abs(totalAllocation - 1) > ALLOCATION_TOLERANCE) {
      throw new Error("Portfolio allocation does not sum to 1");
    }
  }

  function getElement<T extends HTMLElement>(selector: string): T | null {
    return document.querySelector<T>(selector);
  }

  function parseCellCash(cell: HTMLElement | null): number {
    if (!cell) return 0;
    cell.querySelector("sup")?.remove();
    const cashText = cell.textContent?.trim() || "0";
    return parseFloat(cashText.replace(/[$,]/g, ""));
  }

  function formatCurrency(amount: number): string {
    return amount.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function getPositionData(row: HTMLElement) {
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

  function calculateTradeAction(
    symbol: string,
    marketValue: number,
    price: number,
    desiredAccountValue: number
  ) {
    const desiredAllocation = (portfolio[symbol] || 0) * desiredAccountValue;
    const difference = desiredAllocation - marketValue;
    const action = difference >= 0 ? "BUY" : "SELL";
    const amountToTrade = Math.abs(difference);
    const sharesToTrade = Math.floor(amountToTrade / price);

    return { action, amountToTrade, sharesToTrade, desiredAllocation };
  }

  function generateOutputString(
    symbol: string,
    action: string,
    sharesToTrade: number,
    price: number,
    amountToTrade: number,
    desiredAllocation: number
  ): string {
    return `${symbol}: ${action} ${sharesToTrade} shares at $${price.toFixed(2)}
    Trying to ${action} ${formatCurrency(amountToTrade)}
    Target Allocation: ${formatCurrency(desiredAllocation)}

`;
  }
})();
