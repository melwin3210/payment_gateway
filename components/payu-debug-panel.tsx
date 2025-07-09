"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function PayUDebugPanel() {
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [testResult, setTestResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const runDebug = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/payu/debug")
      const data = await response.json()
      setDebugInfo(data)
    } catch (error) {
      console.error("Debug failed:", error)
    }
    setLoading(false)
  }

  const runSimpleTest = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/payu/test-simple", { method: "POST" })
      const data = await response.json()
      setTestResult(data)
    } catch (error) {
      console.error("Test failed:", error)
    }
    setLoading(false)
  }

  const checkCredentials = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/payu/test-credentials")
      const data = await response.json()
      console.log("Credentials:", data)
      alert(JSON.stringify(data, null, 2))
    } catch (error) {
      console.error("Credentials check failed:", error)
    }
    setLoading(false)
  }

  const testDateFormats = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/payu/test-date-formats", { method: "POST" })
      const data = await response.json()
      setTestResult(data)
    } catch (error) {
      console.error("Date format test failed:", error)
    }
    setLoading(false)
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>PayU Debug Panel</CardTitle>
          <CardDescription>Debug PayU integration issues</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={checkCredentials} disabled={loading}>
              Check Credentials
            </Button>
            <Button onClick={runDebug} disabled={loading}>
              Generate Debug Info
            </Button>
            <Button onClick={runSimpleTest} disabled={loading}>
              Run Simple Test
            </Button>
            <Button onClick={testDateFormats} disabled={loading}>
              Test Date Formats
            </Button>
          </div>

          {debugInfo && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Debug Information</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}

          {testResult && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  Test Result
                  <Badge variant={testResult.success ? "default" : "destructive"}>
                    {testResult.success ? "SUCCESS" : "FAILED"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p>
                    <strong>Status:</strong> {testResult.status}
                  </p>
                  <div>
                    <strong>Response:</strong>
                    <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto mt-2">
                      {JSON.stringify(testResult.response, null, 2)}
                    </pre>
                  </div>
                  {testResult.debug && (
                    <div>
                      <strong>Debug Info:</strong>
                      <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto mt-2">
                        {JSON.stringify(testResult.debug, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
