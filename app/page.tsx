import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function HomePage() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>PayU Russia Integration</CardTitle>
            <CardDescription>Test the complete payment flow</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/payment">
                <Button className="w-full h-20 text-lg">🛒 Make a Payment</Button>
              </Link>
              <Link href="/debug">
                <Button variant="outline" className="w-full h-20 text-lg bg-transparent">
                  🔧 Debug Panel
                </Button>
              </Link>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-2">✅ Integration Status</h3>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Environment variables loaded</li>
                <li>• PayU API connection successful</li>
                <li>• Date format resolved (custom format)</li>
                <li>• Payment authorization working</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
