import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6">
          <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-2xl text-center">
            <div className="w-14 h-14 bg-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold mb-2">Portal System Recovery</h2>
            <p className="text-sm text-slate-400 mb-6">
              A temporary interface error occurred. You can safely restore the session below.
            </p>
            <button
              onClick={this.handleReset}
              className="w-full py-2.5 px-4 bg-orange-600 hover:bg-orange-500 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-orange-600/20"
            >
              <RotateCcw className="w-4 h-4" />
              Reload & Restore Portal
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
