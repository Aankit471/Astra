import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { hasError: boolean }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State { return { hasError: true } }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('ASTRA UI error', error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children
    return <main className="app-error" role="alert"><div className="brand-mark">A</div><h1>Something went wrong.</h1><p>ASTRA could not render this screen. Your saved demo state is unchanged.</p><button className="btn-primary" onClick={() => window.location.reload()}>Reload ASTRA</button></main>
  }
}
