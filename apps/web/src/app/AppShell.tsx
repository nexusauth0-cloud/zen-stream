import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "../components/Sidebar/Sidebar";
import { MobileHeader } from "../components/MobileHeader/MobileHeader";
import { BottomNav } from "../components/BottomNav/BottomNav";
import { GlobalSearch } from "../components/GlobalSearch/GlobalSearch";
import { SIDEBAR_STORAGE_KEY } from "./navigation";
import "./AppShell.css";

/**
 * Zen-Stream application shell.
 *
 *   AppShell
 *   ├── Skip link
 *   ├── Sidebar      (>= 768px; collapsible)
 *   ├── MobileHeader (< 768px)
 *   ├── GlobalSearch (>= 768px; sticky)
 *   ├── Main > Outlet
 *   └── BottomNav    (< 768px)
 *
 * The shell owns layout, navigation spacing, safe areas, and content width —
 * pages only render their own content.
 */
export function AppShell() {
  const [collapsed, setCollapsed] = useState<boolean>(() => readSidebarPreference());

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      } catch {
        // Storage may be unavailable (private mode / disabled); the UI state
        // still works for the session.
      }
      return next;
    });
  }

  return (
    <div className="zs-shell">
      <a className="zs-skip-link" href="#zs-main">
        Skip to content
      </a>
      <div className="zs-shell__body">
        <Sidebar collapsed={collapsed} onToggleCollapsed={toggleCollapsed} />
        <div className="zs-shell__frame">
          <MobileHeader />
          <GlobalSearch />
          <main id="zs-main" className="zs-main" tabIndex={-1}>
            <div className="zs-main__inner">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

/** Reads the persisted collapsed preference; never throws. */
function readSidebarPreference(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}