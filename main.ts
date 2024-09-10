import { calculateAssetClassTotals } from "./utils/calculateAssetClassTotals";
import { calculateResultingValue } from "./utils/calculateResultingValue";
import { formatCurrency } from "./utils/formatCurrency";
import { getInitialData } from "./utils/getInitialData";
import { showNotification } from "./utils/notifications";
import { PORTFOLIO, type AssetClass } from "./utils/portfolio";
import { isTaxableAccount } from "./utils/selectors";

function main() {
  const { accountValue, desiredAccountValue, currentHoldings, isWithdrawing } =
    getInitialData();
  const assetClassTotals = calculateAssetClassTotals(currentHoldings);
  const instructions = generateInstructions(
    accountValue,
    desiredAccountValue,
    currentHoldings,
    assetClassTotals,
    isWithdrawing
  );

  displayResults(instructions, desiredAccountValue);
  showNotification();
}

function generateInstructions(
  accountValue: number,
  desiredAccountValue: number,
  currentHoldings: Holding[],
  assetClassTotals: Record<string, number>,
  isWithdrawing: boolean
): AssetClassInstructions[] {
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
      currentHoldings,
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

function generateAssetClassActions(
  details: AssetClass,
  difference: number,
  currentHoldings: Holding[],
  isWithdrawing: boolean,
  isTaxableAccount: boolean
): AssetClassAction[] {
  if (difference >= 0) {
    return generateBuyAction(details, difference, currentHoldings);
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
    currentHoldings,
    isTaxableAccount
  );
}

function generateBuyAction(
  details: AssetClass,
  amount: number,
  currentHoldings: Holding[]
): AssetClassAction[] {
  const { price = 0 } =
    currentHoldings.find((p) => p.symbol === details.primarySymbol) || {};
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
  currentHoldings: Holding[],
  isTaxableAccount: boolean
): AssetClassAction[] {
  if (isTaxableAccount && details.holdoverSymbols.length) {
    console.warn(
      "👷🏼 Suggesting a sell in a taxable account with holdover positions. Consider tax implications."
    );
  }

  const sellCandidates = isTaxableAccount
    ? [...details.holdoverSymbols, details.primarySymbol]
    : [details.primarySymbol];

  const actions: AssetClassAction[] = [];
  let remainingToSell = amountToSell;

  for (const symbol of sellCandidates) {
    const position = currentHoldings.find((p) => p.symbol === symbol);
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
  instructions: AssetClassInstructions[],
  desiredAccountValue: number
) {
  console.log("🎯 Portfolio Allocation and Actions:");
  const instructionsTable = instructions
    .flatMap((summary) => createInstructionRows(summary, desiredAccountValue))
    .sort((a, b) => a.Symbol.localeCompare(b.Symbol));
  console.table(
    instructionsTable.reduce((acc, row) => {
      acc[row.Category] = { ...row };
      delete acc[row.Category].Category;
      return acc;
    }, {})
  );
}

function createInstructionRows(
  summary: AssetClassInstructions,
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

function createBaseRow(summary: AssetClassInstructions) {
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
  action: AssetClassAction,
  desiredAllocation: number,
  desiredAccountValue: number
) {
  return {
    Symbol: action.symbol,
    Action: `${action.action === "BUY" ? "🟢" : "🔴"} ${action.action}`,
    Shares: Number(action.shares.toFixed(2)),
    // Price: `$${action.price.toFixed(2)}`,
    Amount: formatCurrency(action.amount),
    // "Target Allocation": formatCurrency(
    //   desiredAllocation * desiredAccountValue
    // ),
    ...baseRow,
  };
}

main();
