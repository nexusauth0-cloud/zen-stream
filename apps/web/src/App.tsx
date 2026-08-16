import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Button } from "./components/Button/Button";
import { Icon } from "./components/Icon/Icon";
import "./App.css";

function FoundationPage() {
  return (
    <main className="zs-foundation">
      <p className="zs-foundation__kicker">ZEN-STREAM</p>
      <h1>Foundation ready</h1>
      <p className="zs-foundation__text">
        The greenfield foundation is in place: web, server, contracts, tokens, and primitives.
      </p>
      <Button>Get started</Button>
      <span className="zs-foundation__icon">
        <Icon label="Zen-Stream mark">
          <path d="M5 19V5l14 14V5" />
        </Icon>
      </span>
    </main>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="*" element={<FoundationPage />} />
      </Routes>
    </BrowserRouter>
  );
}