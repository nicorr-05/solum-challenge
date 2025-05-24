"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface MetricsProps {
  totalCalls: number
  avgScore: number
  successRate: number
  humanEvalPercentage: number
  outcomeMatchPercentage: number
  callTypeDistribution: Record<string, number>
}

export function Metrics({
  totalCalls,
  avgScore,
  successRate,
  humanEvalPercentage,
  outcomeMatchPercentage,
  callTypeDistribution
}: MetricsProps) {
  const totalCallsValue = typeof totalCalls === 'number' ? totalCalls : 0
  const avgScoreValue = typeof avgScore === 'number' ? avgScore : 0
  const successRateValue = typeof successRate === 'number' ? successRate : 0
  const humanEvalPercentageValue = typeof humanEvalPercentage === 'number' ? humanEvalPercentage : 0
  const outcomeMatchPercentageValue = typeof outcomeMatchPercentage === 'number' ? outcomeMatchPercentage : 0

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-[#071a45]">Total Calls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-[#071a45]">{totalCallsValue}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-[#071a45]">Average Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-[#071a45]">{avgScoreValue.toFixed(1)}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-[#071a45]">Success Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-[#071a45]">{successRateValue.toFixed(1)}%</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-[#071a45]">Human Evaluations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-[#071a45]">{humanEvalPercentageValue.toFixed(1)}%</div>
        </CardContent>
      </Card>
    </div>
  )
} 