const statusMessage = document.querySelector("#app-status");
const form = document.querySelector("#product-form");
const photoInput = document.querySelector("#product-photo");
const photoPreviewWrap = document.querySelector("#photo-preview-wrap");
const photoPreview = document.querySelector("#photo-preview");
const photoDialog = document.querySelector("#photo-dialog");
const photoName = document.querySelector("#photo-name");
const analyzeButton = document.querySelector("#analyze-button");
const apiBaseUrl = document.querySelector("#api-base-url");
const analysisPanel = document.querySelector("#analysis-panel");
const rawResultPanel = document.querySelector("#raw-result-panel");
const completeReviewButton = document.querySelector("#complete-review-button");
const numberFormatter = new Intl.NumberFormat("ko-KR");
const imageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxImageSizeBytes = 10 * 1024 * 1024;
let previewUrl;

function setStatus(message, kind = "") {
  statusMessage.textContent = message;
  statusMessage.className = `status-message${kind ? ` status-message--${kind}` : ""}`;
}

function apiUrl(path) {
  let base;
  try {
    base = new URL(apiBaseUrl.value.trim());
  } catch {
    throw new Error("AI 서비스 주소를 올바르게 입력해 주세요.");
  }
  if (!["http:", "https:"].includes(base.protocol)) {
    throw new Error("AI 서비스 주소는 http 또는 https 주소여야 합니다.");
  }
  return `${base.href.replace(/\/+$/, "")}${path}`;
}

function clearDraft() {
  form.reset();
  document.querySelector("#unit-price").textContent = "가격과 중량을 입력하면 계산돼요.";
  analysisPanel.hidden = true;
  rawResultPanel.hidden = true;
  completeReviewButton.disabled = true;
}

function updateProgress(activeStep) {
  document.querySelectorAll(".stepper li").forEach((step, index) => {
    step.classList.toggle("is-current", index === activeStep);
    step.classList.toggle("is-complete", index < activeStep);
    if (index === activeStep) {
      step.setAttribute("aria-current", "step");
    } else {
      step.removeAttribute("aria-current");
    }
  });
}

function hasDraftValues() {
  return [...form.elements].some((element) => element.value.trim() !== "");
}

function updateUnitPrice() {
  const price = Number(form.elements.price.value);
  const weightKg = Number(form.elements.weightKg.value);
  const output = document.querySelector("#unit-price");
  if (Number.isFinite(price) && price > 0 && Number.isFinite(weightKg) && weightKg > 0) {
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
    analyzeButton.disabled = true;
    return;
  }

  if (!imageTypes.has(file.type)) {
    photoInput.value = "";
    photoPreviewWrap.hidden = true;
    analyzeButton.disabled = true;
    setStatus("JPG, PNG 또는 WEBP 사진을 선택해 주세요.", "error");
    return;
  }
  if (file.size > maxImageSizeBytes) {
    photoInput.value = "";
    photoPreviewWrap.hidden = true;
    analyzeButton.disabled = true;
    setStatus("사진은 10MB 이하로 선택해 주세요.", "error");
    return;
  }

  previewUrl = URL.createObjectURL(file);
  photoPreview.src = previewUrl;
  document.querySelector("#photo-large-preview").src = previewUrl;
  photoName.textContent = file.name;
  photoPreviewWrap.hidden = false;
  analysisPanel.hidden = true;
  rawResultPanel.hidden = true;
  updateProgress(0);
  analyzeButton.disabled = false;
  setStatus(
    hasDraftValues()
      ? "새 사진을 선택했어요. 분석에 성공하면 기존 입력값이 새 결과로 바뀝니다."
      : "사진을 확인했어요. 사진 분석하기를 누르면 AI 백엔드로 전송됩니다.",
    "success",
  );
});

document.querySelector("#photo-zoom-button").addEventListener("click", () => {
  if (previewUrl && typeof photoDialog.showModal === "function") {
    photoDialog.showModal();
  }
});

document.querySelector("#close-photo-dialog").addEventListener("click", () => {
  photoDialog.close();
});

function setTextField(name, value) {
  if (typeof value === "string" || typeof value === "number") {
    form.elements[name].value = String(value);
  }
}

function renderList(container, values) {
  container.replaceChildren();
  values.forEach((value) => {
    const item = document.createElement("li");
    item.textContent = String(value);
    container.append(item);
  });
}

