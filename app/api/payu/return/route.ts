import { type NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    console.log("=== PayU Return POST Request ===")

    // Get the raw request body
    const rawBody = await request.text()
    console.log("Raw POST body:", rawBody)

    // Parse as form data first
    const formData = new URLSearchParams(rawBody)
    const formFields = Object.fromEntries(formData.entries())
    console.log("Parsed form data:", formFields)

    // Extract the JSON payload from the 'body' field
    let payuData: any = {}
    if (formFields.body) {
      try {
        payuData = JSON.parse(formFields.body)
        console.log("Parsed PayU JSON payload:", payuData)
      } catch (error) {
        console.error("Failed to parse PayU JSON payload:", error)
        payuData = { rawBody: formFields.body }
      }
    }

    // Extract signature and verification data
    const signature = formFields.signature
    const merchant = formFields.merchant
    const date = formFields.date

    console.log("PayU signature verification data:", {
      signature,
      merchant,
      date,
      hasSignature: !!signature,
    })

    // TODO: Verify signature for security (optional but recommended)
    // const isValidSignature = verifyPayUSignature(formFields.body, signature, merchant, date)

    // Extract payment information from the JSON payload
    const paymentInfo = {
      payuPaymentReference: payuData.payuPaymentReference,
      merchantPaymentReference: payuData.merchantPaymentReference,
      status: payuData.status,
      paymentResult: payuData.paymentResult,
      message: payuData.message,
      code: payuData.code,
      timestamp: new Date().toISOString(),
      signature,
      merchant,
      date,
      isSuccess: payuData.status === "SUCCESS" && payuData.paymentResult?.payuResponseCode === "AUTHORIZED",
      rawData: payuData,
    }

    console.log("Extracted payment info:", paymentInfo)

    // Store payment result in localStorage-compatible format for the frontend
    // In production, you'd store this in a database

    // Create redirect URL with payment information
    const redirectUrl = new URL("/payment/return", request.url)

    // Add essential parameters to the URL
    if (paymentInfo.merchantPaymentReference) {
      redirectUrl.searchParams.set("reference", paymentInfo.merchantPaymentReference)
    }
    if (paymentInfo.status) {
      redirectUrl.searchParams.set("status", paymentInfo.status)
    }
    if (paymentInfo.payuPaymentReference) {
      redirectUrl.searchParams.set("payuRef", paymentInfo.payuPaymentReference)
    }
    if (paymentInfo.isSuccess) {
      redirectUrl.searchParams.set("success", "true")
    }
    if (paymentInfo.message) {
      redirectUrl.searchParams.set("message", encodeURIComponent(paymentInfo.message))
    }

    console.log("Redirecting to:", redirectUrl.toString())

    // Log success/failure
    if (paymentInfo.isSuccess) {
      console.log("✅ PAYMENT SUCCESS - Authorized payment received")
    } else {
      console.log("❌ PAYMENT FAILED - Status:", paymentInfo.status, "Code:", paymentInfo.code)
    }

    // Return a redirect response
    return NextResponse.redirect(redirectUrl.toString())
  } catch (error) {
    console.error("❌ Error handling PayU return POST:", error)

    // Even if there's an error, redirect to the return page with error info
    const redirectUrl = new URL("/payment/return", request.url)
    redirectUrl.searchParams.set("error", "processing_failed")
    redirectUrl.searchParams.set(
      "errorMessage",
      encodeURIComponent(error instanceof Error ? error.message : "Unknown error"),
    )

    return NextResponse.redirect(redirectUrl.toString())
  }
}

// Also handle GET requests (in case PayU uses GET sometimes)
export async function GET(request: NextRequest) {
  console.log("=== PayU Return GET Request ===")

  const url = new URL(request.url)
  const searchParams = Object.fromEntries(url.searchParams.entries())
  console.log("GET parameters:", searchParams)

  // Just redirect to the return page with the parameters
  const redirectUrl = new URL("/payment/return", request.url)

  // Copy all search parameters
  for (const [key, value] of url.searchParams.entries()) {
    redirectUrl.searchParams.set(key, value)
  }

  console.log("GET redirect to:", redirectUrl.toString())

  return NextResponse.redirect(redirectUrl.toString())
}

// Optional: Add signature verification function for security
function verifyPayUSignature(body: string, signature: string, merchant: string, date: string): boolean {
  try {
    // This is a placeholder - you'd need to implement PayU's signature verification
    // according to their documentation
    const secretKey = process.env.PAYU_SECRET_KEY!

    // Example signature verification (adjust according to PayU's spec)
    const stringToHash = merchant + date + body
    const expectedSignature = crypto.createHmac("sha256", secretKey).update(stringToHash).digest("hex")

    const isValid = signature === expectedSignature
    console.log("Signature verification:", { isValid, provided: signature, expected: expectedSignature })

    return isValid
  } catch (error) {
    console.error("Signature verification error:", error)
    return false
  }
}
