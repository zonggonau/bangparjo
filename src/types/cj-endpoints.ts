// Auto-generated CJ Dropshipping API Types
// Note: Names are derived from documentation headings.

export interface StorageCurlRequest {
  /** Storage ID */
  id?: string;
}

export interface StorageReturnResponse {
  /** Storage Id */
  id?: string;
  /** name */
  name?: string;
  /** area id */
  areaId?: number;
  /** country code */
  areaCountryCode?: string;
  /** province */
  province?: string;
  /** city */
  city?: string;
  /** address1 */
  address1?: string;
  /** address2 */
  address2?: string;
  /** contacts */
  contacts?: string;
  /** phone number */
  phone?: string;
  /** Is support self pickup */
  isSelfPickup?: number;
  /** zip Code */
  zipCode?: string;
  /** Supported logistics brands */
  logisticsBrandList?: string;
}

export interface StorageReturnResponse2 {
  /** error code */
  code?: number;
  /** Whether or not the return is normal */
  result?: boolean;
  /** return message */
  message?: string;
  /** return data */
  data?: Record<string, unknown>;
  /** requestId */
  requestId?: string;
}

export interface ShoppingCurlRequest {
  /** A unique identifier for the order from CJ partner. */
  orderNumber?: string;
  /** Zip of destination */
  shippingZip?: string;
  /** Country code of destination */
  shippingCountryCode?: string;
  /** Country of destination */
  shippingCountry?: string;
  /** Province of destination */
  shippingProvince?: string;
  /** City of destination */
  shippingCity?: string;
  /** County of destination */
  shippingCounty?: string;
  /** Phone number of destination */
  shippingPhone?: string;
  /** Customer name */
  shippingCustomerName?: string;
  /** Shipping address of destination */
  shippingAddress?: string;
  /** Shipping address 2 of destination */
  shippingAddress2?: string;
  /** House Number */
  houseNumber?: string;
  /** Email */
  email?: string;
  /** Tax Id */
  taxId?: string;
  /** Order remark */
  remark?: string;
  /** consignee id */
  consigneeID?: string;
  /** Payment type */
  payType?: number;
  /** Order Amount */
  shopAmount?: number;
  /** logistic name */
  logisticName?: string;
  /** Country code of the shipment from */
  fromCountryCode?: string;
  /** Platform, Default: Api */
  platform?: string;
  /** IOSS Type */
  iossType?: number;
  /** Shipping mode, default value: 2 */
  shopLogisticsType?: number;
  /** CJ warehouse ID */
  storageId?: string;
  /** IOSS Number */
  iossNumber?: string;
  /** Store name */
  storeName?: string;
  /** Store order time */
  storeOrderTime?: string;
  products?: string;
  /** CJ variant id */
  vid?: string;
  /** CJ variant sku */
  sku?: string;
  /** quantity */
  quantity?: number;
  /** item pricing */
  unitPrice?: number;
  /** lineItemId of your store order */
  storeLineItemId?: string;
  /** POD customization information */
  podProperties?: string;
}

export interface ShoppingReturnResponse2 {
  /** CJ order id */
  orderId?: string;
  /** orderNumber */
  orderNumber?: string;
  /** shipment order id */
  shipmentOrderId?: string;
  /** ioss amount */
  iossAmount?: number;
  /** ioss tax */
  iossTaxHandlingFee?: number;
  /** postage amount */
  postageAmount?: number;
  /** product amount */
  productAmount?: number;
  /** total amount of products (before discount) */
  productOriginalAmount?: number;
  /** product discount amount */
  productDiscountAmount?: number;
  /** postage discount amount */
  postageDiscountAmount?: number;
  /** postage amount   (before discount) */
  postageOriginalAmount?: number;
  /** the total amount of the order after discount */
  totalDiscountAmount?: number;
  /** the amount actually paid */
  actualPayment?: number;
  /** original order amount */
  orderOriginalAmount?: number;
  /** CJ pay url */
  cjPayUrl?: string;
  /** order amount */
  orderAmount?: number;
  /** logistics missing mark */
  logisticsMiss?: boolean;
  /** Order status */
  orderStatus?: string;
  /** product information */
  productInfoList?: string;
  /** order interception information */
  interceptOrderReasons?: string;
}

export interface ShoppingReturnResponse3 {
  /** lineItemId of your store order */
  storeLineItemId?: string;
  /** lineItemId of CJ order */
  lineItemId?: string;
  /** variant id */
  variantId?: string;
  /** quantity */
  quantity?: number;
  /** Main product label */
  isGroup?: boolean;
  /** combination product */
  subOrderProducts?: string;
}

export interface ShoppingReturnResponse4 {
  /** code */
  code?: number;
  /** message */
  message?: string;
}

export interface ShoppingCurlRequest2 {
  /** A unique identifier for the order from CJ partner. */
  orderNumber?: string;
  /** Zip of destination */
  shippingZip?: string;
  /** Country code of destination */
  shippingCountryCode?: string;
  /** Country of destination */
  shippingCountry?: string;
  /** Province of destination */
  shippingProvince?: string;
  /** City of destination */
  shippingCity?: string;
  /** County of destination */
  shippingCounty?: string;
  /** Phone number of destination */
  shippingPhone?: string;
  /** Customer name */
  shippingCustomerName?: string;
  /** Shipping address of destination */
  shippingAddress?: string;
  /** Shipping address 2 of destination */
  shippingAddress2?: string;
  /** House Number */
  houseNumber?: string;
  /** Email */
  email?: string;
  /** Tax Id */
  taxId?: string;
  /** Order remark */
  remark?: string;
  /** consignee id */
  consigneeID?: string;
  /** Order Amount */
  shopAmount?: number;
  /** logistic name */
  logisticName?: string;
  /** Country code of the shipment from */
  fromCountryCode?: string;
  /** Platform, Default: Api */
  platform?: string;
  /** IOSS Type */
  iossType?: number;
  /** IOSS Number */
  iossNumber?: string;
  /** Shipping mode, default value: 2 */
  shopLogisticsType?: number;
  /** CJ warehouse ID */
  storageId?: string;
  /** Store name */
  storeName?: string;
  /** Store order time */
  storeOrderTime?: string;
  products?: string;
  /** CJ variant ID */
  vid?: string;
  /** CJ variant sku */
  sku?: string;
  /** quantity */
  quantity?: number;
  /** item pricing */
  unitPrice?: number;
  /** lineItemId of your store order */
  storeLineItemId?: string;
  /** POD customization information */
  podProperties?: string;
}

export interface ShoppingCurlRequest3 {
  /** CJ order id */
  cjOrderIdList?: string;
}

export interface ShoppingReturnResponse13 {
  /** error code */
  code?: number;
  /** Whether or not the return is normal */
  result?: boolean;
  /** return message */
  message?: string;
  /** return data */
  data?: Record<string, unknown>;
  /** Success Count */
  successCount?: string;
  /** Is the submission successful */
  submitSuccess?: string;
  /** Shipment Order Id */
  shipmentsId?: string;
  /** Intercepted order ID List */
  interceptOrders?: string;
  /** requestId */
  requestId?: string;
}

export interface ShoppingCurlRequest5 {
  /** Shipment Order Id */
  shipmentOrderId?: string;
}

export interface ShoppingCurlRequest6 {
  /** Page number */
  pageNum?: number;
  /** Quantity of results on each page */
  pageSize?: number;
  /** order id */
  orderIds?: string;
  /** Shipment Order Id */
  shipmentOrderId?: string;
  /** order status */
  status?: string;
}

