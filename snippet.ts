import { formatCurrency } from "./utils/formatCurrency";
import { getAmountToSell } from "./utils/getAmountToSell";
import { validatePortfolioAllocation, PORTFOLIO } from "./utils/portfolio";
import {
  findHighLevelElements,
  getPositionData,
  parseCellCash,
} from "./utils/selectors";

(() => {
  main();

  function main() {
    const amountToSell = getAmountToSell();
    const isWithdrawing = amountToSell > 0;

    validatePortfolioAllocation(PORTFOLIO);

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

    let outputString = "";
    let allocationWarning = "";

    Object.entries(PORTFOLIO).forEach(([category, details]) => {
      const { primarySymbol, holdoverSymbols } = details;
      const currentValue = categoryTotals[category] || 0;
      const desiredValue = details.desiredAllocation * desiredAccountValue;
      const difference = desiredValue - currentValue;

      const currentAllocation = currentValue / accountValue;
      const desiredAllocation = details.desiredAllocation;
      const allocationDifference = desiredAllocation - currentAllocation;

      allocationWarning += `${category}: Current ${(
        currentAllocation * 100
      ).toFixed(2)}% vs Desired ${(desiredAllocation * 100).toFixed(2)}% (${
        allocationDifference > 0 ? "+" : ""
      }${(allocationDifference * 100).toFixed(2)}%)\n`;

      if (difference >= 0) {
        outputString += handleBuyForCategory({
          primarySymbol,
          difference,
          desiredValue,
          positionData,
        });
      } else if (isWithdrawing) {
        outputString += handleSellForCategory({
          category,
          primarySymbol,
          holdoverSymbols,
          difference,
          desiredValue,
          positionData,
        });
      }
    });

    if (!isWithdrawing) {
      outputString =
        "No sells suggested as you're not withdrawing.\n\n" + outputString;
    }

    outputString +=
      "\nWarning: Portfolio allocation after following instructions:\n" +
      allocationWarning;

    alert(outputString);
  }

  function handleBuyForCategory({
    primarySymbol,
    difference,
    desiredValue,
    positionData,
  }: {
    primarySymbol: string;
    difference: number;
    desiredValue: number;
    positionData: Array<{ symbol: string; price: number; marketValue: number }>;
  }): string {
    const { price } = positionData.find((p) => p.symbol === primarySymbol) || {
      price: 0,
    };
    const sharesToBuy = Math.floor(difference / price);
    return `${primarySymbol}: BUY ${sharesToBuy} shares at $${price.toFixed(2)}
    Trying to BUY ${formatCurrency(difference)}
    Target Allocation: ${formatCurrency(desiredValue)}

`;
  }

  function handleSellForCategory({
    category,
    primarySymbol,
    holdoverSymbols,
    difference,
    desiredValue,
    positionData,
  }: {
    category: string;
    primarySymbol: string;
    holdoverSymbols: string[];
    difference: number;
    desiredValue: number;
    positionData: Array<{ symbol: string; price: number; marketValue: number }>;
  }): string {
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

  function calculateCategoryTotals(
    positionData: Array<{ symbol: string; marketValue: number }>
  ) {
    return Object.entries(PORTFOLIO).reduce((totals, [category, details]) => {
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
})();
