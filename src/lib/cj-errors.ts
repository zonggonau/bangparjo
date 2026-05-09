/**
 * CJ Dropshipping Global Error Codes mapping
 * Based on Appendix 1 of the official documentation
 */

export const CJ_ERROR_CODES: Record<number, string> = {
  // General Errors
  1600100: "Param error - Silakan periksa data yang dikirim.",
  1600101: "Invalid access token - Sesi API telah berakhir.",
  1600102: "Access frequency restricted - Terlalu banyak permintaan, coba lagi nanti.",
  1600103: "Interface access permission denied - Izin API ditolak.",
  
  // Order Errors
  1602100: "Order does not exist - Pesanan tidak ditemukan di sistem CJ.",
  1602101: "Order status error - Status pesanan tidak memungkinkan untuk aksi ini.",
  1602102: "Duplicate orderNumber - Nomor pesanan ini sudah terdaftar di CJ.",
  1602103: "Product variant not found - Varian produk tidak ditemukan.",
  1602104: "Insufficient inventory - Stok tidak mencukupi di gudang CJ.",
  1602105: "Shipping address invalid - Alamat pengiriman tidak valid.",
  1602106: "Logistic method not supported - Metode pengiriman tidak tersedia untuk rute ini.",
  
  // Logistics Errors
  1603100: "Tracking information not found - Informasi pelacakan belum tersedia.",
  1603101: "Logistic service unavailable - Layanan logistik sedang gangguan.",
  
  // Product Errors
  1605100: "Product is off sale - Produk sudah tidak dijual lagi.",
  1605101: "Product status abnormal - Status produk bermasalah.",
  
  // Wallet/Payment
  1606100: "Insufficient balance - Saldo akun CJ Anda tidak cukup.",
  1606101: "Payment failed - Pembayaran ke CJ gagal.",
};

/**
 * Gets a human-readable error message from a CJ error code
 */
export function getCJErrorMessage(code: number): string {
  return CJ_ERROR_CODES[code] || `Error sistem CJ (${code}). Silakan hubungi support.`;
}
