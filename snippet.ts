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

  const main = () => {
    const amountToSell = getAmountToSell();
    console.log("Amount to sell:", amountToSell);

    validatePortfolioAllocation(portfolio);

    const table = getElement<HTMLTableElement>("table");
    const accountValue = parseCellCash(
      getElement("#accountSummary-Lbl_AccountValue-totalValue")
    );
    console.log("Account value:", accountValue);

    const desiredAccountValue = accountValue - amountToSell;
    console.log("Desired account value:", desiredAccountValue);

    const cashAvailable = parseCellCash(
      getElement("#accountSummary-Lbl_CashSymbol-totalValue")
    );
    console.log("Cash available:", cashAvailable);

    const positionRows = table.querySelectorAll<HTMLElement>(
      '.position-row:not([id^="Cash"])'
    );
    console.log("Position rows:", positionRows);

    const outputString = Array.from(positionRows).reduce((output, row) => {
      const { symbol, price, marketValue } = getPositionData(row);
      console.log(
        "Symbol:",
        symbol,
        "Price:",
        price,
        "Market value:",
        marketValue
      );

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
  };

  main();

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

  function getElement<T extends HTMLElement>(selector: string): T {
    const element = document.querySelector<T>(selector);
    if (!element) throw new Error(`Element not found: ${selector}`);
    return element;
  }

  function parseCellCash(cell: HTMLElement): number {
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
    const symbolCell = row.querySelector<HTMLElement>(".symbolColumn");
    if (!symbolCell || !symbolCell.textContent)
      throw new Error("Symbol cell not found");
    const symbol = symbolCell.textContent.trim();

    const priceCell = row.querySelector<HTMLElement>("app-column-price");
    if (!priceCell) throw new Error("Price cell not found");
    const price = parseCellCash(priceCell);

    const marketValueCell = row.querySelector<HTMLElement>(
      "app-column-marketvalue"
    );
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
