import { Check } from 'lucide-react'
import type { WizardStep } from '~/lib/types/wizard'
import { cn } from '~/lib/utils'

interface Step {
  number: WizardStep
  title: string
  shortTitle: string
}

const STEPS: Array<Step> = [
  { number: 1, title: 'GitLab Configuration', shortTitle: 'GitLab' },
  { number: 2, title: 'Select Notion Export', shortTitle: 'Files' },
  { number: 3, title: 'CSV Field Mapping', shortTitle: 'Mapping' },
  { number: 4, title: 'Filter Rules', shortTitle: 'Filters' },
  { number: 5, title: 'Issue Mapping', shortTitle: 'Issues' },
  { number: 6, title: 'Preview & Validate', shortTitle: 'Preview' },
  { number: 7, title: 'Create Issues', shortTitle: 'Create' },
]

interface WizardStepperProps {
  currentStep: WizardStep
  onStepClick?: (step: WizardStep) => void
  completedSteps?: Array<WizardStep>
}

export function WizardStepper({
  currentStep,
  onStepClick,
  completedSteps = [],
}: WizardStepperProps) {
  return (
    <div className="w-full bg-card border-b">
      <div className="container max-w-6xl mx-auto px-4 py-4">
        <nav aria-label="Progress">
          <ol className="hidden md:flex items-center justify-between">
            {STEPS.map((step, index) => {
              const isCompleted = completedSteps.includes(step.number)
              const isCurrent = currentStep === step.number
              const isPast = step.number < currentStep

              return (
                <li key={step.number} className="flex items-center">
                  <button
                    onClick={() => onStepClick?.(step.number)}
                    disabled={
                      !onStepClick || (!isCompleted && !isCurrent && !isPast)
                    }
                    className={cn(
                      'group flex flex-col items-center',
                      onStepClick &&
                        (isCompleted || isPast) &&
                        'cursor-pointer',
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors',
                        isCurrent &&
                          'border-primary bg-primary text-primary-foreground',
                        isCompleted &&
                          'border-primary bg-primary text-primary-foreground',
                        isPast &&
                          !isCompleted &&
                          'border-muted-foreground bg-muted text-muted-foreground',
                        !isCurrent &&
                          !isCompleted &&
                          !isPast &&
                          'border-muted text-muted-foreground',
                      )}
                    >
                      {isCompleted ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        step.number
                      )}
                    </span>
                    <span
                      className={cn(
                        'mt-2 text-xs font-medium',
                        isCurrent && 'text-foreground',
                        !isCurrent && 'text-muted-foreground',
                      )}
                    >
                      {step.title}
                    </span>
                  </button>
                  {index < STEPS.length - 1 && (
                    <div
                      className={cn(
                        'mx-2 h-0.5 w-12 lg:w-20',
                        isPast || isCompleted ? 'bg-primary' : 'bg-muted',
                      )}
                    />
                  )}
                </li>
              )
            })}
          </ol>

          <div className="flex md:hidden items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-semibold',
                  'border-primary bg-primary text-primary-foreground',
                )}
              >
                {currentStep}
              </span>
              <span className="text-sm font-medium">
                {STEPS.find((s) => s.number === currentStep)?.shortTitle}
              </span>
            </div>
            <span className="text-sm text-muted-foreground">
              Step {currentStep} of {STEPS.length}
            </span>
          </div>
        </nav>
      </div>
    </div>
  )
}

export { STEPS }
