export function showNotification() {
  if (Notification.permission === "granted") {
    createNotification();
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        createNotification();
      }
    });
  }
}

export function createNotification() {
  new Notification("Portfolio Rebalancing", {
    body: "Rebalancing instructions generated successfully.",
    icon: "path/to/icon.png", // Replace with actual path if you have an icon
  });
}
