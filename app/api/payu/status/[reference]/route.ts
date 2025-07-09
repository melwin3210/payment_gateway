import { type NextRequest, NextResponse } from "next/server"
import { generateSignature, createPayUHeaders, getPayUConfig } from "@/lib/payu-utils"

export async function GET(request: NextRequest, { params }: { params: { reference: string } }) {
  try {
    const config = getPayUConfig()
    const requestDate = new Date().toISOString()
    const path = `/api/v4/payments/status/${params.reference}`

    // Generate signature for GET request (empty body)
    const signature = generateSignature(config.merchantCode, config.secretKey, requestDate, "GET", path, "", "")

    // Create headers (no idempotency key for GET)
    const headers = createPayUHeaders(config.merchantCode, signature, requestDate)

    // Make request to PayU
    const response = await fetch(`${config.baseUrl}${path}`, {
      method: "GET",
      headers,
    })

    if (!response.ok) {
      throw new Error(`PayU API error: ${response.status}`)
    }

    const statusResponse = await response.json()

    return NextResponse.json({
      success: true,
      data: statusResponse,
    })
  } catch (error) {
    console.error("PayU status check error:", error)
    return NextResponse.json({ success: false, error: "Status check failed" }, { status: 500 })
  }
}
