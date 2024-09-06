(() => {
  // (updated 6/27/24, based on an average of GPT responses 🤷‍♂️ it really differs)
  const portfolio = {
    // US Stocks
    VTI: 0.58, // curr taxable: (Primary: VTI. Holdovers: VV, SCHA)
    // Int'l stocks
    IXUS: 0.25, // curr taxable: (Primary: IXUS. Holdover: SPDW)
    // US bonds
    BND: 0.07,
    // Int'l bonds
    BNDX: 0.02, // alt: IAGG (iShares)
    // Real estate
    VNQ: 0.08,
  };

  const isSelling = confirm(
    "Would you like to withdraw money from your taxable account?"
  );
  let amountToSell = 0;

  if (isSelling) {
    const sellInput = prompt("How much would you like to sell?");
    amountToSell = sellInput ? parseFloat(sellInput) : 0;
  }

  console.log("Amount to sell:", amountToSell);

  const totalAllocation = Object.values(portfolio).reduce(
    (sum, value) => sum + value,
    0
  );
  console.log("Total allocation:", totalAllocation);

  if (Math.abs(totalAllocation - 1) > 0.0001) {
    throw new Error("Portfolio allocation does not sum to 1");
  }

  const table = document.querySelector("table");
  if (!table) throw new Error("Table not found");

  const accountValueEl = document.querySelector<HTMLElement>(
    "#accountSummary-Lbl_AccountValue-totalValue"
  );
  if (!accountValueEl) throw new Error("Account value element not found");

  const accountValue = parseCellCash(accountValueEl);
  console.log("Account value:", accountValue);

  const desiredAccountValue = accountValue - amountToSell;
  console.log("Desired account value:", desiredAccountValue);

  const cashAvailableEl = document.querySelector<HTMLElement>(
    "#accountSummary-Lbl_CashSymbol-totalValue"
  );
  if (!cashAvailableEl) throw new Error("Cash available element not found");

  const cashAvailable = parseCellCash(cashAvailableEl);
  console.log("Cash available:", cashAvailable);

  const positionRows = table.querySelectorAll<HTMLElement>(
    '.position-row:not([id^="Cash"])'
  );
  console.log("Position rows:", positionRows);

  let outputString = "";

  positionRows.forEach((row) => {
    const symbolCell = row.querySelector<HTMLElement>(".symbolColumn");
    if (!symbolCell || !symbolCell.textContent)
      throw new Error("Symbol cell not found");
    const symbol = symbolCell.textContent.trim();
    console.log("Symbol:", symbol);

    const priceCell = row.querySelector<HTMLElement>("app-column-price");
    if (!priceCell) throw new Error("Price cell not found");
    const price = parseCellCash(priceCell);
    console.log("Price:", price);

    const marketValueCell = row.querySelector<HTMLElement>(
      "app-column-marketvalue"
    );
    if (!marketValueCell) throw new Error("Market value cell not found");
    const marketValue = parseCellCash(marketValueCell);
    console.log("Market value:", marketValue);

    const desiredAllocation = (portfolio[symbol] || 0) * desiredAccountValue;
    console.log("Desired allocation:", desiredAllocation);

    const difference = desiredAllocation - marketValue;
    console.log("Difference:", difference);

    const action = difference >= 0 ? "BUY" : "SELL";
    const amountToTrade = Math.abs(difference);
    const sharesToTrade = Math.floor(amountToTrade / price);

    outputString += `${symbol}: ${action} ${sharesToTrade} shares at $${price.toFixed(
      2
    )}\n`;
    outputString += `    Trying to ${action} $${formatCurrency(
      amountToTrade
    )}\n`;
    outputString += `    Target Allocation: $${formatCurrency(
      desiredAllocation
    )}\n\n`;
  });

  alert(outputString);

  function parseCellCash(cell: HTMLElement): number {
    cell.querySelector("sup")?.remove();
    const cashText = cell.textContent?.trim() || "0";
    return parseFloat(cashText.replace(/[$,]/g, ""));
  }

  function formatCurrency(amount: number): string {
    return amount.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
})();
