import {
  AccountBalance,
  CompareArrows,
  CreditCard,
  Dashboard,
  Description,
  Logout,
  Menu as MenuIcon,
} from '@mui/icons-material';
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AccountDetail from './pages/AccountDetail';
import Accounts from './pages/Accounts';
import Cards from './pages/Cards';
import DashboardPage from './pages/Dashboard';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Statements from './pages/Statements';
import Transfers from './pages/Transfers';
import useAuthStore from './store/useAuthStore';

const DRAWER_WIDTH = 220;

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/', icon: <Dashboard /> },
  { label: 'Accounts', path: '/accounts', icon: <AccountBalance /> },
  { label: 'Transfers', path: '/transfers', icon: <CompareArrows /> },
  { label: 'Cards', path: '/cards', icon: <CreditCard /> },
  { label: 'Statements', path: '/statements', icon: <Description /> },
];

function Sidebar({ onClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
    if (onClose) onClose();
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar sx={{ px: 2 }}>
        <Typography variant="h6" fontWeight={700} color="primary.main">
          NeoBank
        </Typography>
      </Toolbar>

      <List sx={{ flex: 1 }}>
        {NAV_ITEMS.map(({ label, path, icon }) => {
          const active = location.pathname === path;
          return (
            <ListItem key={path} disablePadding>
              <ListItemButton
                component={Link}
                to={path}
                onClick={onClose}
                selected={active}
                sx={{
                  mx: 1,
                  borderRadius: 2,
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'background.default',
                    '& .MuiListItemIcon-root': { color: 'background.default' },
                    '&:hover': { bgcolor: 'primary.main' },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>{icon}</ListItemIcon>
                <ListItemText primary={label} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout} sx={{ mx: 1, borderRadius: 2 }}>
            <ListItemIcon sx={{ minWidth: 36 }}>
              <Logout />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );
}

function Layout({ children }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Desktop: permanent drawer */}
      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              bgcolor: 'background.paper',
              borderRight: '1px solid rgba(255,255,255,0.08)',
            },
          }}
        >
          <Sidebar />
        </Drawer>
      )}

      {/* Mobile: temporary drawer + AppBar */}
      {isMobile && (
        <>
          <AppBar
            position="fixed"
            sx={{ bgcolor: 'background.paper', boxShadow: 'none', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
          >
            <Toolbar>
              <IconButton edge="start" color="inherit" onClick={() => setDrawerOpen(true)} sx={{ mr: 1 }}>
                <MenuIcon />
              </IconButton>
              <Typography variant="h6" fontWeight={700} color="primary.main">
                NeoBank
              </Typography>
            </Toolbar>
          </AppBar>
          <Drawer
            variant="temporary"
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            sx={{
              '& .MuiDrawer-paper': {
                width: DRAWER_WIDTH,
                bgcolor: 'background.paper',
              },
            }}
          >
            <Sidebar onClose={() => setDrawerOpen(false)} />
          </Drawer>
        </>
      )}

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: isMobile ? 7 : 0,
          bgcolor: 'background.default',
          minHeight: '100vh',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Protected routes — all wrapped in Layout */}
      <Route element={<ProtectedRoute />}>
        <Route
          path="/"
          element={
            <Layout>
              <DashboardPage />
            </Layout>
          }
        />
        <Route
          path="/accounts"
          element={
            <Layout>
              <Accounts />
            </Layout>
          }
        />
        <Route
          path="/accounts/:id"
          element={
            <Layout>
              <AccountDetail />
            </Layout>
          }
        />
        <Route
          path="/transfers"
          element={
            <Layout>
              <Transfers />
            </Layout>
          }
        />
        <Route
          path="/cards"
          element={
            <Layout>
              <Cards />
            </Layout>
          }
        />
        <Route
          path="/statements"
          element={
            <Layout>
              <Statements />
            </Layout>
          }
        />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
