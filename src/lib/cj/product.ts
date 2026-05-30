import { cjFetch } from './client';
import type { CJResponse } from './client';

// ── Types ─────────────────────────────────────────────────────────────────
export interface CJProduct {
  pid: string;
  productName: string;
  productNameEn: string;
  productSku?: string;
  productImage: string;
  bigImage?: string;
  sellPrice: number;
  categoryId?: string;
  categoryName: string;
  isFreeShipping?: boolean;
  listedNum?: number;
  productWeight?: number; // g
  productUnit?: string;
  productType?: string;
  isActive?: boolean;
}

export interface CJVariant {
  vid: string;
  pid?: string;
  variantNameEn?: string;
  variantName?: string;
  variantImage?: string;
  variantSellPrice: number;
  variantSku: string;
  variantKey: string;
  variantWeight?: number; // g
  variantUnit?: string;
  variantLength?: number; // mm
  variantWidth?: number; // mm
  variantHeight?: number; // mm
  variantVolume?: number; // mm3
  inventory?: number;
  variantNum?: number | string;
  variantPrice?: number | string;
}

export interface CJProductDetail extends CJProduct {
  description?: string;
  variants: CJVariant[];
  productImageSet?: string[];
  suggestSellPrice?: string;
  listedNum?: number;
  productKey?: string;
  productKeyEn?: string;
}

export interface CJProductV2 {
  id: string;           // Product ID (pid)
  nameEn: string;       // English product name
  sku: string;          // Product SKU
  spu: string;          // Product SPU
  bigImage: string;     // Main product image URL
  sellPrice: string;    // Original sell price (string)
  nowPrice: string;     // Current/discounted price (string)
  listedNum: number;    // Number of listings
  categoryId: string;   // Third-level category ID
  threeCategoryName: string;
  twoCategoryId: string;
  twoCategoryName: string;
  oneCategoryId: string;
  oneCategoryName: string;
  addMarkStatus: number; // 0=not free shipping, 1=free shipping
  isVideo: number;
  videoList: string[];
  productType: string;
  supplierName: string;
  createAt: number;     // Timestamp (ms)
  warehouseInventoryNum: number;
  totalVerifiedInventory: number;
  totalUnVerifiedInventory: number;
  verifiedWarehouse: number;
  customization: number;
  hasCECertification: number;
  isCollect: number;
  myProduct: boolean;
  discountPrice: string;
  discountPriceRate: string;
  description?: string; // Only returned if features includes 'enable_description'
  deliveryCycle: string;
  saleStatus: string;
  authorityStatus: string;
  isPersonalized: number;
}

export interface CJVariantDetail {
  vid: string;
  pid: string;
  variantName: string | null;
  variantNameEn: string;
  variantImage?: string;
  variantSku: string;
  variantUnit: string | null;
  variantKey: string;
  variantLength: number;
  variantWidth: number;
  variantHeight: number;
  variantVolume: number;
  variantWeight: number;
  variantSellPrice: number;
  createTime: string;
  variantStandard: string;
  variantSugSellPrice?: number;
}

export interface CJVariantInventory {
  countryCode: string;
  totalInventory: number;
  cjInventory: number;
  factoryInventory: number;
  verifiedWarehouse: number; // 1=verified, 2=unverified
  stock: Array<{
    stockId: string;
    inventory: number;
    factoryInventory: number;
  }>;
}

export interface CJVariantWithInventory extends CJVariantDetail {
  inventories: CJVariantInventory[];
}

export interface CJWarehouseStock {
  vid: string;
  areaId: string;
  areaEn: string;
  countryCode: string;
  storageNum: number;
  totalInventoryNum: number;
  cjInventoryNum: number;
  factoryInventoryNum: number;
  stock: Array<{
    stockId: string;
    inventory: number;
    factoryInventory: number;
  }> | null;
}

export interface CJStockBySku extends CJWarehouseStock {
  countryNameEn: string;
}

