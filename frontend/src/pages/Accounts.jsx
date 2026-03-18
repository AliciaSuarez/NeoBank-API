import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import AccountCard from '../components/AccountCard';
import { createAccount, getAccounts } from '../services/accountService';
import { getErrorMessage } from '../utils/getErrorMessage';

export default function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [newType, setNewType] = useState('checking');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);

  const loadAccounts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAccounts();
      setAccounts(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const handleCreate = async () => {
    setCreating(true);
    setCreateError(null);
    try {
      await createAccount(newType);
      setDialogOpen(false);
      loadAccounts();
    } catch (err) {
      setCreateError(getErrorMessage(err));
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          Accounts
        </Typography>
        <Button variant="contained" onClick={() => setDialogOpen(true)}>
          Open Account
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {accounts.length === 0 ? (
        <Typography color="text.secondary">No accounts yet. Open your first account above.</Typography>
      ) : (
        <Grid container spacing={2}>
          {accounts.map((account) => (
            <Grid item key={account.id} xs={12} sm={6} md={4}>
              <AccountCard account={account} />
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Open New Account</DialogTitle>
        <DialogContent>
          {createError && <Alert severity="error" sx={{ mb: 2 }}>{createError}</Alert>}
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>Account Type</InputLabel>
            <Select value={newType} label="Account Type" onChange={(e) => setNewType(e.target.value)}>
              <MenuItem value="checking">Checking</MenuItem>
              <MenuItem value="savings">Savings</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreate} variant="contained" disabled={creating}>
            {creating ? <CircularProgress size={20} color="inherit" /> : 'Open Account'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
