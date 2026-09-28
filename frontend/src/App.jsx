import { Outlet, Route, Routes } from 'react-router-dom'

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
import PropertyDetailPage from './pages/PropertyDetailPage'
import SavedHomesPage from './pages/SavedHomesPage'
import SearchResultsPage from './pages/SearchResultsPage'

function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="flex-1">
        <Outlet />
      </div>
      <Footer />
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