export interface ShoppingReturnResponse17 {
  /** order id */
  orderId?: string;
  /** order name */
  orderNum?: string;
  /** CJ order id */
  cjOrderId?: string;
  /** country code */
  shippingCountryCode?: string;
  /** province */
  shippingProvince?: string;
  /** city */
  shippingCity?: string;
  /** shipping address */
  shippingAddress?: string;
  /** shipping name */
  shippingCustomerName?: string;
  /** phone number */
  shippingPhone?: string;
  /** order remark */
  remark?: string;
  /** logistic name */
  logisticName?: string;
  /** track number */
  trackNumber?: string;
  /** tracking URL */
  trackingUrl?: string;
  /** order weight */
  orderWeight?: number;
  /** order amount */
  orderAmount?: number;
  /** order status */
  orderStatus?: string;
  /** create time */
  createDate?: string;
  /** pay time */
  paymentDate?: string;
  /** Store order creation time */
  storeCreateDate?: string;
  /** product amount */
  productAmount?: number;
  /** postage amount */
  postageAmount?: number;
  /** storage id */
  storageId?: string;
  /** storage name */
  storageName?: string;
}

export interface ShoppingRequestParametersRequest {
  /** order id */
  orderId?: string;
  /** features */
  features?: string;
}

export interface ShoppingResponseResponse {
  /** order id */
  orderId?: string;
  /** order name */
  orderNum?: string;
  /** Shop order ID */
  platformOrderId?: string;
  /** CJ order id */
  cjOrderId?: string;
  /** CJ order code */
  cjOrderCode?: string;
  /** shipment country code */
  fromCountryCode?: string;
  /** Recipient country code */
  shippingCountryCode?: string;
  /** Recipient province */
  shippingProvince?: string;
  /** Recipient city */
  shippingCity?: string;
  /** Recipient address */
  shippingAddress?: string;
  /** Recipient name */
  shippingCustomerName?: string;
  /** Recipient phone number */
  shippingPhone?: string;
  /** order remark */
  remark?: string;
  /** logistic name */
  logisticName?: string;
  /** track number */
  trackNumber?: string;
  /** tracking URL */
  trackingUrl?: string;
  /** CJ dispute ID */
  disputeId?: string;
  /** order weight */
  orderWeight?: number;
  /** Order amount */
  orderAmount?: number;
  /** Order status */
  orderStatus?: string;
  /** Create time */
  createDate?: string;
  /** Pay time */
  paymentDate?: string;
  /** Delivery time */
  outWarehouseTime?: string;
  /** Store order creation time */
  storeCreateDate?: string;
  /** product amount */
  productAmount?: number;
  /** Is the order complete? 1: Complete 0: Incomplete */
  isComplete?: string;
  /** storage id */
  storageId?: string;
  /** storage name */
  storageName?: string;
  /** Product List */
  productList?: string;
  /** Variant Id */
  vid?: string;
  /** quantity */
  quantity?: number;
  /** Sell Price */
  sellPrice?: number;
  /** The lineItemId of your store order */
  storeLineItemId?: string;
  /** Unique ID of the order item in CJ */
  lineItemId?: string;
  /** Production Status */
  productionOrderStatus?: string;
  /** Abnormal Reason */
  abnormalType?: number;
  /** pod product order return information */
  podPropertiesInfo?: Record<string, unknown>;
  /** Product renderings */
  effectImgList?: string;
  /** Finished product information */
  customResources?: string;
  /** Production diagram */
  productionImgList?: string;
  /** Logistics Timeliness */
  logisticsTimeliness?: Record<string, unknown>;
  /** Logistics List */
  logisticsModes?: string;
  /** Logistics Name */
  logisticsName?: string;
  /** Arrival Time (Day) */
  arrivalTime?: string;
}

export interface ShoppingCurlRequest7 {
  /** order id */
  orderId?: string;
}

export interface ShoppingCurlRequest9 {
  /** order code */
  orderCode?: string;
  /** storage id */
  storageId?: string;
}

export interface ShoppingReturnResponse25 {
  /** Bonus amount */
  noWithdrawalAmount?: number;
  /** Frozen amount */
  freezeAmount?: number;
  /** Amount */
  amount?: number;
}

export interface ShoppingCurlRequest11 {
  /** Shipment order Id */
  shipmentOrderId?: string;
  /** PayId */
  payId: string;
}

export interface ShoppingCurlRequest12 {
  /** Order Id */
  orderId?: string;
  /** CJ Order Id */
  cjOrderId?: string;
  /** CJ Shipping Company Name */
  cjShippingCompanyName?: string;
  /** Track Number */
  trackNumber?: string;
  /** waybill document */
  waybillFile?: string;
}

export interface ShoppingReturnResponse31 {
  /** error code */
  code?: number;
  /** Whether or not the return is normal */
  result?: boolean;
  /** return message */
  message?: string;
  /** return data */
  data?: boolean;
  /** requestId */
  requestId?: string;
}

export interface ShoppingCurlRequest14 {
  podPicturesEditParams?: string;
  /** CJ order id */
  orderCode?: string;
  /** Unique ID of the order item in CJ */
  lineItemId?: string;
  /** Product renderings */
  effectImgList?: string;
  /** Production diagram */
  productionImgList?: string;
}

export interface ShoppingReturnResponse36 {
  list?: string;
  /** CJ order id */
  orderCode?: string;
  /** Unique ID of the order item in CJ */
  lineItemId?: string;
  /** update result 0：fail, 1: Processing, 2: success */
  result?: number;
  /** fail reason */
  failedMessage?: string;
}

export interface WebhookCurlRequest {
  /** Product Message */
  product?: Record<string, unknown>;
  /** Product Message type */
  type?: string;
  /** callback url */
  callbackUrls?: string;
  /** Stock Message */
  stock?: Record<string, unknown>;
  /** Order Message */
  order?: Record<string, unknown>;
  /** Logistics Message */
  logistics?: Record<string, unknown>;
}

export interface WebhookResultResponse {
  /** error code */
  code?: number;
  /** Whether or not the return is normal */
  result?: boolean;
  /** return message */
  message?: string;
  /** return data */
  data?: Record<string, unknown>;
  /** requestId */
  requestId?: string;
  /** whether the call succeeded */
  success?: boolean;
}

export interface AuthenticationCurlRequest {
  /** CJ API Key */
  apiKey?: string;
}

export interface AuthenticationReturnResponse {
  /** Open Id */
  openId?: string;
  /** access token */
  accessToken?: string;
  /** access token expiry time */
  accessTokenExpiryDate?: string;
  /** Refresh Token */
  refreshToken?: string;
  /** Refresh Token expiry time */
  refreshTokenExpiryDate?: string;
  /** Created date */
  createDate?: string;
}

export interface AuthenticationReturnResponse2 {
  /** Error code */
  code?: number;
  /** Whether returned */
  result?: boolean;
  /** Return message */
  message?: string;
  data?: string;
  /** Request ID */
  requestId?: string;
}

export interface AuthenticationCurlRequest2 {
  /** Refresh Token */
  refreshToken?: string;
}

export interface AuthenticationReturnResponse3 {
  /** access token */
  accessToken?: string;
  /** access token Expiry Time */
  accessTokenExpiryDate?: string;
  /** Refresh Token */
  refreshToken?: string;
  /** Refresh Token Expiry Time */
  refreshTokenExpiryDate?: string;
  /** Created Date */
  createDate?: string;
}

