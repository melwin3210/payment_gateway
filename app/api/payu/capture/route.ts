import { type NextRequest, NextResponse } from "next/server"
import { generateSignature, createPayUHeaders, getPayUConfig, type CaptureRequest } from "@/lib/payu-utils"

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

    // Make request to PayU
    const response = await fetch(`${config.baseUrl}${path}`, {
      method: "POST",
      headers,
      body: requestBody,
    })

    if (!response.ok) {
      throw new Error(`PayU API error: ${response.status}`)
    }

    const captureResponse = await response.json()

    return NextResponse.json({
      success: true,
      data: captureResponse,
    })
  } catch (error) {
    console.error("PayU capture error:", error)
    return NextResponse.json({ success: false, error: "Payment capture failed" }, { status: 500 })
  }
}
