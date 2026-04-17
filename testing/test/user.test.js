import { describe, test, mock, it } from "node:test";
import { fetchData } from "../app.js";

describe("user feature", () => {
  it("fetch data from the server", (t) => {
    const data = fetchData(1);
    t.assert.snapshot(data);
  });
});
