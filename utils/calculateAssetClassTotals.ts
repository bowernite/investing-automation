import { PORTFOLIO } from "./portfolio";

export function calculateAssetClassTotals(
  positionData: Array<{ symbol: string; marketValue: number }>
) {
  return Object.entries(PORTFOLIO).reduce((totals, [category, details]) => {
    const categorySymbols = [details.primarySymbol, ...details.holdoverSymbols];
    totals[category] = positionData
      .filter((p) => categorySymbols.includes(p.symbol))
      .reduce((sum, p) => sum + p.marketValue, 0);
    return totals;
  }, {} as Record<string, number>);
}
