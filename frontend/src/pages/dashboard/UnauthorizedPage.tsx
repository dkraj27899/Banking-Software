import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button } from '@mui/material';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';

export default function UnauthorizedPage() {
  const navigate = useNavigate();

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
      <BlockOutlinedIcon sx={{ fontSize: 72, color: 'error.light' }} />
      <Typography variant="h3" color="text.primary">
        Access Denied
      </Typography>
      <Typography variant="body1" color="text.secondary" maxWidth={420}>
        You do not have permission to view this page.
        If you believe this is an error, please contact your branch administrator.
      </Typography>
      <Button variant="outlined" onClick={() => navigate('/')} sx={{ mt: 1 }}>
        Return to Dashboard
      </Button>
    </Box>
  );
}
