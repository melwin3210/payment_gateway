import crypto from "crypto"

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
    paymentMethod: "CCVISAMC"
    usePaymentPage: "YES"
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

export function generatePayUDate(): string {
  const now = new Date()
  const year = now.getUTCFullYear()
  const month = (now.getUTCMonth() + 1).toString().padStart(2, "0")
  const day = now.getUTCDate().toString().padStart(2, "0")
  const hours = now.getUTCHours().toString().padStart(2, "0")
  const minutes = now.getUTCMinutes().toString().padStart(2, "0")
  const seconds = now.getUTCSeconds().toString().padStart(2, "0")

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}Z`
}

export async function secureApiCall(url: string, options: RequestInit): Promise<Response> {
  if (process.env.NODE_ENV === "development") {
    const https = await import("https")
    const agent = new https.Agent({
      rejectUnauthorized: false,
    })

    const fetchOptions = {
      ...options,
      // @ts-ignore
      agent,
    }

    return fetch(url, fetchOptions)
  }

  return fetch(url, options)
}
