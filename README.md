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