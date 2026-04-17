import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import EditorPage from './pages/EditorPage';
import ExportPage from './pages/ExportPage';

function Header() {
  const location = useLocation();
  
  const linkClass = (path) => {
    const base = 'px-4 py-2 rounded-lg transition-all duration-150 ';
    if (location.pathname === path) {
      return base + 'bg-accent text-primary font-medium';
    }
    return base + 'text-text-secondary hover:text-text-primary hover:bg-secondary';
  };
  
  return (
    <header className="sticky top-0 z-40 bg-primary/95 backdrop-blur border-b border-border">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="text-xl font-semibold text-text-primary hidden sm:block">Movie Recap</span>
        </Link>
        
        <nav className="flex items-center gap-2">
          <Link to="/" className={linkClass('/')}>
            Dashboard
          </Link>
          <Link to="/editor" className={linkClass('/editor')}>
            Editor
          </Link>
          <Link to="/export" className={linkClass('/export')}>
            Export
          </Link>
        </nav>
      </div>
    </header>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/editor" element={<EditorPage />} />
            <Route path="/export" element={<ExportPage />} />
          </Routes>
        </main>
        <footer className="py-4 text-center text-text-secondary text-sm border-t border-border">
          <p>Movie Recap App v1.0.0</p>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;