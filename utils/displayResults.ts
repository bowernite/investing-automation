import type { AssetClassInstructions, AssetClassAction } from "../types/types";
import { formatCurrency } from "./formatCurrency";
import { PORTFOLIO } from "./portfolio";

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
    return [
      {
        // NOTE: Don't just spread baseRow -- we need to specify every property explicitly to ensure the table columns are logged in the correct order
        Symbol: "(n/a)",
        Action: "✋ No action",
        Shares: 0,
        Amount: "$0.00",
        Holdings: baseRow.Holdings,
        "Current %": baseRow["Current %"],
        "Desired %": baseRow["Desired %"],
        "Resulting %": baseRow["Resulting %"],
        Category: baseRow.Category,
      },
    ];
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
  _desiredAllocation: number,
  _desiredAccountValue: number
) {
  return {
    // NOTE: Don't just spread baseRow -- we need to specify every property explicitly to ensure the table columns are logged in the correct order
    Symbol: `${action.symbol}`,
    Action: `${action.action === "BUY" ? "🟢" : "🔴"} ${action.action}`,
    Shares: Number(action.shares.toFixed(2)),
    Amount: formatCurrency(action.amount),
    Holdings: baseRow.Holdings,
    "Current %": baseRow["Current %"],
    "Desired %": baseRow["Desired %"],
    "Resulting %": baseRow["Resulting %"],
    Category: baseRow.Category,
  };
}