export interface CJProductInventory {
  inventories: Array<{
    areaEn: string;
    areaId: number;
    countryCode: string;
    totalInventoryNum: number;
    cjInventoryNum: number;
    factoryInventoryNum: number;
    countryNameEn: string;
    stock: Array<{
      stockId: string;
      inventory: number;
      factoryInventory: number;
    }> | null;
  }>;
  variantInventories: Array<{
    vid: string;
    inventory: CJVariantInventory[];
  }>;
}

export interface CJProductReview {
  commentId: number;
  pid: string;
  comment: string;
  commentDate: string;
  commentUser: string;
  score: string;
  commentUrls: string[];
  countryCode: string;
  flagIconUrl: string;
}

export interface CJProductReviewsResponse {
  pageNum: string;
  pageSize: string;
  total: string;
  list: CJProductReview[];
}

export interface CJGlobalWarehouse {
  areaId: number;
  areaEn: string;
  areaCn: string;
  countryCode: string;
  countryNameEn: string;
  countryNameCn: string;
  isDefault: number;
}

export interface CJWarehouseDetail {
  id: string;
  name: string;
  areaId: number;
  areaCountryCode: string;
  address1: string | null;
  address2: string | null;
  contacts: string | null;
  phone: string | null;
  city: string;
  province: string;
  logisticsBrandList: Array<{
    id: string;
    name: string;
  }>;
  isSelfPickup: number | null; // 1: support, 0: not supported
  zipCode: string | null;
}

export interface CJMyProduct {
  pid: string;
  productName: string;
  productImage: string;
  sellPrice: number;
  isListed: number;
  visiable: number;
  createTime: string;
}

export interface CJSourcingResult {
  sourceId: string;
  sourceNumber: string;
  productId: string;
  variantId: string;
  shopId: string;
  shopName: string;
  sourceStatus: string;
  sourceStatusStr: string;
  cjProductId: string;
  cjVariantSku: string;
}

// ── Products ──────────────────────────────────────────────────────────────
export async function getProducts(
  params: {
    pageNum?: number;
    pageSize?: number;
    keyWord?: string;
    categoryId?: string;
    countryCode?: string;
    minPrice?: number;
    maxPrice?: number;
    searchType?: number; // 0=all, 2=trending
    productSku?: string;
    productFlag?: number; // 0=all products
  } = {}
): Promise<CJResponse<{ list: CJProduct[]; total: number }>> {
  const query = new URLSearchParams({
    pageNum: (params.pageNum || 1).toString(),
    pageSize: (params.pageSize || 20).toString(),
  });
  if (params.keyWord) query.set('keyWord', params.keyWord);
  if (params.productSku) query.set('productSku', params.productSku);
  if (params.categoryId) query.set('categoryId', params.categoryId);
  if (params.countryCode) query.set('countryCode', params.countryCode);
  if (params.minPrice != null) query.set('minPrice', params.minPrice.toString());
  if (params.maxPrice != null) query.set('maxPrice', params.maxPrice.toString());
  if (params.searchType != null) query.set('searchType', params.searchType.toString());
  if (params.productFlag != null) query.set('productFlag', params.productFlag.toString());

  return cjFetch(`/v1/product/list?${query.toString()}`);
}

