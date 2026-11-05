const formContainer = document.querySelector("#form-container");
const statusMessage = document.querySelector("#app-status");

const enumLabels = {
  SALE: "판매 중",
  WAIT: "판매 대기",
  ON: "노출",
  SUSPENSION: "노출 중지",
  certified: "인증 보유",
  excluded: "인증 대상 아님",
  TAX: "과세",
  TAX_FREE: "면세",
  ZERO_TAX: "영세율",
  FREE: "무료",
  CONDITIONAL_FREE: "조건부 무료",
  CHARGE: "유료",
  DELIVERY: "택배",
  NORMAL: "일반",
  PREPAID: "선불",
  PRIMARY: "주 택배사",
};

const fieldHints = {
  category: "상품의 최종 카테고리를 네이버 판매자센터에서 확인해 입력해 주세요.",
  "image-file": "파일 선택은 미리보기만 지원합니다. 실제 등록에는 네이버 이미지 업로드와 공개 URL이 필요합니다.",
  "origin-search": "검색어를 입력하는 항목입니다. 원산지 코드는 네이버 검색 결과와 연결해야 합니다.",
  "origin-code": "실제 원산지 검색 결과에서 선택한 코드를 입력해 주세요.",
  "certification-status": "상품의 실제 인증 상태를 선택해 주세요. 인증 정보는 임의로 만들지 않습니다.",
  "delivery-company": "판매자센터에 등록된 택배사 코드를 입력해 주세요.",
  "outbound-location": "판매자센터에 등록된 출고지 ID를 입력해 주세요.",
  "shipping-address-id": "판매자센터에 등록된 교환 발송지 주소 ID를 입력해 주세요.",
  "return-address-id": "판매자센터에 등록된 반품 주소 ID를 입력해 주세요.",
};

const conditionalRequirements = {
  "certification-id": { field: "certification-status", required: true },
  "certification-kind": { field: "certification-status", required: true },
  "certification-number": { field: "certification-status", required: true },
  "certification-name": { field: "certification-status", required: true },
  "certification-company": { field: "certification-status", required: true },
  "certification-date": { field: "certification-status", required: false },
  "certification-mark": { field: "certification-status", required: true },
  "total-capacity": { field: "unit-price-yn", required: true },
  "unit-capacity": { field: "unit-price-yn", required: true },
  "indication-unit": { field: "unit-price-yn", required: true },
  "free-conditional-amount": { field: "delivery-fee-type", required: true },
};

const sectionNotes = {
  product: "상품명·가격·재고 등 상품의 기본 정보를 입력해 주세요.",
  "origin-and-support": "원산지와 판매자 안내는 실제 상품 및 판매자 정보로 입력해 주세요.",
  "food-notice": "상품정보제공고시는 실제 판매 상품에 적용되는 내용을 입력해야 합니다.",
  certification: "인증 정보는 상품이 실제로 보유한 경우에만 입력해 주세요.",
  "unit-price": "판매 중량과 가격 표시 단위를 판매자 설정에 맞게 입력해 주세요.",
  "delivery-and-claims": "배송·반품 정보는 판매자센터에 등록된 실제 값으로 입력해 주세요.",
};

const longTextFieldIds = new Set([
  "detail",
  "food-storage",
  "food-law",
  "food-caution",
  "food-quality",
  "food-compensation",
  "food-troubleshooting",
  "food-return-cost",
  "food-no-refund",
]);

const numberFormatter = new Intl.NumberFormat("ko-KR");

function makeElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function getFieldHint(field) {
  if (fieldHints[field.id]) return fieldHints[field.id];
  if (field.type === "enum" && !Array.isArray(field.allowedValues)) {
    return field.notes ?? "사용 가능한 값은 네이버 카테고리와 판매자 설정에서 확인해 주세요.";
  }
  return field.notes ?? "";
}

