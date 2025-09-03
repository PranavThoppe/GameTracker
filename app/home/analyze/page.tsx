// app/home/analyze/page.tsx
import { Suspense } from 'react'
import AnalyzeScreen from './AnalyzeScreen'

export default function AnalyzePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-1000 to-slate-1000">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto mb-4"></div>
            <p className="text-slate-400">Loading analysis...</p>
          </div>
        </div>
      }>
        <AnalyzeScreen />
      </Suspense>
    </div>
  )
}