function applyAnalysis(responseData) {
  const analysis = responseData.analysis;
  if (!analysis || typeof analysis !== "object") {
    throw new Error("백엔드 응답에 analysis 결과가 없습니다.");
  }

  clearDraft();
  setTextField("productName", analysis.productName);
  setTextField("fruitType", analysis.fruitType);
  setTextField("size", analysis.size);
  setTextField("price", analysis.price);
  setTextField("weightKg", analysis.weightKg);
  setTextField("boxCount", analysis.boxCount);
  setTextField("productDescription", analysis.productDescription);
  updateUnitPrice();

  const confirmationItems = Array.isArray(analysis.needsConfirmation)
    ? analysis.needsConfirmation
    : [];
  const confirmationBox = document.querySelector("#confirmation-box");
  confirmationBox.hidden = confirmationItems.length === 0;
  renderList(document.querySelector("#confirmation-list"), confirmationItems);

  const visibleText = Array.isArray(analysis.visibleText) ? analysis.visibleText : [];
  const visibleTextBox = document.querySelector("#visible-text-box");
  visibleTextBox.hidden = visibleText.length === 0;
  renderList(document.querySelector("#visible-text-list"), visibleText);

  document.querySelector("#analysis-caption").textContent =
    responseData.reviewRequired === true
      ? "AI가 사진에서 읽거나 추정한 초안입니다. 모든 항목을 직접 확인해 주세요."
      : "AI 분석 결과를 받았습니다. 실제 상품 정보를 확인해 주세요.";
  document.querySelector("#provider-label").textContent =
    `분석 제공자: ${responseData.provider || "응답에 정보 없음"} · 사용자가 확인해야 하는 초안`;
  document.querySelector("#raw-response").textContent =
    JSON.stringify(responseData, null, 2);
  completeReviewButton.disabled = false;
  updateProgress(1);
  analysisPanel.hidden = false;
  rawResultPanel.hidden = false;
}

async function readResponse(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { detail: text };
  }
}

function errorMessageForResponse(status, body) {
  if (status === 400) {
    return body.message || "지원하는 사진인지 확인해 주세요 (JPG, PNG, WEBP).";
  }
  if (status === 413) {
    return "사진 용량이 너무 커요. 10MB 이하의 사진을 선택해 주세요.";
  }
  if (status === 503) {
    return body.detail || "AI 서비스가 설정되지 않았습니다. 백엔드의 Azure OpenAI 설정을 확인해 주세요.";
  }
  if (status === 502) {
    return body.detail || body.title || "사진 분석에 실패했어요. 잠시 후 다시 시도해 주세요.";
  }
  return body.detail || body.message || body.title || `사진 분석 요청에 실패했어요 (HTTP ${status}).`;
}

analyzeButton.addEventListener("click", async () => {
  const file = photoInput.files?.[0];
  if (!file) {
    setStatus("먼저 분석할 사진을 선택해 주세요.", "error");
    return;
  }

  analyzeButton.disabled = true;
  analysisPanel.hidden = true;
  rawResultPanel.hidden = true;
  setStatus("사진을 백엔드로 보내 AI 분석을 요청하고 있어요. 잠시 기다려 주세요.");

  try {
    const body = new FormData();
    body.append("image", file, file.name);
    const response = await fetch(apiUrl("/api/agent/product-image/analyze"), {
      method: "POST",
      body,
    });
    const responseData = await readResponse(response);
    if (!response.ok) {
      setStatus(errorMessageForResponse(response.status, responseData), "error");
      return;
    }

    applyAnalysis(responseData);
    setStatus("사진 분석 결과를 받았어요. 입력된 내용을 확인하고 필요한 부분을 고쳐주세요.", "success");
    analysisPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    setStatus(
      error instanceof TypeError
        ? "백엔드에 연결하지 못했어요. AI 서비스 주소, 실행 상태, CORS 설정을 확인해 주세요."
        : error.message,
      "error",
    );
  } finally {
    analyzeButton.disabled = false;
  }
});

form.addEventListener("input", updateUnitPrice);

completeReviewButton.addEventListener("click", () => {
  updateProgress(2);
  setStatus("상품 초안 확인을 마쳤어요. 내용은 저장되거나 네이버로 전송되지 않았습니다.", "success");
  document.querySelector(".stepper").scrollIntoView({ behavior: "smooth", block: "center" });
});

document.querySelector("#health-button").addEventListener("click", async (event) => {
  const button = event.currentTarget;
  button.disabled = true;
  setStatus("AI 백엔드 연결을 확인하고 있어요.");
  try {
    const response = await fetch(apiUrl("/health"));
    const body = await readResponse(response);
    if (!response.ok) {
      setStatus(`AI 백엔드가 오류 응답을 보냈어요 (HTTP ${response.status}).`, "error");
      return;
    }
    if (body.status !== "ok") {
      setStatus("AI 백엔드에 연결됐지만 상태 응답을 확인할 수 없어요.", "warning");
      return;
    }
    setStatus("AI 백엔드에 연결됐어요. Azure OpenAI 설정은 사진 분석 요청 때 확인됩니다.", "success");
  } catch (error) {
    setStatus(
      error instanceof TypeError
        ? "연결할 수 없어요. 서비스 주소, 실행 상태, CORS 설정을 확인해 주세요."
        : error.message,
      "error",
    );
  } finally {
    button.disabled = false;
  }
});

window.addEventListener("beforeunload", () => {
  if (previewUrl) URL.revokeObjectURL(previewUrl);
});
