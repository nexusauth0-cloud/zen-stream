import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppShell } from "./app/AppShell";
import { HomePage } from "./pages/HomePage";
import { MoviesPage } from "./pages/MoviesPage";
import { SeriesPage } from "./pages/SeriesPage";
import { SearchPage } from "./pages/SearchPage";
import { MyListPage } from "./pages/MyListPage";
import { HistoryPage } from "./pages/HistoryPage";
import { AccountPage } from "./pages/AccountPage";
import { PlayerPage } from "./pages/PlayerPage";
import { NotFoundPage } from "./pages/NotFoundPage";

/**
 * Zen-Stream routes (M2: structural only — no feature logic yet).
 *
 * `/`        Home placeholder          (final landing arrives in M3)
 * `/movies`  Movies placeholder
 * `/series`  Series placeholder
 * `/search`  Search placeholder
 * `/my-list` Watchlist placeholder
 * `/history` History placeholder
 * `/account` Account placeholder
 * `/player`  Player placeholder
 * `*`        Not found
 */
export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/movies" element={<MoviesPage />} />
        <Route path="/series" element={<SeriesPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/my-list" element={<MyListPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/player" element={<PlayerPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}