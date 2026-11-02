import { Component, type ErrorInfo, type ReactNode } from "react";
import { Card, Button } from "@/components/ui";
import { AlertTriangleIcon } from "@assets/icons";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
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
    console.error("[Application ErrorBoundary Caught Error]:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#FAFAF9] text-[#111827]">
          <Card className="max-w-lg w-full p-8 bg-white border border-[#E5E7EB] shadow-lg text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-[#166534] mx-auto flex items-center justify-center font-mono font-bold text-lg mb-4 border border-emerald-200">
              <AlertTriangleIcon className="size-6 text-amber-600" />
            </div>

            <h1 className="font-heading font-extrabold text-xl sm:text-2xl text-[#111827]">
              Application Recovery Mode
            </h1>

            <p className="text-sm text-[#4B5563] mt-3 leading-relaxed">
              The application encountered an unexpected routing or rendering state. You can safely return to the compliance dashboard or reload the page.
            </p>

            {this.state.error?.message && (
              <div className="mt-4 p-3 bg-[#F5F7F6] rounded-[6px] border border-[#E5E7EB] text-left">
                <span className="font-mono text-[11px] text-[#6B7280] uppercase tracking-wider block mb-1">
                  Debug Details
                </span>
                <p className="font-mono text-xs text-[#DC2626] break-words">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Button
                variant="primary"
                size="md"
                onClick={this.handleReset}
              >
                Return to Dashboard
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={this.handleReload}
              >
                Reload Application
              </Button>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
