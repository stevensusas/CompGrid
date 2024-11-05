import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CssBaseline, ThemeProvider } from '@mui/material'
import { indigo, amber } from '@mui/material/colors'
import { createTheme } from "@mui/material/styles";
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import NavBar from './components/NavBar';
import HomePage from './pages/HomePage';
import AlbumsPage from './pages/AlbumsPage';
import SongsPage from './pages/SongsPage';
import AlbumInfoPage from './pages/AlbumInfoPage';

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();  // Use the auth context instead of directly checking localStorage
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return (
    <>
      <NavBar />
      {children}
    </>
  );
};

export const theme = createTheme({
  palette: {
    primary: indigo,
    secondary: amber,
  },
});

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes - no NavBar */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* Protected Routes - include NavBar */}
            <Route path="/" element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            } />
            <Route path="/albums" element={
              <ProtectedRoute>
                <AlbumsPage />
              </ProtectedRoute>
            } />
            <Route path="/albums/:album_id" element={
              <ProtectedRoute>
                <AlbumInfoPage />
              </ProtectedRoute>
            } />
            <Route path="/songs" element={
              <ProtectedRoute>
                <SongsPage />
              </ProtectedRoute>
            } />

            {/* Catch all other routes and redirect to login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}