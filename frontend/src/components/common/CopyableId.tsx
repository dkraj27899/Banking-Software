import { useState, useCallback } from 'react';
import { Box, Typography, Tooltip, alpha } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';

interface Props {
  value: string;
  label?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'pill' | 'inline';
}

export default function CopyableId({ value, label, size = 'medium', variant = 'pill' }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [value]);

  const fontSize = size === 'small' ? '0.72rem' : size === 'large' ? '0.95rem' : '0.8rem';
  const iconSize = size === 'small' ? 11 : size === 'large' ? 15 : 13;
  const py = size === 'small' ? 0.25 : size === 'large' ? 0.75 : 0.4;
  const px = size === 'small' ? 0.8 : size === 'large' ? 1.5 : 1;

  if (variant === 'inline') {
    return (
      <Tooltip title={copied ? 'Copied!' : `Copy ${label ?? value}`} arrow placement="top">
        <Box
          component="span"
          onClick={handleCopy}
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.5,
            cursor: 'pointer',
            fontFamily: '"SF Mono", "Roboto Mono", monospace',
            fontSize,
            fontWeight: 700,
            color: '#0A1628',
            letterSpacing: '0.03em',
            transition: 'color 0.2s',
            '&:hover': { color: '#C5A572' },
            '&:hover .copy-icon': { opacity: 1 },
          }}
        >
          {value}
          <Box
            component="span"
            className="copy-icon"
            sx={{
              display: 'inline-flex',
              opacity: 0,
              transition: 'opacity 0.2s, color 0.2s',
              color: copied ? '#059669' : '#C5A572',
            }}
          >
            {copied
              ? <CheckIcon sx={{ fontSize: iconSize }} />
              : <ContentCopyIcon sx={{ fontSize: iconSize }} />}
          </Box>
        </Box>
      </Tooltip>
    );
  }

  return (
    <Tooltip title={copied ? 'Copied!' : `Copy ${label ?? value}`} arrow placement="top">
      <Box
        onClick={handleCopy}
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.6,
          px, py,
          borderRadius: '8px',
          bgcolor: alpha('#0A1628', 0.04),
          border: '1px solid',
          borderColor: alpha('#0A1628', 0.08),
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          '&:hover': {
            bgcolor: alpha('#C5A572', 0.08),
            borderColor: alpha('#C5A572', 0.25),
          },
        }}
      >
        {label && (
          <Typography
            component="span"
            sx={{
              fontSize: size === 'small' ? '0.6rem' : '0.65rem',
              fontWeight: 600,
              color: 'text.secondary',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              lineHeight: 1,
            }}
          >
            {label}
          </Typography>
        )}
        <Typography
          component="span"
          sx={{
            fontFamily: '"SF Mono", "Roboto Mono", monospace',
            fontSize,
            fontWeight: 700,
            color: '#0A1628',
            letterSpacing: '0.04em',
            lineHeight: 1,
          }}
        >
          {value}
        </Typography>
        <Box
          component="span"
          sx={{
            display: 'inline-flex',
            transition: 'all 0.2s',
            color: copied ? '#059669' : alpha('#0A1628', 0.3),
          }}
        >
          {copied
            ? <CheckIcon sx={{ fontSize: iconSize }} />
            : <ContentCopyIcon sx={{ fontSize: iconSize }} />}
        </Box>
      </Box>
    </Tooltip>
  );
}
