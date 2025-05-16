import { getAmountToSell } from "./getAmountToSell";
import { validatePortfolioAllocation, PORTFOLIO } from "./portfolio";
import { findHighLevelElements } from "./selectors/account-selectors";
import { parseCellCash } from "./selectors/element-utils";
import { getPositionData } from "./selectors/position-selectors";

export function getInitialData() {
  const amountToSell = getAmountToSell();
  const isWithdrawing = amountToSell > 0;

  validatePortfolioAllocation(PORTFOLIO);

  const { accountValueElement, positionRows } = findHighLevelElements();
  const accountValue = parseCellCash(accountValueElement as HTMLElement);
  const desiredAccountValue = accountValue - amountToSell;
  const currentHoldings = Array.from(positionRows).map(getPositionData);

  return { accountValue, desiredAccountValue, currentHoldings, isWithdrawing };
}
