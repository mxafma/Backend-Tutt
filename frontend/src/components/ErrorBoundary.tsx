import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface State { hasError: boolean; message: string }

export default class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="bg-white rounded-xl shadow-md p-8 max-w-md w-full text-center">
            <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">Ocurrió un error inesperado</h2>
            <p className="text-gray-500 text-sm mb-6">{this.state.message}</p>
            <button
              onClick={() => window.location.href = '/'}
              className="bg-green-700 hover:bg-green-800 text-white font-semibold px-6 py-2.5 rounded-lg transition"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
