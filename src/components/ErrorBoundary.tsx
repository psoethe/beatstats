import React, { Component, ErrorInfo, ReactNode } from 'react';

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
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in React component tree:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#121212] text-white flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="w-16 h-16 mb-6 text-red-500 flex items-center justify-center bg-red-500/10 rounded-full">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-4">Oops! Algo deu errado.</h1>
          <p className="text-[#B3B3B3] mb-8 max-w-md">
            Ocorreu um erro inesperado ao renderizar seus dados. Isso costuma acontecer se houver uma falha de conexão ou dados incompatíveis (como um Podcast).
          </p>
          <button 
            onClick={() => {
              window.localStorage.clear();
              window.sessionStorage.clear();
              window.location.replace('/');
            }}
            className="bg-[#1DB954] text-black font-bold py-3 px-8 rounded-full hover:scale-105 transition-transform"
          >
            Sair e Tentar Novamente
          </button>
          {this.state.error && (
            <p className="mt-12 text-xs text-gray-500 font-mono text-left bg-black p-4 rounded-xl w-full max-w-lg overflow-auto border border-[#282828]">
              {this.state.error.toString()}
            </p>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
