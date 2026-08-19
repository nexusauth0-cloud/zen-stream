import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppShell } from "./app/AppShell";
import { WatchlistProvider } from "./store/watchlist";
import { HomePage } from "./pages/HomePage";
import { MoviesPage } from "./pages/MoviesPage";
import { SeriesPage } from "./pages/SeriesPage";
import { AnimationPage } from "./pages/AnimationPage";
import { MostWatchedPage } from "./pages/MostWatchedPage";
import { SearchPage } from "./pages/SearchPage";
import { MyListPage } from "./pages/MyListPage";
import { ComingSoonPage } from "./pages/ComingSoonPage";
import { HistoryPage } from "./pages/HistoryPage";
import { AccountPage } from "./pages/AccountPage";
import { MoviePage } from "./pages/MoviePage";
import { SeriesDetailPage } from "./pages/SeriesDetailPage";
import { WatchPage } from "./pages/WatchPage";
import { CollectionPage } from "./pages/CollectionPage";
import { GenresPage } from "./pages/GenresPage";
import { NotFoundPage } from "./pages/NotFoundPage";

/**
 * Zen-Stream routes.
 *
 * `/`               Discovery home (hero + API rails)
 * `/movies`         Movie browse
 * `/series`         Series browse
 * `/animation`      Animation & anime collections
 * `/most-watched`   Popularity collections (popular/trending)
 * `/search`         Search (URL-synced query)
 * `/coming-soon`    Upcoming releases
 * `/movie/:id`      Movie details
 * `/series/:id`     Series details (seasons + episodes)
 * `/watch/:id`      Player
 * `/collection/:opId`  Single home-rail collection ("View all")
 * `/genres`        Genre & category collections
 * `/my-list`       Watchlist
 * `/history`        History placeholder
 * `/account`        Account placeholder
 * `*`               Not found
 */
export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/movies" element={<MoviesPage />} />
        <Route path="/series" element={<SeriesPage />} />
        <Route path="/animation" element={<AnimationPage />} />
        <Route path="/most-watched" element={<MostWatchedPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/coming-soon" element={<ComingSoonPage />} />
        <Route path="/movie/:subjectId" element={<MoviePage />} />
        <Route path="/series/:subjectId" element={<SeriesDetailPage />} />
        <Route path="/watch/:subjectId" element={<WatchPage />} />
        <Route path="/collection/:opId" element={<CollectionPage />} />
        <Route path="/genres" element={<GenresPage />} />
        <Route path="/my-list" element={<MyListPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <WatchlistProvider>
        <AppRoutes />
      </WatchlistProvider>
    </BrowserRouter>
  );
}