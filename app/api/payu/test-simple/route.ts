import { NextResponse } from "next/server"
import { getPayUConfig, secureApiCall } from "@/lib/payu-utils"
import crypto from "crypto"

export async function POST() {
  try {
    const config = getPayUConfig()

    // Minimal test request
    const testPayment = {
      merchantPaymentReference: "TEST_" + Date.now(),
      currency: "RUB",
      returnUrl: "https://example.com/return",
      authorization: {
        paymentMethod: "CCVISAMC",
        usePaymentPage: "YES",
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

    // Try the most common date format for PayU
    const now = new Date()
    const requestDate = now.toUTCString() // RFC 2822 format

    console.log("Using date:", requestDate)
    console.log("Merchant code:", config.merchantCode)
    console.log("Request body:", requestBody)

    // Generate signature exactly as PayU expects
    const bodyHash = crypto.createHash("md5").update(requestBody).digest("hex")
    const stringToHash = config.merchantCode + requestDate + method + path + "" + bodyHash
    const signature = crypto.createHmac("sha256", config.secretKey).update(stringToHash).digest("hex")

    console.log("Body hash:", bodyHash)
    console.log("String to hash:", stringToHash)
    console.log("Generated signature:", signature)

    const headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Header-Signature": signature,
      "X-Header-Merchant": config.merchantCode,
      "X-Header-Date": requestDate,
      "X-Header-Idempotency-Key": "TEST_" + Date.now(),
    }

    console.log("Headers:", headers)
    console.log("Making request to:", `${config.baseUrl}${path}`)

    const response = await secureApiCall(`${config.baseUrl}${path}`, {
      method: "POST",
      headers,
      body: requestBody,
    })

    const responseText = await response.text()
    console.log("Response status:", response.status)
    console.log("Response headers:", Object.fromEntries(response.headers.entries()))
    console.log("Response body:", responseText)

    let responseData
    try {
      responseData = JSON.parse(responseText)
    } catch {
      responseData = responseText
    }

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      response: responseData,
      debug: {
        requestDate,
        signature,
        stringToHash,
        bodyHash,
        headers,
      },
    })
  } catch (error) {
    console.error("Test error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        details: error,
      },
      { status: 500 },
    )
  }
}
