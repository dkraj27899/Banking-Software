import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Card, CardContent, Typography, TextField, Button, Grid, MenuItem, Stack,
  Breadcrumbs, Link, alpha, InputAdornment,
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useSnackbar } from 'notistack';
import { createStaff, listBranches } from '@/api/staff';
import { ROLES } from '@bccs/shared';

const roles = Object.values(ROLES);

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <Box sx={{
      display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5, mt: 1,
      pb: 1.5, borderBottom: '1px solid', borderColor: 'divider',
    }}>
      <Box sx={{
        width: 32, height: 32, borderRadius: 1.5,
        bgcolor: (t) => alpha(t.palette.secondary.main, 0.12),
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'secondary.dark', '& .MuiSvgIcon-root': { fontSize: 18 },
      }}>
        {icon}
      </Box>
      <Typography variant="subtitle2" sx={{ color: 'text.primary', letterSpacing: '0.03em' }}>
        {title}
      </Typography>
    </Box>
  );
}

export default function CreateStaffPage() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const qc = useQueryClient();

  const [form, setForm] = useState({
    username: '', password: '', fullName: '', email: '',
    mobile: '', role: '', branchId: '',
  });

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: listBranches,
  });

  const mutation = useMutation({
    mutationFn: () => createStaff({
      username: form.username,
      password: form.password,
      fullName: form.fullName,
      email: form.email,
      mobile: form.mobile,
      role: form.role as any,
      branchId: form.branchId,
    }),
    onSuccess: () => {
      enqueueSnackbar('Staff member created', { variant: 'success' });
      qc.invalidateQueries({ queryKey: ['staff'] });
      navigate('/staff');
    },
    onError: (err: any) => {
      enqueueSnackbar(err?.response?.data?.error?.message ?? 'Failed to create staff', { variant: 'error' });
    },
  });

  return (
    <Box>
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 1 }}>
        <Link underline="hover" color="inherit" href="/staff" onClick={(e) => { e.preventDefault(); navigate('/staff'); }} sx={{ fontSize: '0.8125rem' }}>
          Staff
        </Link>
        <Typography color="text.primary" sx={{ fontSize: '0.8125rem', fontWeight: 600 }}>
          Add Staff Member
        </Typography>
      </Breadcrumbs>

      <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5 }}>Add Staff Member</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Create a new staff login with role-based access.
      </Typography>

      <Card sx={{ maxWidth: 800, mx: 'auto' }}>
        <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
          <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}>
            <SectionHeader icon={<PersonOutlineIcon />} title="Personal Details" />
            <Grid container spacing={{ xs: 2, sm: 2.5 }} sx={{ mb: 3.5 }}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth required label="Full Name" value={form.fullName} onChange={set('fullName')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth required label="Email" type="email" value={form.email} onChange={set('email')} placeholder="name@example.com" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth required label="Mobile" value={form.mobile} onChange={set('mobile')}
                  inputProps={{ maxLength: 10 }}
                  InputProps={{ startAdornment: <InputAdornment position="start">+91</InputAdornment> }} />
              </Grid>
            </Grid>

            <SectionHeader icon={<LockOutlinedIcon />} title="Login & Role" />
            <Grid container spacing={{ xs: 2, sm: 2.5 }} sx={{ mb: 3.5 }}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth required label="Username" value={form.username} onChange={set('username')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth required label="Password" type="password" value={form.password} onChange={set('password')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth select required label="Role" value={form.role} onChange={set('role')}>
                  {roles.map((r) => (
                    <MenuItem key={r} value={r} sx={{ textTransform: 'capitalize' }}>{r.replace(/_/g, ' ')}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth select required label="Branch" value={form.branchId} onChange={set('branchId')}>
                  {(branches ?? []).map((b) => (
                    <MenuItem key={b.id} value={b.id}>{b.code} — {b.name}</MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>

            <Stack
              direction={{ xs: 'column-reverse', sm: 'row' }}
              spacing={2}
              justifyContent="flex-end"
              sx={{ pt: 2, borderTop: '1px solid', borderColor: 'divider' }}
            >
              <Button variant="outlined" onClick={() => navigate('/staff')} sx={{ minWidth: 120 }}>
                Cancel
              </Button>
              <Button variant="contained" type="submit" disabled={mutation.isPending} sx={{ minWidth: 180 }}>
                {mutation.isPending ? 'Creating...' : 'Create Staff'}
              </Button>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
