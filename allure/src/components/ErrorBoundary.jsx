import React from "react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto", textAlign: "left" }}>
          <h2 style={{ color: "#EF4444" }}>Oops, something went wrong.</h2>
          <p style={{ fontWeight: "bold" }}>{this.state.error?.toString()}</p>
          {this.state.error?.stack && (
            <pre style={{ backgroundColor: "#F1F5F9", padding: "1rem", borderRadius: "8px", overflow: "auto", fontSize: "0.8rem", color: "#334155" }}>
              {this.state.error.stack}
            </pre>
          )}
          {this.state.errorInfo?.componentStack && (
            <details style={{ marginTop: "1rem" }}>
              <summary style={{ cursor: "pointer", fontWeight: "600", color: "#64748B" }}>Component Stack</summary>
              <pre style={{ backgroundColor: "#F8FAFC", padding: "1rem", borderRadius: "8px", overflow: "auto", fontSize: "0.75rem", color: "#64748B" }}>
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: "1.5rem",
              padding: "0.6rem 1.2rem",
              cursor: "pointer",
              borderRadius: "6px",
              backgroundColor: "#2563EB",
              color: "#FFFFFF",
              border: "none",
              fontWeight: "600",
            }}
          >
            Recarregar Página
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
