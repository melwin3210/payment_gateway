"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Loader2, CreditCard, Smartphone, Banknote } from "lucide-react"
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
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    countryCode: "RU",
    paymentMethod: "CCVISAMC",
    products: [
      {
        name: "Sample Product",
        sku: "PROD001",
        unitPrice: "1000.00",
        quantity: "1",
      },
    ],
  })

  const [isLoading, setIsLoading] = useState(false)
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

    try {
      const response = await fetch("/api/payu/authorize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentMethod: formData.paymentMethod,
          currency: "RUB",
          returnUrl: `${window.location.origin}/payment/return`,
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

      if (result.success) {
        toast({
          title: "Payment Initiated",
          description: "Redirecting to payment page...",
        })

        // If there's a redirect URL, redirect the user
        if (result.data.redirectUrl) {
          window.location.href = result.data.redirectUrl
        } else {
          // Store payment reference for status checking
          localStorage.setItem("payuPaymentReference", result.data.payuPaymentReference)
          localStorage.setItem("merchantPaymentReference", result.merchantPaymentReference)

          toast({
            title: "Payment Created",
            description: `Payment reference: ${result.data.payuPaymentReference}`,
          })
        }
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
                Processing Payment...
              </>
            ) : (
              "Pay Now"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
