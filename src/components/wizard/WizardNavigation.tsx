import { useNavigate } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { WizardStep } from '~/lib/types/wizard'
import { Button } from '~/components/ui/button'
import { canProceedToStep } from '~/lib/stores/wizard-store'

interface WizardNavigationProps {
  currentStep: WizardStep
  isNextDisabled?: boolean
  isNextLoading?: boolean
  nextLabel?: string
  onNext?: () => void | Promise<void>
  onBack?: () => void
  hideBack?: boolean
  hideNext?: boolean
}

export function WizardNavigation({
  currentStep,
  isNextDisabled = false,
  isNextLoading = false,
  nextLabel,
  onNext,
  onBack,
  hideBack = false,
  hideNext = false,
}: WizardNavigationProps) {
  const navigate = useNavigate()

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else if (currentStep > 1) {
      const prevStep = (currentStep - 1) as WizardStep
      navigate({ to: `/wizard/step-${prevStep}` })
    }
  }

  const handleNext = async () => {
    if (onNext) {
      await onNext()
    } else if (currentStep < 7) {
      const nextStep = (currentStep + 1) as WizardStep
      if (canProceedToStep(nextStep)) {
        navigate({ to: `/wizard/step-${nextStep}` })
      }
    }
  }

  const isFirstStep = currentStep === 1
  const isLastStep = currentStep === 7

  const getNextLabel = () => {
    if (nextLabel) return nextLabel
    if (isLastStep) return 'Start Import'
    return 'Continue'
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t z-40">
      <div className="container max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            {!hideBack && !isFirstStep && (
              <Button variant="outline" onClick={handleBack} className="gap-2">
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
            )}
          </div>
          <div>
            {!hideNext && (
              <Button
                onClick={handleNext}
                disabled={isNextDisabled || isNextLoading}
                className="gap-2"
              >
                {isNextLoading ? (
                  <span className="animate-spin">⏳</span>
                ) : null}
                {getNextLabel()}
                {!isLastStep && <ChevronRight className="h-4 w-4" />}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