function isLongText(field) {
  return field.type === "string" && (
    longTextFieldIds.has(field.id) ||
    field.id.endsWith("-guide") ||
    field.label.includes("안내") ||
    field.label.includes("설명") ||
    field.label.includes("절차") ||
    field.label.includes("방법") ||
    field.label.includes("표시사항") ||
    field.label.includes("주의사항") ||
    field.label.includes("기준")
  );
}

function createFieldControl(field) {
  let control;
  const id = `field-${field.id}`;

  if (field.type === "enum" && Array.isArray(field.allowedValues)) {
    control = document.createElement("select");
    const emptyOption = document.createElement("option");
    emptyOption.value = "";
    emptyOption.textContent = "선택해 주세요";
    control.append(emptyOption);

    field.allowedValues.forEach((value) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = enumLabels[value] ?? value;
      control.append(option);
    });
  } else if (field.type === "boolean") {
    control = document.createElement("select");
    const emptyOption = document.createElement("option");
    emptyOption.value = "";
    emptyOption.textContent = "선택해 주세요";
    control.append(emptyOption);

    [
      { value: "true", label: "예" },
      { value: "false", label: "아니요" },
    ].forEach(({ value, label }) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      control.append(option);
    });
  } else if (field.type === "imageUpload") {
    control = document.createElement("input");
    control.type = "file";
    control.accept = (field.acceptedFormats ?? [])
      .map((format) => `.${format.toLowerCase()}`)
      .join(",");
    control.dataset.imageField = "true";
    if (field.maxSizeMB) control.dataset.maxSizeMb = String(field.maxSizeMB);
  } else if (field.type === "date") {
    control = document.createElement("input");
    control.type = "date";
  } else if (field.type === "integer" || field.type === "number") {
    control = document.createElement("input");
    control.type = "number";
    control.step = field.type === "integer" ? "1" : "any";
    control.inputMode = "decimal";
    control.min = field.id === "price" ? "1" : "0";
    if (field.unit === "KRW") control.inputMode = "numeric";
  } else if (isLongText(field)) {
    control = document.createElement("textarea");
    control.rows = field.id === "detail" ? 6 : 3;
  } else {
    control = document.createElement("input");
    control.type = "text";
    control.autocomplete = "off";
  }

  control.id = id;
  control.name = field.id;
  control.dataset.fieldId = field.id;
  control.required = field.requiredInForm === true;

  const hint = getFieldHint(field);
  if (hint) {
    control.setAttribute("aria-describedby", `${id}-hint`);
  }

  const wrapper = makeElement("div", "field");
  if (field.type === "imageUpload" || field.type === "string" && isLongText(field)) {
    wrapper.classList.add("field--wide");
  }

  const label = document.createElement("label");
  label.htmlFor = id;
  label.append(document.createTextNode(field.label));

  if (field.requiredInForm) {
    const requiredMark = makeElement("span", "required-mark", "*");
    requiredMark.setAttribute("aria-label", "양식 필수 입력");
    label.append(requiredMark);
  } else if (field.requiredWhen) {
    label.append(makeElement("span", "conditional-mark", "조건부 입력"));
  }

  wrapper.append(label);

  if (field.type === "imageUpload") {
    const fileBox = makeElement("div", "field-file");
    fileBox.append(control);
    const preview = document.createElement("img");
    preview.className = "image-preview";
    preview.alt = `${field.label} 미리보기`;
    preview.dataset.previewFor = field.id;
    fileBox.append(preview);
    wrapper.append(fileBox);
  } else {
    wrapper.append(control);
  }

  if (hint) {
    const hintElement = makeElement("p", "field-hint", hint);
    hintElement.id = `${id}-hint`;
    wrapper.append(hintElement);
  }

  if (field.unit) {
    const unitHint = makeElement("p", "field-hint", `단위: ${field.unit}`);
    wrapper.append(unitHint);
  }

  if (field.example !== undefined && !hint) {
    const exampleHint = makeElement("p", "field-hint", `입력 예시: ${field.example}`);
    wrapper.append(exampleHint);
  }

  const dependentOn = conditionalRequirements[field.id];
  if (dependentOn) {
    wrapper.classList.add("conditional-field");
    wrapper.dataset.dependentOn = dependentOn.field;
    wrapper.dataset.requiredWhenActive = String(dependentOn.required);
    wrapper.hidden = true;
    control.required = false;
  }

  return wrapper;
}

