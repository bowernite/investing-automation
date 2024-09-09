import { calculateAssetClassTotals } from "./utils/calculateAssetClassTotals";
import { formatCurrency } from "./utils/formatCurrency";
import { getAmountToSell } from "./utils/getAmountToSell";
import {
  validatePortfolioAllocation,
  PORTFOLIO,
  type Portfolio,
  type AssetClass,
} from "./utils/portfolio";
import {
  findHighLevelElements,
  getPositionData,
  parseCellCash,
  isTaxableAccount,
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
  resultingAllocation: number;
}

function main() {
  const { accountValue, desiredAccountValue, positionData, isWithdrawing } =
    getInitialData();
  const assetClassTotals = calculateAssetClassTotals(positionData);
  const instructions = generateInstructions(
    accountValue,
    desiredAccountValue,
    positionData,
    assetClassTotals,
    isWithdrawing
  );

  displayResults(instructions, desiredAccountValue);
  showNotification();
}

function getInitialData() {
  const amountToSell = getAmountToSell();
  const isWithdrawing = amountToSell > 0;

  validatePortfolioAllocation(PORTFOLIO);

  const { accountValueElement, positionRows } = findHighLevelElements();
  const accountValue = parseCellCash(accountValueElement);
  const desiredAccountValue = accountValue - amountToSell;
  const positionData = Array.from(positionRows).map(getPositionData);

  return { accountValue, desiredAccountValue, positionData, isWithdrawing };
}

function generateInstructions(
  accountValue: number,
  desiredAccountValue: number,
  positionData: PositionData[],
  assetClassTotals: Record<string, number>,
  isWithdrawing: boolean
): CategorySummary[] {
  return Object.entries(PORTFOLIO).map(([category, details]) => {
    const currentValue = assetClassTotals[category] || 0;
    const desiredValue = details.desiredAllocation * desiredAccountValue;
    const difference = desiredValue - currentValue;

    const currentAllocation = currentValue / accountValue;
    const desiredAllocation = details.desiredAllocation;
    const allocationDifference = desiredAllocation - currentAllocation;

    const actions = generateAssetClassActions(
      details,
      difference,
      positionData,
      isWithdrawing,
      isTaxableAccount()
    );

    const resultingValue = calculateResultingValue(currentValue, actions);
    const resultingAllocation = resultingValue / desiredAccountValue;

    return {
      category,
      currentAllocation,
      desiredAllocation,
      allocationDifference,
      actions,
      resultingAllocation,
    };
  });
}

function calculateResultingValue(
  currentValue: number,
  actions: CategoryAction[]
): number {
  return (
    currentValue +
    actions.reduce((sum, action) => {
      return sum + (action.action === "BUY" ? action.amount : -action.amount);
    }, 0)
  );
}

function generateAssetClassActions(
  details: AssetClass,
  difference: number,
  positionData: PositionData[],
  isWithdrawing: boolean,
  isTaxableAccount: boolean
): CategoryAction[] {
  if (difference >= 0) {
    return generateBuyAction(details, difference, positionData);
  }

  if (isTaxableAccount && !isWithdrawing) {
    console.warn(
      `👷🏼 Ignoring taxable account sells for "${details.class}" (${
        details.primarySymbol
      }, ${details.holdoverSymbols.join(", ")})`
    );
    return [];
  }

  return generateSellActions(
    details,
    -difference,
    positionData,
    isTaxableAccount
  );
}

function generateBuyAction(
  details: AssetClass,
  amount: number,
  positionData: PositionData[]
): CategoryAction[] {
  const { price = 0 } =
    positionData.find((p) => p.symbol === details.primarySymbol) || {};
  const sharesToBuy = amount / price;
  return [
    {
      symbol: details.primarySymbol,
      action: "BUY",
      shares: sharesToBuy,
      price,
      amount: sharesToBuy * price,
    },
  ];
}

function generateSellActions(
  details: AssetClass,
  amountToSell: number,
  positionData: PositionData[],
  isTaxableAccount: boolean
): CategoryAction[] {
  if (isTaxableAccount && details.holdoverSymbols.length) {
    console.warn(
      "👷🏼 Suggesting a sell in a taxable account with holdover positions. Consider tax implications."
    );
  }

  const sellCandidates = isTaxableAccount
    ? [...details.holdoverSymbols, details.primarySymbol]
    : [details.primarySymbol];

  const actions: CategoryAction[] = [];
  let remainingToSell = amountToSell;

  for (const symbol of sellCandidates) {
    const position = positionData.find((p) => p.symbol === symbol);
    if (!position || position.marketValue <= 0) continue;

    const sharesToSell = Math.min(
      remainingToSell / position.price,
      position.marketValue / position.price
    );
    const amountToSellForSymbol = sharesToSell * position.price;

    actions.push({
      symbol,
      action: "SELL",
      shares: sharesToSell,
      price: position.price,
      amount: amountToSellForSymbol,
    });

    remainingToSell -= amountToSellForSymbol;
    if (remainingToSell <= 0) break;
  }

  return actions;
}

function displayResults(
  instructions: CategorySummary[],
  desiredAccountValue: number
) {
  console.log("🎯 Portfolio Allocation and Actions:");
  const instructionsTable = instructions.flatMap((summary) =>
    createInstructionRows(summary, desiredAccountValue)
  );
  console.table(
    instructionsTable.reduce((acc, row) => {
      acc[row.Category] = { ...row };
      delete acc[row.Category].Category;
      return acc;
    }, {})
  );
}

function createInstructionRows(
  summary: CategorySummary,
  desiredAccountValue: number
) {
  const baseRow = createBaseRow(summary);

  if (summary.actions.length === 0) {
    return [{ ...baseRow, Action: "✋ No action" }];
  }

  return summary.actions.map((action) =>
    createActionRow(
      baseRow,
      action,
      summary.desiredAllocation,
      desiredAccountValue
    )
  );
}

function createBaseRow(summary: CategorySummary) {
  return {
    Category: summary.category,
    // "Primary Symbol": PORTFOLIO[summary.category].primarySymbol,
    "Current %": Number(summary.currentAllocation.toFixed(2)),
    "Desired %": Number(summary.desiredAllocation.toFixed(2)),
    "Resulting %": Number(summary.resultingAllocation.toFixed(2)),
    // "Allocation Difference": `${(
    //   (summary.resultingAllocation - summary.currentAllocation) *
    //   100
    // ).toFixed(2)}%`,
  };
}

function createActionRow(
  baseRow: any,
  action: CategoryAction,
  desiredAllocation: number,
  desiredAccountValue: number
) {
  return {
    ...baseRow,
    Symbol: action.symbol,
    Action: `${action.action === "BUY" ? "🟢" : "🔴"} ${action.action}`,
    Shares: Number(action.shares.toFixed(2)),
    // Price: `$${action.price.toFixed(2)}`,
    Amount: formatCurrency(action.amount),
    // "Target Allocation": formatCurrency(
    //   desiredAllocation * desiredAccountValue
    // ),
  };
}

function showNotification() {
  if (Notification.permission === "granted") {
    createNotification();
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        createNotification();
      }
    });
  }
}

function createNotification() {
  new Notification("Portfolio Rebalancing", {
    body: "Rebalancing instructions generated successfully.",
    icon: "path/to/icon.png", // Replace with actual path if you have an icon
  });
}

main();
