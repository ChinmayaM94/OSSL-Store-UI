import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="banner err" style={{ margin: 24 }}>
        <b>The UI hit an unexpected error:</b> {String(this.state.error.message || this.state.error)}
        <div><button onClick={() => this.setState({ error: null })}>Try again</button></div>
      </div>
    );
  }
}
