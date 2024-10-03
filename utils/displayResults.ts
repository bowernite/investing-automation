import type { AssetClassInstructions, AssetClassAction } from "../types/types";
import { formatCurrency } from "./formatCurrency";
import { PORTFOLIO, type AssetClass } from "./portfolio";

export function displayResults(
  instructions: AssetClassInstructions[],
  desiredAccountValue: number
) {
  console.log("🎯 Portfolio Allocation and Actions:");
  const instructionsTable = instructions
    .flatMap((summary) => createInstructionRows(summary, desiredAccountValue))
    .sort((a, b) => a.Symbol.localeCompare(b.Symbol));
  console.table(
    instructionsTable.reduce<
      Record<string, Omit<(typeof instructionsTable)[number], "Category">>
    >((acc, row) => {
      const { Category, ...rowWithoutCategory } = row;
      acc[Category] = rowWithoutCategory;
      return acc;
    }, {})
  );
}

function createInstructionRows(
  instructions: AssetClassInstructions,
  desiredAccountValue: number
) {
  const baseRow = createBaseRow(instructions);

  if (instructions.actions.length === 0) {
    return [{ ...baseRow, Action: "✋ No action", Symbol: "(n/a)" }];
  }

  return instructions.actions.map((action) =>
    createActionRow(
      baseRow,
      action,
      instructions.desiredAllocation,
      desiredAccountValue
    )
  );
}

function createBaseRow(instructions: AssetClassInstructions) {
  const assetClass = PORTFOLIO[instructions.category];
  return {
    Category: instructions.category,
    Holdings: `${assetClass.primarySymbol}${
      assetClass.holdoverSymbols.length
        ? ` (${assetClass.holdoverSymbols.join(", ")})`
        : ""
    }`,
    // "Primary Symbol": PORTFOLIO[summary.category].primarySymbol,
    "Current %": Number((instructions.currentAllocation * 100).toFixed(2)),
    "Desired %": Number((instructions.desiredAllocation * 100).toFixed(2)),
    "Resulting %": Number((instructions.resultingAllocation * 100).toFixed(2)),
    // "Allocation Difference": `${(
    //   (summary.resultingAllocation - summary.currentAllocation) *
    //   100
    // ).toFixed(2)}%`,
  };
}

function createActionRow(
  baseRow: ReturnType<typeof createBaseRow>,
  action: AssetClassAction,
  desiredAllocation: number,
  desiredAccountValue: number
) {
  return {
    Symbol: `${action.symbol}`,
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
