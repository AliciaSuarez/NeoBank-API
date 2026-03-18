import { Card, CardActionArea, CardContent, Chip, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../utils/formatCurrency';

/**
 * Displays a summary card for a bank account.
 * @param {{ account: { id: string, account_number: string, type: string, balance: number, currency: string, status: string } }} props
 */
export default function AccountCard({ account }) {
  const navigate = useNavigate();

  return (
    <Card
      sx={{
        height: '100%',
        border: account.status === 'closed' ? '1px solid' : 'none',
        borderColor: 'error.main',
        opacity: account.status === 'closed' ? 0.7 : 1,
      }}
    >
      <CardActionArea
        onClick={() => navigate(`/accounts/${account.id}`)}
        sx={{ height: '100%' }}
      >
        <CardContent>
          <Typography variant="caption" color="text.secondary" display="block">
            {account.account_number}
          </Typography>
          <Typography variant="h6" sx={{ mt: 0.5, textTransform: 'capitalize' }}>
            {account.type}
          </Typography>
          <Typography variant="h5" color="warning.main" sx={{ mt: 1, fontWeight: 700 }}>
            {formatCurrency(account.balance)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {account.currency}
          </Typography>
          <Chip
            label={account.status}
            size="small"
            color={account.status === 'active' ? 'success' : 'error'}
            sx={{ mt: 1.5, display: 'block', width: 'fit-content' }}
          />
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
