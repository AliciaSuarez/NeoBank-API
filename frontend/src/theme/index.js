import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#0B1437',
      paper: '#142057',
    },
    primary: {
      main: '#63B3ED',
    },
    success: {
      main: '#68D391',
    },
    error: {
      main: '#FC8181',
    },
    warning: {
      main: '#F6E05E',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#A0AEC0',
    },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
  },
});

export default theme;
