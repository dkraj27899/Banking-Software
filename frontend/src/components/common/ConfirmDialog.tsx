import {
  Dialog, DialogTitle, DialogContent, DialogContentText,
  DialogActions, Button,
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  severity?: 'warning' | 'error' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

const severityConfig = {
  warning: { icon: WarningAmberIcon, color: 'warning.main' as const },
  error: { icon: ErrorOutlineIcon, color: 'error.main' as const },
  info: { icon: InfoOutlinedIcon, color: 'info.main' as const },
};

export default function ConfirmDialog({
  open, title, message, confirmText = 'Confirm', cancelText = 'Cancel',
  severity = 'warning', onConfirm, onCancel,
}: Props) {
  const { icon: SeverityIcon, color } = severityConfig[severity];

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
        <SeverityIcon sx={{ color, fontSize: 28 }} />
        {title}
      </DialogTitle>
      <DialogContent>
        <DialogContentText>{message}</DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onCancel} color="inherit" variant="outlined">
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color={severity === 'info' ? 'primary' : severity}
          autoFocus
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
