import { Box, Card, CardContent, Divider, Grid, Typography } from '@mui/material';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';

/**
 * Displays a summary of a monthly bank statement.
 * @param {{ statement: { id: string, period_start: string, period_end: string, opening_balance: number, closing_balance: number, total_credits: number, total_debits: number, generated_at: string } }} props
 */
export default function StatementSummary({ statement }) {
  return (
    <Card>
      <CardContent>
        <Typography variant="subtitle1" fontWeight={600}>
          {formatDate(statement.period_start)} — {formatDate(statement.period_end)}
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
          Generated {formatDate(statement.generated_at)}
        </Typography>

        <Divider sx={{ mb: 2 }} />

        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="text.secondary">Opening Balance</Typography>
            <Typography variant="body1" fontWeight={600}>
              {formatCurrency(statement.opening_balance)}
            </Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="text.secondary">Closing Balance</Typography>
            <Typography variant="body1" fontWeight={600}>
              {formatCurrency(statement.closing_balance)}
            </Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="text.secondary">Total Credits</Typography>
            <Typography variant="body1" color="success.main" fontWeight={600}>
              +{formatCurrency(statement.total_credits)}
            </Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="text.secondary">Total Debits</Typography>
            <Typography variant="body1" color="error.main" fontWeight={600}>
              -{formatCurrency(statement.total_debits)}
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
