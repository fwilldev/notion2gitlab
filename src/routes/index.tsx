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
    <div className="min-h-[calc(100vh-72px)] bg-background">
      <div className="container max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-6 px-5 py-2.5 glass rounded-full">
            <span className="text-primary font-semibold">
              Notion → GitLab Issues
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
            notion<span className="text-primary">2</span>gitlab
          </h1>

          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
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
          {[
            {
              icon: FileSpreadsheet,
              title: 'Notion Export Support',
              description:
                "Works with Notion's CSV + Markdown export format. Automatically links records with their Markdown content.",
            },
            {
              icon: GitBranch,
              title: 'GitLab Integration',
              description:
                'Connect to any GitLab instance. Create issues with titles, descriptions, and labels from your Notion data.',
            },
            {
              icon: Zap,
              title: 'Flexible Mapping',
              description:
                'Filter rows, map columns to issue fields, and preview everything before creating issues. Full control over the import.',
            },
            {
              icon: Shield,
              title: '100% Client-Side',
              description:
                'All processing happens in your browser. Your GitLab token and files never leave your device. No server, no tracking.',
            },
          ].map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="glass rounded-2xl p-6 hover:bg-white/[0.07] transition-all duration-300"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {title}
              </h3>
              <p className="text-muted-foreground text-sm">{description}</p>
            </div>
          ))}
        </div>

        <div className="glass rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-foreground mb-6 text-center">
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
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center mx-auto mb-2 text-primary-foreground font-bold gold-glow">
                  {step}
                </div>
                <p className="text-sm text-muted-foreground">{label}</p>
                {step < 7 && (
                  <div className="hidden md:block absolute top-5 left-[60%] w-[80%] h-0.5 bg-white/[0.08] rounded-full" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
