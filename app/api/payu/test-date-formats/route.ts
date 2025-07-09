import { NextResponse } from "next/server"
import { getPayUConfig, secureApiCall, generatePayUDate } from "@/lib/payu-utils"
import crypto from "crypto"

export async function POST() {
  try {
    const config = getPayUConfig()

    // Test different date formats
    const dateFormats = [
      { name: "RFC 2822 (GMT)", format: "rfc2822" as const },
      { name: "Simple Format", format: "simple" as const },
      { name: "ISO 8601", format: "iso" as const },
      { name: "Custom Format", format: "custom" as const },
    ]

    const results = []

    for (const { name, format } of dateFormats) {
      try {
        console.log(`\n=== Testing ${name} ===`)

        const testPayment = {
          merchantPaymentReference: `TEST_${format}_${Date.now()}`,
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
        const requestDate = generatePayUDate(format)

        // Generate signature
        const bodyHash = crypto.createHash("md5").update(requestBody).digest("hex")
        const stringToHash = config.merchantCode + requestDate + method + path + "" + bodyHash
        const signature = crypto.createHmac("sha256", config.secretKey).update(stringToHash).digest("hex")

        const headers = {
          Accept: "application/json",
          "Content-Type": "application/json",
          "X-Header-Signature": signature,
          "X-Header-Merchant": config.merchantCode,
          "X-Header-Date": requestDate,
          "X-Header-Idempotency-Key": `TEST_${format}_${Date.now()}`,
        }

        console.log(`${name} - Date:`, requestDate)
        console.log(`${name} - Making request to:`, `${config.baseUrl}${path}`)

        const response = await secureApiCall(`${config.baseUrl}${path}`, {
          method: "POST",
          headers,
          body: requestBody,
        })

        const responseText = await response.text()
        let responseData
        try {
          responseData = JSON.parse(responseText)
        } catch {
          responseData = responseText
        }

        results.push({
          format: name,
          success: response.ok,
          status: response.status,
          date: requestDate,
          response: responseData,
          error: response.ok ? null : responseText,
        })

        console.log(`${name} - Status:`, response.status)
        console.log(`${name} - Response:`, responseData)

        // If successful, we can stop testing other formats
        if (response.ok) {
          console.log(`✅ SUCCESS with ${name}!`)
          break
        }
      } catch (error) {
        console.error(`${name} - Error:`, error)
        results.push({
          format: name,
          success: false,
          status: 0,
          date: "Error generating date",
          response: null,
          error: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    return NextResponse.json({
      success: true,
      results,
      summary: {
        totalTested: results.length,
        successful: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
      },
    })
  } catch (error) {
    console.error("Date format test error:", error)
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
