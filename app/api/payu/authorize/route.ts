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
  type PaymentResponse,
} from "@/lib/payu-utils"

export async function POST(request: NextRequest) {
  const config = getPayUConfig()
  const body = await request.json()

  // Try different date formats
  const dateFormats: Array<"rfc2822" | "iso" | "simple" | "custom" | "unix" | "millis"> = [
    "rfc2822",
    "simple",
    "custom",
    "iso",
    "unix",
    "millis",
  ]

  for (const format of dateFormats) {
    try {
      console.log(`\n=== Trying date format: ${format} ===`)

      // Generate unique references
      const merchantPaymentReference = generateMerchantReference()
      const idempotencyKey = generateIdempotencyKey()
      const requestDate = generatePayUDate(format)

      console.log("Generated request date:", requestDate)
      console.log("Date format:", format)

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

      // Make request to PayU using secure API call
      const response = await secureApiCall(`${config.baseUrl}${path}`, {
        method: "POST",
        headers,
        body: requestBody,
      })

      console.log("PayU API response status:", response.status)

      if (response.ok) {
        const paymentResponse: PaymentResponse = await response.json()
        console.log("PayU API success response:", paymentResponse)
        console.log(`SUCCESS with date format: ${format}`)

        return NextResponse.json({
          success: true,
          data: paymentResponse,
          merchantPaymentReference,
          usedDateFormat: format,
        })
      } else {
        const errorText = await response.text()
        console.error(`Failed with ${format} format:`, errorText)

        // If it's not a date error, break the loop and return the error
        if (!errorText.includes("Invalid date")) {
          throw new Error(`PayU API error: ${response.status} - ${errorText}`)
        }

        // Continue to next format if it's a date error
        continue
      }
    } catch (error) {
      console.error(`Error with ${format} format:`, error)

      // If it's the last format, throw the error
      if (format === dateFormats[dateFormats.length - 1]) {
        let errorMessage = "Payment authorization failed - all date formats tried"
        if (error instanceof Error) {
          errorMessage = error.message
        }

        return NextResponse.json(
          {
            success: false,
            error: errorMessage,
            triedFormats: dateFormats,
            details: process.env.NODE_ENV === "development" ? error : undefined,
          },
          { status: 500 },
        )
      }
    }
  }

  // This should never be reached, but just in case
  return NextResponse.json(
    {
      success: false,
      error: "All date formats failed",
      triedFormats: dateFormats,
    },
    { status: 500 },
  )
}
