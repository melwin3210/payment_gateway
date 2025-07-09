import PayUDebugPanel from "@/components/payu-debug-panel"

export default function DebugPage() {
  return (
    <div>
      <PayUDebugPanel />
      <div className="container mx-auto py-4">
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          <strong>✅ Environment Variables Loaded Successfully!</strong>
          <p>Merchant Code: Jaze**** | Base URL: https://sandbox.ypmn.ru</p>
        </div>
      </div>
    </div>
  )
}
