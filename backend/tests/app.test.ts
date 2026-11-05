import assert from "node:assert/strict";
import { once } from "node:events";
import test, { after, before } from "node:test";
import { app } from "../src/app.js";

let server: ReturnType<typeof app.listen>;
let baseUrl: string;

before(async () => {
  server = app.listen(0);
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("serves the sample product draft", async () => {
  const response = await fetch(`${baseUrl}/api/smartstore/products/sample`);

  assert.equal(response.status, 200);
  const draft = await response.json();
  assert.equal(draft.seller.isMock, true);
  assert.equal(draft.product.price, 35000);
  assert.equal(draft.product.priceCurrency, "KRW");
  assert.equal(draft.product.weightKg, 10);
  assert.equal(draft.naverMapping.salePrice.amount, 35000);
  assert.equal(draft.naverMapping.weight.unit, "KG");
});

test("serves mock registration form data for the frontend", async () => {
  const response = await fetch(
    `${baseUrl}/api/smartstore/products/registration-sample`,
  );

  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.seller.isMock, true);
  assert.equal(result.formData.product.name, "청도 반시 10kg");
  assert.equal(result.formData.product.statusType, "WAIT");
  assert.equal(result.formData.foodNotice.noticeType, "FOOD");
  assert.equal(result.formData.certification.status, "excluded");
  assert.deepEqual(result.formData.certification.infos, []);
  assert.equal(result.formData.deliveryAndClaims.outboundLocationId, "MOCK_OUTBOUND_001");
  assert.match(result.notes[0], /API 요청 본문이 아닙니다/);
});

test("converts submitted product data into a draft", async () => {
  const response = await fetch(`${baseUrl}/api/smartstore/products/preview`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      productName: "샘플 상품",
      price: 18000,
      boxCount: 3,
      weightKg: 4.5,
    }),
  });

  assert.equal(response.status, 200);
  const draft = await response.json();
  assert.equal(draft.product.productName, "샘플 상품");
  assert.equal(draft.product.price, 18000);
  assert.equal(draft.product.boxCount, 3);
  assert.equal(draft.product.weightKg, 4.5);
  assert.equal(draft.naverMapping.salePrice.amount, 18000);
  assert.equal(draft.naverMapping.weight.value, 4.5);
});

test("returns validation errors for invalid product data", async () => {
  const response = await fetch(`${baseUrl}/api/smartstore/products/preview`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ productName: "", price: -1 }),
  });

  assert.equal(response.status, 400);
  const result = await response.json();
  assert.equal(result.errors.length, 4);
});
