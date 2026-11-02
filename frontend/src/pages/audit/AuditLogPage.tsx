import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box, Card, Typography, Stack, TextField, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination,
  Chip, Collapse, IconButton, useMediaQuery, useTheme,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { listAuditLogs } from '@/api/audit';
import { formatDateTime } from '@/utils/format';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';

const actionFilters = [
  '', 'LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE',
  'APPROVE', 'REJECT', 'AUTHORIZE', 'REVERSE',
];

function AuditRow({ log, isMobile }: { log: any; isMobile: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <TableRow hover>
        <TableCell>
          <IconButton size="small" onClick={() => setOpen(!open)}>
            {open ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </IconButton>
        </TableCell>
        <TableCell>{formatDateTime(log.createdAt)}</TableCell>
        <TableCell sx={{ fontWeight: 600 }}>{log.actorName}</TableCell>
        <TableCell>
          <Chip label={log.action} size="small" variant="outlined" />
        </TableCell>
        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{log.entityType}</TableCell>
        <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' }, fontFamily: 'monospace', fontSize: '0.75rem' }}>{log.entityId}</TableCell>
        <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{log.ipAddress}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={7} sx={{ py: 0, border: 0 }}>
          <Collapse in={open}>
            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, my: 1, overflowX: 'auto' }}>
              <Typography variant="caption" color="text.secondary">Details</Typography>
              <pre style={{ margin: 0, fontSize: '0.75rem', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {JSON.stringify(log.details, null, 2)}
              </pre>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

export default function AuditLogPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [action, setAction] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', page, pageSize, action, dateFrom, dateTo],
    queryFn: () => listAuditLogs({
      page: page + 1, pageSize,
      action: action || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    }),
  });

  const logs = data?.data ?? [];
  const total = data?.meta?.total ?? 0;

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 3 }}>Audit Logs</Typography>

      <Card sx={{ mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ p: 2 }}>
          <TextField select size="small" value={action} label="Action"
            onChange={(e) => { setAction(e.target.value); setPage(0); }}
            sx={{ minWidth: { xs: '100%', sm: 160 } }}>
            {actionFilters.map((a) => <MenuItem key={a} value={a}>{a || 'All'}</MenuItem>)}
          </TextField>
          <TextField
            size="small" type="date" label="From" value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ flex: { sm: 1 }, maxWidth: { sm: 180 } }}
          />
          <TextField
            size="small" type="date" label="To" value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ flex: { sm: 1 }, maxWidth: { sm: 180 } }}
          />
        </Stack>
      </Card>

      <Card>
        {isLoading ? <LoadingSpinner /> : logs.length === 0 ? (
          <EmptyState message="No audit logs found" />
        ) : (
          <>
            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table size="small" sx={{ minWidth: isMobile ? 500 : 'auto' }}>
                <TableHead>
                  <TableRow>
                    <TableCell width={40} />
                    <TableCell>Timestamp</TableCell>
                    <TableCell>Actor</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Entity Type</TableCell>
                    <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Entity ID</TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>IP Address</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logs.map((log) => <AuditRow key={log.id} log={log} isMobile={isMobile} />)}
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
