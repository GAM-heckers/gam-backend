const statusMessage = document.querySelector("#app-status");
const form = document.querySelector("#product-form");
const photoInput = document.querySelector("#product-photo");
const photoPreviewWrap = document.querySelector("#photo-preview-wrap");
const photoPreview = document.querySelector("#photo-preview");
const photoName = document.querySelector("#photo-name");
const demoDraftButton = document.querySelector("#demo-draft-button");
const apiBaseUrl = document.querySelector("#api-base-url");
const resultPanel = document.querySelector("#result-panel");
const numberFormatter = new Intl.NumberFormat("ko-KR");
let previewUrl;

function setStatus(message, kind = "") {
  statusMessage.textContent = message;
  statusMessage.className = `status-message${kind ? ` status-message--${kind}` : ""}`;
}

function apiUrl(path) {
  const parsed = new URL(apiBaseUrl.value.trim());
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("백엔드 주소는 http 또는 https 주소여야 합니다.");
  }
  return `${parsed.href.replace(/\/+$/, "")}${path}`;
}

function formValues() {
  return {
    productName: form.elements.productName.value.trim(),
    price: Number(form.elements.price.value),
    boxCount: Number(form.elements.boxCount.value),
    weightKg: Number(form.elements.weightKg.value),
  };
}

function updateUnitPrice() {
  const { price, weightKg } = formValues();
  const output = document.querySelector("#unit-price");
  if (Number.isSafeInteger(price) && price > 0 && Number.isFinite(weightKg) && weightKg > 0) {
    output.textContent = `${numberFormatter.format(Math.round(price / weightKg))}원 / kg`;
    return;
  }
  output.textContent = "가격과 중량을 입력하면 계산돼요.";
}

photoInput.addEventListener("change", () => {
  const file = photoInput.files?.[0];
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = undefined;

  if (!file) {
    photoPreviewWrap.hidden = true;
    demoDraftButton.disabled = true;
    return;
  }

  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    photoInput.value = "";
    photoPreviewWrap.hidden = true;
    demoDraftButton.disabled = true;
    setStatus("JPG, PNG 또는 WEBP 사진을 선택해 주세요.", "error");
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    photoInput.value = "";
    photoPreviewWrap.hidden = true;
    demoDraftButton.disabled = true;
    setStatus("사진은 10MB 이하로 선택해 주세요.", "error");
    return;
  }

  previewUrl = URL.createObjectURL(file);
  photoPreview.src = previewUrl;
  photoName.textContent = file.name;
  photoPreviewWrap.hidden = false;
  demoDraftButton.disabled = false;
  setStatus("사진을 화면에 불러왔어요. 이 사진은 서버로 전송되지 않습니다.", "success");
});

demoDraftButton.addEventListener("click", () => {
  form.elements.productName.value = "청도 반시";
  form.elements.boxCount.value = "1";
  form.elements.weightKg.value = "5";
  form.elements.price.value = "";
  updateUnitPrice();
  setStatus("데모 예시를 채웠어요. 사진 분석 결과가 아닙니다. 가격과 실제 중량을 확인해 주세요.", "warning");
  document.querySelector("#product-name").focus();
});

form.addEventListener("input", updateUnitPrice);

document.querySelector("#health-button").addEventListener("click", async (event) => {
  const button = event.currentTarget;
  button.disabled = true;
  setStatus("백엔드 연결을 확인하고 있어요.");
  try {
    const response = await fetch(apiUrl("/health"));
    if (!response.ok) {
      setStatus(`백엔드가 오류 응답을 보냈어요 (HTTP ${response.status}). 주소와 서버 상태를 확인해 주세요.`, "error");
      return;
    }
    const health = await response.json();
    if (health.status !== "ok") {
      setStatus("백엔드에는 연결됐지만 상태 응답이 예상과 달라요.", "warning");
      return;
    }
    setStatus("백엔드에 연결됐어요. 이제 상품 미리보기를 요청할 수 있습니다.", "success");
  } catch (error) {
    const message = error instanceof TypeError
      ? "연결할 수 없어요. 서버 주소, 실행 상태, CORS 설정을 확인해 주세요."
      : error.message;
    setStatus(message, "error");
  } finally {
    button.disabled = false;
  }
});

function addResultItem(label, value) {
  const item = document.createElement("div");
  item.className = "result-item";
  const term = document.createElement("dt");
  term.textContent = label;
  const detail = document.createElement("dd");
  detail.textContent = value;
  item.append(term, detail);
  document.querySelector("#result-details").append(item);
}

function showResult(data) {
  document.querySelector("#result-caption").textContent =
    data.integration?.mode === "MOCK"
      ? "모의 백엔드 응답입니다. 네이버에 등록된 상품이 아닙니다."
      : "백엔드가 상품 미리보기 응답을 반환했습니다.";
  const details = document.querySelector("#result-details");
  details.replaceChildren();
  const product = data.product ?? {};
  if (product.productName) addResultItem("상품 이름", product.productName);
  if (Number.isFinite(product.price)) addResultItem("판매 가격", `${numberFormatter.format(product.price)}원`);
  if (Number.isFinite(product.boxCount)) addResultItem("박스 수", `${numberFormatter.format(product.boxCount)}개`);
  if (Number.isFinite(product.weightKg)) addResultItem("중량", `${product.weightKg}kg`);
  if (!details.childElementCount) addResultItem("응답 상태", "응답 데이터를 아래에서 확인해 주세요.");
  document.querySelector("#raw-response").textContent = JSON.stringify(data, null, 2);
  resultPanel.hidden = false;
  resultPanel.scrollIntoView({ behavior: "smooth", block: "start" });
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;

  const values = formValues();
  if (
    !values.productName ||
    !Number.isSafeInteger(values.price) ||
    values.price <= 0 ||
    !Number.isSafeInteger(values.boxCount) ||
    values.boxCount <= 0 ||
    !Number.isFinite(values.weightKg) ||
    values.weightKg <= 0
  ) {
    setStatus("상품 이름, 양의 정수 가격·박스 수, 0보다 큰 중량을 입력해 주세요.", "error");
    return;
  }

  const button = document.querySelector("#preview-button");
  button.disabled = true;
  resultPanel.hidden = true;
  setStatus("상품 정보를 백엔드 미리보기 API로 보내고 있어요.");
  try {
    const response = await fetch(apiUrl("/api/smartstore/products/preview"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const body = await response.json();
    if (!response.ok) {
      const errors = Array.isArray(body.errors) ? body.errors.join(" ") : body.message;
      setStatus(errors || `백엔드 요청이 실패했어요 (HTTP ${response.status}).`, "error");
      return;
    }
    showResult(body);
    setStatus("백엔드 응답을 받았어요. 모의 응답 내용을 확인해 주세요.", "success");
  } catch (error) {
    const message = error instanceof TypeError
      ? "요청에 실패했어요. 백엔드 주소·실행 상태와 CORS 허용 여부를 확인해 주세요."
      : error.message;
    setStatus(message, "error");
  } finally {
    button.disabled = false;
  }
});
