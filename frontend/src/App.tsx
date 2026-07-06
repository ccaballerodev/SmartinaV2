import Chat from "./components/Chat/Chat";
import "./style.css";

function App() {
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
        <Chat />
      </main>
    </div>
  );
}

export default App;
