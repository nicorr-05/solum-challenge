"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { createEvaluation, updateEvaluation, updateLLMEvaluation } from "@/lib/actions"
import { getScoreBadgeColor, formatDuration } from "@/lib/utils"
import { CallType } from "@prisma/client"
import { TranscriptionService } from "@/lib/transcription"

type CallWithEvaluations = {
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
    reviewerName: string
    outcome: boolean
    feedback: string | null
    callType: CallType | null
    tags: string[]
  }>
  llmEvaluations: {
    id: string
    score: number
    outcome: boolean
    llmFeedback: string | null
    callType: CallType | null
    tags: string[]
    sentiment: string | null
    protocolAdherence: number | null
    approved: boolean | null
    reviewerName: string | null
    reviewComment: string | null
  } | null
}

interface CallDetailsProps {
  call: CallWithEvaluations
}

const CALL_TYPES: CallType[] = [
  "APPOINTMENT_ADJUSTMENT",
  "NEW_CLIENT_SPANISH",
  "GENERAL_INQUIRY",
  "GENERAL_INQUIRY_TRANSFER",
  "TIME_SENSITIVE",
  "NEW_CLIENT_ENGLISH",
  "LOOKING_FOR_SOMEONE",
  "MISSED_CALL",
  "MISCALANEOUS",
  "BILLING"
]

const AVAILABLE_TAGS = ["Polite", "Professional", "Helpful", "Clear", "Empathetic", "Knowledgeable"]

