import { type SanityConfig, SanityApp } from "@sanity/sdk-react";
import { Suspense, useState, useCallback } from "react";
import { Dashboard } from "./components/Dashboard";
import { ReviewView } from "./components/ReviewView";
import "./styles/app.css";

const config: SanityConfig[] = [
  {
    projectId: "o01w1nx2",
    dataset: "production",
  },
];

type Route =
  | { view: "dashboard" }
  | { view: "review"; documentId: string; documentType: string };

function AppContent() {
  const [route, setRoute] = useState<Route>({ view: "dashboard" });

  const navigateToReview = useCallback(
    (documentId: string, documentType: string) => {
      setRoute({ view: "review", documentId, documentType });
    },
    []
  );

  const navigateToDashboard = useCallback(() => {
    setRoute({ view: "dashboard" });
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>
          <span className="header-icon">⚖️</span> Legal Review Dashboard
        </h1>
      </header>
      <main className="app-main">
        <Suspense fallback={<LoadingSpinner />}>
          {route.view === "dashboard" ? (
            <Dashboard onSelectDocument={navigateToReview} />
          ) : (
            <ReviewView
              documentId={route.documentId}
              documentType={route.documentType}
              onBack={navigateToDashboard}
            />
          )}
        </Suspense>
      </main>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="loading-spinner" role="status">
      <div className="spinner" />
      <span>Loading…</span>
    </div>
  );
}

export default function App() {
  return (
    <SanityApp config={config} fallback={<LoadingSpinner />}>
      <AppContent />
    </SanityApp>
  );
}