export interface SettingsReturnResponse {
  /** Account ID */
  openId?: string;
  /** Account name */
  openName?: string;
  /** Account Email */
  openEmail?: string;
  /** Settings */
  setting?: string;
  /** Quota limits */
  quotaLimits?: string;
  /** Quota URL */
  quotaUrl?: string;
  /** Quota limit */
  quotaLimit?: number;
  /** Quota Type */
  quotaType?: number;
  /** QPS limit */
  qpsLimit?: number;
  /** Root access */
  root?: string;
  /** (Whether) Sandbox account */
  isSandbox?: number;
}

export interface ProductReturnResponse {
  /** First level category name */
  categoryFirstName?: string;
  /** First level category list */
  categoryFirstList?: unknown[];
  /** Second level category name */
  categorySecondName?: string;
  /** Second level category list */
  categorySecondList?: unknown[];
  /** Third level category ID */
  categoryId?: string;
  /** Third level category name */
  categoryName?: string;
}

export interface ProductCurlRequest {
  /** Search keyword */
  keyWord?: string;
  /** Page number */
  page?: number;
  /** Quantity of results on each page */
  size?: number;
  /** Category ID */
  categoryId?: string;
  /** Second level category ID list */
  lv2categoryList?: unknown[];
  /** Third level category ID list */
  lv3categoryList?: unknown[];
  /** Country code */
  countryCode?: string;
  /** Start sell price */
  startSellPrice?: number;
  /** End sell price */
  endSellPrice?: number;
  /** Is free shipping */
  addMarkStatus?: number;
  /** Product type */
  productType?: number;
  /** Product flag */
  productFlag?: number;
  /** Start warehouse inventory */
  startWarehouseInventory?: number;
  /** End warehouse inventory */
  endWarehouseInventory?: number;
  /** Verified warehouse type */
  verifiedWarehouse?: number;
  /** Listing time filter start */
  timeStart?: string;
  /** Listing time filter end */
  timeEnd?: string;
  /** Zone platform suggestion */
  zonePlatform?: string;
  /** Is global warehouse search */
  isWarehouse?: boolean;
  /** Sort direction */
  sort?: string;
  /** Sort field */
  orderBy?: number;
  /** Features list */
  features?: unknown[];
  /** Supplier ID */
  supplierId?: string;
  /** Has certification */
  hasCertification?: number;
  /** Is self pickup */
  isSelfPickup?: number;
  /** Is customization product */
  customization?: number;
}

export interface ProductReturnResponse3 {
  /** Page size */
  pageSize?: string;
  /** Current page number */
  pageNumber?: string;
  /** Total records */
  totalRecords?: string;
  /** Total pages */
  totalPages?: string;
  /** Content list */
  content?: unknown[];
}

export interface ProductReturnResponse4 {
  /** Product list */
  productList?: string;
  /** Related category list */
  relatedCategoryList?: unknown[];
  /** Search keyword */
  keyWord?: string;
  /** Original search keyword */
  keyWordOld?: string;
}

export interface ProductReturnResponse5 {
  /** Product ID */
  id?: string;
  /** Product name (English) */
  nameEn?: string;
  /** Product SPU */
  sku?: string;
  /** Product SPU */
  spu?: string;
  /** Product main image */
  bigImage?: string;
  /** Sell price */
  sellPrice?: string;
  /** Discount price */
  nowPrice?: string;
  /** Best discount price */
  discountPrice?: string;
  /** Discount rate */
  discountPriceRate?: string;
  /** Listed number */
  listedNum?: number;
  /** Is collected */
  isCollect?: number;
  /** Third level category ID */
  categoryId?: string;
  /** Third level category name */
  threeCategoryName?: string;
  /** Second level category ID */
  twoCategoryId?: string;
  /** Second level category name */
  twoCategoryName?: string;
  /** First level category ID */
  oneCategoryId?: string;
  /** First level category name */
  oneCategoryName?: string;
  /** Is free shipping */
  addMarkStatus?: number;
  /** Has video */
  isVideo?: number;
  /** Video ID list */
  videoList?: unknown[];
  /** Product type */
  productType?: string;
  /** Supplier name */
  supplierName?: string;
  /** Create time */
  createAt?: string;
  /** Recommended time */
  setRecommendedTime?: string;
  /** Warehouse inventory number */
  warehouseInventoryNum?: string;
  /** Total verified inventory */
  totalVerifiedInventory?: number;
  /** Total unverified inventory */
  totalUnVerifiedInventory?: number;
  /** Verified warehouse identifier */
  verifiedWarehouse?: number;
  /** Is customization product */
  customization?: number;
  /** Is personalized customization */
  isPersonalized?: number;
  /** Has CE certification */
  hasCECertification?: number;
  /** Is added to my products */
  myProduct?: boolean;
  /** Product description */
  description?: string;
  /** Delivery cycle */
  deliveryCycle?: string;
  /** Sale status */
  saleStatus?: string;
  /** User visible permission */
  authorityStatus?: string;
  /** Product visibility */
  autStatus?: string;
  /** Is permanent private */
  isAut?: string;
  /** Is listed */
  isList?: number;
  /** Listing status */
  syncListedProductStatus?: string;
  /** Is advertisement product */
  isAd?: number;
  /** Advertisement product ID */
  activityId?: string;
  /** Minimum order quantity */
  directMinOrderNum?: string;
  /** Zone recommend list */
  zoneRecommendJson?: string;
  /** Warehouse inventory info */
  inventoryInfo?: string;
  /** Variant property */
  variantKeyEn?: string;
  /** Variant inventory info */
  variantInventories?: string;
  /** Product logistics property key */
  propertyKey?: string;
}

export interface ProductReturnResponse7 {
  /** Warehouse name (CN) */
  areaCn?: string;
  /** Warehouse name (EN) */
  areaEn?: string;
  /** Warehouse ID */
  areaId?: number;
  /** Country code */
  countryCode?: string;
  /** Country name (EN) */
  nameEn?: string;
  /** Warehouse code */
  valueEn?: string;
  /** Is disabled */
  disabled?: boolean;
  /** Chinese name */
  zh?: string;
  /** English name */
  en?: string;
  /** German name */
  de?: string;
  /** French name */
  fr?: string;
  /** Thai name */
  th?: string;
  /** Warehouse string ID */
  id?: string;
}

export interface ProductCurlRequest2 {
  /** Page number */
  pageNum?: number;
  /** Quantity of results on each page */
  pageSize?: number;
  /** category id */
  categoryId?: string;
  /** Product id */
  pid?: string;
  /** Product sku */
  productSku?: string;
  /** Product name */
  productName?: string;
  /** Product name(en) */
  productNameEn?: string;
  /** Product type */
  productType?: string;
  /** countryCode */
  countryCode?: string;
  /** Delivery Time (hours) */
  deliveryTime?: string;
  /** Verified Inventory Type */
  verifiedWarehouse?: string;
  /** the minimum inventory */
  startInventory?: string;
  /** the highest inventory */
  endInventory?: string;
  /** create time(start) */
  createTimeFrom?: string;
  /** create time(end) */
  createTimeTo?: string;
  /** brand id */
  brandOpenId?: string;
  /** minimum price */
  minPrice?: string;
  /** maximum price */
  maxPrice?: string;
  /** Search Type */
  searchType?: string;
  /** Minimum Listed Num */
  minListedNum?: string;
  /** Maximum Listed Num */
  maxListedNum?: string;
  /** Sort Type */
  sort?: string;
  /** Sort field */
  orderBy?: string;
  /** Does the product support self pickup */
  isSelfPickup?: string;
  /** Supplier Id */
  supplierId?: string;
  /** Is Free Shipping? */
  isFreeShipping?: number;
  /** Customization Version */
  customizationVersion?: number;
}

