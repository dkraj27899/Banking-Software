import { Box, Tooltip } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface Props {
  dark?: boolean;
}

function IndianFlagThumb() {
  return (
    <Box
      sx={{
        width: 26, height: 26, borderRadius: '50%',
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
        flexShrink: 0,
        position: 'relative',
      }}
    >
      {/* Saffron */}
      <Box sx={{ flex: 1, bgcolor: '#FF9933' }} />
      {/* White + Chakra */}
      <Box sx={{
        flex: 1, bgcolor: '#FFFFFF',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Box sx={{
          width: 7, height: 7, borderRadius: '50%',
          border: '1px solid #000088',
        }} />
      </Box>
      {/* Green */}
      <Box sx={{ flex: 1, bgcolor: '#138808' }} />
    </Box>
  );
}

export default function LanguageToggle({ dark }: Props) {
  const { i18n } = useTranslation();
  const isHindi = i18n.language === 'hi';

  const toggle = () => {
    i18n.changeLanguage(isHindi ? 'en' : 'hi');
  };

  return (
    <Tooltip title={isHindi ? 'Switch to English' : 'हिन्दी में बदलें'}>
      <Box
        onClick={toggle}
        role="switch"
        aria-checked={isHindi}
        aria-label="Toggle language"
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          cursor: 'pointer',
          userSelect: 'none',
          height: 34,
          borderRadius: '20px',
          bgcolor: dark ? 'rgba(255,255,255,0.1)' : '#F0F1F3',
          border: '1.5px solid',
          borderColor: dark ? 'rgba(255,255,255,0.15)' : '#E0E2E6',
          px: 0.5,
          position: 'relative',
          transition: 'all 0.2s ease',
          '&:hover': {
            borderColor: dark ? 'rgba(255,255,255,0.3)' : '#C5A572',
            bgcolor: dark ? 'rgba(255,255,255,0.14)' : '#E8E9EC',
          },
        }}
      >
        {/* EN label */}
        <Box
          sx={{
            fontSize: '0.7rem',
            fontWeight: 700,
            lineHeight: 1,
            pl: 0.75,
            color: !isHindi
              ? (dark ? '#FFF' : '#1A1A2E')
              : (dark ? 'rgba(255,255,255,0.4)' : '#9CA3AF'),
            transition: 'color 0.25s ease',
            letterSpacing: '0.02em',
          }}
        >
          EN
        </Box>

        {/* Track with sliding thumb */}
        <Box
          sx={{
            width: 46, height: 26,
            borderRadius: '13px',
            bgcolor: dark ? 'rgba(255,255,255,0.08)' : '#D9DBE0',
            position: 'relative',
            transition: 'background-color 0.25s ease',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: 0, left: 0,
              transform: isHindi ? 'translateX(20px)' : 'translateX(0px)',
              transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <IndianFlagThumb />
          </Box>
        </Box>

        {/* HI label */}
        <Box
          sx={{
            fontSize: '0.7rem',
            fontWeight: 700,
            lineHeight: 1,
            pr: 0.75,
            color: isHindi
              ? (dark ? '#FFF' : '#1A1A2E')
              : (dark ? 'rgba(255,255,255,0.4)' : '#9CA3AF'),
            transition: 'color 0.25s ease',
            letterSpacing: '0.02em',
          }}
        >
          HI
        </Box>
      </Box>
    </Tooltip>
  );
}
