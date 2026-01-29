import type { FilterOperator, FilterRule } from '~/lib/types/wizard'

export function applyFilters(
  rows: Array<Record<string, string>>,
  filters: Array<FilterRule>,
): Array<Record<string, string>> {
  const activeFilters = filters.filter((f) => f.enabled && f.column)

  if (activeFilters.length === 0) {
    return rows
  }

  return rows.filter((row) => {
    return activeFilters.every((filter) => {
      const value = row[filter.column] ?? ''
      return evaluateFilter(value, filter.operator, filter.value)
    })
  })
}

function evaluateFilter(
  value: string,
  operator: FilterOperator,
  filterValue: string,
): boolean {
  const normalizedValue = value.toLowerCase().trim()
  const normalizedFilterValue = filterValue.toLowerCase().trim()

  switch (operator) {
    case 'equals':
      return normalizedValue === normalizedFilterValue
    case 'not_equals':
      return normalizedValue !== normalizedFilterValue
    case 'contains':
      return normalizedValue.includes(normalizedFilterValue)
    case 'not_contains':
      return !normalizedValue.includes(normalizedFilterValue)
    case 'is_empty':
      return normalizedValue === ''
    case 'is_not_empty':
      return normalizedValue !== ''
    default:
      return true
  }
}

export function createFilterRule(
  column = '',
  operator: FilterOperator = 'equals',
): FilterRule {
  return {
    id: crypto.randomUUID(),
    column,
    operator,
    value: '',
    enabled: true,
  }
}

export const FILTER_OPERATORS: Array<{ value: FilterOperator; label: string }> = [
  { value: 'equals', label: 'equals' },
  { value: 'not_equals', label: 'does not equal' },
  { value: 'contains', label: 'contains' },
  { value: 'not_contains', label: 'does not contain' },
  { value: 'is_empty', label: 'is empty' },
  { value: 'is_not_empty', label: 'is not empty' },
]
