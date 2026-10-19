"use client";

import { Component, type ReactNode } from "react";

interface Props {
  fallback: ReactNode;
  onError?: (error: Error) => void;
  children: ReactNode;
}

/** Catches loader / render errors (e.g. a missing GLB) and renders a fallback. */
export default class ErrorBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    this.props.onError?.(error);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
