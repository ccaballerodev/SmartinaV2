import Chat from "./components/Chat/Chat";
import Archivos from "./components/Archivos/Archivos";
import { Router, useRouter } from "./lib/router";
import "./style.css";

function App() {
  const { path } = useRouter();

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-brand">
          <div className="header-icon">S</div>
          <div className="header-title-group">
            <h1 className="app-title">Smartina</h1>
            <span className="app-subtitle">CDT Smart Regions Center</span>
          </div>
        </div>
        <span className="badge">Beta</span>
      </header>
      <main className="dashboard-main">
        {path === "/archivos" ? <Archivos /> : <Chat />}
      </main>
    </div>
  );
}

export default function Root() {
  return (
    <Router>
      <App />
    </Router>
  );
}