export interface ProductReturnResponse9 {
  /** Page number */
  pageNum?: number;
  /** Quantity of results on each page */
  pageSize?: number;
  /** Total quantity of results */
  total?: number;
  /** Product list */
  list?: string;
  /** Product ID */
  pid?: string;
  /** Product name */
  productName?: string;
  /** Product name(EN) */
  productNameEn?: string;
  /** Product sku */
  productSku?: string;
  /** Product image */
  productImage?: string;
  /** Product weight */
  productWeight?: number;
  /** Product type */
  productType?: number;
  /** Product unit */
  productUnit?: string;
  /** Category id */
  categoryId?: string;
  /** Category name */
  categoryName?: string;
  /** Remark */
  remark?: string;
  /** Is shipping free? (Deprecated, please use isFreeShipping) */
  addMarkStatus?: number;
  /** Is shipping free? */
  isFreeShipping?: boolean;
  /** Listed number */
  listedNum?: number;
  /** Supplier name */
  supplierName?: string;
  /** Supplier id */
  supplierId?: string;
  /** Sell price */
  sellPrice?: number;
  /** Create time */
  createTime?: string;
  /** Has video */
  isVideo?: number;
  /** Sale status */
  saleStatus?: number;
  /** Customization Version */
  customizationVersion?: number;
}

export interface ProductCurlRequest3 {
  /** Product id */
  pid?: string;
  /** Product sku */
  productSku?: string;
  /** variant sku */
  variantSku?: string;
  /** features */
  features?: string;
  /** Country Code */
  countryCode?: string;
}

export interface ProductReturnResponse11 {
  /** Product ID */
  pid?: string;
  /** Product name */
  productName?: string;
  /** Product name(EN) */
  productNameEn?: string;
  /** Product sku */
  productSku?: string;
  /** Product Main Image */
  bigImage?: string;
  /** Product Images */
  productImage?: string;
  /** Product Images */
  productImageSet?: string;
  /** Product weight */
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
  /** Package weight */
  packWeight?: number;
  /** Package name */
  packingName?: string;
  /** Package name (EN) */
  packingNameEn?: string;
  /** Package attribute */
  packingKey?: string;
  /** Product attribute */
  productKey?: string;
  /** Product attribute (EN) */
  productKeyEn?: string;
  /** Product logistics attributes(Chinese) */
  productProSet?: string;
  /** Product logistics attributes(English) */
  productProEnSet?: string;
  /** Is Free Shipping? */
  addMarkStatus?: number;
  /** Description */
  description?: string;
  /** sell price */
  sellPrice?: string;
  /** creater time */
  createrTime?: string;
  /** Product video ID list */
  productVideo?: string;
  /** status */
  status?: string;
  /** suggest sell price */
  suggestSellPrice?: string;
  /** listed number */
  listedNum?: number;
  /** supplier name */
  supplierName?: string;
  /** supplier Id */
  supplierId?: string;
  /** customization version */
  customizationVersion?: number;
  /** customization json */
  customizationJson1?: string;
  /** customization json */
  customizationJson2?: string;
  /** customization json */
  customizationJson3?: string;
  /** customization json */
  customizationJson4?: string;
  /** Variants */
  variants?: string;
}

export interface ProductReturnResponse12 {
  /** Variant Id */
  vid?: string;
  /** Product Id */
  pid?: string;
  /** Variant Name */
  variantName?: string;
  /** Variant Name(en) */
  variantNameEn?: string;
  /** Variant SKU */
  variantSku?: string;
  /** Variant Image */
  variantImage?: string;
  /** Variant Standard */
  variantStandard?: string;
  /** Variant Unit */
  variantUnit?: string;
  /** Variant Options */
  variantKey?: string;
  /** Variant Length */
  variantLength?: number;
  /** Variant Width */
  variantWidth?: number;
  /** Variant Height */
  variantHeight?: number;
  /** Variant Volume */
  variantVolume?: number;
  /** Variant Weight */
  variantWeight?: number;
  /** Variant SellPrice */
  variantSellPrice?: number;
  /** Variant Suggest SellPrice */
  variantSugSellPrice?: number;
  /** Vreater Time */
  createTime?: string;
  /** number of Combine Variants */
  combineNum?: number;
  /** Combine Variants */
  combineVariants?: string;
  /** Variant inventory */
  inventories?: string;
  /** inventory country code */
  countryCode?: string;
  /** total inventory number */
  totalInventory?: number;
  /** Inventory management in CJ warehouse */
  cjInventory?: number;
  /** Inventory management in factory */
  factoryInventory?: number;
  /** Verified Inventory type */
  verifiedWarehouse?: string;
  /** Sub warehouse inventory info */
  stock?: string;
  /** Sub warehouse ID */
  stockId?: string;
  /** Sub warehouse Inventory management in CJ warehouse */
  inventory?: number;
}

export interface ProductCurlRequest4 {
  /** CJ product id */
  productId?: string;
}

export interface ProductCurlRequest5 {
  /** sku/spu/product name */
  keyword?: string;
  /** category id */
  categoryId?: string;
  /** start time */
  startAt?: string;
  /** ent time */
  endAt?: string;
  /** isListed */
  isListed?: number;
  /** visiable */
  visiable?: number;
  /** hasPacked */
  hasPacked?: number;
  /** hasVirPacked */
  hasVirPacked?: number;
}

export interface ProductReturnResponse15 {
  /** Product ID */
  productId?: string;
  /** Product name */
  productName?: string;
  /** Product name(EN) */
  nameEn?: string;
  /** Product sku */
  sku?: string;
  /** Product image */
  bigImage?: string;
  /** Product weight */
  totalPrice?: number;
  /** Product type */
  productType?: number;
  /** listed Shop Num */
  listedShopNum?: string;
  /** Added Time */
  createAt?: string;
  /** trial Freight */
  trialFreight?: string;
}

export interface ProductCurlRequest6 {
  /** Product id */
  pid?: string;
  /** Product sku */
  productSku?: string;
  /** variant sku */
  variantSku?: string;
  /** Country Code */
  countryCode?: string;
}

export interface ProductReturnResponse17 {
  /** Variant ID */
  vid?: string;
  /** Product ID */
  pid?: string;
  /** Variant name */
  variantName?: string;
  /** Variant name (EN) */
  variantNameEn?: string;
  /** Variant image */
  variantImage?: string;
  /** Variant sku */
  variantSku?: string;
  /** Variant unit */
  variantUnit?: string;
  /** Variant property */
  variantProperty?: string;
  /** Variant Options */
  variantKey?: string;
  /** Variant length */
  variantLength?: number;
  /** Variant width */
  variantWidth?: number;
  /** Variant height */
  variantHeight?: number;
  /** Variant volume */
  variantVolume?: number;
  /** Variant weight */
  variantWeight?: number;
  /** Variant sell price */
  variantSellPrice?: number;
  /** Create time */
  createTime?: string;
  /** variant standard */
  variantStandard?: string;
  /** variant suggest sell price */
  variantSugSellPrice?: number;
}

export interface ProductCurlRequest7 {
  /** Variant ID */
  vid?: string;
  /** features */
  features?: string;
}