function createSection(section, index) {
  const details = document.createElement("details");
  details.className = "form-section";
  details.open = index === 0;
  details.dataset.sectionId = section.id;

  const summary = document.createElement("summary");
  const titleGroup = makeElement("span", "section-title");
  titleGroup.append(makeElement("span", "section-number", String(index + 1)));
  titleGroup.append(document.createTextNode(section.title));
  summary.append(titleGroup);
  summary.append(makeElement("span", "section-count", `${section.fields.length}개 항목`));
  details.append(summary);

  const content = makeElement("div", "section-content");
  const note = makeElement(
    "p",
    "section-note",
    sectionNotes[section.id] ?? section.notes?.join(" ") ?? "",
  );
  content.append(note);

  const grid = makeElement("div", "field-grid");
  section.fields.forEach((field) => grid.append(createFieldControl(field)));
  content.append(grid);
  details.append(content);
  return details;
}

function fieldValue(id) {
  return formContainer.querySelector(`[name="${CSS.escape(id)}"]`)?.value ?? "";
}

function updateConditionalFields() {
  formContainer.querySelectorAll(".conditional-field").forEach((wrapper) => {
    const { dependentOn } = wrapper.dataset;
    const value = fieldValue(dependentOn);
    let active = false;

    if (dependentOn === "certification-status") {
      active = value === "certified";
    } else if (dependentOn === "unit-price-yn") {
      active = value === "true";
    } else if (dependentOn === "delivery-fee-type") {
      active = value === "CONDITIONAL_FREE";
    }

    wrapper.hidden = !active;
    const control = wrapper.querySelector("input, select, textarea");
    control.required = active && wrapper.dataset.requiredWhenActive === "true";
  });
}

function parseWeightInKg(value) {
  const match = value.trim().replaceAll(",", "").match(/^(\d+(?:\.\d+)?)\s*(kg|g)?$/i);
  if (!match) return null;

  const amount = Number(match[1]);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return match[2]?.toLowerCase() === "g" ? amount / 1000 : amount;
}

function updateUnitPrice() {
  const price = Number(fieldValue("price"));
  const weight = parseWeightInKg(fieldValue("food-weight"));
  const output = formContainer.querySelector("[data-unit-price]");
  const value = Number.isFinite(price) && price > 0 && weight ? price / weight : null;
  output.textContent = value === null
    ? "중량과 판매 가격을 입력하면 계산돼요."
    : `${numberFormatter.format(Math.round(value))}원 / kg`;
}

function createDerivedUnitPrice() {
  const wrapper = makeElement("div", "field field--wide");
  wrapper.append(makeElement("span", "field-label", "kg당 상품 가격"));
  const price = makeElement("div", "derived-price");
  price.setAttribute("aria-live", "polite");
  price.append(makeElement("strong", "", "계산 전"));
  price.firstElementChild.dataset.unitPrice = "true";
  price.append(makeElement("span", "field-hint", "상품정보제공고시의 중량을 kg 또는 g 단위로 입력해 주세요."));
  wrapper.append(price);
  return wrapper;
}

function validateImage(input) {
  const file = input.files?.[0];
  if (!file) return true;

  const maxSizeMb = Number(input.dataset.maxSizeMb);
  if (maxSizeMb && file.size > maxSizeMb * 1024 * 1024) {
    input.setCustomValidity(`이미지 파일은 ${maxSizeMb}MB 이하로 선택해 주세요.`);
    return false;
  }

  input.setCustomValidity("");
  return true;
}

