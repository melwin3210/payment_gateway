import { type NextRequest, NextResponse } from "next/server"
import { generateSignature, createPayUHeaders, getPayUConfig, secureApiCall, generatePayUDate } from "@/lib/payu-utils"

export async function GET(request: NextRequest, { params }: { params: { reference: string } }) {
  try {
    const config = getPayUConfig()
    const requestDate = generatePayUDate()
    console.log("Generated request date for status check:", requestDate)
    const path = `/api/v4/payments/status/${params.reference}`

    // Generate signature for GET request (empty body)
    const signature = generateSignature(config.merchantCode, config.secretKey, requestDate, "GET", path, "", "")

    // Create headers (no idempotency key for GET)
    const headers = createPayUHeaders(config.merchantCode, signature, requestDate)

    console.log("Making PayU status request to:", `${config.baseUrl}${path}`)

    // Make request to PayU using secure API call
    const response = await secureApiCall(`${config.baseUrl}${path}`, {
      method: "GET",
      headers,
    })

    console.log("PayU status response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("PayU status error response:", errorText)
      throw new Error(`PayU API error: ${response.status} - ${errorText}`)
    }

    const statusResponse = await response.json()
    console.log("PayU status success response:", statusResponse)

    return NextResponse.json({
      success: true,
      data: statusResponse,
    })
  } catch (error) {
    console.error("PayU status check error:", error)

    let errorMessage = "Status check failed"
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