export function CallDetails({ call }: CallDetailsProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLLMReviewSubmitting, setIsLLMReviewSubmitting] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [transcript, setTranscript] = useState<Array<{ start: number; end: number; text: string }>>([])
  const [isTranscribing, setIsTranscribing] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const transcriptRef = useRef<HTMLDivElement>(null)
  const transcriptionService = useRef<TranscriptionService>(new TranscriptionService())

  const humanEval = call.evaluations[0]
  const llmEval = call.llmEvaluations

  const [formData, setFormData] = useState({
    reviewerName: humanEval?.reviewerName || "",
    outcome: humanEval?.outcome || false,
    feedback: humanEval?.feedback || "",
    callType: humanEval?.callType || "GENERAL_INQUIRY",
    tags: humanEval?.tags || [],
  })

  const [llmReviewData, setLLMReviewData] = useState({
    reviewerName: llmEval?.reviewerName || "",
    approved: llmEval?.approved || false,
    reviewComment: llmEval?.reviewComment || "",
  })

  const handleTagChange = (tag: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      tags: checked ? [...prev.tags, tag] : prev.tags.filter((t) => t !== tag),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (humanEval) {
        await updateEvaluation(humanEval.id, formData)
        toast({
          title: "Evaluation updated",
          description: "The human evaluation has been updated successfully.",
        })
      } else {
        await createEvaluation({
          callId: call.id,
          ...formData,
        })
        toast({
          title: "Evaluation created",
          description: "The human evaluation has been created successfully.",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save evaluation. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLLMReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!llmEval) return

    setIsLLMReviewSubmitting(true)
    try {
      await updateLLMEvaluation(llmEval.id, llmReviewData)
      toast({
        title: "Review updated",
        description: "The AI evaluation review has been updated successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save review. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLLMReviewSubmitting(false)
    }
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  useEffect(() => {
    if (audioRef.current && transcriptRef.current) {
      const audio = audioRef.current
      const transcript = transcriptRef.current
      
      const currentTranscript = transcript.querySelector(`[data-time="${Math.floor(currentTime)}"]`)
      
      if (currentTranscript) {
        currentTranscript.scrollIntoView({
          behavior: "smooth",
          block: "center"
        })
      }
    }
  }, [currentTime])

  const handleTranscribe = async () => {
    if (!call.recordingUrl) return;

    setIsTranscribing(true);
    try {
      const result = await transcriptionService.current.transcribeAudio(call.recordingUrl);
      setTranscript(result.segments);
      toast({
        title: "Transcription complete",
        description: "The audio has been transcribed successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to transcribe audio. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsTranscribing(false);
    }
  };

  return (
    <div className="space-y-6 px-4">
      <div>
        <h1 className="text-3xl font-bold">Call Details</h1>
        <p className="text-muted-foreground">Review and evaluate call performance</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-[#071a45]">Call Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Clinic</Label>
                <p className="text-sm text-muted-foreground">{call.assistant.clinic.name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Assistant</Label>
                <p className="text-sm text-muted-foreground">{call.assistant.name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Start Time</Label>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(call.startTime), "MMM dd, yyyy HH:mm:ss")}
                </p>
              </div>
              {call.endTime && (
                <div>
                  <Label className="text-sm font-medium">End Time</Label>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(call.endTime), "MMM dd, yyyy HH:mm:ss")}
                  </p>
                </div>
              )}
              {call.duration && (
                <div>
                  <Label className="text-sm font-medium">Duration</Label>
                  <p className="text-sm text-muted-foreground">{formatDuration(call.duration)}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {call.recordingUrl && (
          <Card>
            <CardHeader>
              <CardTitle>Recording</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <audio 
                ref={audioRef}
                controls 
                className="w-full"
                onTimeUpdate={handleTimeUpdate}
              >
                <source src={call.recordingUrl} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>

              <div className="mt-2">
                <div className="flex justify-between items-center mb-1">
                  <Label className="text-sm font-medium">Transcript</Label>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleTranscribe}
                    disabled={isTranscribing}
                  >
                    {isTranscribing ? "Transcribing..." : "Transcribe"}
                  </Button>
                </div>
                <div 
                  ref={transcriptRef}
                  className="overflow-y-scroll border rounded-md p-2 bg-gray-50 text-xs max-h-12"
                  style={{
                    maxHeight: 100,
                    overflowY: 'scroll'
                  }}
                >
                  {transcript.length > 0 ? (
                    transcript.map((segment, index) => (
                      <div
                        key={index}
                        data-time={Math.floor(segment.start)}
                        className={`mb-2 p-1 rounded-md ${
                          Math.floor(currentTime) === Math.floor(segment.start) ? 'bg-blue-100' : ''
                        }`}
                      >
                        <div className="text-xs font-medium text-gray-500">
                          {formatDuration(segment.start)}
                        </div>
                        <p className="text-xs">
                          {segment.text}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-500 text-center">
                      {isTranscribing ? "Transcribing..." : "Click 'Transcribe' to generate transcript"}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {llmEval && (
          <Card>
            <CardHeader>
              <CardTitle className="text-[#071a45]">AI Evaluation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Score</Label>
                  <Badge className={getScoreBadgeColor(llmEval.score)}>{llmEval.score}/100</Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium mr-2">Outcome</Label>
                  <Badge variant={llmEval.outcome ? "default" : "destructive"} className={llmEval.outcome ? "bg-green-500 hover:bg-green-600" : ""}>
                    {llmEval.outcome ? "Success" : "Failed"}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Call Type</Label>
                  <p className="text-sm text-muted-foreground">{llmEval.callType}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Sentiment</Label>
                  <p className="text-sm text-muted-foreground">{llmEval.sentiment}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Protocol Adherence</Label>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${llmEval.protocolAdherence}%` }}
                  ></div>
                </div>
                <p className="text-sm text-muted-foreground">{llmEval.protocolAdherence}%</p>
              </div>

              <div>
                <Label className="text-sm font-medium">Tags</Label>
                <div className="flex flex-wrap gap-1">
                  {llmEval.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {llmEval.llmFeedback && (
                <div>
                  <Label className="text-sm font-medium">AI Feedback</Label>
                  <p className="text-sm text-muted-foreground">{llmEval.llmFeedback}</p>
                </div>
              )}

              <form onSubmit={handleLLMReviewSubmit} className="space-y-4 pt-4 border-t">
                <div>
                  <Label htmlFor="llmReviewerName">Reviewer Name</Label>
                  <Input
                    id="llmReviewerName"
                    value={llmReviewData.reviewerName}
                    onChange={(e) => setLLMReviewData((prev) => ({ ...prev, reviewerName: e.target.value }))}
                    required
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="llmApproved"
                    checked={llmReviewData.approved}
                    onCheckedChange={(checked) => setLLMReviewData((prev) => ({ ...prev, approved: checked as boolean }))}
                  />
                  <Label htmlFor="llmApproved">Approve AI Evaluation</Label>
                </div>

                <div>
                  <Label htmlFor="llmReviewComment">Review Comments</Label>
                  <Textarea
                    id="llmReviewComment"
                    value={llmReviewData.reviewComment}
                    onChange={(e) => setLLMReviewData((prev) => ({ ...prev, reviewComment: e.target.value }))}
                    placeholder="Enter your review comments..."
                    rows={4}
                  />
                </div>

                <Button type="submit" disabled={isLLMReviewSubmitting} className="w-full">
                  {isLLMReviewSubmitting ? "Saving..." : "Save Review"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-[#071a45]">{humanEval ? "Update Human Evaluation" : "Human Evaluation"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="reviewerName">Reviewer Name</Label>
                <Input
                  id="reviewerName"
                  value={formData.reviewerName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, reviewerName: e.target.value }))}
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="outcome"
                  checked={formData.outcome}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, outcome: checked as boolean }))}
                />
                <Label htmlFor="outcome">Successful Outcome</Label>
              </div>

              <div>
                <Label htmlFor="callType">Call Type</Label>
                <select
                  id="callType"
                  value={formData.callType}
                  onChange={(e) => setFormData((prev) => ({ ...prev, callType: e.target.value as CallType }))}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  {CALL_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Tags</Label>
                <div className="grid grid-cols-2 gap-2">
                  {AVAILABLE_TAGS.map((tag) => (
                    <div key={tag} className="flex items-center space-x-2">
                      <Checkbox
                        id={tag}
                        checked={formData.tags.includes(tag)}
                        onCheckedChange={(checked) => handleTagChange(tag, checked as boolean)}
                      />
                      <Label htmlFor={tag} className="text-sm">
                        {tag}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="feedback">Feedback</Label>
                <Textarea
                  id="feedback"
                  value={formData.feedback}
                  onChange={(e) => setFormData((prev) => ({ ...prev, feedback: e.target.value }))}
                  placeholder="Enter your evaluation feedback..."
                  rows={4}
                />
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? "Saving..." : humanEval ? "Update Evaluation" : "Save Evaluation"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
