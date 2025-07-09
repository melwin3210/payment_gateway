import { NextResponse } from "next/server"
import { getPayUConfig } from "@/lib/payu-utils"

export async function GET() {
  try {
    const config = getPayUConfig()

    // Don't log the actual secret key, just check if it exists
    const credentialsCheck = {
      merchantCode: config.merchantCode ? `${config.merchantCode.substring(0, 4)}****` : "MISSING",
      secretKey: config.secretKey ? `****${config.secretKey.substring(config.secretKey.length - 4)}` : "MISSING",
      baseUrl: config.baseUrl,
      hasAllCredentials: !!(config.merchantCode && config.secretKey && config.baseUrl),
    }

    console.log("Credentials check:", credentialsCheck)

    return NextResponse.json({
      success: true,
      credentials: credentialsCheck,
      envVars: {
        PAYU_MERCHANT_CODE: process.env.PAYU_MERCHANT_CODE ? "SET" : "MISSING",
        PAYU_SECRET_KEY: process.env.PAYU_SECRET_KEY ? "SET" : "MISSING",
        PAYU_BASE_URL: process.env.PAYU_BASE_URL ? "SET" : "MISSING",
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to check credentials",
        details: error,
      },
      { status: 500 },
    )
  }
}
