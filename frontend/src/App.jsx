import { useEffect } from 'react'
import { Outlet, Route, Routes, useLocation } from 'react-router-dom'

import AssistantWidget from './components/AssistantWidget'
import AuthModal from './components/AuthModal'
import Footer from './components/Footer'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import AdminAIImportPage from './pages/admin/AdminAIImportPage'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminLayout from './pages/admin/AdminLayout'
import AdminListingFormPage from './pages/admin/AdminListingFormPage'
import AdminListingsPage from './pages/admin/AdminListingsPage'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import MyListingsPage from './pages/MyListingsPage'
import PostListingPage from './pages/PostListingPage'
import PropertyDetailPage from './pages/PropertyDetailPage'
import SavedHomesPage from './pages/SavedHomesPage'
import SearchResultsPage from './pages/SearchResultsPage'

function PublicLayout() {
  const { pathname } = useLocation()

  // A new page starts at the top instead of inheriting the previous page's scroll position.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  // The search page fills the screen exactly (fixed map, scrolling list), so it has no footer:
  // one below it would let the whole window scroll and drag the map along.
  const fullScreen = pathname === '/search'

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="flex-1">
        <Outlet />
      </div>
      {!fullScreen && <Footer />}
      <AssistantWidget />
    </div>
  )
}

function App() {
  return (
    <>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchResultsPage />} />
          <Route path="/property/:id" element={<PropertyDetailPage />} />
          <Route path="/login" element={<LoginPage mode="login" />} />
          <Route path="/register" element={<LoginPage mode="register" />} />
          <Route
            path="/post"
            element={
              <ProtectedRoute>
                <PostListingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/post/:id/edit"
            element={
              <ProtectedRoute>
                <PostListingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-listings"
            element={
              <ProtectedRoute>
                <MyListingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/saved"
            element={
              <ProtectedRoute>
                <SavedHomesPage />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route
          path="/admin"
          element={
            <ProtectedRoute requireAdmin>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboardPage />} />
          <Route path="listings" element={<AdminListingsPage />} />
          <Route path="listings/new" element={<AdminListingFormPage />} />
          <Route path="listings/:id/edit" element={<AdminListingFormPage />} />
          <Route path="import" element={<AdminAIImportPage />} />
        </Route>
      </Routes>

      <AuthModal />
    </>
  )
}

export default App
