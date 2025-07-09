import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("=== PayU Return POST Request ===")

    // Get the request body
    const body = await request.text()
    console.log("POST body:", body)

    // Try to parse as JSON first
    let payuData: any = {}
    try {
      payuData = JSON.parse(body)
      console.log("Parsed JSON data:", payuData)
    } catch {
      // If not JSON, try to parse as form data
      const formData = new URLSearchParams(body)
      payuData = Object.fromEntries(formData.entries())
      console.log("Parsed form data:", payuData)
    }

    // Get headers for additional info
    const headers = Object.fromEntries(request.headers.entries())
    console.log("Request headers:", headers)

    // Extract payment information
    const paymentInfo = {
      payuPaymentReference: payuData.payuPaymentReference || payuData.payment_reference || payuData.reference,
      merchantPaymentReference: payuData.merchantPaymentReference || payuData.merchant_reference || payuData.order_id,
      status: payuData.status || payuData.payment_status,
      amount: payuData.amount,
      currency: payuData.currency,
      timestamp: new Date().toISOString(),
      rawData: payuData,
    }

    console.log("Extracted payment info:", paymentInfo)

    // Store the payment result temporarily (you might want to use a database in production)
    // For now, we'll just log it and redirect

    // Create redirect URL with payment reference
    const redirectUrl = new URL("/payment/return", request.url)
    if (paymentInfo.merchantPaymentReference) {
      redirectUrl.searchParams.set("reference", paymentInfo.merchantPaymentReference)
    }
    if (paymentInfo.status) {
      redirectUrl.searchParams.set("status", paymentInfo.status)
    }

    console.log("Redirecting to:", redirectUrl.toString())

    // Return a redirect response
    return NextResponse.redirect(redirectUrl.toString())
  } catch (error) {
    console.error("Error handling PayU return POST:", error)

    // Even if there's an error, redirect to the return page
    const redirectUrl = new URL("/payment/return?error=processing_failed", request.url)
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
