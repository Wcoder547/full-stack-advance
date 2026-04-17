export function fetchData(userId) {
  return {
    id: userId,
    name: "John Doe",
    roles: ["admin", "user"],
    lastLogin: new Date("2024-01-01T10:00:00Z").toISOString(),
    prefrences: {
      theme: "dark",
      notifications: true,
    },
  };
}

export function processOrder(data, dependencies = { processPayment }) {
  
  const amount = data.amount;
  const paymentResult = dependencies.processPayment(amount);
  return paymentResult;
}

function processPayment(amount) {
  console.log("I AM ORIGINAL FUNCTION");
  return { id: 123, amount: amount };
}

export function greet(word) {
  return `Hello, ${word}!`;
}