export interface ProductReturnResponse19 {
  /** Variant id */
  vid?: string;
  /** Product id */
  pid?: string;
  /** Variant name */
  variantName?: string;
  /** Variant name (EN) */
  variantNameEn?: string;
  /** Variant image */
  variantImage?: string;
  /** Variant sku */
  variantSku?: string;
  /** Variant unit */
  variantUnit?: string;
  /** Variant Options */
  variantKey?: string;
  /** Variant length */
  variantLength?: number;
  /** Variant width */
  variantWidth?: number;
  /** Variant height */
  variantHeight?: number;
  /** Variant volume */
  variantVolume?: number;
  /** Variant weight */
  variantWeight?: number;
  /** Variant sell price */
  variantSellPrice?: number;
  /** Create time */
  createTime?: string;
  /** Variant standard */
  variantStandard?: string;
  /** Variant inventory */
  inventories?: string;
  /** inventory country code */
  countryCode?: string;
  /** total inventory number */
  totalInventory?: number;
  /** Inventory management in CJ warehouse */
  cjInventory?: number;
  /** Inventory management in factory */
  factoryInventory?: number;
  /** Verified Inventory type */
  verifiedWarehouse?: string;
  /** Sub warehouse inventory info */
  stock?: string;
  /** Sub warehouse ID */
  stockId?: string;
  /** Sub warehouse Inventory management in CJ warehouse */
  inventory?: number;
}

export interface ProductCurlRequest8 {
  /** Variant id */
  vid?: string;
}

export interface ProductReturnResponse21 {
  /** Variant id */
  vid?: number;
  /** Warehouse id */
  areaId?: number;
  /** Warehouse name */
  areaEn?: string;
  /** Country code(EN) */
  countryCode?: string;
  /** total inventory number, please use totalInventoryNum */
  storageNum?: number;
  /** total inventory number */
  totalInventoryNum?: number;
  /** Inventory management in CJ warehouse */
  cjInventoryNum?: number;
  /** Inventory management in factory */
  factoryInventoryNum?: number;
  /** Sub warehouse inventory info */
  stock?: string;
  /** Sub warehouse ID */
  stockId?: string;
  /** Sub warehouse Inventory management in CJ warehouse */
  inventory?: number;
  /** Sub warehouse Inventory management in factory */
  factoryInventory?: number;
}

export interface ProductCurlRequest9 {
  /** SKU or SPU */
  sku?: string;
}

export interface ProductReturnResponse23 {
  /** Warehouse id */
  areaId?: number;
  /** Warehouse name */
  areaEn?: string;
  /** Country code(EN) */
  countryCode?: string;
  /** Country name */
  countryNameEn?: string;
  /** total inventory number */
  totalInventoryNum?: number;
  /** Inventory management in CJ warehouse */
  cjInventoryNum?: number;
  /** Inventory management in factory */
  factoryInventoryNum?: number;
  /** Sub warehouse inventory info */
  stock?: string;
  /** Sub warehouse ID */
  stockId?: string;
  /** Sub warehouse Inventory management in CJ warehouse */
  inventory?: number;
  /** Sub warehouse Inventory management in factory */
  factoryInventory?: number;
}

export interface ProductCurlRequest10 {
  /** Product Id */
  pid?: string;
}

export interface ProductReturnResponse25 {
  /** error code */
  code?: number;
  /** return message */
  message?: string;
  /** Product Inventory Object */
  data?: Record<string, unknown>;
  /** product inventory list */
  inventories?: string;
  /** Warehouse Name */
  areaEn?: string;
  /** Warehouse id */
  areaId?: number;
  /** Country Code */
  countryCode?: string;
  /** total inventory number */
  totalInventoryNum?: number;
  /** Inventory management in CJ warehouse */
  cjInventoryNum?: number;
  /** Inventory management in factory */
  factoryInventoryNum?: number;
  /** Country Name */
  countryNameEn?: string;
  /** Sub warehouse inventory info */
  stock?: string;
  /** Sub warehouse ID */
  stockId?: string;
  /** Sub warehouse Inventory in CJ warehouse */
  inventory?: number;
  /** Sub warehouse Inventory in factory */
  factoryInventory?: number;
  /** variant inventory list */
  variantInventories?: string;
  /** variant id */
  vid?: string;
  /** total inventory number */
  totalInventory?: number;
  /** Inventory management in CJ warehouse */
  cjInventory?: number;
  /** Verified Inventory type */
  verifiedWarehouse?: number;
  /** requestId */
  requestId?: string;
}

export interface ProductCurlRequest11 {
  /** Product id */
  pid?: string;
  /** score */
  score?: number;
  /** page number */
  pageNum?: number;
  /** page size */
  pageSize?: number;
}

export interface ProductReturnResponse26 {
  /** Product id */
  pid?: string;
  /** Comment id */
  commentId?: string;
  /** Comment */
  comment?: string;
  /** Comment url */
  commentUrls?: string;
  /** Comment user */
  commentUser?: string;
  /** score */
  score?: number;
  /** Country code */
  countryCode?: string;
  /** Comment date */
  commentDate?: string;
  /** FlagIcon url */
  flagIconUrl?: string;
}

export interface ProductCurlRequest13 {
  /** third product id */
  thirdProductId?: string;
  /** third variant id */
  thirdVariantId?: string;
  /** third product sku */
  thirdProductSku?: string;
  /** product name */
  productName?: string;
  /** product image */
  productImage?: string;
  /** product url */
  productUrl?: string;
  /** remark */
  remark?: string;
  /** price */
  price?: number;
}

export interface ProductReturnResponse30 {
  /** CJ sourcing id */
  cjSourcingId?: string;
  /** search results */
  result?: string;
}

export interface ProductCurlRequest14 {
  /** CJ sourcing id */
  sourceIds?: string;
}

export interface ProductReturnResponse32 {
  /** CJ sourcing id */
  sourceId?: string;
  /** Search short code */
  sourceNumber?: string;
  /** product id */
  productId?: string;
  /** variant id */
  variantId?: string;
  /** shop id */
  shopId?: string;
  /** shop name */
  shopName?: string;
  /** status */
  sourceStatus?: string;
  /** status (chinese) */
  sourceStatusStr?: string;
  /** CJ product id */
  cjProductId?: string;
  /** CJ variant sku */
  cjVariantSku?: string;
}

export interface LogisticsCurlRequest {
  /** Country of origin */
  startCountryCode?: string;
  /** Country of destination */
  endCountryCode?: string;
  /** zip */
  zip?: string;
  /** tax id */
  taxId?: string;
  /** house number */
  houseNumber?: string;
  /** ioss number */
  iossNumber?: string;
  /** Quantity */
  quantity?: number;
  /** Variant id */
  vid?: string;
}

export interface LogisticsReturnResponse {
  /** Shipping cost in USD */
  logisticPrice?: number;
  /** Shipping cost in CNY */
  logisticPriceCn?: number;
  /** Shipping time */
  logisticAging?: string;
  /** Carrier name */
  logisticName?: string;
  /** taxes fee */
  taxesFee?: number;
  /** customs clearance fee */
  clearanceOperationFee?: number;
  /** total postage */
  totalPostageFee?: number;
}

