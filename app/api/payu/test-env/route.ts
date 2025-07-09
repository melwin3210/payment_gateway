import { NextResponse } from "next/server"

export async function GET() {
  // Check if environment variables are available
  const envCheck = {
    PAYU_MERCHANT_CODE: process.env.PAYU_MERCHANT_CODE || "NOT_SET",
    PAYU_SECRET_KEY: process.env.PAYU_SECRET_KEY ? "SET (hidden)" : "NOT_SET",
    PAYU_BASE_URL: process.env.PAYU_BASE_URL || "NOT_SET",
    NODE_ENV: process.env.NODE_ENV || "NOT_SET",
    allEnvVars: Object.keys(process.env).filter((key) => key.startsWith("PAYU_")),
  }

  console.log("Environment check:", envCheck)

  return NextResponse.json({
    success: true,
    environment: envCheck,
    instructions: [
      "1. Make sure .env.local file exists in your project root",
      "2. Add your actual PayU credentials to .env.local",
      "3. Restart your development server after adding environment variables",
      "4. Environment variables should start with PAYU_",
    ],
  })
}
