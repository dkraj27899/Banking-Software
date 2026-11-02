import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Box, Button, Card, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination, TextField, MenuItem,
  InputAdornment, Stack, Typography, useMediaQuery, useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import { listAccounts } from '@/api/accounts';
import { formatDate, formatINR } from '@/utils/format';
import StatusChip from '@/components/common/StatusChip';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';

const statuses = ['', 'pending', 'active', 'suspended', 'closed'];

export default function AccountListPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['accounts', page, pageSize, search, status],
    queryFn: () => listAccounts({
      page: page + 1, pageSize,
      search: search || undefined,
      status: status || undefined,
    }),
  });

  const accounts = data?.data ?? [];
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
        <Typography variant="h4" fontWeight={700}>Accounts</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/accounts/new')}
          sx={{ alignSelf: { xs: 'stretch', sm: 'auto' } }}>
          Open Account
        </Button>
      </Stack>

      <Card sx={{ mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ p: 2 }}>
          <TextField
            size="small" placeholder="Search by account # or member..."
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
            sx={{ flex: 1, minWidth: { sm: 280 } }}
          />
          <TextField
            select size="small" value={status} label="Status"
            onChange={(e) => { setStatus(e.target.value); setPage(0); }}
            sx={{ minWidth: { xs: '100%', sm: 150 } }}
          >
            {statuses.map((s) => <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>{s || 'All Statuses'}</MenuItem>)}
          </TextField>
        </Stack>
      </Card>

      <Card>
        {isLoading ? <LoadingSpinner /> : accounts.length === 0 ? (
          <EmptyState message="No accounts found" />
        ) : (
          <>
            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table size="small" sx={{ minWidth: isMobile ? 600 : 'auto' }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Account #</TableCell>
                    <TableCell>Member</TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Product</TableCell>
                    <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Branch</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Balance</TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Opened</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {accounts.map((a) => (
                    <TableRow key={a.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/accounts/${a.id}`)}>
                      <TableCell sx={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '0.8rem' }}>{a.accountNumber ?? '—'}</TableCell>
                      <TableCell>{a.memberName}</TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{a.productName}</TableCell>
                      <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>{a.branchName}</TableCell>
                      <TableCell><StatusChip status={a.status} /></TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>{formatINR(a.balancePaise)}</TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{formatDate(a.openedAt)}</TableCell>
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
    </Box>
  );
}
