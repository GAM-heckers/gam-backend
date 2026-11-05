import type {
  MockSeller,
  ProductInput,
  SmartStoreRegistrationFormData,
} from "./types.js";

export const mockSeller: MockSeller = {
  sellerId: "seller-demo-001",
  channel: "NAVER_SMARTSTORE",
  storeName: "청도 테스트 스토어",
  registrationStatus: "UNREGISTERED",
  isMock: true,
};

export const sampleProduct: ProductInput = {
  productName: "청도 반시 테스트 상품",
  price: 35000,
  boxCount: 1,
  weightKg: 10,
};

export const sampleRegistrationForm: SmartStoreRegistrationFormData = {
  product: {
    name: "청도 반시 10kg",
    categoryId: "50002167",
    statusType: "WAIT",
    salePrice: 30000,
    stockQuantity: 5,
    detailContent:
      "청도에서 수확한 반시입니다. 상품 구성과 보관 방법을 확인해 주세요. 본 설명은 화면 연동을 위한 예시입니다.",
    representativeImageUrl:
      "https://example.com/mock/chungdo-persimmon.jpg",
    naverShoppingRegistration: false,
    channelProductDisplayStatusType: "SUSPENSION",
  },
  originAndSupport: {
    minorPurchasable: true,
    originSearch: "청도군",
    originAreaCode: "0004820",
    originContent: "국산:경상북도>청도군",
    originPlural: false,
    afterServiceTelephoneNumber: "0000-0000",
    afterServiceGuideContent:
      "문의 사항은 판매자 고객센터로 연락해 주세요. (목업 안내)",
  },
  foodNotice: {
    noticeType: "FOOD",
    foodItem: "감",
    weight: "10kg",
    amount: "1박스",
    size: "혼합과 (예시)",
    producer: "청도 테스트 농가 (목업)",
    packDateText: "주문일에 따라 상이",
    consumptionDateText: "수령 후 가급적 빠르게 섭취해 주세요 (예시)",
    productComposition: "청도 반시 10kg",
    keep: "수령 후 냉장 보관해 주세요 (예시)",
    relevantLawContent: "농산물 관련 표시사항은 실제 판매 상품 기준으로 확인 필요",
    adCaution: "농산물 특성상 크기와 색상에 차이가 있을 수 있습니다 (예시)",
    customerServicePhoneNumber: "0000-0000",
    qualityAssuranceStandard: "실제 판매 상품의 품질 기준 확인 필요",
    compensationProcedure: "상품 상태 확인 후 판매자 고객센터로 문의해 주세요 (예시)",
    troubleShootingContents: "수령 후 이상이 있으면 사진과 함께 판매자에게 문의해 주세요 (예시)",
    returnCostReason: "상품 하자 여부 확인 후 안내 (예시)",
    noRefundReason: "신선식품 특성상 단순 변심 반품 제한 여부 확인 필요",
  },
  certification: {
    status: "excluded",
    infos: [],
  },
  unitPrice: {
    unitPriceYn: true,
    totalCapacityValue: 10,
    unitCapacity: 1,
    indicationUnit: "kg",
    taxType: "TAX",
  },
  deliveryAndClaims: {
    deliveryType: "DELIVERY",
    deliveryAttributeType: "NORMAL",
    deliveryCompany: "MOCK_COURIER",
    outboundLocationId: "MOCK_OUTBOUND_001",
    deliveryFee: {
      deliveryFeeType: "CONDITIONAL_FREE",
      baseFee: 3000,
      freeConditionalAmount: 50000,
      deliveryFeePayType: "PREPAID",
    },
    deliveryBundleGroupUsable: false,
    claimDeliveryInfo: {
      returnDeliveryCompanyPriorityType: "PRIMARY",
      returnDeliveryFee: 6000,
      exchangeDeliveryFee: 6000,
      shippingAddressId: 100001,
      returnAddressId: 100001,
      freeReturnInsuranceYn: false,
    },
  },
};
