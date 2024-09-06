export function getAmountToSell(): number {
  const userInput = prompt(
    "Would you like to withdraw money from your taxable account? (Type 'y' for yes)"
  );
  const isSelling = userInput?.toLowerCase() === "y";
  if (!isSelling) return 0;

  const sellInput = prompt("How much would you like to sell?");
  return sellInput ? parseFloat(sellInput) : 0;
}
