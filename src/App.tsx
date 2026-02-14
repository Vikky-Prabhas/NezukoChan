import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import Layout from "./components/layout/Layout";
import { isSetupComplete } from "./hooks/useSetup";

// Lazy-loaded pages for code splitting
const SetupWizard = lazy(() => import("./pages/setup/SetupWizard"));
const AniListCallback = lazy(() => import("./pages/auth/AniListCallback"));
const Home = lazy(() => import("./pages/home/Home"));
const Catalog = lazy(() => import("./pages/catalog/Catalog"));
const News = lazy(() => import("./pages/news/News"));
const Collections = lazy(() => import("./pages/collections/Collections"));
const CollectionDetail = lazy(() => import("./pages/collections/CollectionDetail"));
const Profile = lazy(() => import("./pages/profile/Profile"));
const AnimeDetail = lazy(() => import("./pages/anime/AnimeDetail"));
const Watch = lazy(() => import("./pages/watch/Watch"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-7 h-7 border-2 border-white/20 border-t-white rounded-full animate-spin" />
    </div>
  );
}

/** Guard: redirects to /setup if wizard hasn't been completed */
function RequireSetup({ children }: { children: React.ReactNode }) {
  if (!isSetupComplete()) {
    return <Navigate to="/setup" replace />;
  }
  return <>{children}</>;
}

/** Guard: redirects to / if wizard is already done */
function RedirectIfSetupDone({ children }: { children: React.ReactNode }) {
  if (isSetupComplete()) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* OAuth Callbacks — no guards, must be accessible at all times */}
          <Route path="/auth/anilist/callback" element={<AniListCallback />} />

          {/* Setup Wizard — no Layout wrapper, fullscreen */}
          <Route
            path="/setup"
            element={
              <RedirectIfSetupDone>
                <SetupWizard />
              </RedirectIfSetupDone>
            }
          />

          {/* Main App — requires setup completion */}
          <Route
            element={
              <RequireSetup>
                <Layout />
              </RequireSetup>
            }
          >
            <Route path="/" element={<Home />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/news" element={<News />} />
            <Route path="/collections" element={<Collections />} />
            <Route path="/collections/:id" element={<CollectionDetail />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/anime/:id" element={<AnimeDetail />} />
            <Route path="/watch/:id" element={<Watch />} />
            <Route
              path="*"
              element={
                <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                  <h1 className="text-6xl font-serif font-black text-white/10">404</h1>
                  <p className="text-white/30 text-sm">Page not found</p>
                </div>
              }
            />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