function handleImageChange(input) {
  const file = input.files?.[0];
  const preview = formContainer.querySelector(`[data-preview-for="${CSS.escape(input.dataset.fieldId)}"]`);
  validateImage(input);

  if (preview.dataset.objectUrl) {
    URL.revokeObjectURL(preview.dataset.objectUrl);
    delete preview.dataset.objectUrl;
  }

  if (!file || !file.type.startsWith("image/")) {
    preview.removeAttribute("src");
    preview.classList.remove("is-visible");
    return;
  }

  const url = URL.createObjectURL(file);
  preview.src = url;
  preview.dataset.objectUrl = url;
  preview.classList.add("is-visible");
}

function readFormValue(field) {
  const control = formContainer.querySelector(`[name="${CSS.escape(field.id)}"]`);
  if (field.type === "imageUpload") return control.files?.[0]?.name ?? "";
  if (field.type === "boolean") {
    if (control.value === "true") return "예";
    if (control.value === "false") return "아니요";
  }
  if (field.type === "enum") return enumLabels[control.value] ?? control.value;
  return control.value.trim();
}

function createReview(schema) {
  const card = makeElement("section", "review-card");
  card.setAttribute("aria-labelledby", "review-title");
  const heading = makeElement("h2", "", "");
  heading.id = "review-title";
  heading.append(makeElement("span", "review-icon", "✓"));
  heading.append(document.createTextNode("입력 내용을 확인했어요"));
  card.append(heading);
  card.append(makeElement("p", "", "아래 내용은 이 화면에서 확인한 요약입니다. 네이버 스마트스토어에는 아직 전달되지 않았어요."));

  const summaryGrid = makeElement("div", "review-grid");
  const summaryFields = [
    { id: "name", label: "상품명" },
    { id: "price", label: "판매 가격" },
    { id: "food-weight", label: "포장 중량" },
    { id: "stock", label: "재고 수량" },
  ];

  summaryFields.forEach(({ id, label }) => {
    const field = schema.sections.flatMap((section) => section.fields).find((item) => item.id === id);
    if (!field) return;
    const value = readFormValue(field);
    if (!value) return;

    const item = makeElement("div", "review-item");
    item.append(makeElement("span", "", label));
    item.append(makeElement("strong", "", value));
    summaryGrid.append(item);
  });

  const filledCount = schema.sections
    .flatMap((section) => section.fields)
    .filter((field) => {
      const control = formContainer.querySelector(`[name="${CSS.escape(field.id)}"]`);
      return readFormValue(field) !== "" && !control.closest(".conditional-field")?.hidden;
    })
    .length;
  const totalCount = schema.sections.reduce((sum, section) => sum + section.fields.length, 0);

  const itemCount = makeElement("div", "review-item");
  itemCount.append(makeElement("span", "", "입력한 항목"));
  itemCount.append(makeElement("strong", "", `${filledCount} / ${totalCount}개`));
  summaryGrid.append(itemCount);
  card.append(summaryGrid);

  const notice = makeElement("div", "notice");
  notice.setAttribute("role", "note");
  notice.append(makeElement("span", "notice-icon", "i"));
  notice.append(makeElement("p", "", "네이버 상품 API 요청 형식으로 변환하거나 실제 등록을 보내는 기능은 아직 연결되지 않았습니다. 판매처별 필수 설정과 입력값을 확인한 뒤 이어서 연결해야 합니다."));
  card.append(notice);

  const backButton = makeElement("button", "secondary-button", "입력 내용 수정하기");
  backButton.type = "button";
  backButton.addEventListener("click", () => {
    formContainer.querySelector(".form-card").hidden = false;
    formContainer.querySelector(".review-card")?.remove();
    formContainer.querySelector(".form-card").scrollIntoView({ behavior: "smooth", block: "start" });
  });
  card.append(backButton);

  return card;
}

