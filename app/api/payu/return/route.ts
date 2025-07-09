import { type NextRequest, NextResponse } from "next/server"

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

    // Store payment result temporarily (in production, use a database)
    // For now, we'll pass it via URL parameters

    // Create redirect URL with payment information
    const baseUrl = request.url.replace("/api/payu/return", "")
    const redirectUrl = new URL("/payment/return", baseUrl)

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

    console.log("Will redirect browser to:", redirectUrl.toString())

    // Log success/failure
    if (paymentInfo.isSuccess) {
      console.log("✅ PAYMENT SUCCESS - Authorized payment received")
    } else {
      console.log("❌ PAYMENT FAILED - Status:", paymentInfo.status, "Code:", paymentInfo.code)
    }

    // Return HTML with JavaScript redirect (this will work for server-to-server POST)
    const htmlResponse = `
<!DOCTYPE html>
<html>
<head>
    <title>Payment Processing</title>
    <meta charset="utf-8">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background-color: #f5f5f5;
        }
        .container {
            text-align: center;
            background: white;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            max-width: 400px;
        }
        .spinner {
            border: 3px solid #f3f3f3;
            border-top: 3px solid #3498db;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 1rem;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .success { color: #27ae60; }
        .error { color: #e74c3c; }
        .pending { color: #f39c12; }
    </style>
</head>
<body>
    <div class="container">
        <div class="spinner"></div>
        <h2>Processing Payment Result</h2>
        <p class="${paymentInfo.isSuccess ? "success" : paymentInfo.status === "PENDING" ? "pending" : "error"}">
            ${
              paymentInfo.isSuccess
                ? "✅ Payment Successful!"
                : paymentInfo.status === "PENDING"
                  ? "⏳ Payment Processing..."
                  : "❌ Payment Failed"
            }
        </p>
        <p>Redirecting you to the results page...</p>
        <p><small>Reference: ${paymentInfo.merchantPaymentReference || "N/A"}</small></p>
    </div>

    <script>
        console.log('PayU callback received:', ${JSON.stringify(paymentInfo)});
        
        // Store payment info in localStorage for the frontend
        try {
            localStorage.setItem('payuCallbackData', ${JSON.stringify(JSON.stringify(paymentInfo))});
            localStorage.setItem('payuCallbackTimestamp', Date.now().toString());
        } catch (e) {
            console.warn('Could not store callback data in localStorage:', e);
        }
        
        // Redirect after a short delay
        setTimeout(function() {
            window.location.href = '${redirectUrl.toString()}';
        }, 2000);
        
        // Fallback: redirect immediately if user clicks
        document.addEventListener('click', function() {
            window.location.href = '${redirectUrl.toString()}';
        });
        
        // Auto-redirect after 5 seconds as failsafe
        setTimeout(function() {
            if (window.location.href.indexOf('/payment/return') === -1) {
                window.location.href = '${redirectUrl.toString()}';
            }
        }, 5000);
    </script>
</body>
</html>`

    // Return HTML response
    return new Response(htmlResponse, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    })
  } catch (error) {
    console.error("❌ Error handling PayU return POST:", error)

    // Return error HTML
    const errorHtml = `
<!DOCTYPE html>
<html>
<head>
    <title>Payment Processing Error</title>
    <meta charset="utf-8">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background-color: #f5f5f5;
        }
        .container {
            text-align: center;
            background: white;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            max-width: 400px;
        }
        .error { color: #e74c3c; }
    </style>
</head>
<body>
    <div class="container">
        <h2 class="error">❌ Processing Error</h2>
        <p>There was an error processing the payment callback.</p>
        <p>Redirecting to payment status page...</p>
        <button onclick="redirect()">Continue</button>
    </div>

    <script>
        function redirect() {
            window.location.href = '/payment/return?error=processing_failed';
        }
        
        // Auto-redirect after 3 seconds
        setTimeout(redirect, 3000);
    </script>
</body>
</html>`

    return new Response(errorHtml, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    })
  }
}

// Handle GET requests (in case PayU uses GET sometimes)
export async function GET(request: NextRequest) {
  console.log("=== PayU Return GET Request ===")

  const url = new URL(request.url)
  const searchParams = Object.fromEntries(url.searchParams.entries())
  console.log("GET parameters:", searchParams)

  // For GET requests, we can use a normal redirect
  const redirectUrl = new URL("/payment/return", request.url)

  // Copy all search parameters
  for (const [key, value] of url.searchParams.entries()) {
    redirectUrl.searchParams.set(key, value)
  }

  console.log("GET redirect to:", redirectUrl.toString())

  return NextResponse.redirect(redirectUrl.toString())
}
