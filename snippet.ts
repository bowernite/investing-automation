(() => {
  // (updated 6/27/24, based on an average of GPT responses 🤷‍♂️ it really differs)
  interface PortfolioCategory {
    desiredAllocation: number;
    primarySymbol: string;
    holdoverSymbols: string[];
  }

  interface Portfolio {
    [category: string]: PortfolioCategory;
  }

  const portfolio: Portfolio = {
    US_STOCKS: {
      desiredAllocation: 0.58,
      primarySymbol: "VTI",
      holdoverSymbols: ["VV", "SCHA"],
    },
    INTL_STOCKS: {
      desiredAllocation: 0.25,
      primarySymbol: "IXUS",
      holdoverSymbols: ["SPDW"],
    },
    REAL_ESTATE: {
      desiredAllocation: 0.08,
      primarySymbol: "VNQ",
      holdoverSymbols: [],
    },
    US_BONDS: {
      desiredAllocation: 0.07,
      primarySymbol: "BND",
      holdoverSymbols: [],
    },
    INTL_BONDS: {
      desiredAllocation: 0.02,
      primarySymbol: "BNDX",
      holdoverSymbols: [],
    },
  };

  const ALLOCATION_TOLERANCE = 0.0001;

  main();

  function main() {
    const amountToSell = getAmountToSell();

    validatePortfolioAllocation(portfolio);

    const { table, accountValueElement, cashAvailableElement, positionRows } =
      findHighLevelElements();
    const accountValue = parseCellCash(accountValueElement);
    const cashAvailable = parseCellCash(cashAvailableElement);
    const desiredAccountValue = accountValue - amountToSell;

    console.log({
      amountToSell,
      accountValue,
      desiredAccountValue,
      cashAvailable,
      table,
      positionRows,
    });

    const positionData = Array.from(positionRows).map(getPositionData);
    const categoryTotals = calculateCategoryTotals(positionData);

    const outputString = Object.entries(portfolio).reduce(
      (output, [category, details]) => {
        const { primarySymbol, holdoverSymbols } = details;
        const currentValue = categoryTotals[category] || 0;
        const desiredValue = details.desiredAllocation * desiredAccountValue;
        const difference = desiredValue - currentValue;

        const action = difference >= 0 ? "BUY" : "SELL";
        if (action === "BUY") {
          return (
            output +
            handleBuyForCategory(
              primarySymbol,
              difference,
              desiredValue,
              positionData
            )
          );
        } else {
          return (
            output +
            handleSellForCategory(
              category,
              primarySymbol,
              holdoverSymbols,
              difference,
              desiredValue,
              positionData
            )
          );
        }
      },
      ""
    );

    alert(outputString);
  }

  function handleBuyForCategory(
    primarySymbol: string,
    difference: number,
    desiredValue: number,
    positionData: Array<{ symbol: string; price: number; marketValue: number }>
  ): string {
    const { price } = positionData.find((p) => p.symbol === primarySymbol) || {
      price: 0,
    };
    const sharesToBuy = Math.floor(difference / price);
    return `${primarySymbol}: BUY ${sharesToBuy} shares at $${price.toFixed(2)}
    Trying to BUY ${formatCurrency(difference)}
    Target Allocation: ${formatCurrency(desiredValue)}

`;
  }

  function handleSellForCategory(
    category: string,
    primarySymbol: string,
    holdoverSymbols: string[],
    difference: number,
    desiredValue: number,
    positionData: Array<{ symbol: string; price: number; marketValue: number }>
  ): string {
    const sellCandidates = [...holdoverSymbols, primarySymbol];
    let remainingToSell = -difference;
    let sellOutput = "";

    for (const symbol of sellCandidates) {
      const position = positionData.find((p) => p.symbol === symbol);
      if (position && position.marketValue > 0) {
        const sharesToSell = Math.min(
          Math.floor(remainingToSell / position.price),
          Math.floor(position.marketValue / position.price)
        );
        const amountToSell = sharesToSell * position.price;
        sellOutput += `${symbol}: SELL ${sharesToSell} shares at $${position.price.toFixed(
          2
        )}
    Trying to SELL ${formatCurrency(amountToSell)}
    Target Allocation: ${formatCurrency(desiredValue)}

`;
        remainingToSell -= amountToSell;
        if (remainingToSell <= 0) break;
      }
    }

    return (
      sellOutput +
      `WARNING: Selling in ${category} category. Please review lot details before proceeding with the sale.

`
    );
  }

  function getAmountToSell(): number {
    const isSelling = confirm(
      "Would you like to withdraw money from your taxable account?"
    );
    if (!isSelling) return 0;

    const sellInput = prompt("How much would you like to sell?");
    return sellInput ? parseFloat(sellInput) : 0;
  }

  function validatePortfolioAllocation(portfolio: Portfolio): void {
    const totalAllocation = Object.values(portfolio).reduce(
      (sum, { desiredAllocation }) => sum + desiredAllocation,
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

  function calculateCategoryTotals(
    positionData: Array<{ symbol: string; marketValue: number }>
  ) {
    return Object.entries(portfolio).reduce((totals, [category, details]) => {
      const categorySymbols = [
        details.primarySymbol,
        ...details.holdoverSymbols,
      ];
      totals[category] = positionData
        .filter((p) => categorySymbols.includes(p.symbol))
        .reduce((sum, p) => sum + p.marketValue, 0);
      return totals;
    }, {} as Record<string, number>);
  }

  function findHighLevelElements() {
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
})();
