import { NextResponse } from "next/server"
import {
  generateMerchantReference,
  generateIdempotencyKey,
  createPayUHeaders,
  getPayUConfig,
  generatePayUDate,
} from "@/lib/payu-utils"

export async function GET() {
  try {
    const config = getPayUConfig()

    // Test data
    const testPayment = {
      merchantPaymentReference: "TEST_" + generateMerchantReference(),
      currency: "RUB",
      returnUrl: "https://example.com/return",
      authorization: {
        paymentMethod: "CCVISAMC" as const,
        usePaymentPage: "YES" as const,
      },
      client: {
        billing: {
          firstName: "Test",
          lastName: "User",
          email: "test@example.com",
          countryCode: "RU",
          phone: "+7-1234567890",
        },
      },
      products: [
        {
          name: "Test Product",
          sku: "TEST001",
          unitPrice: "100.00",
          quantity: "1",
        },
      ],
    }

    const requestBody = JSON.stringify(testPayment)
    const path = "/api/v4/payments/authorize"
    const method = "POST"
    const requestDate = generatePayUDate("rfc2822")
    const idempotencyKey = generateIdempotencyKey()

    // Generate signature step by step
    const bodyHash = require("crypto").createHash("md5").update(requestBody).digest("hex")
    const stringToHash = config.merchantCode + requestDate + method + path + "" + bodyHash
    const signature = require("crypto").createHmac("sha256", config.secretKey).update(stringToHash).digest("hex")

    const headers = createPayUHeaders(config.merchantCode, signature, requestDate, idempotencyKey)

    const debugInfo = {
      config: {
        merchantCode: config.merchantCode ? `${config.merchantCode.substring(0, 4)}****` : "MISSING",
        secretKey: config.secretKey ? `****${config.secretKey.substring(config.secretKey.length - 4)}` : "MISSING",
        baseUrl: config.baseUrl,
      },
      request: {
        method,
        path,
        url: `${config.baseUrl}${path}`,
        date: requestDate,
        idempotencyKey,
      },
      signature: {
        bodyHash,
        stringToHash,
        signature,
      },
      headers,
      requestBody: JSON.parse(requestBody),
    }

    console.log("Debug info:", JSON.stringify(debugInfo, null, 2))

    return NextResponse.json({
      success: true,
      debug: debugInfo,
    })
  } catch (error) {
    console.error("Debug error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Debug failed",
        details: error,
      },
      { status: 500 },
    )
  }
}
