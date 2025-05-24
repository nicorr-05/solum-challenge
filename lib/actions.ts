"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { CallType } from "@prisma/client"

export async function getCalls() {
  try {
    const calls = await prisma.call.findMany({
      include: {
        evaluations: true,
        llmEvaluations: true,
        assistant: {
          include: {
            clinic: true
          }
        }
      },
      orderBy: {
        startTime: "desc",
      },
    })
    return calls
  } catch (error) {
    console.error("Error fetching calls:", error)
    throw new Error("Failed to fetch calls")
  }
}

export async function getCallById(id: string) {
  try {
    const call = await prisma.call.findUnique({
      where: { id },
      include: {
        evaluations: true,
        llmEvaluations: true,
        assistant: {
          include: {
            clinic: true
          }
        }
      },
    })
    return call
  } catch (error) {
    console.error("Error fetching call:", error)
    throw new Error("Failed to fetch call")
  }
}

export async function createEvaluation(data: {
  callId: string
  reviewerName: string
  outcome: boolean
  feedback: string
  callType: CallType
  tags: string[]
}) {
  try {
    const evaluation = await prisma.evaluation.create({
      data: {
        ...data,
        feedback: data.feedback || "",
      },
    })
    revalidatePath(`/calls/${data.callId}`)
    return evaluation
  } catch (error) {
    console.error("Error creating evaluation:", error)
    throw new Error("Failed to create evaluation")
  }
}

export async function updateEvaluation(
  id: string,
  data: {
    reviewerName: string
    outcome: boolean
    feedback: string
    callType: CallType
    tags: string[]
  },
) {
  try {
    const evaluation = await prisma.evaluation.update({
      where: { id },
      data: {
        ...data,
        feedback: data.feedback || "",
      },
    })
    revalidatePath(`/calls`)
    return evaluation
  } catch (error) {
    console.error("Error updating evaluation:", error)
    throw new Error("Failed to update evaluation")
  }
}

export async function getDashboardMetrics() {
  try {
    const totalCalls = await prisma.call.count()

    const avgScore = await prisma.lLM_Evaluation.aggregate({
      _avg: {
        score: true,
      },
    })

    const callsWithHumanEval = await prisma.call.count({
      where: {
        evaluations: {
          some: {},
        },
      },
    })

    const outcomeMatches = await prisma.call.findMany({
      where: {
        AND: [
          { evaluations: { some: {} } },
          { llmEvaluations: { isNot: null } }
        ],
      },
      include: {
        evaluations: true,
        llmEvaluations: true,
      },
    })

    const matchCount = outcomeMatches.filter(
      (call) => call.evaluations[0]?.outcome === call.llmEvaluations?.outcome,
    ).length

    return {
      totalCalls,
      avgScore: avgScore._avg.score || 0,
      humanEvalPercentage: totalCalls > 0 ? (callsWithHumanEval / totalCalls) * 100 : 0,
      outcomeMatchPercentage: outcomeMatches.length > 0 ? (matchCount / outcomeMatches.length) * 100 : 0,
    }
  } catch (error) {
    console.error("Error fetching dashboard metrics:", error)
    throw new Error("Failed to fetch dashboard metrics")
  }
}

export async function updateLLMEvaluation(
  id: string,
  data: {
    approved: boolean
    reviewerName: string
    reviewComment: string
  }
) {
  try {
    const evaluation = await prisma.lLM_Evaluation.update({
      where: { id },
      data: {
        approved: data.approved,
        reviewerName: data.reviewerName,
        reviewComment: data.reviewComment,
      },
    })
    revalidatePath(`/calls/${evaluation.callId}`)
    return evaluation
  } catch (error) {
    console.error("Error updating LLM evaluation:", error)
    throw new Error("Failed to update LLM evaluation")
  }
}

