import { createTheme, alpha } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#0A1628',
      light: '#1A2940',
      dark: '#060E1A',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#C5A572',
      light: '#DDBF89',
      dark: '#A67D4A',
      contrastText: '#0A1628',
    },
    background: {
      default: '#F4F5F7',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1A1A2E',
      secondary: '#6B7280',
    },
    success: { main: '#059669', light: '#ECFDF5' },
    error: { main: '#DC2626', light: '#FEF2F2' },
    warning: { main: '#D97706', light: '#FFFBEB' },
    info: { main: '#2563EB', light: '#EFF6FF' },
    divider: '#E5E7EB',
  },
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    h1: { fontSize: '1.75rem', fontWeight: 700, lineHeight: 1.3, letterSpacing: '-0.02em' },
    h2: { fontSize: '1.375rem', fontWeight: 700, lineHeight: 1.35, letterSpacing: '-0.015em' },
    h3: { fontSize: '1.125rem', fontWeight: 600, lineHeight: 1.4 },
    h4: { fontSize: '1rem', fontWeight: 600, lineHeight: 1.4 },
    h5: { fontSize: '0.9375rem', fontWeight: 600, lineHeight: 1.5 },
    h6: { fontSize: '0.875rem', fontWeight: 600, lineHeight: 1.5 },
    subtitle1: { fontSize: '0.875rem', fontWeight: 500, lineHeight: 1.5 },
    subtitle2: { fontSize: '0.8125rem', fontWeight: 600, lineHeight: 1.5 },
    body1: { fontSize: '0.875rem', lineHeight: 1.6 },
    body2: { fontSize: '0.8125rem', lineHeight: 1.55 },
    button: { fontWeight: 600, letterSpacing: '0.01em' },
    caption: { fontSize: '0.75rem', lineHeight: 1.5, color: '#6B7280' },
    overline: { fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' as const },
  },
  shape: {
    borderRadius: 8,
  },
  shadows: [
    'none',
    '0 1px 2px 0 rgba(0,0,0,0.04)',
    '0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.03)',
    '0 4px 6px -1px rgba(0,0,0,0.06), 0 2px 4px -2px rgba(0,0,0,0.03)',
    '0 10px 15px -3px rgba(0,0,0,0.06), 0 4px 6px -4px rgba(0,0,0,0.03)',
    '0 20px 25px -5px rgba(0,0,0,0.06), 0 8px 10px -6px rgba(0,0,0,0.03)',
    '0 25px 50px -12px rgba(0,0,0,0.12)',
    ...Array(18).fill('none'),
  ] as any,
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '*': { scrollbarWidth: 'thin', scrollbarColor: '#CBD5E1 transparent' },
        '*::-webkit-scrollbar': { width: 6, height: 6 },
        '*::-webkit-scrollbar-thumb': { backgroundColor: '#CBD5E1', borderRadius: 3 },
        '*::-webkit-scrollbar-track': { backgroundColor: 'transparent' },
        body: { backgroundColor: '#F4F5F7' },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 6,
          fontWeight: 600,
          padding: '7px 16px',
          fontSize: '0.8125rem',
          transition: 'all 0.15s ease',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': { boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
        },
        containedPrimary: {
          backgroundColor: '#0A1628',
          color: '#FFFFFF',
          '&:hover': { backgroundColor: '#1A2940', color: '#FFFFFF' },
        },
        containedSecondary: {
          backgroundColor: '#C5A572',
          color: '#0A1628',
          '&:hover': { backgroundColor: '#B89460' },
        },
        outlined: {
          borderWidth: 1,
          '&:hover': { borderWidth: 1, backgroundColor: alpha('#0A1628', 0.03) },
        },
        sizeSmall: {
          padding: '4px 12px',
          fontSize: '0.8125rem',
        },
      },
      defaultProps: { disableElevation: true },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
        rounded: { borderRadius: 8 },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          border: '1px solid #E5E7EB',
          boxShadow: 'none',
          overflow: 'hidden',
        },
      },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined', size: 'medium' },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 6,
            backgroundColor: '#FFFFFF',
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderWidth: 2,
              borderColor: '#0A1628',
            },
          },
          '& .MuiInputLabel-root.Mui-focused': { color: '#0A1628' },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { borderRadius: 6 },
        notchedOutline: { borderColor: '#E5E7EB' },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            fontWeight: 600,
            fontSize: '0.6875rem',
            color: '#6B7280',
            backgroundColor: '#F9FAFB',
            borderBottom: '1px solid #E5E7EB',
            textTransform: 'uppercase' as const,
            letterSpacing: '0.04em',
            padding: '10px 16px',
            whiteSpace: 'nowrap',
            '@media (max-width: 600px)': {
              padding: '8px 10px',
              fontSize: '0.625rem',
            },
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '10px 16px',
          fontSize: '0.8125rem',
          borderBottom: '1px solid #F0F1F4',
          '@media (max-width: 600px)': {
            padding: '8px 10px',
            fontSize: '0.75rem',
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'background-color 0.1s ease',
          '&.MuiTableRow-hover:hover': { backgroundColor: '#F9FAFB' },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, fontSize: '0.6875rem', borderRadius: 4, height: 24 },
        sizeSmall: { height: 22, fontSize: '0.625rem' },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 10, margin: 16, maxWidth: 'calc(100% - 32px)' },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: { backgroundColor: '#1A1A2E', fontSize: '0.75rem', borderRadius: 4, padding: '4px 10px' },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: { backgroundColor: '#0A1628', color: '#FFFFFF', fontWeight: 600 },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          '&.Mui-selected': {
            backgroundColor: alpha('#C5A572', 0.12),
            '&:hover': { backgroundColor: alpha('#C5A572', 0.18) },
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600, fontSize: '0.8125rem', minHeight: 44 },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: { height: 2, borderRadius: '2px 2px 0 0' },
      },
    },
    MuiTablePagination: {
      styleOverrides: {
        root: { borderTop: '1px solid #F0F1F4' },
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        paper: { borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.08)', border: '1px solid #E5E7EB' },
      },
    },
    MuiSelect: {
      styleOverrides: { select: { borderRadius: 6 } },
    },
    MuiAlert: {
      styleOverrides: { root: { borderRadius: 6 } },
    },
  },
});

export default theme;
