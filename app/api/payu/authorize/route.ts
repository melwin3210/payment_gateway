import { type NextRequest, NextResponse } from "next/server"
import {
  generateSignature,
  generateMerchantReference,
  generateIdempotencyKey,
  createPayUHeaders,
  getPayUConfig,
  secureApiCall,
  generatePayUDate, // Add this import
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
    const requestDate = generatePayUDate() // Try the GMT format first

    // Add logging to see what date format we're sending
    console.log("Generated request date:", requestDate)

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

    console.log("Making PayU API request to:", `${config.baseUrl}${path}`)
    console.log("Request headers:", headers)
    console.log("Request body:", requestBody)

    // Make request to PayU using secure API call
    const response = await secureApiCall(`${config.baseUrl}${path}`, {
      method: "POST",
      headers,
      body: requestBody,
    })

    console.log("PayU API response status:", response.status)
    console.log("PayU API response headers:", Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.error("PayU API error response:", errorText)
      throw new Error(`PayU API error: ${response.status} - ${errorText}`)
    }

    const paymentResponse: PaymentResponse = await response.json()
    console.log("PayU API success response:", paymentResponse)

    return NextResponse.json({
      success: true,
      data: paymentResponse,
      merchantPaymentReference,
    })
  } catch (error) {
    console.error("PayU authorization error:", error)

    // Provide more detailed error information
    let errorMessage = "Payment authorization failed"
    if (error instanceof Error) {
      errorMessage = error.message
      console.error("Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
        cause: error.cause,
      })
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: process.env.NODE_ENV === "development" ? error : undefined,
      },
      { status: 500 },
    )
  }
}
