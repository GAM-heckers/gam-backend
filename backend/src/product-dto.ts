import { mockSeller } from "./mock-data.js";
import type {
  ProductInput,
  ProductValidationResult,
  SmartStoreProductDraft,
} from "./types.js";

export function validateProductInput(input: unknown): ProductValidationResult {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return { success: false, errors: ["요청 본문은 객체여야 합니다."] };
  }

  const candidate = input as Record<string, unknown>;
  const productName = candidate.productName;
  const price = candidate.price;
  const boxCount = candidate.boxCount;
  const weightKg = candidate.weightKg;
  const errors: string[] = [];

  const parsedProductName =
    typeof productName === "string" &&
    productName.trim().length > 0 &&
    productName.trim().length <= 100
      ? productName.trim()
      : undefined;
  const parsedPrice =
    typeof price === "number" && Number.isSafeInteger(price) && price > 0
      ? price
      : undefined;
  const parsedBoxCount =
    typeof boxCount === "number" &&
    Number.isSafeInteger(boxCount) &&
    boxCount > 0
      ? boxCount
      : undefined;
  const parsedWeightKg =
    typeof weightKg === "number" && Number.isFinite(weightKg) && weightKg > 0
      ? weightKg
      : undefined;

  if (parsedProductName === undefined) {
    errors.push("productName은 1자 이상 100자 이하의 문자열이어야 합니다.");
  }

  if (parsedPrice === undefined) {
    errors.push("price는 0보다 큰 정수(원 단위)여야 합니다.");
  }

  if (parsedBoxCount === undefined) {
    errors.push("boxCount는 0보다 큰 정수여야 합니다.");
  }

  if (parsedWeightKg === undefined) {
    errors.push("weightKg는 0보다 큰 숫자여야 합니다.");
  }

  if (
    errors.length > 0 ||
    parsedProductName === undefined ||
    parsedPrice === undefined ||
    parsedBoxCount === undefined ||
    parsedWeightKg === undefined
  ) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      productName: parsedProductName,
      price: parsedPrice,
      boxCount: parsedBoxCount,
      weightKg: parsedWeightKg,
    },
  };
}

export function toSmartStoreProductDraft(
  product: ProductInput,
): SmartStoreProductDraft {
  return {
    seller: mockSeller,
    product: {
      productName: product.productName,
      price: product.price,
      priceCurrency: "KRW",
      boxCount: product.boxCount,
      weightKg: product.weightKg,
    },
    naverMapping: {
      productName: product.productName,
      salePrice: {
        amount: product.price,
        currency: "KRW",
      },
      boxCount: product.boxCount,
      weight: {
        value: product.weightKg,
        unit: "KG",
      },
    },
    integration: {
      mode: "MOCK",
      externalApiReady: false,
    },
  };
}
