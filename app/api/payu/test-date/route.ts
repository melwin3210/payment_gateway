import { NextResponse } from "next/server"
import { generatePayUDate, generatePayUDateSimple, generatePayUDateISO } from "@/lib/payu-utils"

export async function GET() {
  const formats = {
    gmt: generatePayUDate(),
    simple: generatePayUDateSimple(),
    iso: generatePayUDateISO(),
    timestamp: Date.now(),
    utc: new Date().toUTCString(),
  }

  console.log("Date formats for PayU testing:", formats)

  return NextResponse.json({
    success: true,
    dateFormats: formats,
    recommendation: "Try GMT format first, then simple if that fails",
  })
}
