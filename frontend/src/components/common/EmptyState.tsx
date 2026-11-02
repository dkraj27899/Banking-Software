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
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight={260}
      gap={1.5}
      py={6}
    >
      <Icon sx={{ fontSize: 56, color: 'text.disabled' }} />
      <Typography variant="h6" color="text.secondary">
        {title ?? message ?? 'No data'}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.disabled" textAlign="center" maxWidth={360}>
          {description}
        </Typography>
      )}
    </Box>
  );
}
