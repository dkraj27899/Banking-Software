import { createTheme, alpha } from '@mui/material/styles';

const navy = {
  main: '#0A1628',
  light: '#1A2940',
  dark: '#060E1A',
  contrastText: '#FFFFFF',
};

const gold = {
  main: '#C5A572',
  light: '#DDBF89',
  dark: '#A67D4A',
  contrastText: '#0A1628',
};

const theme = createTheme({
  palette: {
    primary: navy,
    secondary: gold,
    background: {
      default: '#F5F6FA',
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
    h1: { fontSize: '2rem', fontWeight: 700, lineHeight: 1.3, letterSpacing: '-0.025em' },
    h2: { fontSize: '1.5rem', fontWeight: 700, lineHeight: 1.35, letterSpacing: '-0.02em' },
    h3: { fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.4 },
    h4: { fontSize: '1.125rem', fontWeight: 600, lineHeight: 1.4 },
    h5: { fontSize: '1rem', fontWeight: 600, lineHeight: 1.5 },
    h6: { fontSize: '0.875rem', fontWeight: 600, lineHeight: 1.5 },
    subtitle1: { fontSize: '0.9375rem', fontWeight: 500, lineHeight: 1.5 },
    subtitle2: { fontSize: '0.8125rem', fontWeight: 600, lineHeight: 1.5, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' },
    body1: { fontSize: '0.9375rem', lineHeight: 1.6 },
    body2: { fontSize: '0.8125rem', lineHeight: 1.55 },
    button: { fontWeight: 600, letterSpacing: '0.01em' },
    caption: { fontSize: '0.75rem', lineHeight: 1.5, color: '#6B7280' },
    overline: { fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' },
  },
  shape: {
    borderRadius: 10,
  },
  shadows: [
    'none',
    '0 1px 2px 0 rgba(0,0,0,0.03)',
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
        '*': {
          scrollbarWidth: 'thin',
          scrollbarColor: '#CBD5E1 transparent',
        },
        '*::-webkit-scrollbar': { width: 6, height: 6 },
        '*::-webkit-scrollbar-thumb': { backgroundColor: '#CBD5E1', borderRadius: 3 },
        '*::-webkit-scrollbar-track': { backgroundColor: 'transparent' },
        body: {
          backgroundColor: '#F5F6FA',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 10,
          fontWeight: 600,
          padding: '9px 22px',
          fontSize: '0.875rem',
          transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
        },
        contained: {
          boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)',
          '&:hover': {
            boxShadow: '0 4px 12px -2px rgba(10,22,40,0.15)',
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #0A1628 0%, #1A2940 100%)',
        },
        containedSecondary: {
          color: '#0A1628',
          background: 'linear-gradient(135deg, #C5A572 0%, #DDBF89 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #B89460 0%, #C5A572 100%)',
          },
        },
        outlined: {
          borderWidth: 1.5,
          '&:hover': {
            borderWidth: 1.5,
            backgroundColor: alpha('#0A1628', 0.04),
          },
        },
        sizeSmall: {
          padding: '6px 14px',
          fontSize: '0.8125rem',
        },
      },
      defaultProps: {
        disableElevation: true,
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        rounded: {
          borderRadius: 14,
        },
        elevation1: {
          boxShadow: '0 1px 3px 0 rgba(0,0,0,0.04), 0 1px 2px -1px rgba(0,0,0,0.03)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          border: '1px solid',
          borderColor: '#E5E7EB',
          boxShadow: '0 1px 3px 0 rgba(0,0,0,0.04)',
          transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
          overflow: 'hidden',
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        size: 'medium',
      },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            backgroundColor: '#FAFBFC',
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: '#FFFFFF',
            },
            '&.Mui-focused': {
              backgroundColor: '#FFFFFF',
              '& .MuiOutlinedInput-notchedOutline': {
                borderWidth: 2,
                borderColor: '#0A1628',
              },
            },
          },
          '& .MuiInputLabel-root.Mui-focused': {
            color: '#0A1628',
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
        },
        notchedOutline: {
          borderColor: '#E5E7EB',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            fontWeight: 600,
            fontSize: '0.75rem',
            color: '#6B7280',
            backgroundColor: '#F9FAFB',
            borderBottom: '1px solid #E5E7EB',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            padding: '12px 16px',
            whiteSpace: 'nowrap',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '14px 16px',
          fontSize: '0.8125rem',
          borderBottom: '1px solid #F3F4F6',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&.MuiTableRow-hover:hover': {
            backgroundColor: '#F9FAFB',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          fontSize: '0.6875rem',
          borderRadius: 6,
          height: 26,
        },
        sizeSmall: {
          height: 22,
          fontSize: '0.625rem',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#1A1A2E',
          fontSize: '0.75rem',
          borderRadius: 8,
          padding: '6px 12px',
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          backgroundColor: alpha('#C5A572', 0.15),
          color: '#C5A572',
          fontWeight: 600,
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          '&.Mui-selected': {
            backgroundColor: alpha('#C5A572', 0.12),
            '&:hover': {
              backgroundColor: alpha('#C5A572', 0.18),
            },
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.875rem',
          minHeight: 48,
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          height: 3,
          borderRadius: '3px 3px 0 0',
        },
      },
    },
    MuiTablePagination: {
      styleOverrides: {
        root: {
          borderTop: '1px solid #F3F4F6',
        },
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
          border: '1px solid #E5E7EB',
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        select: {
          borderRadius: 10,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 10,
        },
      },
    },
  },
});

export default theme;
