import { notFound } from "next/navigation"
import { getCallById } from "@/lib/actions"
import { CallDetails } from "@/components/call-details"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

interface CallDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function CallDetailPage({ params }: CallDetailPageProps) {
  const { id } = await params
  const call = await getCallById(id)

  if (!call) {
    notFound()
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-[#071a45]">Call Details</CardTitle>
        </CardHeader>
        <CardContent>
          <CallDetails call={call} />
        </CardContent>
      </Card>
    </div>
  )
}
