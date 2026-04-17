import { test, describe, mock } from "node:test";
import { processOrder } from "../app.js";
import assert from "node:assert";

describe("order feature", () => {
  test("that it process the order correctly", () => {
    //AAA
    const mockedProcessPayment = mock.fn((amount) => {
      console.log("I AM MOCKED FUNCTION");  
      return { id: 123, amount: amount };
    });

    const data = { amount: 100 };
    const expected = { id: 123, amount: 100 };
    assert.strictEqual(mockedProcessPayment.mock.callCount(), 0);
    const actual = processOrder(data,{ processPayment: mockedProcessPayment });

    assert.deepStrictEqual(actual, expected);

    assert.strictEqual(mockedProcessPayment.mock.callCount(), 1);

    const call = mockedProcessPayment.mock.calls[0];
    assert.deepStrictEqual(call.arguments, [100]);
  });
});
