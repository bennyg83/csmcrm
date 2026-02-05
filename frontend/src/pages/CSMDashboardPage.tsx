import React, { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  ToggleButtonGroup,
  ToggleButton,
  Link,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import GroupWorkIcon from '@mui/icons-material/GroupWork';
import CircleIcon from '@mui/icons-material/Circle';
import { apiService } from '../services/api';
import { Account, CSMWorkloadItem } from '../types';

type TouchpointFilter = 'all' | 'overdue' | 'next7' | 'next30';
type RenewalRange = '90d' | string; // '90d' or 'YYYY-MM'

function getHealthColor(health: number): 'success.main' | 'warning.main' | 'error.main' {
  if (health >= 70) return 'success.main';
  if (health >= 40) return 'warning.main';
  return 'error.main';
}

function formatDate(s: string | undefined): string {
  if (!s) return '—';
  const d = new Date(s);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function nextTouchBadge(nextScheduled: string | undefined): { label: string; severity: 'error' | 'warning' | 'success' } {
  if (!nextScheduled) return { label: 'No date', severity: 'warning' };
  const next = new Date(nextScheduled);
  const now = new Date();
  const diffDays = Math.ceil((next.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
  if (diffDays < 0) return { label: `${Math.abs(diffDays)} day(s) overdue`, severity: 'error' };
  if (diffDays <= 7) return { label: `In ${diffDays} day(s)`, severity: 'warning' };
  return { label: `In ${diffDays} day(s)`, severity: 'success' };
}

const CSMDashboardPage: React.FC = () => {
  const [workload, setWorkload] = useState<CSMWorkloadItem[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [touchpointFilter, setTouchpointFilter] = useState<TouchpointFilter>('all');
  const [renewalRange, setRenewalRange] = useState<RenewalRange>('90d');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([apiService.getCSMWorkload(), apiService.getAccounts()])
      .then(([w, a]) => {
        if (!cancelled) {
          setWorkload(w);
          setAccounts(Array.isArray(a) ? a : []);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e?.message || 'Failed to load CSM data');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const touchpointFiltered = useMemo(() => {
    const now = new Date();
    const next7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const next30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return accounts.filter((acc) => {
      const next = acc.nextScheduled ? new Date(acc.nextScheduled) : null;
      if (!next) return touchpointFilter === 'all';
      if (touchpointFilter === 'all') return true;
      if (touchpointFilter === 'overdue') return next < now;
      if (touchpointFilter === 'next7') return next >= now && next <= next7;
      if (touchpointFilter === 'next30') return next >= now && next <= next30;
      return true;
    });
  }, [accounts, touchpointFilter]);

  const renewalMonths = useMemo(() => {
    const months: string[] = ['90d'];
    const now = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    return months;
  }, []);

  const renewalFiltered = useMemo(() => {
    if (renewalRange === '90d') {
      const now = new Date();
      const end = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
      return accounts.filter((acc) => {
        const r = acc.renewalDate ? new Date(acc.renewalDate) : null;
        return r && r >= now && r <= end;
      });
    }
    const [y, m] = renewalRange.split('-').map(Number);
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0);
    return accounts.filter((acc) => {
      const r = acc.renewalDate ? new Date(acc.renewalDate) : null;
      return r && r >= start && r <= end;
    });
  }, [accounts, renewalRange]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 320 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <GroupWorkIcon color="primary" sx={{ fontSize: 32 }} />
        <Typography variant="h5" fontWeight={600}>CSM</Typography>
      </Box>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Customer Success dashboard – workload, touchpoint cadence, renewal pipeline.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* 1. CSM Workload */}
      <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 3, mb: 1 }}>CSM Workload</Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 2, mb: 3 }}>
        {workload.map((row) => (
          <Card key={row.customerSuccessManager} variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>{row.customerSuccessManager}</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Accounts</Typography>
                  <Typography variant="body2" fontWeight={600}>{row.accounts}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">At-risk</Typography>
                  <Typography variant="body2" fontWeight={600} color="warning.main">{row.atRisk}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Overdue tasks</Typography>
                  <Typography variant="body2" fontWeight={600} color="error.main">{row.overdueTasks}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Renewals (90d)</Typography>
                  <Typography variant="body2" fontWeight={600}>{row.renewals90d}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}
        {workload.length === 0 && (
          <Typography variant="body2" color="text.secondary">No CSM workload data. Assign Customer Success Manager on accounts.</Typography>
        )}
      </Box>

      {/* 2. Touchpoint cadence */}
      <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 3, mb: 1 }}>Touchpoint cadence</Typography>
      <Paper variant="outlined" sx={{ mb: 3 }}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <ToggleButtonGroup
            size="small"
            value={touchpointFilter}
            exclusive
            onChange={(_, v) => v != null && setTouchpointFilter(v)}
          >
            <ToggleButton value="all">All</ToggleButton>
            <ToggleButton value="overdue">Overdue touch</ToggleButton>
            <ToggleButton value="next7">Next 7 days</ToggleButton>
            <ToggleButton value="next30">Next 30 days</ToggleButton>
          </ToggleButtonGroup>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Account</TableCell>
                <TableCell>CSM</TableCell>
                <TableCell>Health</TableCell>
                <TableCell>Next touch</TableCell>
                <TableCell>Last touch</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {touchpointFiltered.slice(0, 50).map((acc) => {
                const badge = nextTouchBadge(acc.nextScheduled);
                return (
                  <TableRow key={acc.id} hover>
                    <TableCell>
                      <Link component={RouterLink} to={`/accounts/${acc.id}`} underline="hover">
                        {acc.name}
                      </Link>
                    </TableCell>
                    <TableCell>{acc.customerSuccessManager || '—'}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CircleIcon sx={{ fontSize: 10, color: getHealthColor(acc.health) }} />
                        <Typography variant="body2" fontWeight={600} sx={{ color: getHealthColor(acc.health) }}>
                          {acc.health}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip size="small" label={badge.label} color={badge.severity} variant="outlined" />
                    </TableCell>
                    <TableCell>{formatDate(acc.lastTouchpoint)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        {touchpointFiltered.length === 0 && (
          <Box sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary">No accounts match the selected filter.</Typography>
          </Box>
        )}
      </Paper>

      {/* 3. Renewal pipeline */}
      <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 3, mb: 1 }}>Renewal pipeline</Typography>
      <Box sx={{ mb: 1 }}>
        <ToggleButtonGroup
          size="small"
          value={renewalRange}
          exclusive
          onChange={(_, v) => v != null && setRenewalRange(v)}
        >
          <ToggleButton value="90d">Next 90 days</ToggleButton>
          {renewalMonths.slice(1).map((m) => (
            <ToggleButton key={m} value={m}>
              {(() => {
                const [y, mo] = m.split('-').map(Number);
                const d = new Date(y, mo - 1, 1);
                return d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
              })()}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 2, mb: 3 }}>
        {renewalFiltered.slice(0, 24).map((acc) => (
          <Card key={acc.id} variant="outlined" sx={{ textDecoration: 'none' }} component={RouterLink} to={`/accounts/${acc.id}`}>
            <CardContent>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>{acc.name}</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption" color="text.secondary">ARR</Typography>
                <Typography variant="body2">${Number(acc.arr || 0).toLocaleString()}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption" color="text.secondary">Health</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <CircleIcon sx={{ fontSize: 8, color: getHealthColor(acc.health) }} />
                  <Typography variant="body2" sx={{ color: getHealthColor(acc.health) }}>{acc.health}%</Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption" color="text.secondary">Last contact</Typography>
                <Typography variant="body2">{formatDate(acc.lastTouchpoint)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" color="text.secondary">Renewal</Typography>
                <Typography variant="body2">{formatDate(acc.renewalDate)}</Typography>
              </Box>
            </CardContent>
          </Card>
        ))}
        {renewalFiltered.length === 0 && (
          <Typography variant="body2" color="text.secondary">No renewals in the selected period.</Typography>
        )}
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        Quick actions and email/note templates are on Account detail. Expanded bulk actions (Reassign CSM, Set health) are on the Accounts page when rows are selected.
      </Typography>
    </Box>
  );
};

export default CSMDashboardPage;
