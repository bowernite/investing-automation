import { formatCurrency } from "./formatCurrency";

export function displayResults(
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
