import { Link, createFileRoute } from '@tanstack/react-router'
import {
  ArrowRight,
  FileSpreadsheet,
  GitBranch,
  Shield,
  Zap,
} from 'lucide-react'
import { Button } from '~/components/ui/button'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  return (
    <div className="min-h-[calc(100vh-72px)] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-6 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full">
            <span className="text-cyan-400 font-medium">
              Notion → GitLab Issues
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            notion2gitlab
          </h1>

          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Convert your Notion database exports into GitLab issues with a
            simple 7-step wizard. Map fields, filter rows, and import in bulk.
          </p>

          <div className="flex gap-4 justify-center flex-wrap">
            <Link to="/wizard">
              <Button size="lg" className="gap-2">
                Start Import
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-16">
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
            <div className="w-12 h-12 bg-cyan-500/10 rounded-lg flex items-center justify-center mb-4">
              <FileSpreadsheet className="h-6 w-6 text-cyan-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Notion Export Support
            </h3>
            <p className="text-gray-400 text-sm">
              Works with Notion's CSV + Markdown export format. Automatically
              links records with their Markdown content.
            </p>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
            <div className="w-12 h-12 bg-cyan-500/10 rounded-lg flex items-center justify-center mb-4">
              <GitBranch className="h-6 w-6 text-cyan-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              GitLab Integration
            </h3>
            <p className="text-gray-400 text-sm">
              Connect to any GitLab instance. Create issues with titles,
              descriptions, and labels from your Notion data.
            </p>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
            <div className="w-12 h-12 bg-cyan-500/10 rounded-lg flex items-center justify-center mb-4">
              <Zap className="h-6 w-6 text-cyan-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Flexible Mapping
            </h3>
            <p className="text-gray-400 text-sm">
              Filter rows, map columns to issue fields, and preview everything
              before creating issues. Full control over the import.
            </p>
          </div>

          <div className="bg-gray-800/50 border border-green-700/50 rounded-xl p-6">
            <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              100% Client-Side
            </h3>
            <p className="text-gray-400 text-sm">
              All processing happens in your browser. Your GitLab token and
              files never leave your device. No server, no tracking.
            </p>
          </div>
        </div>

        <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            How It Works
          </h2>
          <div className="grid md:grid-cols-7 gap-4 text-center">
            {[
              { step: 1, label: 'Connect GitLab' },
              { step: 2, label: 'Select Export' },
              { step: 3, label: 'Map CSV Fields' },
              { step: 4, label: 'Filter Rows' },
              { step: 5, label: 'Map to Issues' },
              { step: 6, label: 'Preview' },
              { step: 7, label: 'Import' },
            ].map(({ step, label }) => (
              <div key={step} className="relative">
                <div className="w-10 h-10 bg-cyan-500 rounded-full flex items-center justify-center mx-auto mb-2 text-white font-bold">
                  {step}
                </div>
                <p className="text-sm text-gray-400">{label}</p>
                {step < 7 && (
                  <div className="hidden md:block absolute top-5 left-[60%] w-[80%] h-0.5 bg-gray-700" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
