import { calculateAssetClassTotals } from "./utils/calculateAssetClassTotals";
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

  async function main() {
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
    const assetClassTotals = calculateAssetClassTotals(positionData);

    let outputString = "🎯 Desired Portfolio Allocation:\n\n";
    Object.entries(PORTFOLIO).forEach(([category, details]) => {
      outputString += `${category}: ${(details.desiredAllocation * 100).toFixed(
        2
      )}% (${details.primarySymbol})\n`;
    });
    outputString += "\n";
    let allocationWarning = "📊 Portfolio Allocation Summary:\n\n";

    const sortedEntries = Object.entries(PORTFOLIO).sort(([, a], [, b]) =>
      a.primarySymbol.localeCompare(b.primarySymbol)
    );

    sortedEntries.forEach(([category, details]) => {
      const { primarySymbol, holdoverSymbols } = details;
      const currentValue = assetClassTotals[category] || 0;
      const desiredValue = details.desiredAllocation * desiredAccountValue;
      const difference = desiredValue - currentValue;

      const currentAllocation = currentValue / accountValue;
      const desiredAllocation = details.desiredAllocation;
      const allocationDifference = desiredAllocation - currentAllocation;

      const emoji = allocationDifference > 0 ? "🔼" : "🔽";
      allocationWarning += `${emoji} ${category}:\n`;
      allocationWarning += `   Current: ${(currentAllocation * 100).toFixed(
        2
      )}%\n`;
      allocationWarning += `   Desired: ${(desiredAllocation * 100).toFixed(
        2
      )}%\n`;
      allocationWarning += `   Difference: ${
        allocationDifference > 0 ? "+" : ""
      }${(allocationDifference * 100).toFixed(2)}%\n\n`;

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
        "ℹ️ No sells suggested as you're not withdrawing.\n\n" + outputString;
    }

    allocationWarning =
      "\n⚠️ Warning: Portfolio allocation after following instructions:\n" +
      allocationWarning;

    console.log(outputString);
    console.warn(allocationWarning);

    if (Notification.permission === "granted") {
      new Notification("Portfolio Rebalancing", {
        body: "Rebalancing instructions generated successfully.",
        icon: "path/to/icon.png", // Replace with actual path if you have an icon
      });
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          new Notification("Portfolio Rebalancing", {
            body: "Rebalancing instructions generated successfully.",
            icon: "path/to/icon.png", // Replace with actual path if you have an icon
          });
        }
      });
    }
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
    return `🟢 ${primarySymbol}: BUY ${sharesToBuy} shares at $${price.toFixed(
      2
    )}
    💰 Trying to BUY ${formatCurrency(difference)}
    🎯 Target Allocation: ${formatCurrency(desiredValue)}}%)

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
        sellOutput += `🔴 ${symbol}: SELL ${sharesToSell} shares at $${position.price.toFixed(
          2
        )}
    💰 Trying to SELL ${formatCurrency(amountToSell)}
    🎯 Target Allocation: ${formatCurrency(desiredValue)}

`;
        remainingToSell -= amountToSell;
        if (remainingToSell <= 0) break;
      }
    }

    return (
      sellOutput +
      `⚠️ WARNING: Selling in ${category} category. Please review lot details before proceeding with the sale.

`
    );
  }
})();
