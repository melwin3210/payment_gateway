import { type NextRequest, NextResponse } from "next/server"
import {
  generateSignature,
  generateMerchantReference,
  generateIdempotencyKey,
  createPayUHeaders,
  getPayUConfig,
  type PaymentRequest,
  type PaymentResponse,
} from "@/lib/payu-utils"

export async function POST(request: NextRequest) {
  try {
    const config = getPayUConfig()
    const body = await request.json()

    // Generate unique references
    const merchantPaymentReference = generateMerchantReference()
    const idempotencyKey = generateIdempotencyKey()
    const requestDate = new Date().toISOString()

    // Prepare payment request
    const paymentRequest: PaymentRequest = {
      merchantPaymentReference,
      currency: body.currency || "RUB",
      returnUrl: body.returnUrl,
      authorization: {
        paymentMethod: body.paymentMethod || "CCVISAMC",
        usePaymentPage: body.paymentMethod === "CCVISAMC" ? "YES" : undefined,
      },
      client: {
        billing: {
          firstName: body.client.firstName,
          lastName: body.client.lastName,
          email: body.client.email,
          countryCode: body.client.countryCode,
          phone: body.client.phone,
        },
      },
      products: body.products,
    }

    const requestBody = JSON.stringify(paymentRequest)
    const path = "/api/v4/payments/authorize"

    // Generate signature
    const signature = generateSignature(
      config.merchantCode,
      config.secretKey,
      requestDate,
      "POST",
      path,
      "",
      requestBody,
    )

    // Create headers
    const headers = createPayUHeaders(config.merchantCode, signature, requestDate, idempotencyKey)

    // Make request to PayU
    const response = await fetch(`${config.baseUrl}${path}`, {
      method: "POST",
      headers,
      body: requestBody,
    })

    if (!response.ok) {
      throw new Error(`PayU API error: ${response.status}`)
    }

    const paymentResponse: PaymentResponse = await response.json()

    return NextResponse.json({
      success: true,
      data: paymentResponse,
      merchantPaymentReference,
    })
  } catch (error) {
    console.error("PayU authorization error:", error)
    return NextResponse.json({ success: false, error: "Payment authorization failed" }, { status: 500 })
  }
}
