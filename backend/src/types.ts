export interface ProductInput {
  productName: string;
  price: number;
  boxCount: number;
  weightKg: number;
}

export interface MockSeller {
  sellerId: string;
  channel: "NAVER_SMARTSTORE";
  storeName: string;
  registrationStatus: "UNREGISTERED";
  isMock: true;
}

export interface SmartStoreProductDraft {
  seller: MockSeller;
  product: {
    productName: string;
    price: number;
    priceCurrency: "KRW";
    boxCount: number;
    weightKg: number;
  };
  naverMapping: {
    productName: string;
    salePrice: {
      amount: number;
      currency: "KRW";
    };
    boxCount: number;
    weight: {
      value: number;
      unit: "KG";
    };
  };
  integration: {
    mode: "MOCK";
    externalApiReady: false;
  };
}

export interface SmartStoreRegistrationFormData {
  product: {
    name: string;
    categoryId: string;
    statusType: "SALE" | "WAIT";
    salePrice: number;
    stockQuantity: number;
    detailContent: string;
    representativeImageUrl: string;
    naverShoppingRegistration: boolean;
    channelProductDisplayStatusType: "ON" | "SUSPENSION";
  };
  originAndSupport: {
    minorPurchasable: boolean;
    originSearch: string;
    originAreaCode: string;
    originContent: string;
    originPlural: boolean;
    afterServiceTelephoneNumber: string;
    afterServiceGuideContent: string;
  };
  foodNotice: {
    noticeType: "FOOD";
    foodItem: string;
    weight: string;
    amount: string;
    size: string;
    producer: string;
    packDateText: string;
    consumptionDateText: string;
    productComposition: string;
    keep: string;
    relevantLawContent: string;
    adCaution: string;
    customerServicePhoneNumber: string;
    qualityAssuranceStandard: string;
    compensationProcedure: string;
    troubleShootingContents: string;
    returnCostReason: string;
    noRefundReason: string;
  };
  certification: {
    status: "certified" | "excluded";
    infos: {
      certificationInfoId: number;
      certificationKindType: string;
      certificationNumber: string;
      name: string;
      companyName: string;
      certificationDate: string;
      certificationMark: boolean;
    }[];
  };
  unitPrice: {
    unitPriceYn: boolean;
    totalCapacityValue: number;
    unitCapacity: number;
    indicationUnit: string;
    taxType: "TAX" | "TAX_FREE" | "ZERO_TAX";
  };
  deliveryAndClaims: {
    deliveryType: string;
    deliveryAttributeType: string;
    deliveryCompany: string;
    outboundLocationId: string;
    deliveryFee: {
      deliveryFeeType: "FREE" | "CONDITIONAL_FREE" | "CHARGE";
      baseFee: number;
      freeConditionalAmount: number;
      deliveryFeePayType: string;
    };
    deliveryBundleGroupUsable: boolean;
    claimDeliveryInfo: {
      returnDeliveryCompanyPriorityType: string;
      returnDeliveryFee: number;
      exchangeDeliveryFee: number;
      shippingAddressId: number;
      returnAddressId: number;
      freeReturnInsuranceYn: boolean;
    };
  };
}

export type ProductValidationResult =
  | { success: true; data: ProductInput }
  | { success: false; errors: string[] };
