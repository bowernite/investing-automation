export function calculateResultingValue(
  currentValue: number,
  actions: AssetClassAction[]
): number {
  return (
    currentValue +
    actions.reduce((sum, action) => {
      return sum + (action.action === "BUY" ? action.amount : -action.amount);
    }, 0)
  );
}
