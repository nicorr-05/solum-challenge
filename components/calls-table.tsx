"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { format } from "date-fns"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { getScoreBadgeColor, getStatusIcon } from "@/lib/utils"

type Call = {
  id: string
  assistantId: string
  startTime: Date
  endTime: Date | null
  duration: number | null
  recordingUrl: string | null
  assistant: {
    id: string
    name: string
    clinic: {
      id: string
      name: string
    }
  }
  evaluations: Array<{
    id: string
    outcome: boolean
    reviewerName: string
  }>
  llmEvaluations: {
    id: string
    score: number
    outcome: boolean
  } | null
}

interface CallsTableProps {
  calls: Call[]
}

export function CallsTable({ calls }: CallsTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "")
  const [clinicFilter, setClinicFilter] = useState(searchParams.get("clinic") || "")
  const [assistantFilter, setAssistantFilter] = useState(searchParams.get("assistant") || "")

  const updateUrlParams = (params: { search?: string; clinic?: string; assistant?: string }) => {
    const newParams = new URLSearchParams(searchParams.toString())
    
    if (params.search !== undefined) {
      if (params.search) {
        newParams.set("search", params.search)
      } else {
        newParams.delete("search")
      }
    }
    
    if (params.clinic !== undefined) {
      if (params.clinic) {
        newParams.set("clinic", params.clinic)
      } else {
        newParams.delete("clinic")
      }
    }
    
    if (params.assistant !== undefined) {
      if (params.assistant) {
        newParams.set("assistant", params.assistant)
      } else {
        newParams.delete("assistant")
      }
    }

    router.push(`?${newParams.toString()}`)
  }

  const uniqueClinics = useMemo(() => {
    return Array.from(
      new Map(calls.map(call => [call.assistant.clinic.id, call.assistant.clinic])).values()
    ).sort((a, b) => a.name.localeCompare(b.name))
  }, [calls])

  const uniqueAssistants = useMemo(() => {
    const filteredCalls = clinicFilter 
      ? calls.filter(call => call.assistant.clinic.id === clinicFilter)
      : calls

    return Array.from(
      new Map(filteredCalls.map(call => [call.assistant.id, call.assistant])).values()
    ).sort((a, b) => a.name.localeCompare(b.name))
  }, [calls, clinicFilter])

  const filteredCalls = calls.filter((call) => {
    const matchesSearch = call.assistant.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesClinic = clinicFilter === "" || call.assistant.clinic.id === clinicFilter
    const matchesAssistant = assistantFilter === "" || call.assistant.id === assistantFilter
    return matchesSearch && matchesClinic && matchesAssistant
  })

  const handleClinicChange = (clinicId: string) => {
    setClinicFilter(clinicId)
    setAssistantFilter("")
    updateUrlParams({ clinic: clinicId, assistant: "" })
  }

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    updateUrlParams({ search: value })
  }

  const handleAssistantChange = (assistantId: string) => {
    setAssistantFilter(assistantId)
    updateUrlParams({ assistant: assistantId })
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Input
          placeholder="Search by assistant name..."
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="max-w-sm"
        />
        <select
          value={clinicFilter}
          onChange={(e) => handleClinicChange(e.target.value)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="">All Clinics</option>
          {uniqueClinics.map((clinic) => (
            <option key={clinic.id} value={clinic.id}>
              {clinic.name}
            </option>
          ))}
        </select>
        <select
          value={assistantFilter}
          onChange={(e) => handleAssistantChange(e.target.value)}
          className="px-3 py-2 border rounded-md"
          disabled={!clinicFilter}
        >
          <option value="">All Assistants</option>
          {uniqueAssistants.map((assistant) => (
            <option key={assistant.id} value={assistant.id}>
              {assistant.name}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-[#071a45]">Start Time</TableHead>
              <TableHead className="text-[#071a45]">Clinic</TableHead>
              <TableHead className="text-[#071a45]">Assistant</TableHead>
              <TableHead className="text-[#071a45]">AI Score</TableHead>
              <TableHead className="text-[#071a45]">AI Outcome</TableHead>
              <TableHead className="text-[#071a45]">Human Outcome</TableHead>
              <TableHead className="text-[#071a45]">Status</TableHead>
              <TableHead className="text-[#071a45]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCalls.map((call) => {
              const llmEval = call.llmEvaluations
              const humanEval = call.evaluations[0]
              const hasHumanEval = !!humanEval
              const hasLLMEval = !!llmEval

              return (
                <TableRow key={call.id}>
                  <TableCell>{format(new Date(call.startTime), "MMM dd, yyyy HH:mm")}</TableCell>
                  <TableCell>{call.assistant.clinic.name}</TableCell>
                  <TableCell className="font-medium text-[#071a45]">{call.assistant.name}</TableCell>
                  <TableCell>
                    {llmEval ? (
                      <Badge className={getScoreBadgeColor(llmEval.score)}>{llmEval.score}</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {llmEval ? (
                      <Badge variant={llmEval.outcome ? "default" : "destructive"} className={llmEval.outcome ? "bg-green-500 hover:bg-green-600" : ""}>
                        {llmEval.outcome ? "Success" : "Failed"}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {humanEval ? (
                      <Badge variant={humanEval.outcome ? "default" : "destructive"} className={humanEval.outcome ? "bg-green-500 hover:bg-green-600" : ""}>
                        {humanEval.outcome ? "Success" : "Failed"}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-lg">{getStatusIcon(hasHumanEval, hasLLMEval)}</span>
                  </TableCell>
                  <TableCell>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/calls/${call.id}`}>View Details</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
