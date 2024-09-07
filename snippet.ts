import { calculateAssetClassTotals } from "./utils/calculateAssetClassTotals";
import { formatCurrency } from "./utils/formatCurrency";
import { getAmountToSell } from "./utils/getAmountToSell";
import {
  validatePortfolioAllocation,
  PORTFOLIO,
  type Portfolio,
} from "./utils/portfolio";
import {
  findHighLevelElements,
  getPositionData,
  parseCellCash,
} from "./utils/selectors";

interface PositionData {
  symbol: string;
  price: number;
  marketValue: number;
}

interface CategoryAction {
  symbol: string;
  action: "BUY" | "SELL";
  shares: number;
  price: number;
  amount: number;
}

interface CategorySummary {
  category: string;
  currentAllocation: number;
  desiredAllocation: number;
  allocationDifference: number;
  actions: CategoryAction[];
}

function main() {
  const amountToSell = getAmountToSell();
  const isWithdrawing = amountToSell > 0;

  validatePortfolioAllocation(PORTFOLIO);

  const { accountValueElement, positionRows } = findHighLevelElements();
  const accountValue = parseCellCash(accountValueElement);
  const desiredAccountValue = accountValue - amountToSell;

  const positionData = Array.from(positionRows).map(getPositionData);
  const assetClassTotals = calculateAssetClassTotals(positionData);

  const categorySummaries = generateCategorySummaries(
    PORTFOLIO,
    assetClassTotals,
    accountValue,
    desiredAccountValue,
    positionData,
    isWithdrawing
  );

  displayResults(categorySummaries, isWithdrawing);
  showNotification();
}

function generateCategorySummaries(
  portfolio: Portfolio,
  assetClassTotals: Record<string, number>,
  accountValue: number,
  desiredAccountValue: number,
  positionData: PositionData[],
  isWithdrawing: boolean
): CategorySummary[] {
  return Object.entries(portfolio).map(([category, details]) => {
    const currentValue = assetClassTotals[category] || 0;
    const desiredValue = details.desiredAllocation * desiredAccountValue;
    const difference = desiredValue - currentValue;

    const currentAllocation = currentValue / accountValue;
    const desiredAllocation = details.desiredAllocation;
    const allocationDifference = desiredAllocation - currentAllocation;

    const actions = generateCategoryActions(
      details,
      difference,
      positionData,
      isWithdrawing
    );

    return {
      category,
      currentAllocation,
      desiredAllocation,
      allocationDifference,
      actions,
    };
  });
}

function generateCategoryActions(
  details: Portfolio[keyof Portfolio],
  difference: number,
  positionData: PositionData[],
  isWithdrawing: boolean
): CategoryAction[] {
  const actions: CategoryAction[] = [];

  if (difference >= 0) {
    const { price } = positionData.find(
      (p) => p.symbol === details.primarySymbol
    ) || { price: 0 };
    const sharesToBuy = Math.floor(difference / price);
    actions.push({
      symbol: details.primarySymbol,
      action: "BUY",
      shares: sharesToBuy,
      price,
      amount: sharesToBuy * price,
    });
  } else if (isWithdrawing) {
    const sellCandidates = [...details.holdoverSymbols, details.primarySymbol];
    let remainingToSell = -difference;

    for (const symbol of sellCandidates) {
      const position = positionData.find((p) => p.symbol === symbol);
      if (position && position.marketValue > 0) {
        const sharesToSell = Math.min(
          Math.floor(remainingToSell / position.price),
          Math.floor(position.marketValue / position.price)
        );
        const amountToSell = sharesToSell * position.price;
        actions.push({
          symbol,
          action: "SELL",
          shares: sharesToSell,
          price: position.price,
          amount: amountToSell,
        });
        remainingToSell -= amountToSell;
        if (remainingToSell <= 0) break;
      }
    }
  }

  return actions;
}

function displayResults(
  categorySummaries: CategorySummary[],
  isWithdrawing: boolean
) {
  let outputString = "🎯 Desired Portfolio Allocation:\n\n";
  let allocationWarning = "📊 Portfolio Allocation Summary:\n\n";

  categorySummaries.forEach(
    ({
      category,
      currentAllocation,
      desiredAllocation,
      allocationDifference,
      actions,
    }) => {
      outputString += `${category}: ${(desiredAllocation * 100).toFixed(2)}% (${
        PORTFOLIO[category].primarySymbol
      })\n`;

      const emoji = allocationDifference > 0 ? "🔼" : "🔽";
      allocationWarning += `${emoji} ${category}:
   Current: ${(currentAllocation * 100).toFixed(2)}%
   Desired: ${(desiredAllocation * 100).toFixed(2)}%
   Difference: ${allocationDifference > 0 ? "+" : ""}${(
        allocationDifference * 100
      ).toFixed(2)}%

`;

      actions.forEach(({ symbol, action, shares, price, amount }) => {
        const color = action === "BUY" ? "🟢" : "🔴";
        outputString += `${color} ${symbol}: ${action} ${shares} shares at $${price.toFixed(
          2
        )}
    💰 Trying to ${action} ${formatCurrency(amount)}
    🎯 Target Allocation: ${formatCurrency(desiredAllocation)}

`;
      });

      if (actions.some(({ action }) => action === "SELL")) {
        outputString += `⚠️ WARNING: Selling in ${category} category. Please review lot details before proceeding with the sale.\n\n`;
      }
    }
  );

  if (!isWithdrawing) {
    outputString =
      "ℹ️ No sells suggested as you're not withdrawing.\n\n" + outputString;
  }

  allocationWarning =
    "\n⚠️ Warning: Portfolio allocation after following instructions:\n" +
    allocationWarning;

  console.log(outputString);
  console.warn(allocationWarning);
}

function showNotification() {
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

main();
