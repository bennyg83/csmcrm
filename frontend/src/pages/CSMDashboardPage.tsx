import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import GroupWorkIcon from '@mui/icons-material/GroupWork';

/**
 * CSM Dashboard – Phase 1 placeholder.
 * This will host: CSM workload view, touchpoint cadence, renewal pipeline,
 * and (from Accounts/Account detail) quick actions, templates, bulk actions.
 * See docs/mockups/phase1-csm-mockup.html for the visual mockup.
 */
const CSMDashboardPage: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <GroupWorkIcon color="primary" sx={{ fontSize: 32 }} />
        <Typography variant="h5" fontWeight={600}>CSM</Typography>
      </Box>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Customer Success dashboard – Phase 1 content will go here.
      </Typography>
      <Paper sx={{ p: 3, maxWidth: 560 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>Planned sections</Typography>
        <Typography component="ul" variant="body2" sx={{ pl: 2, mb: 2 }}>
          <li>CSM workload view (accounts, at-risk, overdue tasks, renewals per CSM)</li>
          <li>Touchpoint cadence (next touch, overdue/soon badges, filters)</li>
          <li>Renewal pipeline (by month, ARR, health, last contact)</li>
          <li>Quick actions and email/note templates (on Account detail)</li>
          <li>Expanded bulk actions (Reassign CSM, Set health)</li>
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Mockup: <code>docs/mockups/phase1-csm-mockup.html</code> — open that file in a browser to preview Phase 1.
        </Typography>
      </Paper>
    </Box>
  );
};

export default CSMDashboardPage;
