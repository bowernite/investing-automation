import { getAmountToSell } from "./getAmountToSell";
import { validatePortfolioAllocation, PORTFOLIO } from "./portfolio";
import {
  findHighLevelElements,
  parseCellCash,
  getPositionData,
} from "./selectors";

export function getInitialData() {
  const amountToSell = getAmountToSell();
  const isWithdrawing = amountToSell > 0;

  validatePortfolioAllocation(PORTFOLIO);

  const { accountValueElement, positionRows } = findHighLevelElements();
  const accountValue = parseCellCash(accountValueElement);
  const desiredAccountValue = accountValue - amountToSell;
  const currentHoldings = Array.from(positionRows).map(getPositionData);

  return { accountValue, desiredAccountValue, currentHoldings, isWithdrawing };
}
