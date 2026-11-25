import { Component, StrictMode, type ErrorInfo, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

type ErrorBoundaryState = { hasError: boolean; message: string };

class AdytumErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error?.message || 'Unexpected rendering error' };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Adytum Planner ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="min-h-[100dvh] bg-zinc-950 text-zinc-100 flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-2xl border border-amber-500/30 bg-zinc-900/90 p-6 space-y-4 text-center">
            <h1 className="text-xl font-heading text-amber-300">Adytum Planner Recovered from a Render Error</h1>
            <p className="text-sm text-zinc-300">{this.state.message}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="min-h-[44px] px-5 py-2 rounded-full bg-amber-500 text-zinc-950 font-medium text-sm hover:bg-amber-400"
            >
              Reload Workbench
            </button>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AdytumErrorBoundary>
      <App />
    </AdytumErrorBoundary>
  </StrictMode>,
);
