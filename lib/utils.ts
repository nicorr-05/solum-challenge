import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
}

export function getScoreBadgeColor(score: number): string {
  if (score >= 80) return "bg-green-100 text-green-800"
  if (score >= 50) return "bg-yellow-100 text-yellow-800"
  return "bg-red-100 text-red-800"
}

export function getStatusIcon(hasHumanEval: boolean, hasLLMEval: boolean): string {
  if (hasHumanEval) return "✅"
  if (hasLLMEval) return "⏳"
  return "❌"
}
