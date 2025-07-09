"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, ExternalLink } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const paymentMethods = [
  { value: "CCVISAMC", label: "Credit/Debit Card", icon: "💳" },
  { value: "FASTER_PAYMENTS", label: "Fast Payment System (SBP)", icon: "📱" },
  { value: "SBERPAY", label: "SberPay", icon: "🏦" },
  { value: "TPAY", label: "T-Pay", icon: "💰" },
  { value: "ALFAPAY", label: "AlfaPay", icon: "🔷" },
]

interface PaymentFormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  countryCode: string
  paymentMethod: "CCVISAMC" | "FASTER_PAYMENTS" | "SBERPAY" | "TPAY" | "ALFAPAY"
  amount: string
}

export default function PayUPaymentForm() {
  const [formData, setFormData] = useState<PaymentFormData>({
    firstName: "Melwin",
    lastName: "Fernandez",
    email: "melwin@example.com",
    phone: "+7-9123456789",
    countryCode: "RU",
    paymentMethod: "CCVISAMC",
    amount: "1000.00",
  })

  const [isLoading, setIsLoading] = useState(false)
  const [paymentResult, setPaymentResult] = useState<any>(null)
  const { toast } = useToast()

  const handleInputChange = (field: keyof PaymentFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const baseUrl = `${window.location.protocol}//${window.location.host}`
      const returnUrl = `${baseUrl}/api/payu/return`

      const response = await fetch("/api/payu/authorize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentMethod: formData.paymentMethod,
          currency: "RUB",
          returnUrl: returnUrl,
          client: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            countryCode: formData.countryCode,
            phone: formData.phone,
          },
          products: [
            {
              name: "Product",
              sku: "PROD001",
              unitPrice: formData.amount,
              quantity: "1",
            },
          ],
        }),
      })

      const result = await response.json()

      if (result.success) {
        setPaymentResult(result)
        localStorage.setItem("payuPaymentReference", result.data.payuPaymentReference)
        localStorage.setItem("merchantPaymentReference", result.merchantPaymentReference)

        toast({
          title: "Payment Created",
          description: "Redirecting to PayU...",
        })
      } else {
        throw new Error(result.error || "Payment failed")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Payment failed",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRedirectToPayment = () => {
    const paymentUrl = paymentResult?.data?.paymentResult?.url

    if (!paymentUrl) {
      toast({
        title: "Error",
        description: "Payment URL not found",
        variant: "destructive",
      })
      return
    }

    window.location.href = paymentUrl
  }

  if (paymentResult) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-green-600">Payment Ready</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Click below to complete your payment securely with PayU
              </p>
              <Button onClick={handleRedirectToPayment} className="w-full" size="lg">
                <ExternalLink className="mr-2 h-4 w-4" />
                Pay {formData.amount} RUB
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Payment Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Payment Method Selection */}
        <div className="space-y-3">
          <Label>Payment Method</Label>
          <div className="grid grid-cols-1 gap-2">
            {paymentMethods.map((method) => (
              <label
                key={method.value}
                className={`flex items-center space-x-3 rounded-md border-2 p-3 cursor-pointer transition-colors ${
                  formData.paymentMethod === method.value
                    ? "border-primary bg-primary/5"
                    : "border-muted hover:border-primary/50"
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value={method.value}
                  checked={formData.paymentMethod === method.value}
                  onChange={(e) => handleInputChange("paymentMethod", e.target.value)}
                  className="sr-only"
                />
                <span className="text-lg">{method.icon}</span>
                <span className="font-medium">{method.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Existing form fields... */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) => handleInputChange("firstName", e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) => handleInputChange("lastName", e.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="countryCode">Country</Label>
            <Select value={formData.countryCode} onValueChange={(value) => handleInputChange("countryCode", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="RU">Russia</SelectItem>
                <SelectItem value="US">United States</SelectItem>
                <SelectItem value="GB">United Kingdom</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              placeholder="+7-1234567890"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">Amount (RUB)</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="1"
            value={formData.amount}
            onChange={(e) => handleInputChange("amount", e.target.value)}
            required
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Payment...
            </>
          ) : (
            "Pay Now"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
