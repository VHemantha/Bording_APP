import { Route, Routes } from 'react-router-dom'

import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import PropertyDetailPage from './pages/PropertyDetailPage'
import RegisterPage from './pages/RegisterPage'
import SavedHomesPage from './pages/SavedHomesPage'
import SearchResultsPage from './pages/SearchResultsPage'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<SearchResultsPage />} />
        <Route path="/property/:id" element={<PropertyDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/saved"
          element={
            <ProtectedRoute>
              <SavedHomesPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  )
}

export default App
