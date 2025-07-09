import { type NextRequest, NextResponse } from "next/server"
import {
  generateSignature,
  createPayUHeaders,
  getPayUConfig,
  secureApiCall,
  generatePayUDate, // Add this import
  type RefundRequest,
} from "@/lib/payu-utils"

export async function POST(request: NextRequest) {
  try {
    const config = getPayUConfig()
    const body = await request.json()
    const requestDate = generatePayUDate()
    console.log("Generated request date for refund:", requestDate)

    const refundRequest: RefundRequest = {
      payuPaymentReference: body.payuPaymentReference,
      originalAmount: body.originalAmount,
      amount: body.amount,
      currency: body.currency,
    }

    const requestBody = JSON.stringify(refundRequest)
    const path = "/api/v4/payments/refund"

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
    const headers = createPayUHeaders(config.merchantCode, signature, requestDate)

    console.log("Making PayU refund request to:", `${config.baseUrl}${path}`)

    // Make request to PayU using secure API call
    const response = await secureApiCall(`${config.baseUrl}${path}`, {
      method: "POST",
      headers,
      body: requestBody,
    })

    console.log("PayU refund response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("PayU refund error response:", errorText)
      throw new Error(`PayU API error: ${response.status} - ${errorText}`)
    }

    const refundResponse = await response.json()
    console.log("PayU refund success response:", refundResponse)

    return NextResponse.json({
      success: true,
      data: refundResponse,
    })
  } catch (error) {
    console.error("PayU refund error:", error)

    let errorMessage = "Payment refund failed"
    if (error instanceof Error) {
      errorMessage = error.message
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
