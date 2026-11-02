import { Chip, type ChipProps } from '@mui/material';

const statusColors: Record<string, { bg: string; text: string }> = {
  pending:    { bg: '#FFF3E0', text: '#E65100' },
  active:     { bg: '#E8F5E9', text: '#2E7D32' },
  approved:   { bg: '#E8F5E9', text: '#2E7D32' },
  authorized: { bg: '#E8F5E9', text: '#2E7D32' },
  posted:     { bg: '#E3F2FD', text: '#1565C0' },
  reversed:   { bg: '#F3E5F5', text: '#7B1FA2' },
  failed:     { bg: '#FFEBEE', text: '#C62828' },
  rejected:   { bg: '#FFEBEE', text: '#C62828' },
  inactive:   { bg: '#F5F5F5', text: '#616161' },
  suspended:  { bg: '#FFF8E1', text: '#F57F17' },
  closed:     { bg: '#ECEFF1', text: '#546E7A' },
};

const defaultColor = { bg: '#F5F5F5', text: '#616161' };

interface Props extends Omit<ChipProps, 'color'> {
  status: string;
}

export default function StatusChip({ status, ...rest }: Props) {
  const color = statusColors[status.toLowerCase()] ?? defaultColor;

  return (
    <Chip
      label={status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
      size="small"
      sx={{
        bgcolor: color.bg,
        color: color.text,
        fontWeight: 600,
        fontSize: '0.75rem',
        height: 24,
      }}
      {...rest}
    />
  );
}
