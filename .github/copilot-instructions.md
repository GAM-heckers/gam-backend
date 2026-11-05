# 프로젝트 지침

## 제품 방향

- 이 프로젝트는 청도 소규모 농가, 특히 온라인 판매가 익숙하지 않은 어르신이 수확물 사진으로 상품 등록 초안을 만들도록 돕는다.
- 중심 흐름은 사진 선택 → AI 분석 API 요청 → 초안 확인·수정이다.
- 제품 범위와 수용 기준은 `prd.md`, 제품 아이디어는 `ideation.md`를 따른다.
- UI와 문서는 쉬운 한국어, 큰 글자, 짧은 문장으로 작성한다.

## AI 분석과 데이터 정확성

- 사진 분석 응답은 초안이며 사용자가 확인해야 한다.
- 사진을 AI 백엔드로 업로드한다는 사실과 실패 상태를 사용자에게 명확히 알린다.
- 판독되지 않은 값은 비워 두며 사진만으로 알 수 없는 판매 가격, 정확한 중량, 재고, 원산지, 인증, 배송 정보를 만들어내지 않는다.
- AI 신뢰도 점수가 API에 없으면 임의의 점수나 확신을 표시하지 않는다.
- AI 분석, 모의 응답, 판매처 등록 상태를 서로 구분한다.
- 사진 분석 API는 상품을 네이버에 등록하지 않는다.

## 이미지 분석 API 계약

- AI API 기본 경로는 `POST /api/agent/product-image/analyze`다.
- 프런트는 `multipart/form-data`의 `image` 파일 필드로 JPG/JPEG, PNG, WEBP를 최대 10MB까지 전송한다.
- multipart `Content-Type`은 브라우저가 boundary와 함께 만들도록 하며 수동으로 지정하지 않는다.
- 응답 구조는 `{ analysis, provider, reviewRequired }`이며 `analysis`에는 `productName`, `fruitType`, `size`, `price`, `weightKg`, `boxCount`, `productDescription`, `visibleText`, `needsConfirmation`이 있다.
- 현재 AI API는 신뢰도 점수를 제공하지 않는다. 기존 `POST /api/smartstore/products/preview`는 별도 모의 API이며 사진 분석 흐름에서 호출하지 않는다.
- 연결 상태는 `GET /health`로 확인하지만 Azure OpenAI 설정 확인은 실제 분석 요청에서 이뤄진다.
- 로컬 프런트 출처는 기본적으로 `http://localhost:5500`, `http://127.0.0.1:5500`이다. 배포 도메인은 `FRONTEND_ORIGINS`에 필요한 정확한 출처만 설정한다.

## 보안

- `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_DEPLOYMENT`, `AZURE_OPENAI_API_KEY` 등 자격 증명을 브라우저 코드, 브라우저 저장소, 프런트엔드 파일, 공개 저장소에 넣지 않는다.
- 비밀 값은 AI 백엔드의 서버 환경 변수나 Azure 비밀 저장소에서 관리한다.
- 사진 업로드, 허용 형식·용량, 보관 여부를 사용자에게 사실대로 알린다.
- HTTPS 프런트엔드에서는 AI API도 HTTPS로 사용한다.

## 구현과 검증

- 기존 구조와 백엔드 계약을 확인한 뒤 일치하도록 구현한다.
- 사용자 입력값과 서버 응답을 안전하게 표시하고, 실패를 성공처럼 숨기지 않는다.
- 변경 범위에 맞는 브라우저 검증·테스트·빌드를 실행하고 결과를 보고한다.
- 제품 동작이 바뀌면 README, PRD, 아이디어 문서도 현재 상태에 맞게 갱신한다.
