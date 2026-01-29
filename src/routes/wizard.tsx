import {
  Outlet,
  createFileRoute,
  redirect,
  useLocation,
} from '@tanstack/react-router'
import { useStore } from '@tanstack/react-store'
import type { WizardStep } from '~/lib/types/wizard'
import { WizardStepper } from '~/components/wizard/WizardStepper'
import { canProceedToStep, wizardStore } from '~/lib/stores/wizard-store'

export const Route = createFileRoute('/wizard')({
  beforeLoad: ({ location }) => {
    const stepMatch = location.pathname.match(/step-(\d)/)
    if (!stepMatch) return

    const step = parseInt(stepMatch[1] ?? '1', 10) as WizardStep
    if (step > 1 && !canProceedToStep(step)) {
      let redirectStep: WizardStep = 1
      for (let s = step - 1; s >= 1; s--) {
        if (canProceedToStep(s as WizardStep)) {
          redirectStep = s as WizardStep
          break
        }
      }
      throw redirect({ to: `/wizard/step-${redirectStep}` })
    }
  },
  component: WizardLayout,
})

function WizardLayout() {
  const location = useLocation()
  const state = useStore(wizardStore)

  const stepMatch = location.pathname.match(/step-(\d)/)
  const currentStep = stepMatch
    ? (parseInt(stepMatch[1] ?? '1', 10) as WizardStep)
    : 1

  const completedSteps: Array<WizardStep> = []
  if (state.gitlab.isConnected) completedSteps.push(1)
  if (state.notionExport.csvFiles.length > 0) completedSteps.push(2)
  if (state.csvMapping.parsedData && state.csvMapping.notionIdColumn)
    completedSteps.push(3)
  if (state.issueMapping.titleColumn && state.issueMapping.repositoryColumn) {
    completedSteps.push(4, 5)
  }
  if (state.preview.rows.length > 0) completedSteps.push(6)
  if (state.processing.status === 'completed') completedSteps.push(7)

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <WizardStepper
        currentStep={currentStep}
        completedSteps={completedSteps}
      />
      <main className="flex-1 container max-w-4xl mx-auto px-4 py-8 pb-24">
        <Outlet />
      </main>
    </div>
  )
}
