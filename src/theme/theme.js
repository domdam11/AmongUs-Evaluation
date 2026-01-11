import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#16213e',
      paper: '#1e2a47',
    },
    text: {
      primary: '#ffffff',
      secondary: '#aaa',
    },
  },
  components: {
    MuiTableCell: {
      styleOverrides: {
        head: {
          color: '#f9d342',
          fontWeight: 'bold',
          backgroundColor: '#1e2a47',
        },
        body: {
          color: '#fff',
          backgroundColor: '#1e2a47',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#1e2a47',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:nth-of-type(odd)': {
            backgroundColor: '#1b2b4a',
          },
        },
      },
    },
  },
});

export default theme;
