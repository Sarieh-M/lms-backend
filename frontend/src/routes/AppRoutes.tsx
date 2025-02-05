import { Route, Routes } from "react-router-dom";
import { lazy } from "react";
import SuspenseFallback from "@/components/feedback/SuspenseFallback";
// import SearchBikesPage from "@/pages/SearchBikesPage";
// import Layout from "@/layouts/Layout";
// import HomePage from "@/pages/HomePage";
// pages
const MainLayout = lazy(() => import("@/layouts/Layout"));
const HomePage = lazy(() => import("@/pages/HomePage"));
const SearchBikesPage = lazy(() => import("@/pages/SearchBikesPage"));

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route
          index
          element={
            <SuspenseFallback>
              <HomePage />
            </SuspenseFallback>
          }
        />
        <Route
          path="bikes"
          element={
            <SuspenseFallback>
              <SearchBikesPage />
            </SuspenseFallback>
          }
        />
        {/* if page not found */}
        <Route path="*" />
      </Route>
    </Routes>
  );
};
export default AppRoutes;
