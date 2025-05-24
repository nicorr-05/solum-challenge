"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Metrics } from "@/components/dashboard/metrics"
import { Charts } from "@/components/dashboard/charts"
import { getClinicMetrics } from "@/lib/actions"
import { Loader2 } from "lucide-react"

interface Clinic {
  id: string
  name: string
}

interface Assistant {
  id: string
  name: string
}

export default function DashboardPage() {
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [assistants, setAssistants] = useState<Assistant[]>([])
  const [selectedClinic, setSelectedClinic] = useState("all")
  const [selectedAssistant, setSelectedAssistant] = useState("all")
  const [metrics, setMetrics] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchClinics = async () => {
      try {
        const response = await fetch("/api/clinics")
        if (!response.ok) throw new Error("Failed to fetch clinics")
        const data = await response.json()
        setClinics(data)
      } catch (error) {
        console.error("Error fetching clinics:", error)
      }
    }
    fetchClinics()
  }, [])

  useEffect(() => {
    const fetchAssistants = async () => {
      if (selectedClinic === "all") {
        setAssistants([])
        return
      }
      try {
        const response = await fetch(`/api/assistants?clinicId=${selectedClinic}`)
        if (!response.ok) throw new Error("Failed to fetch assistants")
        const data = await response.json()
        setAssistants(data)
      } catch (error) {
        console.error("Error fetching assistants:", error)
      }
    }
    fetchAssistants()
  }, [selectedClinic])

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true)
      try {
        const data = await getClinicMetrics(
          selectedClinic === "all" ? "all" : selectedClinic,
          selectedAssistant === "all" ? undefined : selectedAssistant
        )
        setMetrics(data)
      } catch (error) {
        console.error("Error fetching metrics:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchMetrics()
  }, [selectedClinic, selectedAssistant])

  return (
    <div className="container mx-auto p-4 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-[#071a45]">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Clinic</label>
              <Select
                value={selectedClinic}
                onValueChange={(value) => {
                  setSelectedClinic(value)
                  setSelectedAssistant("all")
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select clinic" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clinics</SelectItem>
                  {clinics.map((clinic) => (
                    <SelectItem key={clinic.id} value={clinic.id}>
                      {clinic.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Assistant</label>
              <Select
                value={selectedAssistant}
                onValueChange={setSelectedAssistant}
                disabled={selectedClinic === "all"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select assistant" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assistants</SelectItem>
                  {assistants.map((assistant) => (
                    <SelectItem key={assistant.id} value={assistant.id}>
                      {assistant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : metrics ? (
        <>
          <Metrics 
            totalCalls={metrics.metrics.totalCalls}
            avgScore={metrics.metrics.avgScore}
            successRate={metrics.metrics.successRate}
            humanEvalPercentage={metrics.metrics.humanEvalPercentage}
            outcomeMatchPercentage={metrics.metrics.outcomeMatchPercentage}
            callTypeDistribution={metrics.charts.callTypeDistribution.reduce((acc: Record<string, number>, curr: { type: string; count: number }) => ({
              ...acc,
              [curr.type]: curr.count
            }), {})}
          />
          <Charts metrics={metrics} />
        </>
      ) : null}
    </div>
  )
}
