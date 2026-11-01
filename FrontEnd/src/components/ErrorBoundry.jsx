import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info);
    this.setState({ info });
  }

  render() {
    if (this.state.error) {
      return (
        <main className="max-w-3xl mx-auto px-4 py-12">
          <div className="bg-blush-100 border border-blush-400 rounded-2xl p-6">
            <h1 className="text-xl font-extrabold text-blush-700 mb-2">
              Something went wrong
            </h1>
            <p className="text-sm text-blush-700 mb-4">
              {this.state.error.message}
            </p>
            <pre className="text-xs bg-white/60 rounded-lg p-3 overflow-x-auto">
              {this.state.error.stack}
            </pre>
            {this.state.info && (
              <pre className="text-xs bg-white/60 rounded-lg p-3 mt-3 overflow-x-auto">
                {this.state.info.componentStack}
              </pre>
            )}
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-brand-700 text-white rounded-lg font-bold"
            >
              Reload page
            </button>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}