function renderForm(schema) {
  formContainer.replaceChildren();
  const form = document.createElement("form");
  form.className = "form-card";
  form.noValidate = true;

  const intro = makeElement("div", "form-intro");
  const introText = document.createElement("div");
  introText.append(makeElement("h2", "", "네이버 스마트스토어 상품 정보"));
  introText.append(makeElement("p", "", "실제 상품과 판매자 설정을 확인해 입력해 주세요. 예시값은 자동으로 입력되지 않습니다."));
  intro.append(introText);
  const totalFields = schema.sections.reduce((sum, section) => sum + section.fields.length, 0);
  intro.append(makeElement("span", "field-count", `${totalFields}개 입력 항목`));
  form.append(intro);

  const sections = makeElement("div", "form-sections");
  const foodSection = schema.sections.find((section) => section.id === "food-notice");
  const weightField = foodSection?.fields.find((field) => field.id === "food-weight");
  schema.sections.forEach((section, index) => {
    let displayedSection = section;
    if (section.id === "product" && weightField) {
      displayedSection = { ...section, fields: [...section.fields, weightField] };
    } else if (section.id === "food-notice" && weightField) {
      displayedSection = {
        ...section,
        fields: section.fields.filter((field) => field.id !== "food-weight"),
      };
    }
    sections.append(createSection(displayedSection, index));
  });

  const productGrid = sections.querySelector('[data-section-id="product"] .field-grid');
  if (productGrid) productGrid.append(createDerivedUnitPrice());

  form.append(sections);
  const actions = makeElement("div", "form-actions");
  actions.append(makeElement("p", "", "* 표시는 현재 입력 양식에서 요구하는 항목입니다. 네이버의 실제 필수 여부는 카테고리·계정 설정에 따라 달라질 수 있습니다."));
  const submitButton = makeElement("button", "primary-button", "입력 내용 확인하기");
  submitButton.type = "submit";
  actions.append(submitButton);
  form.append(actions);
  formContainer.append(form);

  form.addEventListener("input", updateUnitPrice);
  form.addEventListener("change", (event) => {
    if (event.target.matches("[data-image-field]")) handleImageChange(event.target);
    updateConditionalFields();
    updateUnitPrice();
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    form.querySelectorAll("[data-image-field]").forEach(validateImage);
    updateConditionalFields();

    if (!form.checkValidity()) {
      statusMessage.textContent = "필수 항목과 입력값을 확인해 주세요.";
      const invalid = form.querySelector(":invalid");
      invalid?.closest("details")?.setAttribute("open", "");
      invalid?.reportValidity();
      invalid?.focus();
      return;
    }

    statusMessage.textContent = "";
    form.hidden = true;
    formContainer.append(createReview(schema));
    formContainer.querySelector(".review-card").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  updateConditionalFields();
  updateUnitPrice();
  statusMessage.textContent = "상품 입력 항목을 준비했습니다. 네이버 상품 API는 아직 연결되지 않았습니다.";
}

async function initialize() {
  try {
    const response = await fetch("./product-registration-fields.json");
    if (!response.ok) {
      throw new Error(`입력 항목을 불러오지 못했습니다 (HTTP ${response.status}).`);
    }

    const schema = await response.json();
    if (!Array.isArray(schema.sections) || schema.sections.length === 0) {
      throw new Error("입력 항목 파일에 표시할 섹션이 없습니다.");
    }

    renderForm(schema);
  } catch (error) {
    const errorCard = makeElement("section", "load-error");
    errorCard.setAttribute("role", "alert");
    errorCard.append(makeElement("h2", "", "상품 입력 항목을 불러오지 못했어요"));
    errorCard.append(makeElement("p", "", `${error.message} Frontend 폴더의 index.html을 로컬 웹 서버로 열어 주세요.`));
    formContainer.replaceChildren(errorCard);
    statusMessage.textContent = "";
  }
}

initialize();
