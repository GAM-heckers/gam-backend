<<<<<<< HEAD
# 청도 농가 매출 관리자

청도 지역의 소규모 농가가 상품과 재고를 관리하고, 온라인 판매 현황 및 농산물 시세를 한곳에서 확인하도록 돕는 매출 관리 도구입니다. 온라인 판매에 익숙하지 않은 사용자도 쉽게 사용할 수 있도록 큰 글씨, 쉬운 표현, 명확한 등록·동기화 상태를 지향합니다.

> **현재 상태:** 제품 기획 단계입니다. 판매처 및 시세 API의 실제 연동 여부와 지원 범위는 공식 문서와 계정 권한을 확인한 뒤 결정합니다.

## 주요 기능

- **상품·재고 관리:** 상품명, 작물, 규격, 재고, 희망 판매 가격을 입력하고 선택한 판매처의 등록 요청을 준비합니다.
- **판매 현황 대시보드:** 연결된 주문 데이터를 바탕으로 기간별 매출과 판매 건수, 상품별 실적을 확인합니다.
- **농산물 시세 확인:** 공공 시세의 추이와 함께 출처, 기준일, 지역·시장, 등급, 단위를 확인합니다.
- **명확한 데이터 상태:** 실제 데이터와 샘플 데이터를 구분하고 집계 기준과 마지막 동기화 시각을 표시합니다.

판매처별 API 권한과 기능은 다를 수 있습니다. 검증되지 않은 연동은 실제 기능처럼 안내하지 않으며, 시세 비교는 지역·등급·단위 등 조건이 맞는 경우에만 참고용으로 제공합니다. 자동 가격 변경, 판매 추천, 회계·세무 처리는 초기 범위에 포함하지 않습니다.

## 문서

- [제품 요구사항 정의서](./prd.md): 제품 목표, 핵심 기능, 사용자 흐름, MVP 우선순위, 제외 범위와 데이터 원칙
- [아이디어 정리](./ideation.md): 사용자 문제, 가설, 제품 방향과 검증 과제
- [Copilot 프로젝트 지침](./.github/copilot-instructions.md): 개발 및 외부 연동 시 지켜야 할 프로젝트 규칙

## 기술 및 실행 방법

기술 스택과 실행·테스트 절차는 아직 확정되지 않았습니다. 구현이 시작되면 의존성 설치, 개발 서버 실행, 테스트 및 빌드 방법을 이 문서에 추가합니다.

## 연동 및 보안 원칙

- 우선 한 판매처의 공식 API 문서, 인증, 계정 권한과 데이터 응답을 검증합니다.
- 외부 API 자격 증명은 서버 측 비밀 저장소나 환경 변수로 관리하며, 프런트엔드와 공개 저장소에 노출하지 않습니다.
- API가 제공하지 않는 매출·환불·정산 값을 추정해 사실처럼 표시하지 않습니다.
- API 미연동 또는 샘플 데이터는 사용자에게 분명하게 표시합니다.
=======
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
>>>>>>> develop
