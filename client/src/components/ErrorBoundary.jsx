import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white grid place-items-center p-8">
          <div className="max-w-md text-center space-y-6">
            <div className="mx-auto h-20 w-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-4xl">
              ⚠️
            </div>
            <h2 className="text-2xl font-black tracking-tight">Something went wrong</h2>
            <p className="text-sm text-slate-400 leading-7">
              An unexpected error occurred. Please refresh the page to continue.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="rounded-2xl bg-blue-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
