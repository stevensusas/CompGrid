import { AppBar, Container, Toolbar, Typography, Button } from '@mui/material'
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function NavText({ href, text, isMain }) {
  return (
    <Typography
      variant={isMain ? 'h5' : 'h7'}
      noWrap
      style={{
        marginRight: '30px',
        fontFamily: 'monospace',
        fontWeight: 700,
        letterSpacing: '.3rem',
      }}
    >
      <NavLink
        to={href}
        style={{
          color: 'inherit',
          textDecoration: 'none',
        }}
      >
        {text}
      </NavLink>
    </Typography>
  );
}

export default function NavBar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  
  // List of paths where navbar should be hidden
  const hideNavbarPaths = ['/login', '/register'];
  
  // Check if current path is in the hide list
  if (hideNavbarPaths.includes(location.pathname)) {
    return null;  // Return nothing if we're on login or register page
  }

  return (
    <AppBar position='static'>
      <Container maxWidth='xl'>
        <Toolbar disableGutters>
          <NavText href='/' text='COMPGRID' isMain />
          {user ? (
            <>
              <NavText href='/albums' text='ANALYTICS' />
              <NavText href='/songs' text='INSTANCES' />
              <Button 
                color="inherit" 
                onClick={logout} 
                style={{ marginLeft: 'auto' }}
              >
                Logout
              </Button>
            </>
          ) : null}
        </Toolbar>
      </Container>
    </AppBar>
  );
}