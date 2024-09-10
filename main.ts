import { calculateAssetClassTotals } from "./utils/calculateAssetClassTotals";
import { displayResults } from "./utils/displayResults";
import { getInitialData } from "./utils/getInitialData";
import { generateInstructions } from "./utils/instruction-engine";
import { showNotification } from "./utils/notifications";

const { accountValue, desiredAccountValue, currentHoldings, isWithdrawing } =
  getInitialData();
const assetClassTotals = calculateAssetClassTotals(currentHoldings);
const instructions = generateInstructions(
  accountValue,
  desiredAccountValue,
  currentHoldings,
  assetClassTotals,
  isWithdrawing
);

displayResults(instructions, desiredAccountValue);
showNotification();
