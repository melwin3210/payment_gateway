import type { NextRequest } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const formData = new URLSearchParams(rawBody)
    const formFields = Object.fromEntries(formData.entries())

    let payuData: any = {}
    if (formFields.body) {
      try {
        payuData = JSON.parse(formFields.body)
      } catch (error) {
        payuData = { rawBody: formFields.body }
      }
    }

    const paymentInfo = {
      payuPaymentReference: payuData.payuPaymentReference,
      merchantPaymentReference: payuData.merchantPaymentReference,
      status: payuData.status,
      message: payuData.message,
      isSuccess: payuData.status === "SUCCESS" && payuData.paymentResult?.payuResponseCode === "AUTHORIZED",
    }

    const baseUrl = request.url.replace("/api/payu/return", "")
    const redirectUrl = new URL("/payment/return", baseUrl)

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
    </style>
</head>
<body>
    <div class="container">
        <div class="spinner"></div>
        <h2>Processing Payment</h2>
        <p class="${paymentInfo.isSuccess ? "success" : "error"}">
            ${paymentInfo.isSuccess ? "✅ Payment Successful!" : "Processing..."}
        </p>
        <p>Redirecting...</p>
    </div>

    <script>
        localStorage.setItem('payuCallbackData', ${JSON.stringify(JSON.stringify(paymentInfo))});
        localStorage.setItem('payuCallbackTimestamp', Date.now().toString());
        
        setTimeout(function() {
            window.location.href = '${redirectUrl.toString()}';
        }, 2000);
    </script>
</body>
</html>`

    return new Response(htmlResponse, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    })
  } catch (error) {
    const errorHtml = `
<!DOCTYPE html>
<html>
<head>
    <title>Payment Error</title>
    <meta charset="utf-8">
</head>
<body>
    <div style="text-align: center; padding: 2rem;">
        <h2>Processing Error</h2>
        <p>Redirecting to payment status...</p>
    </div>
    <script>
        setTimeout(function() {
            window.location.href = '/payment/return?error=processing_failed';
        }, 2000);
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
