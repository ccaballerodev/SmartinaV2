import Chat from "./components/Chat/Chat";
import Archivos from "./components/Archivos/Archivos";
import { Router, useRouter } from "./lib/router";
import idleImg from "./components/Avatar/idle.png";
import "./style.css";

function App() {
  const { path } = useRouter();

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-brand">
          <img src={idleImg} alt="Smartina" className="header-icon" />
          <div className="header-title-group">
            <h1 className="app-title">Smartina</h1>
            <span className="app-subtitle">CDT Smart Regions Center</span>
          </div>
        </div>
      </header>
      <main className="dashboard-main">
        {path === "/archivos" ? <Archivos /> : <Chat />}
      </main>
      <footer className="dashboard-footer">
        <div className="footer-brand">
          <span className="footer-text">© 2026 CDT Smart Regions Center — Todos los derechos reservados</span>
          <img src="/images/icons/Logo_SmartRegions_white-small.gif" alt="Logo" className="footer-logo" />
        </div>
      </footer>
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
