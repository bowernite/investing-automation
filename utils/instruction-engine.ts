import type {
  AssetClassAction,
  AssetClassInstructions,
  Holding,
} from "../types/types";
import { calculateResultingValue } from "./calculateResultingValue";
import {
  PORTFOLIO,
  type AssetClass,
  type AssetClassCategory,
} from "./portfolio";
import { isTaxableAccount } from "./selectors";

export function generateInstructions(
  accountValue: number,
  desiredAccountValue: number,
  currentHoldings: Holding[],
  assetClassTotals: Record<string, number>,
  isWithdrawing: boolean
): AssetClassInstructions[] {
  return Object.entries(PORTFOLIO).map(
    ([category, details]): AssetClassInstructions => {
      const assetClassCategory = category as AssetClassCategory;
      const currentValue = assetClassTotals[assetClassCategory] || 0;
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
        category: assetClassCategory,
        currentAllocation,
        desiredAllocation,
        allocationDifference,
        actions,
        resultingAllocation,
      };
    }
  );
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
  const sellCandidates = isTaxableAccount
    ? [...details.holdoverSymbols, details.primarySymbol]
    : [details.primarySymbol];

  if (isTaxableAccount && details.holdoverSymbols.length) {
    console.warn(
      "👷🏼 Suggesting a sell in a taxable account with holdover positions. Consider tax implications."
    );
  }

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
