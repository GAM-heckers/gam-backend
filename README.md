# gam-backend

## SmartStore product preview

Run the backend from the `backend` directory:

```bash
cd backend
npm run dev
```

`GET /api/smartstore/products/sample` returns a sample. Submit product data to
`POST /api/smartstore/products/preview` as JSON:

```json
{
  "productName": "샘플 상품",
  "price": 18000,
  "boxCount": 3,
  "weightKg": 4.5
}
```

The response contains a flat `product` object for direct frontend field
mapping, and a `naverMapping` object showing how those values are represented
in the SmartStore draft:

```json
{
  "seller": {
    "sellerId": "seller-demo-001",
    "channel": "NAVER_SMARTSTORE",
    "storeName": "청도 테스트 스토어",
    "registrationStatus": "UNREGISTERED",
    "isMock": true
  },
  "product": {
    "productName": "샘플 상품",
    "price": 18000,
    "priceCurrency": "KRW",
    "boxCount": 3,
    "weightKg": 4.5
  },
  "naverMapping": {
    "productName": "샘플 상품",
    "salePrice": {
      "amount": 18000,
      "currency": "KRW"
    },
    "boxCount": 3,
    "weight": {
      "value": 4.5,
      "unit": "KG"
    }
  },
  "integration": {
    "mode": "MOCK",
    "externalApiReady": false
  }
}
```

`naverMapping` is a local mapping preview, not a confirmed official Naver
Commerce API request schema. No request is sent to Naver.

## SmartStore registration form mock data

`GET /api/smartstore/products/registration-sample` returns JSON mock data for
the frontend registration form, grouped into product, origin/support, food
notice, certification, unit price, and delivery/claims sections. The response
includes the mock seller and notes identifying values that must be replaced
with seller-specific information.

This is UI sample data, not a confirmed Naver Commerce API request body. Mock
addresses, courier, image URL, category, tax, and product details must be
verified or replaced before any real registration.

## .NET AI and MCP service (hybrid setup)

The existing Express API remains the source of SmartStore mock data. A separate
.NET 10 service provides a Microsoft Agent Framework chat endpoint and an MCP
tool that reads the Express registration-sample endpoint.

Run both services locally through Aspire:

```bash
dotnet run --project aspire/AppHost
```

Aspire runs the Express API and the .NET AI/MCP service together. The .NET
service exposes:

- `GET /health`
- `POST /api/agent/chat` with `{"message":"상품 등록 입력 항목을 알려줘"}`
- `POST /api/agent/product-image/analyze` as `multipart/form-data`, with the
  image in the `image` field (JPEG, PNG, or WebP; up to 10 MB). The response
  contains a draft extraction and always requires human review.
- MCP Streamable HTTP at `/mcp`, with the
  `get_smartstore_registration_sample` tool

Set `AZURE_OPENAI_ENDPOINT` and `AZURE_OPENAI_DEPLOYMENT` in the environment to
enable AI chat and image analysis. The deployment must use a vision-capable
model that accepts image input. Authenticate either with
`AZURE_OPENAI_API_KEY`, or omit the key and use Azure credentials available to
`DefaultAzureCredential` (such as `az login` locally or a managed identity in
Azure). Without endpoint or deployment settings, AI requests return HTTP 503.
Uploaded images are sent to Azure OpenAI for analysis and are not saved by this
service.

The .NET service calls the existing Express endpoint through Aspire service
discovery. The MCP tool and Agent Framework function share the same operation,
so both return the frontend mock data without duplicating it.