import { Outlet } from "react-router-dom";
import { Header } from "../components/Header/Header";
import { BottomNav } from "../components/BottomNav/BottomNav";
import { Footer } from "../components/Footer/Footer";
import "./AppShell.css";

/**
 * Zen-Stream application shell.
 *
 *   AppShell
 *   ├── Skip link
 *   ├── Header        (sticky; brand + nav + search)
 *   ├── Main > Outlet
 *   ├── Footer
 *   └── BottomNav     (< 768px)
 *
 * The shell owns layout and safe areas; pages render their own content.
 */
export function AppShell() {
  return (
    <div className="zs-shell">
      <a className="zs-skip-link" href="#zs-main">
        Skip to content
      </a>
      <Header />
      <main id="zs-main" className="zs-main" tabIndex={-1}>
        <div className="zs-main__inner">
          <Outlet />
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}