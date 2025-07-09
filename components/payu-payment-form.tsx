"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Loader2, CreditCard, Smartphone, Banknote, ExternalLink } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface PaymentFormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  countryCode: string
  paymentMethod: "CCVISAMC" | "FASTER_PAYMENTS" | "SBERPAY" | "TPAY" | "ALFAPAY"
  products: Array<{
    name: string
    sku: string
    unitPrice: string
    quantity: string
  }>
}

export default function PayUPaymentForm() {
  const [formData, setFormData] = useState<PaymentFormData>({
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    phone: "+7-9123456789",
    countryCode: "RU",
    paymentMethod: "CCVISAMC",
    products: [
      {
        name: "Test Product",
        sku: "PROD001",
        unitPrice: "1000.00",
        quantity: "1",
      },
    ],
  })

  const [isLoading, setIsLoading] = useState(false)
  const [paymentResult, setPaymentResult] = useState<any>(null)
  const { toast } = useToast()

  const paymentMethods = [
    { value: "CCVISAMC", label: "Credit/Debit Card", icon: CreditCard },
    { value: "FASTER_PAYMENTS", label: "Fast Payment System (SBP)", icon: Smartphone },
    { value: "SBERPAY", label: "SberPay", icon: Banknote },
    { value: "TPAY", label: "T-Pay", icon: Banknote },
    { value: "ALFAPAY", label: "AlfaPay", icon: Banknote },
  ]

  const handleInputChange = (field: keyof PaymentFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setPaymentResult(null)

    try {
      // Create a simple return URL without complex parameters
      const returnUrl = `${window.location.protocol}//${window.location.host}/payment/return`

      console.log("Creating payment with return URL:", returnUrl)

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
          products: formData.products,
        }),
      })

      const result = await response.json()
      console.log("Payment creation result:", result)

      if (result.success) {
        setPaymentResult(result)

        // Store payment reference for status checking
        localStorage.setItem("payuPaymentReference", result.data.payuPaymentReference)
        localStorage.setItem("merchantPaymentReference", result.merchantPaymentReference)
        localStorage.setItem("paymentStartTime", Date.now().toString())
        localStorage.setItem("paymentAmount", result.data.amount || "1000.00")

        toast({
          title: "Payment Initiated Successfully!",
          description: `Payment reference: ${result.data.payuPaymentReference}`,
        })
      } else {
        throw new Error(result.error || "Payment failed")
      }
    } catch (error) {
      console.error("Payment error:", error)
      toast({
        title: "Payment Error",
        description: error instanceof Error ? error.message : "An error occurred",
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
        description: "Payment URL not found. Please try again.",
        variant: "destructive",
      })
      return
    }

    console.log("Redirecting to PayU URL:", paymentUrl)

    // Validate URL before redirecting
    try {
      new URL(paymentUrl)
    } catch (error) {
      console.error("Invalid payment URL:", paymentUrl)
      toast({
        title: "Error",
        description: "Invalid payment URL received from PayU.",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Redirecting to PayU",
      description: "Complete your payment and you'll be redirected back",
      duration: 3000,
    })

    // Use a simple redirect
    setTimeout(() => {
      window.location.href = paymentUrl
    }, 1000)
  }

  if (paymentResult) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-green-600">✅ Payment Created Successfully!</CardTitle>
          <CardDescription>Your payment has been initialized with PayU</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Payment Details:</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>PayU Reference:</span>
                <span className="font-mono text-xs">{paymentResult.data.payuPaymentReference}</span>
              </div>
              <div className="flex justify-between">
                <span>Merchant Reference:</span>
                <span className="font-mono text-xs">{paymentResult.merchantPaymentReference}</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="font-semibold">{paymentResult.data.status}</span>
              </div>
              <div className="flex justify-between">
                <span>Authorization:</span>
                <span className="text-orange-600 font-semibold">
                  {paymentResult.data.authorization?.authorized || "PENDING"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Amount:</span>
                <span className="font-semibold">{paymentResult.data.amount || "1000.00"} RUB</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Next Steps:</h3>
            <p className="text-sm text-blue-700 mb-3">
              Click the button below to complete your payment on PayU's secure payment page.
            </p>
            <Button onClick={handleRedirectToPayment} className="w-full" size="lg">
              <ExternalLink className="mr-2 h-4 w-4" />
              Complete Payment on PayU
            </Button>
          </div>

          <div className="text-xs text-gray-500 space-y-1">
            <p>• You will be redirected to PayU's secure payment page</p>
            <p>• After payment, you'll automatically return to see the final status</p>
            <p>• This is a sandbox environment - use test card details</p>
            <p>
              • Payment URL:{" "}
              {paymentResult.data.paymentResult?.url ? (
                <span className="text-green-600">✅ Ready</span>
              ) : (
                <span className="text-red-600">❌ Missing</span>
              )}
            </p>
          </div>

          {/* Debug info */}
          <details className="text-xs text-gray-400">
            <summary className="cursor-pointer">Debug Info</summary>
            <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
              {JSON.stringify(paymentResult, null, 2)}
            </pre>
          </details>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>PayU Russia Payment</CardTitle>
        <CardDescription>Complete your payment using PayU Russia payment gateway</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {/* Payment Method Selection */}
          <div className="space-y-3">
            <Label>Payment Method</Label>
            <RadioGroup
              value={formData.paymentMethod}
              onValueChange={(value) => handleInputChange("paymentMethod", value)}
              className="grid grid-cols-1 gap-4"
            >
              {paymentMethods.map((method) => {
                const Icon = method.icon
                return (
                  <div key={method.value}>
                    <RadioGroupItem value={method.value} id={method.value} className="peer sr-only" />
                    <Label
                      htmlFor={method.value}
                      className="flex items-center space-x-3 rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                    >
                      <Icon className="h-5 w-5" />
                      <span>{method.label}</span>
                    </Label>
                  </div>
                )
              })}
            </RadioGroup>
          </div>

          {/* Customer Information */}
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
                  <SelectItem value="DE">Germany</SelectItem>
                  <SelectItem value="FR">France</SelectItem>
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

          {/* Order Summary */}
          <div className="space-y-2">
            <Label>Order Summary</Label>
            <div className="rounded-md border p-4 space-y-2">
              {formData.products.map((product, index) => (
                <div key={index} className="flex justify-between">
                  <span>
                    {product.name} (x{product.quantity})
                  </span>
                  <span>{product.unitPrice} RUB</span>
                </div>
              ))}
              <div className="border-t pt-2 font-semibold flex justify-between">
                <span>Total</span>
                <span>
                  {formData.products
                    .reduce(
                      (total, product) =>
                        total + Number.parseFloat(product.unitPrice) * Number.parseInt(product.quantity),
                      0,
                    )
                    .toFixed(2)}{" "}
                  RUB
                </span>
              </div>
            </div>
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
              "Create Payment"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
