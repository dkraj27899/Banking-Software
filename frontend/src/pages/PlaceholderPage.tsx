import { Box, Typography, alpha } from '@mui/material';
import ConstructionOutlinedIcon from '@mui/icons-material/ConstructionOutlined';

interface Props {
  title: string;
}

export default function PlaceholderPage({ title }: Props) {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight={400}
      gap={2}
      textAlign="center"
    >
      <Box
        sx={{
          width: 80, height: 80, borderRadius: 3,
          bgcolor: alpha('#C5A572', 0.1),
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <ConstructionOutlinedIcon sx={{ fontSize: 40, color: 'secondary.main' }} />
      </Box>
      <Typography variant="h4" color="text.primary">
        {title}
      </Typography>
      <Typography variant="body1" color="text.secondary" maxWidth={380}>
        This module is under development and will be available in an upcoming release.
      </Typography>
    </Box>
  );
}
