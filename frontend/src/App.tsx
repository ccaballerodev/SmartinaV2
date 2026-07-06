import Chat from "./components/Chat/Chat";
import "./style.css";

function App() {
    return (
        <div className="dashboard">
            <header className="dashboard-header">
                <span className="badge">Smartina</span>
            </header>
            <main className="dashboard-main">
                <Chat />
            </main>
        </div>
    );
}

export default App;