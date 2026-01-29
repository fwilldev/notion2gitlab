import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useStore } from '@tanstack/react-store'
import {
  AlertCircle,
  CheckCircle2,
  Info,
  Loader2,
  Server,
  Shield,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Button } from '~/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'
import { WizardNavigation } from '~/components/wizard/WizardNavigation'
import {
  setGitLabProjects,
  updateGitLabConfig,
  wizardStore,
} from '~/lib/stores/wizard-store'
import { GitLabApiError, createGitLabClient } from '~/lib/api/gitlab-client'

export const Route = createFileRoute('/wizard/step-1')({
  component: Step1GitLabConfig,
})

function Step1GitLabConfig() {
  const navigate = useNavigate()
  const state = useStore(wizardStore)
  const [isValidating, setIsValidating] = useState(false)

  const handleDomainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateGitLabConfig({
      domain: e.target.value,
      isConnected: false,
      error: null,
    })
  }

  const handleTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateGitLabConfig({
      token: e.target.value,
      isConnected: false,
      error: null,
    })
  }

  const handleTestConnection = async () => {
    const { domain, token } = state.gitlab
    if (!domain || !token) {
      updateGitLabConfig({ error: 'Please enter both domain and token' })
      return
    }

    setIsValidating(true)
    updateGitLabConfig({ isValidating: true, error: null })

    try {
      const client = createGitLabClient(domain, token)
      const user = await client.validateConnection()
      const projects = await client.listProjects({ per_page: 100 })

      updateGitLabConfig({
        isConnected: true,
        isValidating: false,
        username: user.username,
        error: null,
      })
      setGitLabProjects(projects)
      toast.success(`Connected as ${user.username}`, {
        description: `Found ${projects.length} accessible projects`,
      })
    } catch (error) {
      let message = 'Failed to connect to GitLab'
      if (error instanceof GitLabApiError) {
        if (error.statusCode === 401) {
          message = 'Invalid token or insufficient permissions'
        } else {
          message = error.message
        }
      } else if (error instanceof Error) {
        if (error.message.includes('fetch')) {
          message =
            'Could not reach GitLab server. Check the domain and try again.'
        } else {
          message = error.message
        }
      }
      updateGitLabConfig({
        isConnected: false,
        isValidating: false,
        error: message,
      })
      toast.error('Connection failed', {
        description: message,
      })
    } finally {
      setIsValidating(false)
    }
  }

  const handleNext = () => {
    if (state.gitlab.isConnected) {
      navigate({ to: '/wizard/step-2' })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">GitLab Configuration</h1>
        <p className="text-muted-foreground mt-1">
          Connect to your GitLab instance to create issues from Notion exports.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Connection Settings
          </CardTitle>
          <CardDescription>
            Enter your GitLab instance URL and a personal access token with{' '}
            <code className="bg-muted px-1 rounded">api</code> scope.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="domain">GitLab Domain</Label>
            <Input
              id="domain"
              type="text"
              placeholder="gitlab.com or gitlab.yourcompany.com"
              value={state.gitlab.domain}
              onChange={handleDomainChange}
            />
            <p className="text-xs text-muted-foreground">
              Enter your GitLab domain without https://
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="token">Personal Access Token</Label>
            <Input
              id="token"
              type="password"
              placeholder="glpat-xxxxxxxxxxxxxxxxxxxx"
              value={state.gitlab.token}
              onChange={handleTokenChange}
            />
            <p className="text-xs text-muted-foreground">
              Create a token in GitLab → Settings → Access Tokens with{' '}
              <code className="bg-muted px-1 rounded">api</code> scope.
            </p>
          </div>

          {state.gitlab.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{state.gitlab.error}</AlertDescription>
            </Alert>
          )}

          {state.gitlab.isConnected && (
            <Alert className="border-green-500 bg-green-500/10">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-700 dark:text-green-400">
                Connected as <strong>{state.gitlab.username}</strong> with
                access to <strong>{state.gitlab.projects.length}</strong>{' '}
                projects.
              </AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleTestConnection}
            disabled={
              !state.gitlab.domain || !state.gitlab.token || isValidating
            }
            className="w-full"
          >
            {isValidating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing Connection...
              </>
            ) : state.gitlab.isConnected ? (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Reconnect
              </>
            ) : (
              'Test Connection'
            )}
          </Button>
        </CardContent>
      </Card>

      <Alert className="border-blue-500/50 bg-blue-500/10">
        <Shield className="h-4 w-4 text-blue-500" />
        <AlertTitle className="text-blue-700 dark:text-blue-400">
          Privacy & Security
        </AlertTitle>
        <AlertDescription className="text-blue-700/80 dark:text-blue-400/80 text-sm space-y-2">
          <p>
            This app runs <strong>entirely in your browser</strong>. Your data
            never leaves your device:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>
              Your GitLab token is stored in your browser's local storage only
            </li>
            <li>
              CSV and Markdown files are processed locally and never uploaded
            </li>
            <li>
              API calls go directly from your browser to your GitLab instance
            </li>
          </ul>
          <p className="text-xs mt-2">
            <Info className="h-3 w-3 inline mr-1" />
            To clear all stored data, use your browser's developer tools to
            clear localStorage or click "Start Over" at the end of the wizard.
          </p>
        </AlertDescription>
      </Alert>

      <WizardNavigation
        currentStep={1}
        isNextDisabled={!state.gitlab.isConnected}
        onNext={handleNext}
        hideBack
      />
    </div>
  )
}
