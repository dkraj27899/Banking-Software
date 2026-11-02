import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Card, CardContent, Typography, TextField, Button, Grid, MenuItem, Stack,
  alpha, InputAdornment, Breadcrumbs, Link,
} from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { useSnackbar } from 'notistack';
import { createMember } from '@/api/members';

const genders = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];
const membershipTypes = [
  { value: 'individual', label: 'Individual' },
  { value: 'joint', label: 'Joint' },
  { value: 'minor', label: 'Minor' },
  { value: 'corporate', label: 'Corporate' },
];
const indianStates = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu and Kashmir', 'Ladakh',
];

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
        color: 'secondary.dark',
        '& .MuiSvgIcon-root': { fontSize: 18 },
      }}>
        {icon}
      </Box>
      <Typography variant="subtitle2" sx={{ color: 'text.primary', letterSpacing: '0.03em' }}>
        {title}
      </Typography>
    </Box>
  );
}

export default function CreateMemberPage() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    fullName: '', fatherGuardianName: '', dateOfBirth: '', gender: '',
    addressLine1: '', addressLine2: '', city: '', state: '', pincode: '',
    mobile: '', email: '', aadhaarLast4: '', membershipType: 'individual',
  });

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const mutation = useMutation({
    mutationFn: () => createMember({
      fullName: form.fullName,
      fatherGuardianName: form.fatherGuardianName || undefined,
      dateOfBirth: form.dateOfBirth || undefined,
      gender: form.gender || undefined,
      addressLine1: form.addressLine1,
      addressLine2: form.addressLine2 || undefined,
      city: form.city,
      state: form.state,
      pincode: form.pincode,
      mobile: form.mobile,
      email: form.email || undefined,
      aadhaarLast4: form.aadhaarLast4 || undefined,
      membershipType: form.membershipType,
    }),
    onSuccess: (data) => {
      enqueueSnackbar(`Member created (ID: ${data?.id})`, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['members'] });
      navigate('/members');
    },
    onError: (err: any) => {
      enqueueSnackbar(err?.response?.data?.error?.message ?? 'Failed to create member', { variant: 'error' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  return (
    <Box>
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 1 }}>
        <Link underline="hover" color="inherit" href="/members" onClick={(e) => { e.preventDefault(); navigate('/members'); }} sx={{ fontSize: '0.8125rem' }}>
          Members
        </Link>
        <Typography color="text.primary" sx={{ fontSize: '0.8125rem', fontWeight: 600 }}>
          New Registration
        </Typography>
      </Breadcrumbs>

      <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5 }}>New Member Registration</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Fill in the details below to register a new society member.
      </Typography>

      <Card sx={{ maxWidth: 900, mx: 'auto' }}>
        <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
          <form onSubmit={handleSubmit}>

            <SectionHeader icon={<PersonOutlineIcon />} title="Personal Details" />
            <Grid container spacing={{ xs: 2, sm: 2.5 }} sx={{ mb: 3.5 }}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth required label="Full Name" value={form.fullName} onChange={set('fullName')} placeholder="Enter full name" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Father / Guardian Name" value={form.fatherGuardianName} onChange={set('fatherGuardianName')} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth type="date" label="Date of Birth" value={form.dateOfBirth} onChange={set('dateOfBirth')} InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={6} sm={4}>
                <TextField fullWidth select label="Gender" value={form.gender} onChange={set('gender')}>
                  <MenuItem value="" disabled><em>Select</em></MenuItem>
                  {genders.map((g) => <MenuItem key={g.value} value={g.value}>{g.label}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={6} sm={4}>
                <TextField fullWidth select required label="Membership Type" value={form.membershipType} onChange={set('membershipType')}>
                  {membershipTypes.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                </TextField>
              </Grid>
            </Grid>

            <SectionHeader icon={<PhoneOutlinedIcon />} title="Contact Information" />
            <Grid container spacing={{ xs: 2, sm: 2.5 }} sx={{ mb: 3.5 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth required label="Mobile Number" value={form.mobile} onChange={set('mobile')}
                  inputProps={{ maxLength: 10 }}
                  InputProps={{ startAdornment: <InputAdornment position="start">+91</InputAdornment> }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Email Address" type="email" value={form.email} onChange={set('email')} placeholder="name@example.com" />
              </Grid>
            </Grid>

            <SectionHeader icon={<HomeOutlinedIcon />} title="Address" />
            <Grid container spacing={{ xs: 2, sm: 2.5 }} sx={{ mb: 3.5 }}>
              <Grid item xs={12}>
                <TextField fullWidth required label="Address Line 1" value={form.addressLine1} onChange={set('addressLine1')} placeholder="Street address, building name" />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Address Line 2" value={form.addressLine2} onChange={set('addressLine2')} placeholder="Locality, landmark (optional)" />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth required label="City" value={form.city} onChange={set('city')} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth select required label="State" value={form.state} onChange={set('state')}>
                  <MenuItem value="" disabled><em>Select State</em></MenuItem>
                  {indianStates.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth required label="Pincode" value={form.pincode} onChange={set('pincode')} inputProps={{ maxLength: 6, inputMode: 'numeric', pattern: '[0-9]*' }} />
              </Grid>
            </Grid>

            <SectionHeader icon={<BadgeOutlinedIcon />} title="KYC (Optional)" />
            <Grid container spacing={{ xs: 2, sm: 2.5 }} sx={{ mb: 3.5 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth label="Aadhaar Last 4 Digits" value={form.aadhaarLast4} onChange={set('aadhaarLast4')}
                  inputProps={{ maxLength: 4, inputMode: 'numeric', pattern: '[0-9]*' }}
                  helperText="Only last 4 digits are stored for security"
                />
              </Grid>
            </Grid>

            <Stack
              direction={{ xs: 'column-reverse', sm: 'row' }}
              spacing={2}
              justifyContent="flex-end"
              sx={{ pt: 2, borderTop: '1px solid', borderColor: 'divider' }}
            >
              <Button variant="outlined" onClick={() => navigate('/members')} sx={{ minWidth: 120 }}>
                Cancel
              </Button>
              <Button variant="contained" type="submit" disabled={mutation.isPending} sx={{ minWidth: 180 }}>
                {mutation.isPending ? 'Creating...' : 'Register Member'}
              </Button>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
