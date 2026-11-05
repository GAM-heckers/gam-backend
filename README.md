# 청도 농가 매출 관리자

청도 지역의 소규모 농가가 상품을 등록하고 판매 현황 및 농산물 시세를 한곳에서 확인하도록 돕는 매출 관리 도구입니다. 초기 판매처 연동은 네이버 스마트스토어로 시작하고, 검증 후 쿠팡 등 다른 판매처로 확장하는 것을 목표로 합니다.

> **현재 상태:** 네이버 스마트스토어 상품 입력 화면과 백엔드 미리보기 API가 준비되어 있습니다. 등록 흐름은 모의 기능이며, 현재 네이버로 상품 등록 요청이나 이미지 업로드를 보내지 않습니다.

## 주요 기능

- **상품 등록 준비:** 네이버 스마트스토어 상품, 원산지, 식품 표시, 인증, 단위 가격, 배송·반품 정보를 입력하고 제출 전에 확인합니다.
- **상품 정보 미리보기 API:** 입력된 핵심 상품 정보를 검증하고 네이버 매핑 초안을 반환합니다.
- **판매 대시보드와 시세 정보:** 판매·시세 데이터를 출처, 단위, 기준일과 함께 표시할 수 있도록 확장합니다.
- **명확한 모의 상태:** 예시 응답과 미연동 기능을 실제 판매처 등록 결과와 구분합니다.

상품 등록 입력 정의는 화면 준비를 위한 목록이지 네이버 Commerce API 요청 본문이 아닙니다. 실제 필수값과 허용 값은 네이버 카테고리와 판매자 설정에 따라 달라질 수 있습니다.

## 저장소 구조

```text
Frontend/   네이버 상품 입력·검토 화면
backend/    상품 미리보기 API와 모의 데이터
.github/    Copilot 프로젝트 지침
```

## 실행 방법

### 프런트엔드

JSON 입력 정의를 불러오므로 `Frontend` 폴더를 정적 웹 서버로 엽니다.

```powershell
cd Frontend
py -m http.server 5500
```

브라우저에서 `http://localhost:5500`을 엽니다.

### 백엔드

새 터미널에서 다음 명령을 실행합니다.

```powershell
cd backend
npm install
npm run dev
```

기본 주소는 `http://localhost:3000`이며, 서버는 `PORT` 환경 변수가 설정되면 해당 포트를 사용합니다.

## 상품 미리보기 API

### 상태 확인

```http
GET /health
```

### 간단한 상품 미리보기 조회

```http
GET /api/smartstore/products/sample
```

### 상품 등록 폼 모의 데이터 조회

```http
GET /api/smartstore/products/registration-sample
```

이 응답은 네이버 스마트스토어 입력 폼의 시연용 데이터입니다. 판매자 ID·주소·택배사·이미지·원산지와 상품 세부 정보는 모의 값이며, 실제 판매자 정보로 확인해야 합니다.

### 상품 미리보기 생성

```http
POST /api/smartstore/products/preview
Content-Type: application/json
```

요청 예시:

```json
{
  "productName": "청도 반시",
  "price": 18000,
  "boxCount": 3,
  "weightKg": 4.5
}
```

성공 응답 예시:

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
    "productName": "청도 반시",
    "price": 18000,
    "priceCurrency": "KRW",
    "boxCount": 3,
    "weightKg": 4.5
  },
  "naverMapping": {
    "productName": "청도 반시",
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

`naverMapping`은 현재 백엔드의 매핑 미리보기입니다. 네이버 공식 API 요청 형식으로 검증된 것이 아니며, 이 API는 네이버에 상품을 등록하지 않습니다. 잘못된 입력에는 `400`과 오류 설명을 반환합니다.

## 검증

```powershell
cd backend
npm test
npm run build
```

## 연동 및 보안 원칙

- 네이버 공식 API의 인증, 권한, 요청·응답과 실제 입력 조건을 확인한 뒤 연동합니다.
- 다른 판매처는 네이버 연동을 검증한 다음 확장합니다.
- API 자격 증명과 비밀 값은 서버 측 환경 변수나 비밀 저장소로 관리하며 프런트엔드와 공개 저장소에 노출하지 않습니다.
- 매출과 시세 데이터의 출처·기준일·단위·집계 기준을 표시하고, 제공되지 않은 값을 사실처럼 추정하지 않습니다.
