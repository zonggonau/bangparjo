// Auto-generated CJ Dropshipping API Types
// Based on Interface Field Definitions _ CJ Docs.mhtml

export interface CJSystemFields {
  /** error code - Reference error code */
  code?: number;
  /** Whether or not the return is normal */
  result?: boolean;
  /** return message */
  message?: string;
  /** return data - interface data return */
  data?: Record<string, unknown> // object;
  /** requestId - Flag request for logging errors */
  requestId?: string;
}

export interface CJPublicFields {
  /** area id */
  areaId?: string;
  /** area name */
  areaEn?: string;
  /** country code */
  countryCode?: string;
}

export interface CJAuthenticationFields {
  /** Email */
  email?: string;
  /** Password */
  password?: string;
}

export interface CJSettingsFields {
  /** Account ID */
  openId?: string;
  /** Account Name */
  openName?: string;
  /** Account Email */
  openEmail?: string;
  /** Root access - root：NO_PERMISSION - not authorized */
  root?: string;
  /** (Whether) Sandbox account */
  isSandbox?: number;
}

export interface CJProductFields {
  /** Product ID */
  pid?: string;
  /** Product name */
  productName?: string;
  /** Product name（EN） */
  productNameEn?: string;
  /** Product sku */
  productSku?: string;
  /** Product image */
  productImage?: string;
  /** Product weight - unit: g */
  productWeight?: number;
  /** Product type */
  productType?: number;
  /** Product unit */
  productUnit?: string;
  /** Category id */
  categoryId?: string;
  /** Category name */
  categoryName?: string;
  /** HS code */
  entryCode?: string;
  /** Customs name */
  entryName?: string;
  /** Customs name (EN) */
  entryNameEn?: string;
  /** Material */
  materialName?: string;
  /** Material (EN) */
  materialNameEn?: string;
  /** Material attribute */
  materialKey?: string;
  /** Package weight - unit: g */
  packWeight?: number;
  /** Package name */
  packingName?: string;
  /** Package name (EN) */
  packingNameEn?: string;
  /** Package attribute */
  packingKey?: string;
  /** (Whether) Active */
  isActive?: boolean;
  /** Description */
  description?: string;
}

export interface CJStorageFields {
  /** Warehouse id */
  storageId?: string;
  /** Warehouse Name */
  storageName?: string;
}

export interface CJTransactionFields {
  /** Order Id */
  orderId?: string;
  /** order weight */
  orderWeight?: number;
  /** order amount - unit: $ (USD) */
  orderAmount?: number;
  /** order status */
  orderStatus?: string;
}

export interface CJLogisticsFields {
  /** Shipping cost - unit: $ (USD) */
  logisticPrice?: number;
  /** Shipping cost - unit: ￥ (CNY) */
  logisticPriceCn?: number;
  /** Estimated delivery timespan */
  logisticAging?: string;
  /** Shipping method */
  logisticName?: string;
}
