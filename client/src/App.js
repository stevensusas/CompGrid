import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CssBaseline, ThemeProvider } from '@mui/material'
import { indigo, amber } from '@mui/material/colors'
import { createTheme } from "@mui/material/styles";
import { AuthProvider, useAuth } from './context/AuthContext';
import OwnerLoginPage from './pages/OwnerLoginPage';
import OwnerRegisterPage from './pages/OwnerRegisterPage';
import NavBar from './components/NavBar';
import OwnerHomePage from './pages/OwnerHomePage';
import OwnerManagePage from './pages/OwnerManagePage';
import UserLoginPage from './pages/UserLoginPage';
import UserRegisterPage from './pages/UserRegisterPage';
import UserHomePage from './pages/UserHomePage';
import UserManagePage from './pages/UserManagePage';


// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();  // Use the auth context instead of directly checking localStorage
  
  if (!user) {
    return <Navigate to="/ownerlogin" replace />;
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
            <Route path="/ownerlogin" element={<OwnerLoginPage />} />
            <Route path="/ownerregister" element={<OwnerRegisterPage />} />
            <Route path="/userlogin" element={<UserLoginPage />} />
            <Route path="/userregister" element={<UserRegisterPage />} />
            

            {/* Protected Routes - include NavBar */}
            <Route path="/ownerhome" element={
              <ProtectedRoute>
                <OwnerHomePage />
              </ProtectedRoute>
            } />
            <Route path="/ownermanage" element={
              <ProtectedRoute>
                <OwnerManagePage />
              </ProtectedRoute>
            } />
            <Route path="/userhome" element={
              <ProtectedRoute>
                <UserHomePage />
              </ProtectedRoute>
            } />
            <Route path="/usermanage" element={
              <ProtectedRoute>
                <UserManagePage />
              </ProtectedRoute>
            } />


            {/* Catch all other routes and redirect to login */}
            <Route path="*" element={<Navigate to="/ownerlogin" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}