import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from '@mui/material';
import { useState } from 'react';
import { formatCurrency } from '../utils/formatCurrency';

/**
 * Controlled form for transferring money between accounts.
 * @param {{
 *   accounts: Account[],
 *   onSubmit: (fromId: string, toId: string, amount: number) => Promise<void>,
 *   loading: boolean,
 *   error: string | null,
 * }} props
 */
export default function TransferForm({ accounts, onSubmit, loading, error }) {
  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');
  const [amount, setAmount] = useState('');

  const activeAccounts = accounts.filter((a) => a.status === 'active');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!fromId || !toId || !amount) return;
    onSubmit(fromId, toId, parseFloat(amount));
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {error && <Alert severity="error">{error}</Alert>}

      <FormControl fullWidth required>
        <InputLabel>From Account</InputLabel>
        <Select
          value={fromId}
          label="From Account"
          onChange={(e) => setFromId(e.target.value)}
        >
          {activeAccounts.map((a) => (
            <MenuItem key={a.id} value={a.id} disabled={a.id === toId}>
              {a.account_number} — {formatCurrency(a.balance)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth required>
        <InputLabel>To Account</InputLabel>
        <Select
          value={toId}
          label="To Account"
          onChange={(e) => setToId(e.target.value)}
        >
          {activeAccounts.map((a) => (
            <MenuItem key={a.id} value={a.id} disabled={a.id === fromId}>
              {a.account_number} — {formatCurrency(a.balance)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <TextField
        label="Amount (USD)"
        type="number"
        inputProps={{ min: 0.01, step: 0.01 }}
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        required
        fullWidth
      />

      <Button
        type="submit"
        variant="contained"
        disabled={loading || !fromId || !toId || !amount || fromId === toId}
        sx={{ alignSelf: 'flex-start' }}
      >
        {loading ? <CircularProgress size={20} color="inherit" /> : 'Transfer'}
      </Button>
    </Box>
  );
}
