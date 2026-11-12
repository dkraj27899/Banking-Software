import { Box, Typography } from '@mui/material';
import type { SvgIconComponent } from '@mui/icons-material';
import InboxIcon from '@mui/icons-material/InboxOutlined';

interface Props {
  icon?: SvgIconComponent;
  title?: string;
  message?: string;
  description?: string;
}

export default function EmptyState({ icon: Icon = InboxIcon, title, message, description }: Props) {
  return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight={140} gap={0.5} py={4}>
      <Icon sx={{ fontSize: 32, color: 'text.disabled', mb: 0.5 }} />
      <Typography variant="body2" color="text.secondary" fontWeight={500}>
        {title ?? message ?? 'No data'}
      </Typography>
      {description && (
        <Typography variant="caption" color="text.disabled" textAlign="center" maxWidth={320}>
          {description}
        </Typography>
      )}
    </Box>
  );
}
