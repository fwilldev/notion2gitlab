import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useStore } from '@tanstack/react-store'
import { Filter, Plus, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { Badge } from '~/components/ui/badge'
import { WizardNavigation } from '~/components/wizard/WizardNavigation'
import {
  addFilterRule,
  removeFilterRule,
  updateFilterRule,
  wizardStore,
} from '~/lib/stores/wizard-store'
import {
  FILTER_OPERATORS,
  applyFilters,
  createFilterRule,
} from '~/lib/filters/apply-filters'

export const Route = createFileRoute('/wizard/step-4')({
  component: Step4FilterRules,
})

function Step4FilterRules() {
  const navigate = useNavigate()
  const state = useStore(wizardStore)

  const parsedData = state.csvMapping.parsedData
  const filters = state.filters
  const headers = parsedData?.headers ?? []
  const allRows = parsedData?.rows ?? []

  const filteredRows = applyFilters(allRows, filters)
  const excludedCount = allRows.length - filteredRows.length

  const handleAddRule = () => {
    const newRule = createFilterRule(headers[0] ?? '')
    addFilterRule(newRule)
  }

  const handleToggleRule = (id: string, enabled: boolean) => {
    updateFilterRule(id, { enabled: !enabled })
  }

  const handleRemoveRule = (id: string) => {
    removeFilterRule(id)
  }

  const handleColumnChange = (id: string, column: string) => {
    updateFilterRule(id, { column })
  }

  const handleOperatorChange = (id: string, operator: string) => {
    updateFilterRule(id, {
      operator: operator as (typeof FILTER_OPERATORS)[number]['value'],
    })
  }

  const handleValueChange = (id: string, value: string) => {
    updateFilterRule(id, { value })
  }

  const handleNext = () => {
    navigate({ to: '/wizard/step-5' })
  }

  const needsValue = (operator: string) =>
    !['is_empty', 'is_not_empty'].includes(operator)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Filter Rules</h1>
        <p className="text-muted-foreground mt-1">
          Optionally filter which rows to include in the import. Skip this step
          if you want to import all rows.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filter Configuration
              </CardTitle>
              <CardDescription>
                Add rules to filter which rows will be imported. All rules must
                match (AND logic).
              </CardDescription>
            </div>
            <Button onClick={handleAddRule} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Rule
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {filters.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Filter className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>
                No filters configured. All {allRows.length} rows will be
                imported.
              </p>
              <p className="text-sm mt-1">
                Click "Add Rule" to filter specific rows.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filters.map((filter, index) => (
                <div
                  key={filter.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    filter.enabled ? 'bg-background' : 'bg-muted/50 opacity-60'
                  }`}
                >
                  <span className="text-sm text-muted-foreground w-6">
                    {index + 1}.
                  </span>

                  <Select
                    value={filter.column}
                    onValueChange={(v) => handleColumnChange(filter.id, v)}
                    disabled={!filter.enabled}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Column" />
                    </SelectTrigger>
                    <SelectContent>
                      {headers.map((header) => (
                        <SelectItem key={header} value={header}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={filter.operator}
                    onValueChange={(v) => handleOperatorChange(filter.id, v)}
                    disabled={!filter.enabled}
                  >
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Operator" />
                    </SelectTrigger>
                    <SelectContent>
                      {FILTER_OPERATORS.map((op) => (
                        <SelectItem key={op.value} value={op.value}>
                          {op.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {needsValue(filter.operator) && (
                    <Input
                      value={filter.value}
                      onChange={(e) =>
                        handleValueChange(filter.id, e.target.value)
                      }
                      placeholder="Value"
                      className="flex-1"
                      disabled={!filter.enabled}
                    />
                  )}

                  {!needsValue(filter.operator) && <div className="flex-1" />}

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleToggleRule(filter.id, filter.enabled)}
                    title={filter.enabled ? 'Disable rule' : 'Enable rule'}
                  >
                    {filter.enabled ? (
                      <ToggleRight className="h-5 w-5 text-green-600" />
                    ) : (
                      <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveRule(filter.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Filter Preview</CardTitle>
          <CardDescription>
            See how many rows will be included based on your filter rules.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-lg px-3 py-1">
                {filteredRows.length}
              </Badge>
              <span className="text-muted-foreground">
                rows will be imported
              </span>
            </div>

            {excludedCount > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-lg px-3 py-1">
                  {excludedCount}
                </Badge>
                <span className="text-muted-foreground">
                  rows excluded by filters
                </span>
              </div>
            )}
          </div>

          {filteredRows.length === 0 && allRows.length > 0 && (
            <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
              Warning: Your filters exclude all rows. Adjust your filter rules
              or disable them to proceed.
            </div>
          )}
        </CardContent>
      </Card>

      <WizardNavigation
        currentStep={4}
        isNextDisabled={filteredRows.length === 0 && allRows.length > 0}
        onNext={handleNext}
      />
    </div>
  )
}