export async function getClinicMetrics(clinicId: string, assistantId?: string) {
  try {
    const whereClause = {
      ...(clinicId !== "all" && {
        assistant: {
          clinicId
        }
      }),
      ...(assistantId && assistantId !== "all" && {
        assistantId
      })
    }

    const calls = await prisma.call.findMany({
      where: whereClause,
      include: {
        evaluations: true,
        llmEvaluations: true,
        assistant: {
          include: {
            clinic: true
          }
        }
      }
    })

    const totalCalls = calls.length || 0

    const successfulCalls = calls.filter(call => {
      const hasLLMEval = call.llmEvaluations?.outcome === true
      const hasHumanEval = call.evaluations.some(evaluation => evaluation.outcome === true)
      return hasLLMEval || hasHumanEval
    }).length || 0

    const callsWithLLMEval = calls.filter(call => {
      const hasScore = call.llmEvaluations?.score !== undefined && call.llmEvaluations?.score !== null
      return hasScore
    })

    const avgScore = callsWithLLMEval.length > 0
      ? Number((callsWithLLMEval.reduce((acc, call) => {
          const score = call.llmEvaluations?.score || 0
          return acc + score
        }, 0) / callsWithLLMEval.length).toFixed(2))
      : 0

    const callsWithHumanEval = calls.filter(call => call.evaluations.length > 0).length || 0
    const humanEvalPercentage = totalCalls > 0 ? Math.round((callsWithHumanEval / totalCalls) * 100) : 0

    const callsWithBothEvals = calls.filter(call => 
      call.evaluations.length > 0 && call.llmEvaluations
    )
    
    const outcomeMatches = callsWithBothEvals.filter(call => 
      call.evaluations[0].outcome === call.llmEvaluations?.outcome
    ).length || 0
    
    const outcomeMatchPercentage = callsWithBothEvals.length > 0 
      ? Math.round((outcomeMatches / callsWithBothEvals.length) * 100)
      : 0

    const metrics = {
      totalCalls,
      avgScore,
      successRate: totalCalls > 0 ? Math.round((successfulCalls / totalCalls) * 100) : 0,
      humanEvalPercentage,
      outcomeMatchPercentage
    }

    const assistantPerformance = await prisma.assistant.findMany({
      where: clinicId !== "all" ? { clinicId } : undefined,
      include: {
        clinic: true,
        calls: {
          include: {
            llmEvaluations: true,
            evaluations: true
          }
        }
      }
    }).then(assistants => assistants.map(assistant => {
      const calls = assistant.calls
      const totalCalls = calls.length || 0
      
      const successfulCalls = calls.filter(call => {
        const hasLLMEval = call.llmEvaluations?.outcome === true
        const hasHumanEval = call.evaluations.some(evaluation => evaluation.outcome === true)
        return hasLLMEval || hasHumanEval
      }).length || 0

      const callsWithLLMEval = calls.filter(call => call.llmEvaluations?.score !== undefined && call.llmEvaluations?.score !== null)
      const avgScore = callsWithLLMEval.length > 0
        ? Number((callsWithLLMEval.reduce((acc, call) => acc + (call.llmEvaluations?.score || 0), 0) / callsWithLLMEval.length).toFixed(2))
        : 0

      return {
        name: `${assistant.name} (${assistant.clinic.name})`,
        score: avgScore,
        successRate: totalCalls > 0 ? Number((successfulCalls / totalCalls).toFixed(2)) : 0,
        totalCalls
      }
    }))

    const callTypeDistribution = await Promise.all([
      prisma.lLM_Evaluation.groupBy({
        by: ['callType'],
        where: {
          call: whereClause
        },
        _count: true
      }),
      prisma.evaluation.groupBy({
        by: ['callType'],
        where: {
          call: whereClause
        },
        _count: true
      })
    ]).then(([llmResults, humanResults]) => {
      if (llmResults.length > 0) {
        return llmResults.map(result => ({
          type: result.callType || 'UNKNOWN',
          count: result._count
        }))
      }
      return humanResults.map(result => ({
        type: result.callType || 'UNKNOWN',
        count: result._count
      }))
    })

    const sentimentDistribution = callsWithLLMEval.length > 0
      ? await prisma.lLM_Evaluation.groupBy({
          by: ['sentiment'],
          where: {
            call: whereClause,
            sentiment: { not: null }
          },
          _count: true
        }).then(results => results.map(result => ({
          sentiment: result.sentiment || 'UNKNOWN',
          count: result._count
        })))
      : []

    return {
      metrics,
      charts: {
        assistantPerformance,
        callTypeDistribution,
        sentimentDistribution,
        hasLLMEvaluations: callsWithLLMEval.length > 0
      }
    }
  } catch (error) {
    console.error("Error fetching clinic metrics:", error)
    throw new Error("Failed to fetch clinic metrics")
  }
}
