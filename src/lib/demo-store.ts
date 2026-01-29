import { Store } from '@tanstack/store'

interface CounterState {
  count: number
  lastUpdated: Date | null
}

export const counterStore = new Store<CounterState>({
  count: 0,
  lastUpdated: null,
})

export function increment() {
  counterStore.setState((state) => ({
    ...state,
    count: state.count + 1,
    lastUpdated: new Date(),
  }))
}

export function decrement() {
  counterStore.setState((state) => ({
    ...state,
    count: state.count - 1,
    lastUpdated: new Date(),
  }))
}

export function reset() {
  counterStore.setState(() => ({
    count: 0,
    lastUpdated: new Date(),
  }))
}
