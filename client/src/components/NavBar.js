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
  const hideNavbarPaths = ['/ownerlogin', '/ownerregister', '/userlogin', '/userregister'];
  
  // Check if current path is in the hide list
  if (hideNavbarPaths.includes(location.pathname)) {
    return null;
  }

  const getClusterLink = () => {
    if (user?.role === 'admin') {
      return '/ownermanage';
    } else if (user?.role === 'user') {
      return '/usermanage';
    }
    return '/';
  };

  const getClusterText = () => {
    if (user?.role === 'admin') {
      return 'MANAGE CLUSTER';
    } else if (user?.role === 'user') {
      return 'MY INSTANCES';
    }
    return 'CLUSTER';
  };

  const getHomeLink = () => {
    if (user?.role === 'admin') {
      return '/ownerhome';
    } else if (user?.role === 'user') {
      return '/userhome';
    }
    return '/';
  };

  return (
    <AppBar position='static'>
      <Container maxWidth='xl'>
        <Toolbar disableGutters>
          <NavText href={getHomeLink()} text='COMPGRID' isMain />
          {user && (
            <>
              <NavText href={getClusterLink()} text={getClusterText()} />
              <Button 
                color="inherit" 
                onClick={logout} 
                style={{ marginLeft: 'auto' }}
              >
                Logout
              </Button>
            </>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
}