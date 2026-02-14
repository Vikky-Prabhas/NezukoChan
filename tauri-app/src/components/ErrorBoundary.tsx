import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
    children?: ReactNode;
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
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6 font-sans">
                    <h1 className="text-4xl font-serif font-black text-white mb-3">Something went wrong</h1>
                    <p className="text-white/40 text-sm mb-6 max-w-md text-center">
                        An unexpected error occurred. Please try reloading the page.
                    </p>
                    <pre className="bg-white/5 border border-white/10 rounded-xl p-5 text-red-400/80 text-xs font-mono max-w-lg w-full overflow-auto mb-6 max-h-48">
                        {this.state.error?.toString()}
                    </pre>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-2.5 bg-white text-black rounded-lg font-bold text-sm hover:bg-white/90 transition-all shadow-[0_0_25px_rgba(255,255,255,0.1)]"
                    >
                        Reload Page
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
