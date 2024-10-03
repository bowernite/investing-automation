import type { AssetClass, AssetClassCategory } from "../utils/portfolio";

interface Holding {
  symbol: string;
  price: number;
  marketValue: number;
}

interface AssetClassAction {
  symbol: string;
  action: "BUY" | "SELL";
  shares: number;
  price: number;
  amount: number;
}

interface AssetClassInstructions {
  category: AssetClassCategory;
  currentAllocation: number;
  desiredAllocation: number;
  allocationDifference: number;
  actions: AssetClassAction[];
  resultingAllocation: number;
}
