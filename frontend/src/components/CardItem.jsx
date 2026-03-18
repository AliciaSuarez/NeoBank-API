import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { formatCurrency } from '../utils/formatCurrency';

/**
 * Displays a single credit card with block/unblock/pay actions.
 * @param {{
 *   card: { id: string, last_four: string, type: string, status: string, credit_limit: number, current_balance: number, expiry_date: string },
 *   onBlock: (cardId: string) => Promise<void>,
 *   onUnblock: (cardId: string) => Promise<void>,
 *   onPay: (cardId: string, amount: number) => Promise<void>,
 * }} props
 */
export default function CardItem({ card, onBlock, onUnblock, onPay }) {
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [payAmount, setPayAmount] = useState('');

  const statusColor = {
    active: 'success',
    blocked: 'error',
    cancelled: 'default',
  }[card.status] ?? 'default';

  const handlePay = () => {
    onPay(card.id, parseFloat(payAmount));
    setPayDialogOpen(false);
    setPayAmount('');
  };

  return (
    <>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                CREDIT •••• {card.last_four}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Expires {card.expiry_date}
              </Typography>
            </Box>
            <Chip label={card.status} size="small" color={statusColor} />
          </Box>

          <Box sx={{ mt: 2, display: 'flex', gap: 4 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Balance
              </Typography>
              <Typography variant="h6" color="error.main" fontWeight={700}>
                {formatCurrency(card.current_balance)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Credit Limit
              </Typography>
              <Typography variant="h6" fontWeight={700}>
                {formatCurrency(card.credit_limit)}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {card.status === 'active' && (
              <>
                <Button size="small" variant="outlined" color="error" onClick={() => onBlock(card.id)}>
                  Block
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="primary"
                  onClick={() => setPayDialogOpen(true)}
                  disabled={card.current_balance <= 0}
                >
                  Pay Balance
                </Button>
              </>
            )}
            {card.status === 'blocked' && (
              <Button size="small" variant="outlined" color="success" onClick={() => onUnblock(card.id)}>
                Unblock
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>

      <Dialog open={payDialogOpen} onClose={() => setPayDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Pay Card Balance</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Outstanding balance: {formatCurrency(card.current_balance)}
          </Typography>
          <TextField
            label="Amount to Pay (USD)"
            type="number"
            inputProps={{ min: 0.01, step: 0.01, max: card.current_balance }}
            value={payAmount}
            onChange={(e) => setPayAmount(e.target.value)}
            fullWidth
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPayDialogOpen(false)}>Cancel</Button>
          <Button onClick={handlePay} variant="contained" disabled={!payAmount || parseFloat(payAmount) <= 0}>
            Confirm Payment
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
