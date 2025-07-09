import { type NextRequest, NextResponse } from "next/server"
import {
  generateSignature,
  generateMerchantReference,
  generateIdempotencyKey,
  createPayUHeaders,
  getPayUConfig,
  secureApiCall,
  generatePayUDate,
  type PaymentRequest,
} from "@/lib/payu-utils"

export async function POST(request: NextRequest) {
  try {
    const config = getPayUConfig()
    const body = await request.json()

    const merchantPaymentReference = generateMerchantReference()
    const idempotencyKey = generateIdempotencyKey()
    const requestDate = generatePayUDate()

    const paymentRequest: PaymentRequest = {
      merchantPaymentReference,
      currency: body.currency || "RUB",
      returnUrl: body.returnUrl,
      authorization: {
        paymentMethod: "CCVISAMC",
        usePaymentPage: "YES",
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

    const signature = generateSignature(
      config.merchantCode,
      config.secretKey,
      requestDate,
      "POST",
      path,
      "",
      requestBody,
    )

    const headers = createPayUHeaders(config.merchantCode, signature, requestDate, idempotencyKey)

    const response = await secureApiCall(`${config.baseUrl}${path}`, {
      method: "POST",
      headers,
      body: requestBody,
    })

    if (response.ok) {
      const paymentResponse = await response.json()
      return NextResponse.json({
        success: true,
        data: paymentResponse,
        merchantPaymentReference,
      })
    } else {
      const errorText = await response.text()
      throw new Error(`PayU API error: ${response.status} - ${errorText}`)
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Payment authorization failed",
      },
      { status: 500 },
    )
  }
}