export async function getProductsV2(
  params: {
    page?: number;
    size?: number;
    keyWord?: string;
    categoryId?: string;
    lv2categoryList?: string[];
    lv3categoryList?: string[];
    countryCode?: string;
    startSellPrice?: number;
    endSellPrice?: number;
    addMarkStatus?: number;     // 0=not free shipping, 1=free shipping
    productType?: number;       // 4=Supplier, 10=Video, 11=Non-video
    productFlag?: number;       // 0=Trending, 1=New, 2=Video, 3=Slow-moving
    startWarehouseInventory?: number;
    endWarehouseInventory?: number;
    verifiedWarehouse?: number; // 0=All, 1=Verified, 2=Unverified
    timeStart?: number;         // Timestamp ms
    timeEnd?: number;           // Timestamp ms
    zonePlatform?: string;      // shopify, ebay, amazon, tiktok, etsy
    isWarehouse?: boolean;
    sort?: 'desc' | 'asc';
    orderBy?: number;           // 0=best match, 1=listing count, 2=sell price, 3=create time, 4=inventory
    features?: string[];        // enable_description, enable_category, enable_combine, enable_video
    supplierId?: string;
    hasCertification?: number;  // 0=No, 1=Yes
    isSelfPickup?: number;      // 0=No, 1=Yes
    customization?: number;     // 0=No, 1=Yes
  } = {}
): Promise<CJResponse<{
  pageSize: number;
  pageNumber: number;
  totalRecords: number;
  totalPages: number;
  content: Array<{
    productList: CJProductV2[];
    relatedCategoryList: Array<{ categoryId: string; categoryName: string }>;
    keyWord: string;
  }>;
}>> {
  const query = new URLSearchParams();
  if (params.page != null) query.set('page', params.page.toString());
  if (params.size != null) query.set('size', params.size.toString());
  if (params.keyWord) query.set('keyWord', params.keyWord);
  if (params.categoryId) query.set('categoryId', params.categoryId);
  if (params.lv2categoryList?.length) query.set('lv2categoryList', JSON.stringify(params.lv2categoryList));
  if (params.lv3categoryList?.length) query.set('lv3categoryList', JSON.stringify(params.lv3categoryList));
  if (params.countryCode) query.set('countryCode', params.countryCode);
  if (params.startSellPrice != null) query.set('startSellPrice', params.startSellPrice.toString());
  if (params.endSellPrice != null) query.set('endSellPrice', params.endSellPrice.toString());
  if (params.addMarkStatus != null) query.set('addMarkStatus', params.addMarkStatus.toString());
  if (params.productType != null) query.set('productType', params.productType.toString());
  if (params.productFlag != null) query.set('productFlag', params.productFlag.toString());
  if (params.startWarehouseInventory != null) query.set('startWarehouseInventory', params.startWarehouseInventory.toString());
  if (params.endWarehouseInventory != null) query.set('endWarehouseInventory', params.endWarehouseInventory.toString());
  if (params.verifiedWarehouse != null) query.set('verifiedWarehouse', params.verifiedWarehouse.toString());
  if (params.timeStart != null) query.set('timeStart', params.timeStart.toString());
  if (params.timeEnd != null) query.set('timeEnd', params.timeEnd.toString());
  if (params.zonePlatform) query.set('zonePlatform', params.zonePlatform);
  if (params.isWarehouse != null) query.set('isWarehouse', params.isWarehouse.toString());
  if (params.sort) query.set('sort', params.sort);
  if (params.orderBy != null) query.set('orderBy', params.orderBy.toString());
  if (params.features?.length) query.set('features', JSON.stringify(params.features));
  if (params.supplierId) query.set('supplierId', params.supplierId);
  if (params.hasCertification != null) query.set('hasCertification', params.hasCertification.toString());
  if (params.isSelfPickup != null) query.set('isSelfPickup', params.isSelfPickup.toString());
  if (params.customization != null) query.set('customization', params.customization.toString());

  return cjFetch(`/api2.0/v1/product/listV2?${query.toString()}`);
}

export async function getProductDetails(id: string): Promise<CJResponse<CJProductDetail>> {
  const res = await cjFetch<CJProductDetail>(`/v1/product/query?pid=${id}`);
  if (!res.success && id.length > 5) {
    const resSku = await cjFetch<CJProductDetail>(`/v1/product/query?productSku=${id}`);
    if (resSku.success) return resSku;
  }
  return res;
}

export async function getCategories() {
  return cjFetch<any>('/v1/product/getCategory');
}

// ── Variant APIs ──────────────────────────────────────────────────────────
export async function getProductVariants(pid: string): Promise<CJResponse<CJVariantDetail[]>> {
  return cjFetch<CJVariantDetail[]>(`/api2.0/v1/product/variant/query?pid=${pid}`);
}

export async function getVariantById(vid: string, includeInventory = false): Promise<CJResponse<CJVariantWithInventory>> {
  let endpoint = `/api2.0/v1/product/variant/queryByVid?vid=${vid}`;
  if (includeInventory) {
    endpoint += '&features=enable_inventory';
  }
  return cjFetch<CJVariantWithInventory>(endpoint);
}

