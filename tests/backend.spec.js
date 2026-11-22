import { expect, test } from "@playwright/test";

const API_URL = process.env.BACKEND_URL || "http://127.0.0.1:3001";

test.describe("Backend – godkänt nivå (JWT & bcrypt)", () => {
  test("användaren kan skapas, logga in och erhålla en giltig JWT", async ({
    request,
  }) => {
    const username = `student-${Date.now()}`;
    const password = "hemligt123";

    const createUserResponse = await request.post(`${API_URL}/users`, {
      data: { username, password },
    });

    expect(
      createUserResponse.ok(),
      "POST /users ska svara med en 2xx-status",
    ).toBe(true);

    const loginResponse = await request.post(`${API_URL}/sessions`, {
      data: { username, password },
    });

    expect(
      loginResponse.ok(),
      "POST /sessions ska svara med en 2xx-status för rätt inloggning",
    ).toBe(true);

    const loginBody = await loginResponse.json();

    expect(loginBody.token).toBeDefined();
    expect(loginBody.token.split(".").length).toBe(3);

    const { token } = loginBody;

    const initialAccountResponse = await request.post(
      `${API_URL}/me/accounts`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    expect(
      initialAccountResponse.ok(),
      "POST /me/accounts ska godkänna användarens token",
    ).toBe(true);
    const initialAccountBody = await initialAccountResponse.json();
    expect(initialAccountBody).toEqual(expect.objectContaining({ amount: 0 }));

    const transactionResponse = await request.post(
      `${API_URL}/me/accounts/transactions`,
      {
        headers: { Authorization: `Bearer ${token}` },
        data: { amount: 250 },
      },
    );

    expect(
      transactionResponse.ok(),
      "POST /me/accounts/transactions ska svara med en 2xx-status",
    ).toBe(true);
    const transactionBody = await transactionResponse.json();
    expect(transactionBody).toEqual(expect.objectContaining({ amount: 250 }));

    const updatedAccountResponse = await request.post(
      `${API_URL}/me/accounts`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    expect(updatedAccountResponse.ok()).toBe(true);
    const updatedAccountBody = await updatedAccountResponse.json();
    expect(updatedAccountBody).toEqual(
      expect.objectContaining({ amount: 250 }),
    );
  });

  test("kontouppgifter nekas utan en token, med ogiltig token eller manipulerad token", async ({
    request,
  }) => {
    const noTokenResponse = await request.post(`${API_URL}/me/accounts`);
    expect(
      [401, 403],
      "En begäran utan token ska ge status 401 eller 403",
    ).toContain(noTokenResponse.status());

    const invalidTokenResponse = await request.post(`${API_URL}/me/accounts`, {
      headers: { Authorization: `Bearer invalid-token` },
    });
    expect(invalidTokenResponse.status()).toBe(401);

    const username = `student-tamper-${Date.now()}`;
    const password = "hemligt123";

    await request.post(`${API_URL}/users`, {
      data: { username, password },
    });

    const loginResponse = await request.post(`${API_URL}/sessions`, {
      data: { username, password },
    });

    const { token } = await loginResponse.json();

    const tamperedToken =
      token.slice(0, -1) + (token.endsWith("a") ? "b" : "a");

    const tamperedTokenResponse = await request.post(`${API_URL}/me/accounts`, {
      headers: { Authorization: `Bearer ${tamperedToken}` },
    });
    expect(
      tamperedTokenResponse.status(),
      "En manipulerad token ska ge status 401",
    ).toBe(401);
  });
});