export interface LogisticsCurlRequest2 {
  /** Country of origin */
  srcAreaCode?: string;
  /** Country of destination */
  destAreaCode?: string;
  /** customer code */
  customerCode?: string;
  /** zip */
  zip?: string;
  /** house number */
  houseNumber?: string;
  /** ioss number */
  iossNumber?: string;
  /** Storage id List */
  storageIdList?: string;
  /** Recipient address */
  recipientAddress?: string;
  /** City */
  city?: string;
  /** Recipient name */
  recipientName?: string;
  /** Sku list */
  skuList?: string;
  /** Town */
  town?: string;
  /** Phone */
  phone?: string;
  /** wrap weight,Unit:g */
  wrapWeight?: number;
  /** Volume,Unit:cm³ */
  volume?: number;
  /** station */
  station?: string;
  /** Platform List */
  platforms?: string;
  /** dutyNo */
  dutyNo?: string;
  /** email */
  email?: string;
  /** province */
  province?: string;
  /** recipient address1 */
  recipientAddress1?: string;
  /** uid */
  uid?: string;
  /** recipient id */
  recipientId?: string;
  /** recipient address2 */
  recipientAddress2?: string;
  /** amount */
  amount?: number;
  /** product type */
  productTypes?: string;
  /** weight,Unit:g */
  weight?: number;
  /** product prop */
  productProp?: string;
  /** option name */
  optionName?: string;
  /** volume weight,Unit:g */
  volumeWeight?: number;
  /** order type */
  orderType?: string;
  /** total value of goods */
  totalGoodsAmount?: number;
  /** freight trial sku list */
  freightTrialSkuList?: Record<string, unknown>;
  /** product code */
  productCode?: string;
  /** sku */
  sku?: string;
  /** Product attributes */
  productPropList?: string;
  /** product type */
  productTypeList?: string;
  /** variant id */
  vid?: string;
  /** sku quantity */
  skuQuantity?: number;
  /** sku weight,Unit:g */
  skuWeight?: number;
  /** sku volume,Unit:cm³ */
  skuVolume?: number;
  /** combination type */
  combinationType?: number;
  /** parent variant id */
  parentVid?: string;
  /** unsalable */
  unsalable?: number;
  /** tail cost quantity */
  tailCostQuantity?: number;
  /** private Ddeduction quantity */
  privateDeductionQuantity?: number;
}

export interface LogisticsReturnResponse3 {
  /** arrival time */
  arrivalTime?: string;
  /** discount Fee */
  discountFee?: number;
  /** discount Fee CNY */
  discountFeeCNY?: number;
  /** volume weight */
  volumeWeight?: number;
  /** channel id */
  channelId?: string;
  /** error */
  error?: string;
  /** errorEn */
  errorEn?: string;
  /** option id */
  optionId?: string;
  /** postage */
  postage?: number;
  /** postage CNY */
  postageCNY?: number;
  /** price increases */
  priceIncreases?: string;
  /** reSort */
  reSort?: string;
  /** remoteFee */
  remoteFee?: number;
  /** remoteFee CNY */
  remoteFeeCNY?: number;
  /** tip */
  tip?: string;
  /** uid */
  uid?: string;
  /** order id */
  orderId?: string;
  /** unWeightChargeTarget */
  unWeightChargeTarget?: number;
  /** floatMaxPrice */
  floatMaxPrice?: number;
  /** floatMinPrice */
  floatMinPrice?: number;
  /** logisticsParamRespDTO */
  logisticsParamRespDTO?: string;
  /** message */
  message?: string;
  /** wrap postage */
  wrapPostage?: number;
  /** wrap postage CNY */
  wrapPostageCNY?: number;
  /** wrap weight */
  wrapWeight?: number;
  /** Stop Words */
  stopWords?: string;
  /** channel */
  channel?: Record<string, unknown>;
  /** name(CN) */
  cnName?: string;
  /** name(EN) */
  enName?: string;
  /** id */
  id?: string;
  /** option */
  option?: Record<string, unknown>;
  /** taxes fee */
  taxesFee?: number;
  /** customs clearance fee */
  clearanceOperationFee?: number;
  /** total postage */
  totalPostageFee?: number;
  /** all rule tips */
  allRuleTips?: Record<string, unknown>;
  /** expression */
  expression?: string;
  /** InterceptType */
  interceptType?: string;
  /** Maximum range (name, address) */
  max?: string;
  /** Minimum scope (name, address) */
  min?: string;
  /** Tip code */
  msgCode?: string;
  /** Type */
  type?: string;
  /** msg(english) */
  msgEn?: string;
  /** Target Area */
  destArea?: Record<string, unknown>;
  /** Country Id */
  countryId?: string;
  /** Parent Id */
  parentId?: string;
  /** Post Code */
  postCode?: string;
  /** Short Code */
  shortCode?: string;
  /** Source Area */
  srcArea?: Record<string, unknown>;
}

export interface LogisticsCurlRequest3 {
  /** Order number */
  orderNumber?: string;
  /** Destination country code */
  shippingCountryCode?: string;
  /** Destination country */
  shippingCountry?: string;
  /** Province/State */
  shippingProvince?: string;
  /** City */
  shippingCity?: string;
  /** Address */
  shippingAddress?: string;
  /** Recipient name */
  shippingCustomerName?: string;
  /** Zip code */
  shippingZip?: string;
  /** Phone */
  shippingPhone?: string;
  /** House number */
  houseNumber?: string;
  /** Order remark */
  remark?: string;
  /** Logistics name */
  logisticName?: string;
  /** Origin country */
  fromCountryCode?: string;
  /** Email */
  email?: string;
  /** Consignee ID */
  consigneeID?: string;
  /** IOSS type */
  iossType?: number;
  /** IOSS number */
  iossNumber?: string;
  /** Product list */
  products?: string;
  /** Variant id */
  vid?: string;
  /** Quantity */
  quantity?: number;
}

export interface LogisticsReturnResponse5 {
  /** Shipping cost */
  postageAmount?: number;
  /** Logistics channel */
  logisticsModel?: string;
  /** Logistics name */
  logisticsName?: string;
  /** Delivery time */
  arrivalTime?: string;
  /** Whether IOSS is supported */
  isSupportIoss?: boolean;
  /** IOSS list */
  iossList?: string;
  /** IOSS number */
  iossNumber?: string;
  /** Whether default. 1-Don't use IOSS 2-Use my IOSS 3-Use CJ's IOSS */
  iossType?: string;
  /** Service fee */
  serviceAmount?: number;
  /** Tax amount */
  taxAmount?: number;
}

export interface LogisticsCurlRequest4 {
  /** Product SPU */
  skuList?: string;
}

export interface LogisticsResponseResponse {
  /** SPU List */
  skuList?: string;
  /** logistics Information */
  logisticsInfoList?: Record<string, unknown>;
  /** Template Id */
  id?: string;
  /** Logistics Name */
  logisticsName?: string;
  /** Postage Fee */
  postage?: number;
  /** Start Country Code */
  startCountryCode?: string;
  /** Target Country Code */
  destCountryCode?: string;
}

export interface LogisticsCurlRequest5 {
  /** trackNumber */
  trackNumber?: string;
}

export interface LogisticsReturnResponse7 {
  /** tracking number */
  trackingNumber?: string;
  /** from */
  trackingFrom?: string;
  /** to */
  trackingTo?: string;
  /** Delivery day */
  deliveryDay?: string;
  /** Delivery time */
  deliveryTime?: string;
  /** tracking status */
  trackingStatus?: string;
  /** last mile carrier */
  lastMileCarrier?: string;
  /** last mile tracking number */
  lastTrackNumber?: string;
}

export interface DisputeReturnResponse {
  /** CJ order id */
  orderId?: string;
  /** customer order number */
  orderNumber?: string;
  /** Product information list */
  productInfoList?: Record<string, unknown>;
  /** lineItem id */
  lineItemId?: string;
  /** CJ product id */
  cjProductId?: string;
  /** CJ variant id */
  cjVariantId?: string;
  /** Is it possible to check to open a dispute */
  canChoose?: boolean;
  /** product price */
  price?: number;
  /** quantity */
  quantity?: number;
  /** CJ product name */
  cjProductName?: string;
  /** CJ product image */
  cjImage?: string;
  /** sku */
  sku?: string;
  /** supplier name */
  supplierName?: string;
}

