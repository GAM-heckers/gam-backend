import express from "express";
import {
  mockSeller,
  sampleProduct,
  sampleRegistrationForm,
} from "./mock-data.js";
import {
  toSmartStoreProductDraft,
  validateProductInput,
} from "./product-dto.js";

export const app = express();

app.use(express.json());

app.get("/health", (_request, response) => {
  response.json({ status: "ok" });
});

app.get("/api/smartstore/products/sample", (_request, response) => {
  response.json(toSmartStoreProductDraft(sampleProduct));
});

app.get(
  "/api/smartstore/products/registration-sample",
  (_request, response) => {
    response.json({
      seller: mockSeller,
      formData: sampleRegistrationForm,
      integration: {
        mode: "MOCK",
        externalApiReady: false,
      },
      notes: [
        "화면 연동용 더미 데이터입니다. 네이버 API 요청 본문이 아닙니다.",
        "카테고리, 원산지, 과세, 인증, 배송 및 주소 값은 실제 판매자 정보로 확인해야 합니다.",
        "이미지 URL은 예시이며, 실제 상품 등록에는 네이버 이미지 업로드 결과가 필요합니다.",
      ],
    });
  },
);

app.post("/api/smartstore/products/preview", (request, response) => {
  const validation = validateProductInput(request.body);

  if (!validation.success) {
    response.status(400).json({
      message: "상품 입력값이 올바르지 않습니다.",
      errors: validation.errors,
    });
    return;
  }

  response.json(toSmartStoreProductDraft(validation.data));
});

app.use(
  (
    error: unknown,
    _request: express.Request,
    response: express.Response,
    next: express.NextFunction,
  ) => {
    if (response.headersSent) {
      next(error);
      return;
    }

    if (
      error instanceof SyntaxError &&
      "status" in error &&
      error.status === 400 &&
      "body" in error
    ) {
      response
        .status(400)
        .json({ message: "JSON 요청 본문 형식이 올바르지 않습니다." });
      return;
    }

    next(error);
  },
);
