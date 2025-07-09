import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function HomePage() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>PayU Payment Gateway</CardTitle>
            <CardDescription>Secure payment processing</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/payment">
              <Button className="w-full">Make Payment</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
