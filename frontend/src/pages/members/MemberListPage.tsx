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
import { listMembers } from '@/api/members';
import { formatDate } from '@/utils/format';
import StatusChip from '@/components/common/StatusChip';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';

const statuses = ['', 'pending', 'active', 'inactive', 'rejected'];

export default function MemberListPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['members', page, pageSize, search, status],
    queryFn: () => listMembers({
      page: page + 1,
      pageSize,
      search: search || undefined,
      status: status || undefined,
    }),
  });

  const members = data?.data ?? [];
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
        <Typography variant="h4" fontWeight={700}>Members</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/members/new')}
          sx={{ alignSelf: { xs: 'stretch', sm: 'auto' } }}
        >
          New Member
        </Button>
      </Stack>

      <Card sx={{ mb: 2 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          sx={{ p: 2 }}
        >
          <TextField
            size="small" placeholder="Search by name, mobile, membership #..."
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
            sx={{ flex: 1, minWidth: { sm: 260 } }}
          />
          <TextField
            select size="small" value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(0); }}
            sx={{ minWidth: { xs: '100%', sm: 150 } }}
            label="Status"
          >
            {statuses.map((s) => (
              <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>{s || 'All Statuses'}</MenuItem>
            ))}
          </TextField>
        </Stack>
      </Card>

      <Card>
        {isLoading ? <LoadingSpinner /> : members.length === 0 ? (
          <EmptyState message="No members found" />
        ) : (
          <>
            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table size="small" sx={{ minWidth: isMobile ? 600 : 'auto' }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Membership #</TableCell>
                    <TableCell>Full Name</TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Mobile</TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>City</TableCell>
                    <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Type</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Applied</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {members.map((m) => (
                    <TableRow
                      key={m.id} hover sx={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/members/${m.id}`)}
                    >
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{m.membershipNumber ?? '—'}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{m.fullName}</TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{m.mobile}</TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{m.city}</TableCell>
                      <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' }, textTransform: 'capitalize' }}>{m.membershipType}</TableCell>
                      <TableCell><StatusChip status={m.status} /></TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{formatDate(m.applicationDate)}</TableCell>
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
              sx={{ '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': { fontSize: '0.8125rem' } }}
            />
          </>
        )}
      </Card>
    </Box>
  );
}
