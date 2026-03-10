import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // You can also log the error to an error reporting service
        console.error("ErrorBoundary caught an error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    render() {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return (
                <div className="min-h-screen bg-red-50 flex flex-col justify-center items-center p-8">
                    <div className="max-w-3xl w-full bg-white rounded-lg shadow-2xl p-8 border-t-4 border-red-500">
                        <h1 className="text-3xl font-bold text-red-600 mb-4">Application Error</h1>
                        <p className="text-gray-700 mb-4">
                            The application encountered an unexpected error. Please share the details below with support to fix this issue:
                        </p>
                        <div className="bg-gray-100 p-4 rounded-md overflow-x-auto text-sm font-mono text-gray-800 border border-gray-200">
                            <strong>{this.state.error?.toString()}</strong>
                            <br /><br />
                            <pre className="whitespace-pre-wrap">{this.state.errorInfo?.componentStack}</pre>
                        </div>
                        <div className="mt-6 flex gap-4">
                            <button
                                onClick={() => window.location.reload()}
                                className="px-6 py-2 bg-red-600 text-white rounded-md font-medium hover:bg-red-700 transition"
                            >
                                Reload Page
                            </button>
                            <button
                                onClick={() => {
                                    this.setState({ hasError: false });
                                }}
                                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md font-medium hover:bg-gray-300 transition"
                            >
                                Try to Recover
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
