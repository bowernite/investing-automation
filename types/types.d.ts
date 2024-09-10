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
  category: string;
  currentAllocation: number;
  desiredAllocation: number;
  allocationDifference: number;
  actions: AssetClassAction[];
  resultingAllocation: number;
}
