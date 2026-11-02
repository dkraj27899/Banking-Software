import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Button, Card, Typography, Stack, TextField, InputAdornment,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination,
  Chip, IconButton, Tooltip, useMediaQuery, useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import BlockIcon from '@mui/icons-material/Block';
import { listStaff, deactivateStaff } from '@/api/staff';
import { formatDateTime } from '@/utils/format';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { useSnackbar } from 'notistack';

export default function StaffListPage() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const qc = useQueryClient();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [search, setSearch] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['staff', page, pageSize, search],
    queryFn: () => listStaff({ page: page + 1, pageSize, search: search || undefined }),
  });

  const deactivateMut = useMutation({
    mutationFn: deactivateStaff,
    onSuccess: () => {
      enqueueSnackbar('Staff deactivated', { variant: 'info' });
      qc.invalidateQueries({ queryKey: ['staff'] });
      setConfirmId(null);
    },
  });

  const staff = data?.data ?? [];
  const total = data?.meta?.total ?? 0;

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', sm: 'center' }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Typography variant="h4" fontWeight={700}>Staff Management</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/staff/new')}
          sx={{ alignSelf: { xs: 'stretch', sm: 'auto' } }}>
          Add Staff
        </Button>
      </Stack>

      <Card sx={{ mb: 2 }}>
        <Box sx={{ p: 2 }}>
          <TextField
            fullWidth size="small" placeholder="Search staff..."
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
            sx={{ maxWidth: { sm: 320 } }}
          />
        </Box>
      </Card>

      <Card>
        {isLoading ? <LoadingSpinner /> : staff.length === 0 ? (
          <EmptyState message="No staff found" />
        ) : (
          <>
            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table size="small" sx={{ minWidth: isMobile ? 550 : 'auto' }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Username</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Branch</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Last Login</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {staff.map((s) => (
                    <TableRow key={s.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{s.fullName}</TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }, fontFamily: 'monospace', fontSize: '0.8rem' }}>{s.username}</TableCell>
                      <TableCell>
                        <Chip label={s.role.replace(/_/g, ' ')} size="small" sx={{ textTransform: 'capitalize' }} />
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{s.branchName}</TableCell>
                      <TableCell>
                        <Chip
                          label={s.isActive ? 'Active' : 'Inactive'}
                          size="small"
                          color={s.isActive ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>{formatDateTime(s.lastLoginAt)}</TableCell>
                      <TableCell align="center">
                        {s.isActive && (
                          <Tooltip title="Deactivate">
                            <IconButton size="small" color="error" onClick={() => setConfirmId(s.id)}>
                              <BlockIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div" count={total}
              page={page} onPageChange={(_, p) => setPage(p)}
              rowsPerPage={pageSize} onRowsPerPageChange={(e) => { setPageSize(+e.target.value); setPage(0); }}
              rowsPerPageOptions={[10, 25, 50]}
            />
          </>
        )}
      </Card>

      <ConfirmDialog
        open={!!confirmId}
        title="Deactivate Staff"
        message="Are you sure you want to deactivate this staff member? Their sessions will be revoked."
        onConfirm={() => confirmId && deactivateMut.mutate(confirmId)}
        onCancel={() => setConfirmId(null)}
      />
    </Box>
  );
}
