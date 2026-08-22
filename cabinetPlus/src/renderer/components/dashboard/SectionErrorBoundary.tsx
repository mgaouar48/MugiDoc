import { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "../ui/button";

interface ErrorBoundaryProps {
  children?: ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class SectionErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Section Rendering Error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="m-8 p-6 bg-destructive/5 border border-destructive/20 rounded-lg text-destructive text-sm space-y-3">
          <div className="font-semibold flex items-center gap-2 text-base">
            <AlertCircle className="w-5 h-5" />
            Une erreur est survenue lors de l'affichage de ce module
          </div>
          <p className="text-xs text-destructive/80 font-mono bg-card p-3 rounded-md border border-destructive/10">
            {this.state.error?.message || "Erreur de rendu"}
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              this.setState({ hasError: false, error: undefined });
              if (this.props.onReset) this.props.onReset();
            }}
          >
            Retour au tableau de bord
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
