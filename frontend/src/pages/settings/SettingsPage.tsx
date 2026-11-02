import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Card, Typography, Stack,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, useMediaQuery, useTheme,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { listConfig, updateConfig, type SystemConfig } from '@/api/settings';
import { formatDateTime } from '@/utils/format';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useSnackbar } from 'notistack';

export default function SettingsPage() {
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const qc = useQueryClient();
  const [editing, setEditing] = useState<SystemConfig | null>(null);
  const [editValue, setEditValue] = useState('');

  const { data: configs, isLoading } = useQuery({
    queryKey: ['system-config'],
    queryFn: listConfig,
  });

  const updateMut = useMutation({
    mutationFn: () => {
      let parsed: unknown = editValue;
      try { parsed = JSON.parse(editValue); } catch { /* keep as string */ }
      return updateConfig(editing!.key, parsed);
    },
    onSuccess: () => {
      enqueueSnackbar('Configuration updated', { variant: 'success' });
      qc.invalidateQueries({ queryKey: ['system-config'] });
      setEditing(null);
    },
    onError: (err: any) => {
      enqueueSnackbar(err?.response?.data?.error?.message ?? 'Update failed', { variant: 'error' });
    },
  });

  const openEdit = (config: SystemConfig) => {
    setEditing(config);
    setEditValue(typeof config.value === 'string' ? config.value : JSON.stringify(config.value));
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 3 }}>System Settings</Typography>

      <Card>
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: isMobile ? 500 : 'auto' }}>
            <TableHead>
              <TableRow>
                <TableCell>Key</TableCell>
                <TableCell>Value</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Description</TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Module</TableCell>
                <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Updated</TableCell>
                <TableCell align="center">Edit</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(configs ?? []).map((c) => (
                <TableRow key={c.key} hover>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 600 }}>{c.key}</TableCell>
                  <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {String(c.value)}
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{c.description ?? '—'}</TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{c.module}</TableCell>
                  <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>{formatDateTime(c.updatedAt)}</TableCell>
                  <TableCell align="center">
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => openEdit(c)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={!!editing} onClose={() => setEditing(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Configuration</DialogTitle>
        <DialogContent>
          <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>{editing?.key}</Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>{editing?.description}</Typography>
          <TextField
            fullWidth multiline rows={3} value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            label="Value"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditing(null)}>Cancel</Button>
          <Button variant="contained" onClick={() => updateMut.mutate()} disabled={updateMut.isPending}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
