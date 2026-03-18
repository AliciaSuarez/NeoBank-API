import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Paper,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import TransactionList from '../components/TransactionList';
import { closeAccount, getAccount } from '../services/accountService';
import { getTransactions } from '../services/transactionService';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';
import { getErrorMessage } from '../utils/getErrorMessage';

export default function AccountDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [account, setAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [closeError, setCloseError] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [acc, txs] = await Promise.all([getAccount(id), getTransactions(id)]);
        setAccount(acc);
        setTransactions(txs);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleClose = async () => {
    setClosing(true);
    setCloseError(null);
    try {
      await closeAccount(id);
      navigate('/accounts');
    } catch (err) {
      setCloseError(getErrorMessage(err));
      setClosing(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      <Button variant="text" onClick={() => navigate('/accounts')} sx={{ mb: 2 }}>
        ← Back to Accounts
      </Button>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              {account.account_number}
            </Typography>
            <Typography variant="h5" fontWeight={700} sx={{ mt: 0.5, textTransform: 'capitalize' }}>
              {account.type} Account
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Opened {formatDate(account.created_at)}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="h4" color="warning.main" fontWeight={700}>
              {formatCurrency(account.balance)}
            </Typography>
            <Chip
              label={account.status}
              size="small"
              color={account.status === 'active' ? 'success' : 'error'}
              sx={{ mt: 0.5 }}
            />
          </Box>
        </Box>

        {account.status === 'active' && (
          <>
            <Divider sx={{ my: 2 }} />
            {closeError && <Alert severity="error" sx={{ mb: 1 }}>{closeError}</Alert>}
            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={() => setCloseDialogOpen(true)}
            >
              Close Account
            </Button>
          </>
        )}
      </Paper>

      <Typography variant="h6" fontWeight={600} gutterBottom>
        Transactions
      </Typography>
      <TransactionList transactions={transactions} />

      <Dialog open={closeDialogOpen} onClose={() => setCloseDialogOpen(false)}>
        <DialogTitle>Close Account</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to close account {account.account_number}? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCloseDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleClose} color="error" variant="contained" disabled={closing}>
            {closing ? <CircularProgress size={20} color="inherit" /> : 'Close Account'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
