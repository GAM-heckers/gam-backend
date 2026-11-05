# 청도 농가 도우미

수확물 사진을 AI로 분석해 상품 등록 초안을 만들고, 온라인 판매가 익숙하지 않은 농가가 내용을 확인·수정하도록 돕는 프로젝트입니다.

> **현재 연결 흐름:** 프런트엔드가 사진을 AI 백엔드에 업로드하고, 분석 응답을 상품 정보 입력란에 채웁니다. 결과는 참고용 초안이며 사용자가 확인해야 합니다. 네이버 스마트스토어 등록은 수행하지 않습니다.

## 사용자 흐름

1. 수확물 사진(JPG, PNG, WEBP, 최대 10MB)을 선택합니다.
2. 프런트엔드에서 AI 백엔드로 사진을 보내 분석을 요청합니다.
3. AI 응답에서 상품명, 과일 종류, 크기, 가격, 중량, 박스 수, 설명 초안을 보여줍니다.
4. 사용자는 결과와 사진에서 읽은 글자를 확인하고 내용을 수정합니다.

사진에서 읽은 값은 틀릴 수 있습니다. 특히 판매 가격, 정확한 중량, 재고 수량은 반드시 확인해야 합니다. 사진 분석은 상품을 판매처에 등록하지 않습니다.

## 폴더 구성

```text
Frontend/                    사진 업로드, AI 분석 결과 확인·수정 UI
backend/                     상품 미리보기 API와 SmartStore MCP 도구
services/AiMcpService/       이미지 분석 및 AI/MCP 서비스
aspire/AppHost/              백엔드와 AI 서비스 로컬 오케스트레이션
ideation.md                 아이디어와 제품 방향
prd.md                      제품 요구사항 정의서
```

## 실행 방법

### 필수 준비

- Node.js와 npm
- .NET SDK (Aspire AppHost에서 AI 서비스 실행)
- Azure OpenAI endpoint와 이미지 입력을 지원하는 모델 배포 이름
- 서버의 `AZURE_OPENAI_API_KEY` 또는 서버에서 사용할 수 있는 Azure 기본 자격 증명

Azure OpenAI 인증 설정은 프런트엔드가 아니라 서버 환경 변수나 안전한 비밀 저장소에 둡니다. API key가 없으면 서비스는 `DefaultAzureCredential`을 사용하므로, 실행 환경에 적절한 Azure 자격 증명이 있어야 합니다.

### 서비스 실행

로컬 오케스트레이션을 사용할 경우:

```powershell
cd aspire\AppHost
dotnet run
```

Aspire 대시보드에서 AI 서비스의 HTTP 주소를 확인해 프런트엔드의 “AI 서비스 주소” 칸에 입력합니다. 프런트엔드는 아래 주소를 기본값으로 사용하지만, 실제 포트는 실행 설정에 따라 다를 수 있습니다.

```text
http://localhost:5000
```

Azure OpenAI 설정은 AppHost 실행 환경에 endpoint와 배포 이름을 지정합니다. API key 방식이면 key도 설정합니다.

```text
AZURE_OPENAI_ENDPOINT
AZURE_OPENAI_DEPLOYMENT
AZURE_OPENAI_API_KEY
```

`AZURE_OPENAI_API_KEY`는 선택 값이며, 지정하지 않으면 AI 서비스가 `DefaultAzureCredential`을 사용합니다. `AZURE_OPENAI_DEPLOYMENT_NAME`도 배포 이름 대체 설정으로 지원합니다. 어떤 인증 방식을 쓰든 자격 증명을 브라우저 코드나 프런트엔드 환경에 넣지 마세요.

프런트엔드:

```powershell
cd Frontend
py -m http.server 5500
```

브라우저에서 `http://localhost:5500`을 열고, AI 서비스 주소를 확인한 뒤 사진을 선택해 “사진 분석하기”를 누릅니다.

### 서비스 별도 실행

Aspire 대신 개별 실행이 필요하면 먼저 Express 백엔드를 실행합니다.

```powershell
cd backend
npm install
npm run dev
```

그다음 AI 서비스를 실행합니다.

```powershell
cd services\AiMcpService
dotnet run
```

이 경우 AI 서비스에 `SMARTSTORE_API_URL`과 Azure OpenAI 설정을 환경 변수로 제공합니다. 서비스가 실제로 사용하는 주소와 포트는 실행 출력에서 확인합니다.

## 이미지 분석 API

### 상태 확인

```http
GET /health
```

```json
{ "status": "ok" }
```

상태 확인은 AI 서비스 프로세스가 응답하는지 검사합니다. Azure OpenAI 자격 증명과 모델 호출 가능 여부는 분석 요청에서 검증됩니다.

### 사진 분석

```http
POST /api/agent/product-image/analyze
Content-Type: multipart/form-data
```

폼 필드 이름은 `image`입니다. JPG/JPEG, PNG, WEBP 형식과 10MB 이하 파일을 지원합니다. 브라우저가 `Content-Type`의 multipart boundary를 생성해야 하므로 프런트엔드는 직접 Content-Type 헤더를 지정하지 않습니다.

응답 예시:

```json
{
  "analysis": {
    "productName": "청도 반시",
    "fruitType": "감",
    "size": "중과",
    "price": null,
    "weightKg": 5,
    "boxCount": null,
    "productDescription": "사진에서 확인할 수 있는 상품 설명 초안",
    "visibleText": ["청도 반시", "5kg"],
    "needsConfirmation": ["판매 가격", "박스 수", "중량"]
  },
  "provider": "azure-openai",
  "reviewRequired": true
}
```

분석 항목이 불명확하면 `null`일 수 있습니다. 실제 배포에서 AI 설정이 없으면 `503`, 모델 호출 실패나 분석 응답 처리 실패는 `502`, 잘못된 파일은 `400`, 용량 초과는 `413`으로 반환됩니다.

개발 환경에서는 저장소의 샘플 이미지로 분석 API를 확인할 수 있습니다.

```http
POST /api/agent/product-image/analyze-sample
```

이 개발용 경로는 Development 환경에서만 등록됩니다.

## 브라우저 연결과 CORS

AI 서비스는 기본적으로 다음 로컬 프런트엔드 출처를 허용합니다.

```text
http://localhost:5500
http://127.0.0.1:5500
```

다른 로컬 포트나 Azure 프런트엔드 도메인을 사용하는 경우 AI 서비스의 `FRONTEND_ORIGINS` 환경 변수에 허용할 출처를 세미콜론으로 구분해 지정합니다. 예:

```text
FRONTEND_ORIGINS=https://your-frontend.example.com
```

실제 배포 주소, Azure OpenAI 설정 및 허용 출처가 설정되어야 배포 환경에서 분석 요청이 동작합니다.

## 다른 백엔드 API

기존 `POST /api/smartstore/products/preview`는 상품명·가격·박스 수·중량을 검증하고 모의 네이버 매핑을 반환합니다. 현재 사진 분석 흐름에서는 호출하지 않으며, 실제 네이버 등록도 하지 않습니다.

## 검증

```powershell
cd backend
npm test
npm run build
```

AI 서비스와 Aspire AppHost의 .NET 빌드는 각각 해당 프로젝트 디렉터리에서 `dotnet build`로 확인합니다.
