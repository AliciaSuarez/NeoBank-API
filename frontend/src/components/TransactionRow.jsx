import { TableCell, TableRow, Typography } from '@mui/material';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';

/**
 * A single row in the transactions table.
 * @param {{ transaction: { id: string, type: string, amount: number, description: string, created_at: string }, hideDate: boolean }} props
 */
export default function TransactionRow({ transaction, hideDate }) {
  const isCredit = transaction.type === 'credit';

  return (
    <TableRow hover>
      <TableCell>
        <Typography variant="body2">{transaction.description}</Typography>
      </TableCell>
      <TableCell>
        <Typography
          variant="body2"
          color={isCredit ? 'success.main' : 'error.main'}
          fontWeight={600}
        >
          {isCredit ? '+' : '-'}{formatCurrency(transaction.amount)}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography
          variant="caption"
          color={isCredit ? 'success.main' : 'error.main'}
          sx={{ textTransform: 'capitalize' }}
        >
          {transaction.type}
        </Typography>
      </TableCell>
      {!hideDate && (
        <TableCell>
          <Typography variant="caption" color="text.secondary">
            {formatDate(transaction.created_at)}
          </Typography>
        </TableCell>
      )}
    </TableRow>
  );
}