// ── Inventory APIs ────────────────────────────────────────────────────────
export async function getInventoryByVid(vid: string): Promise<CJResponse<CJWarehouseStock[]>> {
  return cjFetch<CJWarehouseStock[]>(`/api2.0/v1/product/stock/queryByVid?vid=${vid}`);
}

export async function getInventoryBySku(sku: string): Promise<CJResponse<CJStockBySku[]>> {
  return cjFetch<CJStockBySku[]>(`/api2.0/v1/product/stock/queryBySku?sku=${sku}`);
}

export async function getInventoryByPid(pid: string): Promise<CJResponse<CJProductInventory>> {
  return cjFetch<CJProductInventory>(`/api2.0/v1/product/stock/getInventoryByPid?pid=${pid}`);
}

// ── Product Reviews APIs ──────────────────────────────────────────────────
export async function getProductReviews(
  pid: string,
  params: {
    score?: number;
    pageNum?: number;
    pageSize?: number;
  } = {}
): Promise<CJResponse<CJProductReviewsResponse>> {
  const query = new URLSearchParams({ pid });
  if (params.score != null) query.set('score', params.score.toString());
  if (params.pageNum != null) query.set('pageNum', params.pageNum.toString());
  if (params.pageSize != null) query.set('pageSize', params.pageSize.toString());
  return cjFetch<CJProductReviewsResponse>(`/api2.0/v1/product/productComments?${query.toString()}`);
}

// ── Global Warehouse List API ─────────────────────────────────────────────
export async function getGlobalWarehouseList(): Promise<CJResponse<CJGlobalWarehouse[]>> {
  return cjFetch<CJGlobalWarehouse[]>('/api2.0/v1/product/globalWarehouseList');
}

// ── Warehouse / Storage Detail API ─────────────────────────────────────────
export async function getWarehouseDetail(id: string): Promise<CJResponse<CJWarehouseDetail>> {
  return cjFetch<CJWarehouseDetail>(`/api2.0/v1/warehouse/detail?id=${encodeURIComponent(id)}`);
}

// ── My Product APIs ───────────────────────────────────────────────────────
export async function getMyProducts(params: {
  keyword?: string;
  categoryId?: string;
  isListed?: number;
  visiable?: number;
  pageNum?: number;
  pageSize?: number;
} = {}): Promise<CJResponse<{ list: CJMyProduct[]; total: number }>> {
  const query = new URLSearchParams();
  if (params.keyword) query.set('keyword', params.keyword);
  if (params.categoryId) query.set('categoryId', params.categoryId);
  if (params.isListed != null) query.set('isListed', params.isListed.toString());
  if (params.visiable != null) query.set('visiable', params.visiable.toString());
  if (params.pageNum != null) query.set('pageNum', params.pageNum.toString());
  if (params.pageSize != null) query.set('pageSize', params.pageSize.toString());
  return cjFetch(`/api2.0/v1/product/myProduct/query?${query.toString()}`);
}

export async function addToMyProduct(params: {
  pid: string;
  vid?: string;
  sku?: string;
}): Promise<CJResponse<any>> {
  return cjFetch<any>('/api2.0/v1/product/addToMyProduct', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

// ── Sourcing APIs ─────────────────────────────────────────────────────────
export async function createSourcing(params: {
  productName: string;
  productImage: string;
  thirdProductId?: string;
  thirdVariantId?: string;
  thirdProductSku?: string;
  productUrl?: string;
  remark?: string;
  price?: number;
}): Promise<CJResponse<{ cjSourcingId: string; result: string }>> {
  return cjFetch<any>('/api2.0/v1/product/sourcing/create', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function querySourcing(sourceIds: string[]): Promise<CJResponse<CJSourcingResult[]>> {
  return cjFetch<CJSourcingResult[]>('/api2.0/v1/product/sourcing/query', {
    method: 'POST',
    body: JSON.stringify({ sourceIds }),
  });
}
