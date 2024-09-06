// (updated 6/27/24, based on an average of GPT responses 🤷‍♂️ it really differs)
export interface PortfolioCategory {
  desiredAllocation: number;
  primarySymbol: string;
  holdoverSymbols: string[];
}

export interface Portfolio {
  [category: string]: PortfolioCategory;
}

export const PORTFOLIO: Portfolio = {
  US_STOCKS: {
    desiredAllocation: 0.58,
    primarySymbol: "VTI",
    holdoverSymbols: ["VV", "SCHA"],
  },
  INTL_STOCKS: {
    desiredAllocation: 0.25,
    primarySymbol: "IXUS",
    holdoverSymbols: ["SPDW"],
  },
  REAL_ESTATE: {
    desiredAllocation: 0.08,
    primarySymbol: "VNQ",
    holdoverSymbols: [],
  },
  US_BONDS: {
    desiredAllocation: 0.07,
    primarySymbol: "BND",
    holdoverSymbols: [],
  },
  INTL_BONDS: {
    desiredAllocation: 0.02,
    primarySymbol: "BNDX",
    holdoverSymbols: [],
  },
};

const ALLOCATION_TOLERANCE = 0.0001;
export function validatePortfolioAllocation(portfolio: Portfolio): void {
  const totalAllocation = Object.values(portfolio).reduce(
    (sum, { desiredAllocation }) => sum + desiredAllocation,
    0
  );
  if (Math.abs(totalAllocation - 1) > ALLOCATION_TOLERANCE) {
    throw new Error("Portfolio allocation does not sum to 1");
  }
}
