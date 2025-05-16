import { validateAccountValue, validateCashAvailable } from "../financial-data-validation";
import { getElement } from "./element-utils";

/**
 * Functions for extracting account-level data from the page
 */

/**
 * Find high-level elements on the page (account value, cash available, position rows)
 */
export function findHighLevelElements() {
  const table =
    getElement<HTMLTableElement>("table") ||
    getElement<HTMLTableElement>(".sdps-table");
  if (!table) throw new Error("Table not found");

  // Account value - first look for the element with "Total Accounts Value" label
  const accountValueLabel = getElement("span[id$='-accounts-value-label']");
  const accountValueElement = accountValueLabel
    ? accountValueLabel
        .closest(".sdps-display-value")
        ?.querySelector(".sdps-display-value__value")
    : getElement(".sdps-display-value__value.sdps-title-3") ||
      getElement(".sdps-display-value__value:first-of-type");

  // Cash available - look for the element with "Total Cash & Cash Invest" label
  const cashLabel = Array.from(document.querySelectorAll("span")).find((span) =>
    span.textContent?.includes("Total Cash & Cash Invest")
  );
  const cashAvailableElement = cashLabel
    ? cashLabel
        .closest(".sdps-display-value")
        ?.querySelector(".sdps-display-value__value")
    : getElement(".sdps-display-value__value:nth-of-type(2)");

  const positionRows = Array.from(
    table.querySelectorAll<HTMLElement>(".position-row, tr[appholdingsrow]")
  ).filter((row) => !row.textContent?.includes("Cash"));
  
  if (!accountValueElement) throw new Error("Account value element not found");
  if (!cashAvailableElement)
    throw new Error("Cash available element not found");
  if (positionRows.length === 0) throw new Error("No position rows found");

  // Parse and validate account data
  const accountValueText = accountValueElement?.textContent?.trim() || "";
  const cashAvailableText = cashAvailableElement?.textContent?.trim() || "";

  const accountValue = validateAccountValue(accountValueText);
  validateCashAvailable(cashAvailableText, accountValue);

  return { table, accountValueElement, cashAvailableElement, positionRows };
}

/**
 * Determine if the current account is a taxable account
 */
export function isTaxableAccount() {
  // Check for elements that indicate a taxable account
  const taxableIndicators = [
    getElement<HTMLElement>("#account-selector-label"),
    getElement<HTMLElement>("#account-selector"),
  ];

  for (const indicator of taxableIndicators) {
    if (indicator && indicator.textContent) {
      const accountTypeText = indicator.textContent.toLowerCase();
      if (accountTypeText.includes("taxable account")) {
        return true;
      }
    }
  }
  return false;
} 