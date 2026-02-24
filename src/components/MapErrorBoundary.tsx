import { Component, ErrorInfo, ReactNode } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Props = { children: ReactNode };
type State = { hasError: boolean; error: Error | null };

/**
 * Error boundary for the Map screen.
 * Catches render-time crashes and shows a recovery UI
 * instead of killing the app.
 */
export default class MapErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (__DEV__) {
      console.error('[MapErrorBoundary] Caught:', error.message);
      console.error('[MapErrorBoundary] Component stack:', info.componentStack);
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.icon}>⚠️</Text>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.subtitle}>
            The map couldn't load properly.
          </Text>
          {__DEV__ && this.state.error && (
            <Text style={styles.devError} numberOfLines={4}>
              {this.state.error.message}
            </Text>
          )}
          <TouchableOpacity style={styles.retryBtn} onPress={this.handleRetry} activeOpacity={0.7}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
    padding: 32,
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A2A3A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6A7A8C',
    textAlign: 'center',
    marginBottom: 16,
  },
  devError: {
    fontSize: 11,
    color: '#C0392B',
    fontFamily: 'monospace',
    backgroundColor: 'rgba(192,57,43,0.08)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    maxWidth: '100%',
  },
  retryBtn: {
    backgroundColor: '#3D9EFF',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
