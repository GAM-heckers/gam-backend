import assert from "node:assert/strict";
import test from "node:test";
import { sampleProduct } from "../src/mock-data.js";
import {
  toSmartStoreProductDraft,
  validateProductInput,
} from "../src/product-dto.js";

test("maps product input to a mock SmartStore draft", () => {
  assert.deepEqual(toSmartStoreProductDraft(sampleProduct), {
    seller: {
      sellerId: "seller-demo-001",
      channel: "NAVER_SMARTSTORE",
      storeName: "청도 테스트 스토어",
      registrationStatus: "UNREGISTERED",
      isMock: true,
    },
    product: {
      productName: "청도 반시 테스트 상품",
      price: 35000,
      priceCurrency: "KRW",
      boxCount: 1,
      weightKg: 10,
    },
    naverMapping: {
      productName: "청도 반시 테스트 상품",
      salePrice: { amount: 35000, currency: "KRW" },
      boxCount: 1,
      weight: { value: 10, unit: "KG" },
    },
    integration: { mode: "MOCK", externalApiReady: false },
  });
});

test("validates and trims incoming product data", () => {
  assert.deepEqual(
    validateProductInput({
      productName: "  샘플 상품  ",
      price: 12000,
      boxCount: 2,
      weightKg: 5.5,
    }),
    {
      success: true,
      data: {
        productName: "샘플 상품",
        price: 12000,
        boxCount: 2,
        weightKg: 5.5,
      },
    },
  );
});

test("rejects invalid product data", () => {
  const result = validateProductInput({
    productName: " ",
    price: -1,
    boxCount: 0,
    weightKg: Number.NaN,
  });

  assert.equal(result.success, false);
  if (!result.success) {
    assert.equal(result.errors.length, 4);
  }
});
