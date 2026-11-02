import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Card, CardContent, Typography, Grid, Button, Stack,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Breadcrumbs, Link, useMediaQuery, useTheme,
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { useSnackbar } from 'notistack';
import { getMember, approveMember, rejectMember } from '@/api/members';
import { getAccountsByMember } from '@/api/accounts';
import { formatDate, formatINR } from '@/utils/format';
import StatusChip from '@/components/common/StatusChip';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function MemberDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const qc = useQueryClient();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const { data: member, isLoading } = useQuery({
    queryKey: ['member', id],
    queryFn: () => getMember(id!),
    enabled: !!id,
  });

  const { data: accounts } = useQuery({
    queryKey: ['member-accounts', id],
    queryFn: () => getAccountsByMember(id!),
    enabled: !!id,
  });

  const approve = useMutation({
    mutationFn: () => approveMember(id!),
    onSuccess: (data) => {
      enqueueSnackbar(`Approved — ${data?.membershipNumber}`, { variant: 'success' });
      qc.invalidateQueries({ queryKey: ['member', id] });
      qc.invalidateQueries({ queryKey: ['members'] });
    },
  });

  const reject = useMutation({
    mutationFn: () => rejectMember(id!, 'Rejected by admin'),
    onSuccess: () => {
      enqueueSnackbar('Member rejected', { variant: 'info' });
      qc.invalidateQueries({ queryKey: ['member', id] });
    },
  });

  if (isLoading) return <LoadingSpinner />;
  if (!member) return <Typography>Member not found</Typography>;

  return (
    <Box>
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 1 }}>
        <Link underline="hover" color="inherit" href="/members" onClick={(e) => { e.preventDefault(); navigate('/members'); }} sx={{ fontSize: '0.8125rem' }}>
          Members
        </Link>
        <Typography color="text.primary" sx={{ fontSize: '0.8125rem', fontWeight: 600 }}>
          {member.fullName}
        </Typography>
      </Breadcrumbs>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', sm: 'center' }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={700}>{member.fullName}</Typography>
          <Typography variant="body2" color="text.secondary">
            {member.membershipNumber ?? 'Pending approval'} &middot; {member.branchName}
          </Typography>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          {member.status === 'pending' && (
            <>
              <Button variant="contained" color="success" onClick={() => approve.mutate()} disabled={approve.isPending}>
                Approve
              </Button>
              <Button variant="outlined" color="error" onClick={() => reject.mutate()} disabled={reject.isPending}>
                Reject
              </Button>
            </>
          )}
          <Button variant="outlined" onClick={() => navigate('/members')}>Back</Button>
        </Stack>
      </Stack>

      <Grid container spacing={{ xs: 2, md: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>Personal Information</Typography>
              <Grid container spacing={1.5}>
                {[
                  ['Status', <StatusChip status={member.status} key="s" />],
                  ['Type', member.membershipType],
                  ['Father / Guardian', member.fatherGuardianName ?? '—'],
                  ['Date of Birth', formatDate(member.dateOfBirth)],
                  ['Gender', member.gender ?? '—'],
                  ['Applied On', formatDate(member.applicationDate)],
                  ['Approved On', formatDate(member.approvalDate)],
                ].map(([label, value]) => (
                  <Grid item xs={6} key={String(label)}>
                    <Typography variant="caption" color="text.secondary">{String(label)}</Typography>
                    <Typography variant="body2">{value}</Typography>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>Contact & Address</Typography>
              <Grid container spacing={1.5}>
                {[
                  ['Mobile', member.mobile],
                  ['Email', member.email ?? '—'],
                  ['Address', [member.addressLine1, member.addressLine2].filter(Boolean).join(', ')],
                  ['City', member.city],
                  ['State', member.state],
                  ['Pincode', member.pincode],
                  ['Aadhaar (last 4)', member.aadhaarLast4 ? `****${member.aadhaarLast4}` : '—'],
                ].map(([label, value]) => (
                  <Grid item xs={6} key={String(label)}>
                    <Typography variant="caption" color="text.secondary">{String(label)}</Typography>
                    <Typography variant="body2">{String(value)}</Typography>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'stretch', sm: 'center' }}
                spacing={1}
                sx={{ mb: 2 }}
              >
                <Typography variant="subtitle2" color="text.secondary">Accounts</Typography>
                {member.status === 'active' && (
                  <Button size="small" onClick={() => navigate('/accounts/new', { state: { memberId: member.id } })}
                    sx={{ alignSelf: { xs: 'flex-start', sm: 'auto' } }}>
                    Open New Account
                  </Button>
                )}
              </Stack>
              {!accounts || accounts.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No accounts</Typography>
              ) : (
                <TableContainer sx={{ overflowX: 'auto' }}>
                  <Table size="small" sx={{ minWidth: isMobile ? 450 : 'auto' }}>
                    <TableHead>
                      <TableRow>
                        <TableCell>Account #</TableCell>
                        <TableCell>Product</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="right">Balance</TableCell>
                        <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Opened</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {accounts.map((a) => (
                        <TableRow key={a.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/accounts/${a.id}`)}>
                          <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{a.accountNumber}</TableCell>
                          <TableCell>{a.productName}</TableCell>
                          <TableCell><StatusChip status={a.status} /></TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>{formatINR(a.balancePaise)}</TableCell>
                          <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{formatDate(a.openedAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
