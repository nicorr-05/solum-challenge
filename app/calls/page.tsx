import { Suspense } from "react"
import { getCalls } from "@/lib/actions"
import { CallsTable } from "@/components/calls-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function CallsPage() {
  const calls = await getCalls()

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-[#071a45]">All Calls</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div>Loading...</div>}>
            <CallsTable calls={calls} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
