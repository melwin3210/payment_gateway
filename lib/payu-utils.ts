import crypto from "crypto"
import fetch from "node-fetch"

export interface PayUConfig {
  merchantCode: string
  secretKey: string
  baseUrl: string
}

export interface PaymentRequest {
  merchantPaymentReference: string
  currency: string
  returnUrl: string
  authorization: {
    paymentMethod: "CCVISAMC" | "FASTER_PAYMENTS" | "SBERPAY" | "TPAY" | "ALFAPAY"
    usePaymentPage?: "YES" | "NO"
  }
  client: {
    billing: {
      firstName: string
      lastName: string
      email: string
      countryCode: string
      phone: string
    }
  }
  products: Array<{
    name: string
    sku: string
    unitPrice: string
    quantity: string
  }>
}

export interface PaymentResponse {
  payuPaymentReference: string
  merchantPaymentReference: string
  status: string
  redirectUrl?: string
}

export interface CaptureRequest {
  payuPaymentReference: string
  currency: string
  originalAmount: number
  amount: number
}

export interface RefundRequest {
  payuPaymentReference: string
  originalAmount: number
  amount: number
  currency: string
}

export function generateSignature(
  merchantCode: string,
  secretKey: string,
  date: string,
  method: string,
  path: string,
  queryString = "",
  body = "",
): string {
  const bodyHash = crypto.createHash("md5").update(body).digest("hex")
  const stringToHash = merchantCode + date + method + path + queryString + bodyHash

  console.log("Signature generation details:", {
    merchantCode,
    date,
    method,
    path,
    queryString,
    bodyHash,
    stringToHash,
  })

  return crypto.createHmac("sha256", secretKey).update(stringToHash).digest("hex")
}

export function generateMerchantReference(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

export function generateIdempotencyKey(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

export function getPayUConfig(): PayUConfig {
  return {
    merchantCode: process.env.PAYU_MERCHANT_CODE!,
    secretKey: process.env.PAYU_SECRET_KEY!,
    baseUrl: process.env.PAYU_BASE_URL!,
  }
}

export function createPayUHeaders(
  merchantCode: string,
  signature: string,
  date: string,
  idempotencyKey?: string,
): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-Header-Signature": signature,
    "X-Header-Merchant": merchantCode,
    "X-Header-Date": date,
  }

  if (idempotencyKey) {
    headers["X-Header-Idempotency-Key"] = idempotencyKey
  }

  return headers
}

// Use the working "custom" format that was successful
export function generatePayUDate(): string {
  // Custom format without milliseconds: "2024-12-09T14:30:45Z"
  const now = new Date()
  const year = now.getUTCFullYear()
  const month = (now.getUTCMonth() + 1).toString().padStart(2, "0")
  const day = now.getUTCDate().toString().padStart(2, "0")
  const hours = now.getUTCHours().toString().padStart(2, "0")
  const minutes = now.getUTCMinutes().toString().padStart(2, "0")
  const seconds = now.getUTCSeconds().toString().padStart(2, "0")

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}Z`
}

// Keep other date format functions for testing
export function generatePayUDateRFC2822(): string {
  const now = new Date()
  return now.toUTCString()
}

export function generatePayUDateISO(): string {
  return new Date().toISOString()
}

export function generatePayUDateSimple(): string {
  const now = new Date()
  const year = now.getUTCFullYear()
  const month = (now.getUTCMonth() + 1).toString().padStart(2, "0")
  const day = now.getUTCDate().toString().padStart(2, "0")
  const hours = now.getUTCHours().toString().padStart(2, "0")
  const minutes = now.getUTCMinutes().toString().padStart(2, "0")
  const seconds = now.getUTCSeconds().toString().padStart(2, "0")

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

// Create a custom fetch function with SSL options for development
export async function secureApiCall(url: string, options: RequestInit): Promise<Response> {
  // For development environment, we might need to handle SSL differently
  if (process.env.NODE_ENV === "development") {
    // Import https module for Node.js specific SSL handling
    const https = await import("https")

    // Create a custom agent that ignores SSL certificate errors (ONLY for development)
    const agent = new https.Agent({
      rejectUnauthorized: false, // This bypasses SSL certificate validation
    })

    // Add the agent to the fetch options
    const fetchOptions = {
      ...options,
      // @ts-ignore - Node.js specific property
      agent,
    }

    return fetch(url, fetchOptions)
  }

  // For production, use normal fetch
  return fetch(url, options)
}
