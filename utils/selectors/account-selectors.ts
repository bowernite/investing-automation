import {
  validateAccountValue,
  validateCashAvailable,
  parseCurrencyText,
} from "../financial-data-validation";
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

  const accountValueLabel = getElement("span[id$='-accounts-value-label']");
  const accountValueElement = accountValueLabel
    ? accountValueLabel
        .closest(".sdps-display-value")
        ?.querySelector(".sdps-display-value__value")
    : getElement(".sdps-display-value__value.sdps-title-3") ||
      getElement(".sdps-display-value__value:first-of-type");

  const cashAvailableElement = findCashAvailableElement();

  const positionRows = Array.from(
    table.querySelectorAll<HTMLElement>(".position-row, tr[appholdingsrow]")
  ).filter((row) => !row.textContent?.includes("Cash"));

  if (positionRows.length === 0) throw new Error("No position rows found");

  let accountValue: number;
  let cashAvailable: number;

  if (!accountValueElement) {
    console.warn("Account value element not found, prompting user");
    accountValue = promptUserForCurrencyValue("Total Account Value");
  } else {
    const accountValueText = accountValueElement.textContent?.trim() || "";
    try {
      accountValue = validateAccountValue(accountValueText);
    } catch (error) {
      console.warn(`Failed to parse account value: ${error}`, "Prompting user");
      accountValue = promptUserForCurrencyValue("Total Account Value");
    }
  }

  if (!cashAvailableElement) {
    console.warn("Cash available element not found, prompting user");
    cashAvailable = promptUserForCurrencyValue(
      "Total Cash & Cash Investments",
      accountValue
    );
  } else {
    const cashAvailableText = cashAvailableElement.textContent?.trim() || "";
    try {
      cashAvailable = validateCashAvailable(cashAvailableText, accountValue);
    } catch (error) {
      console.warn(
        `Failed to parse cash available: ${error}`,
        "Prompting user"
      );
      cashAvailable = promptUserForCurrencyValue(
        "Total Cash & Cash Investments",
        accountValue
      );
    }
  }

  return {
    table,
    accountValueElement,
    cashAvailableElement,
    positionRows,
    accountValue,
    cashAvailable,
  };
}

/**
 * Determine if the current account is a taxable account
 */
export function isTaxableAccount() {
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

/**
 * Find the cash available element using multiple fallback strategies
 */
function findCashAvailableElement(): HTMLElement | null {
  let cashLabel =
    getElement("span[id*='total-cash-and-investments-label']") ||
    getElement("span[id*='total-cash']");

  if (!cashLabel) {
    cashLabel =
      Array.from(document.querySelectorAll("span")).find((span) => {
        const text = span.textContent?.toLowerCase() || "";
        return (
          text.includes("total cash & cash invest") ||
          text.includes("total cash &") ||
          text.includes("cash invest")
        );
      }) || null;
  }

  if (!cashLabel) {
    const summarySection =
      getElement("sdps-summary-total") ||
      getElement("[sdps-id='positions-account-summary']");
    if (summarySection) {
      cashLabel =
        Array.from(summarySection.querySelectorAll("span")).find((span) => {
          const text = span.textContent?.toLowerCase() || "";
          return text.includes("cash") && text.includes("invest");
        }) || null;
    }
  }

  const cashAvailableElement = cashLabel
    ? cashLabel
        .closest(".sdps-display-value")
        ?.querySelector(
          ".sdps-display-value__value sdps-number, .sdps-display-value__value"
        )
    : getElement(".sdps-display-value__value:nth-of-type(2)");

  return cashAvailableElement as HTMLElement | null;
}

/**
 * Prompt the user to manually enter a currency value when it cannot be found automatically
 */
function promptUserForCurrencyValue(
  valueName: string,
  maxValue?: number
): number {
  while (true) {
    const userInput = prompt(
      `Could not automatically detect "${valueName}".\n\nPlease enter the value (e.g., 9036.01 or $9,036.01):`
    );

    if (userInput === null) {
      throw new Error(`User cancelled input for ${valueName}`);
    }

    try {
      const value = parseCurrencyText(userInput);

      if (isNaN(value) || value < 0) {
        alert(`Invalid value. Please enter a positive number.`);
        continue;
      }

      if (maxValue !== undefined && value > maxValue) {
        alert(
          `Value cannot exceed ${maxValue.toLocaleString("en-US", {
            style: "currency",
            currency: "USD",
          })}`
        );
        continue;
      }

      return value;
    } catch (error) {
      alert(
        `Invalid format. Please enter a number (e.g., 9036.01 or $9,036.01)`
      );
    }
  }
}