export interface DisputeCurlRequest2 {
  /** CJ order id */
  orderId?: string;
  /** product information */
  productInfoList?: Record<string, unknown>;
  /** lineItem id */
  lineItemId?: string;
  /** quantity */
  quantity?: number;
  /** price */
  price?: number;
}

export interface DisputeReturnResponse3 {
  /** CJ order id */
  orderId?: string;
  /** customer order number */
  orderNumber?: string;
  /** expected result */
  expectResultOptionList?: string;
  /** Product price */
  maxProductPrice?: number;
  /** Postage */
  maxPostage?: number;
  /** ioss tax amount */
  maxIossTaxAmount?: number;
  /** ioss tax fee amount */
  maxIossHandTaxAmount?: number;
  /** Apply for refund amount */
  maxAmount?: number;
  /** product information */
  productInfoList?: Record<string, unknown>;
  /** Whether to check open dispute */
  canChoose?: boolean;
  /** price */
  price?: number;
  /** quantity */
  quantity?: number;
  /** lineItem id */
  lineItemId?: string;
  /** CJ product id */
  cjProductId?: string;
  /** CJ variant id */
  cjVariantId?: string;
  /** CJ product name */
  cjProductName?: string;
  /** CJ product image */
  cjImage?: string;
  /** CJ sku */
  sku?: string;
  /** supplier name */
  supplierName?: string;
  /** dispute reason */
  disputeReasonList?: Record<string, unknown>;
  /** dispute reason id */
  disputeReasonId?: number;
  /** dispute reason name (EN) */
  reasonName?: string;
}

export interface DisputeCurlRequest3 {
  /** customer business id, 唯一值 */
  businessDisputeId?: string;
  /** CJ order id */
  orderId?: string;
  /** dispute reason id */
  disputeReasonId?: number;
  /** expect type */
  expectType?: number;
  /** Refund type */
  refundType?: number;
  /** text message */
  messageText?: string;
  /** image url */
  imageUrl?: string;
  /** video url */
  videoUrl?: string;
  /** product information */
  productInfoList?: Record<string, unknown>;
  /** price */
  price?: number;
  /** lineItem id */
  lineItemId?: string;
  /** quantity */
  quantity?: number;
}

export interface DisputeReturnResponse5 {
  /** status code */
  code?: number;
  /** whether the request is successful */
  result?: boolean;
  /** return message */
  message?: string;
  /** whether the dispute was created successfully */
  data?: boolean;
  /** request id */
  requestId?: string;
  /** whether the call succeeded */
  success?: boolean;
}

export interface DisputeCurlRequest4 {
  /** CJ order id */
  orderId?: string;
  /** CJ dispute id */
  disputeId?: string;
}

export interface DisputeCurlRequest5 {
  /** CJ order id */
  orderId?: string;
  /** dispute id */
  disputeId?: number;
  /** customer order number */
  orderNumber?: string;
  /** page number */
  pageNum?: number;
  /** page size */
  pageSize?: number;
}

export interface DisputeReturnResponse9 {
  /** page number */
  pageNum?: number;
  /** page size */
  pageSize?: number;
  /** total */
  total?: number;
  /** dispute list */
  list?: string;
  /** dispute status */
  status?: string;
  /** dispute id */
  id?: string;
  /** dispute reason */
  disputeReason?: string;
  /** Reissue amount */
  replacementAmount?: number;
  /** Reissue order id */
  resendOrderCode?: string;
  /** final refund amount */
  money?: number;
  /** final negotiation result */
  finallyDeal?: number;
  /** create date */
  createDate?: string;
  /** product information */
  productList?: Record<string, unknown>;
  /** product image */
  image?: string;
  /** product price */
  price?: number;
  /** lineItem id */
  lineItemId?: string;
  /** CJ product id */
  cjProductId?: string;
  /** CJ variant id */
  cjVariantId?: string;
  /** product name */
  productName?: string;
  /** supplier name */
  supplierName?: string;
}

export interface DisputeCurlRequest6 {
  /** dispute id */
  disputeId?: string;
}

export interface DisputeReturnResponse11 {
  /** dispute id */
  id?: string;
  /** dispute status */
  status?: string;
  /** dispute reason */
  disputeReason?: string;
  /** reissue amount */
  replacementAmount?: number;
  /** reissue order id */
  resendOrderCode?: string;
  /** final refund amount */
  money?: number;
  /** final refund amount */
  refundAmount?: number;
  /** final negotiation result */
  finallyDeal?: number;
  /** create date (timestamp ms) */
  createDate?: string;
  /** refund cost breakdown */
  refundDetails?: Record<string, unknown>;
  /** cost type */
  type?: string;
  /** cost type name */
  typeName?: string;
  /** amount */
  amount?: number;
  /** product information */
  productList?: Record<string, unknown>;
  /** product image */
  image?: string;
  /** product price */
  price?: number;
  /** product code */
  productCode?: string;
  /** product id */
  productId?: string;
  /** product name */
  productName?: string;
  /** variant id */
  standId?: string;
  /** supplier name */
  supplierName?: string;
}

export interface DisputeReturnResponse13 {
  /** dispute id */
  id?: string;
  /** dispute status */
  status?: string;
  /** dispute reason */
  disputeReason?: string;
  /** Reissue amount */
  replacementAmount?: number;
  /** Reissue order id */
  resendOrderCode?: string;
  /** final refund amount */
  money?: number;
  /** final negotiation result */
  finallyDeal?: number;
  /** create date */
  createDate?: string;
  /** product information */
  productList?: Record<string, unknown>;
  /** product image */
  image?: string;
  /** product price */
  price?: number;
  /** product code */
  productCode?: string;
  /** product id */
  productId?: string;
  /** product name */
  productName?: string;
  /** variant id */
  standId?: string;
  /** supplier name */
  supplierName?: string;
}

export interface InterfaceFieldDefinitionsPagingResponse {
  /** Number of current pages */
  pageNum?: number;
  /** Number of items returned per page */
  pageSize?: number;
  /** total */
  total?: number;
  list?: string;
}

export interface InterfaceFieldDefinitionsRegionResponse {
  /** area id */
  areaId?: string;
  /** area name */
  areaEn?: string;
  /** country code */
  countryCode?: string;
}

export interface InterfaceFieldDefinitionsPeopleResponse {
  /** creator */
  creator?: string;
  /** create time */
  createTime?: string;
  /** modifier */
  updater?: string;
  /** modify time */
  updateTime?: string;
}

export interface InterfaceFieldDefinitionsOtherResponse {
  /** source */
  sourceFrom?: number;
  /** comment */
  comment?: string;
}

export interface InterfaceFieldDefinitionsAuthorizationResponse {
  /** Email */
  email?: string;
  /** Password */
  password?: string;
}

export interface InterfaceFieldDefinitionsTokenResponse {
  /** Access Token */
  accessToken?: string;
  /** Access Token expiry time */
  accessTokenExpiryDate?: string;
  /** Refresh Token */
  refreshToken?: string;
  /** Refresh Token expiry time */
  refreshTokenExpiryDate?: string;
}

export interface InterfaceFieldDefinitionsAccountResponse {
  /** Account ID */
  openId?: string;
  /** Account Name */
  openName?: string;
  /** Account Email */
  openEmail?: string;
  /** Root access */
  root?: string;
  /** (Whether) Sandbox account */
  isSandbox?: number;
}

