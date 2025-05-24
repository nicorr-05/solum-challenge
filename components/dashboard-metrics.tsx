"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getScoreBadgeColor } from "@/lib/utils"

interface DashboardMetricsProps {
  metrics: {
    totalCalls: number
    avgScore: number
    humanEvalPercentage: number
    outcomeMatchPercentage: number
  }
  calls: Array<{
    id: string
    assistantId: string
    startTime: Date
    llmEvaluations: Array<{
      score: number
      outcome: boolean
    }>
    evaluations: Array<{
      outcome: boolean
    }>
  }>
}

export function DashboardMetrics({ metrics, calls }: DashboardMetricsProps) {
  const recentCalls = calls.slice(0, 10)

  return (
    <div className="space-y-6 px-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalCalls}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg AI Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(metrics.avgScore)}</div>
            <Badge className={getScoreBadgeColor(metrics.avgScore)}>{Math.round(metrics.avgScore)}/100</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Human Evaluated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.humanEvalPercentage}%</div>
            <p className="text-xs text-muted-foreground">of total calls</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI vs Human Match</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(metrics.outcomeMatchPercentage)}%</div>
            <p className="text-xs text-muted-foreground">outcome agreement</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Calls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentCalls.map((call) => {
              const llmEval = call.llmEvaluations[0]
              const humanEval = call.evaluations[0]

              return (
                <div key={call.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{call.assistantId}</p>
                    <p className="text-sm text-muted-foreground">{new Date(call.startTime).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {llmEval && <Badge className={getScoreBadgeColor(llmEval.score)}>AI: {llmEval.score}</Badge>}
                    {humanEval ? (
                      <Badge variant={humanEval.outcome ? "default" : "destructive"}>
                        Human: {humanEval.outcome ? "Success" : "Failed"}
                      </Badge>
                    ) : (
                      <Badge variant="outline">Pending Review</Badge>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
