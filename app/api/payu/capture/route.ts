import { type NextRequest, NextResponse } from "next/server"
import {
  generateSignature,
  createPayUHeaders,
  getPayUConfig,
  secureApiCall,
  type CaptureRequest,
} from "@/lib/payu-utils"

export async function POST(request: NextRequest) {
  try {
    const config = getPayUConfig()
    const body = await request.json()
    const requestDate = new Date().toISOString()

    const captureRequest: CaptureRequest = {
      payuPaymentReference: body.payuPaymentReference,
      currency: body.currency,
      originalAmount: body.originalAmount,
      amount: body.amount,
    }

    const requestBody = JSON.stringify(captureRequest)
    const path = "/api/v4/payments/capture"

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

    console.log("Making PayU capture request to:", `${config.baseUrl}${path}`)

    // Make request to PayU using secure API call
    const response = await secureApiCall(`${config.baseUrl}${path}`, {
      method: "POST",
      headers,
      body: requestBody,
    })

    console.log("PayU capture response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("PayU capture error response:", errorText)
      throw new Error(`PayU API error: ${response.status} - ${errorText}`)
    }

    const captureResponse = await response.json()
    console.log("PayU capture success response:", captureResponse)

    return NextResponse.json({
      success: true,
      data: captureResponse,
    })
  } catch (error) {
    console.error("PayU capture error:", error)

    let errorMessage = "Payment capture failed"
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