export interface InterfaceFieldDefinitionsApiSettingResponse {
  /** Settings */
  setting?: string;
  /** Quota limits */
  quotaLimits?: string;
  /** Quota URL */
  quotaUrl?: string;
  /** Quota limit */
  quotaLimit?: number;
  /** Quota Type */
  quotaType?: number;
  /** QPS limit */
  qpsLimit?: number;
}

export interface InterfaceFieldDefinitionsProductResponse {
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
  /** Product weight */
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
  /** Package weight */
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

export interface InterfaceFieldDefinitionsVariantResponse {
  /** Variant ID */
  vid?: string;
  /** Variant name */
  variantName?: string;
  /** Variant name (EN) */
  variantNameEn?: string;
  /** Variant SKU */
  variantSku?: string;
  /** Variant Unit */
  variantUnit?: string;
  /** Variant Property */
  variantProperty?: string;
  /** Variant Key */
  variantKey?: string;
  /** Variant Length */
  variantLength?: number;
  /** Variant Width */
  variantWidth?: number;
  /** Variant Height */
  variantHeight?: number;
  /** Variant Volume */
  variantVolume?: number;
  /** Variant Weight */
  variantWeight?: number;
  /** Variant Sell Price */
  variantSellPrice?: number;
}

export interface InterfaceFieldDefinitionsStorageResponse {
  /** Available inventory */
  storageNum?: number;
  /** Refresh rate */
  queryTime?: string;
}

export interface InterfaceFieldDefinitionsWarehouseResponse {
  /** Warehouse id */
  storageId?: string;
  /** Warehouse Name */
  storageName?: string;
}

export interface InterfaceFieldDefinitionsOrderResponse {
  /** Order Id */
  orderId?: string;
  /** order weight */
  orderWeight?: number;
  /** order amount */
  orderAmount?: number;
  /** order status */
  orderStatus?: string;
}

export interface InterfaceFieldDefinitionsShippingResponse {
  /** shipping country code */
  shippingCountryCode?: string;
  /** shipping country */
  shippingCountry?: string;
  /** shipping province */
  shippingProvince?: string;
  /** shipping city */
  shippingCity?: string;
  /** shipping address */
  shippingAddress?: string;
  /** shipping zip */
  shippingZip?: string;
  /** shipping phone */
  shippingPhone?: string;
}

export interface InterfaceFieldDefinitionsLogisticsResponse {
  /** Shipping cost */
  logisticPrice?: number;
  /** Shipping cost */
  logisticPriceCn?: number;
  /** Estimated delivery timespan */
  logisticAging?: string;
  /** Shipping method */
  logisticName?: string;
}

export interface InterfaceFieldDefinitionsTrackingNumberResponse {
  /** Tracking number */
  trackingNumber?: string;
  /** From */
  trackingFrom?: string;
  /** To */
  trackingTo?: string;
  /** Delivery timespan */
  deliveryDay?: string;
  /** Delivered time */
  deliveryTime?: string;
  /** Tracking status */
  trackingStatus?: string;
}

export interface WebhookMechanismOccursWhenAProductIsCreatedOrUpdatedRequest {
  /** Message Id */
  messageId?: string;
  /** Data Type */
  type?: string;
  /** Message type */
  messageType?: string;
  params?: Record<string, unknown>;
  /** category Id */
  categoryId?: string;
  /** category Name */
  categoryName?: string;
  /** product id */
  pid?: string;
  /** product description */
  productDescription?: string;
  /** product image */
  productImage?: string;
  /** product name */
  productName?: string;
  /** product name(english) */
  productNameEn?: string;
  /** product property */
  productProperty1?: string;
  /** product property */
  productProperty2?: string;
  /** product property */
  productProperty3?: string;
  /** product sell price */
  productSellPrice?: number;
  /** product sku */
  productSku?: string;
  /** product status */
  productStatus?: number;
  /** fields list */
  fields?: string;
}

export interface WebhookMechanismInboundMessageForVariantRequest {
  /** Message id */
  messageId?: string;
  /** Data Type */
  type?: string;
  /** Message Type */
  messageType?: string;
  params?: Record<string, unknown>;
  /** variant Id */
  vid?: string;
  /** variant name */
  variantName?: string;
  /** variant weight, unit:g */
  variantWeight?: number;
  /** variant length, unit:mm */
  variantLength?: number;
  /** variant width, unit:mm */
  variantWidth?: number;
  /** variant height, unit:mm */
  variantHeight?: number;
  /** variant image */
  variantImage?: string;
  /** variant sku */
  variantSku?: string;
  /** variant key */
  variantKey?: string;
  /** variant sell price, USD */
  variantSellPrice?: number;
  /** variant status */
  variantStatus?: number;
  /** variant value1 */
  variantValue1?: string;
  /** variant value2 */
  variantValue2?: string;
  /** variant value3 */
  variantValue3?: string;
  /** fields list */
  fields?: string;
}

export interface WebhookMechanismOrderMessageRequest {
  /** Message id */
  messageId?: string;
  /** Data Type */
  type?: string;
  /** Message Type */
  messageType?: string;
  params?: Record<string, unknown>;
  /** CJ order id */
  cjOrderId?: string;
  /** Customer order number */
  orderNum?: string;
  /** Customer order number */
  orderNumber?: string;
  /** CJ order status */
  orderStatus?: string;
  /** logistic name */
  logisticName?: string;
  /** track number */
  trackNumber?: string;
  /** tracking URL */
  trackingUrl?: string;
  /** update date */
  updateDate?: string;
  /** create date */
  createDate?: string;
  /** pay date */
  payDate?: string;
  /** delivery date */
  deliveryDate?: string;
  /** complete date */
  completeDate?: string;
  /** order item list */
  orderItems?: string;
  /** Variant Id */
  vid?: string;
  /** quantity */
  quantity?: number;
  /** Sell Price */
  sellPrice?: number;
  /** The lineItemId of your store order */
  storeLineItemId?: string;
  /** Unique ID of the order item in CJ */
  lineItemId?: string;
  /** Production Status */
  productionOrderStatus?: string;
  /** Abnormal Reason */
  abnormalType?: number;
}

export interface WebhookMechanismOrderSplittingMessageRequest {
  /** Message id */
  messageId?: string;
  /** Data Type */
  type?: string;
  /** Message Type */
  messageType?: string;
  params?: Record<string, unknown>;
  /** Original CJ order id */
  originalOrderId?: string;
  /** Order Split Date */
  orderSplitTime?: string;
  /** Order List */
  splitOrderList?: string;
  /** CJ order id */
  orderCode?: string;
  /** Create date */
  createAt?: string;
  /** Order status */
  orderStatus?: number;
  /** Product Information List */
  productList?: string;
  /** product code */
  productCode?: string;
  /** Variant id */
  vid?: string;
  /** Quantity */
  quantity?: number;
  /** Sku */
  sku?: string;
}

export interface WebhookMechanismLogisticsMessageRequest {
  /** Message Id */
  messageId?: string;
  /** Data Type */
  type?: string;
  /** Message Type */
  messageType?: string;
  params?: Record<string, unknown>;
  /** CJ order id */
  orderId?: string;
  /** logistic name */
  logisticName?: string;
  /** tracking number */
  trackingNumber?: string;
  /** tracking URL */
  trackingUrl?: string;
  /** tracking status */
  trackingStatus?: number;
  /** logistics track events */
  logisticsTrackEvents?: string;
}
