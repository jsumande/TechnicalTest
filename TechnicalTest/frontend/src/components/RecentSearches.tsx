'use client';

/**
 * RecentSearches component built with Material UI.
 *
 * Fetches recent searches and renders them as interactive MUI Chips.
 */

import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import HistoryIcon from '@mui/icons-material/History';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import type { RecentSearch, HistoryResponse } from '@/types';

interface RecentSearchesProps {
  /** Called when the user clicks a history chip */
  onSelectSearch: (query: string) => void;
}

export function RecentSearches({ onSelectSearch }: RecentSearchesProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [searches, setSearches] = useState<RecentSearch[]>([]);

  useEffect(() => {
    if (!user) {
      setSearches([]);
      return;
    }

    api
      .get<HistoryResponse>('/api/search/history')
      .then((res) => setSearches(res.data.searches))
      .catch(() => {
        setSearches([]);
      });
  }, [user]);

  if (!user || searches.length === 0) return null;

  // Deduplicate: show each unique query only once
  const uniqueSearches = searches.filter(
    (s, idx, arr) => arr.findIndex((x) => x.query === s.query) === idx,
  );

  return (
    <Box sx={{ mt: 2 }}>
      <Typography
        variant="caption"
        sx={{
          fontWeight: 700,
          color: 'text.secondary',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          display: 'block',
          mb: 1,
        }}
      >
        {t('search.recentTitle')}
      </Typography>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {uniqueSearches.map((search) => (
          <Chip
            key={search.id}
            icon={<HistoryIcon sx={{ fontSize: '1rem !important' }} />}
            label={search.query}
            onClick={() => onSelectSearch(search.query)}
            variant="outlined"
            size="small"
            sx={{
              borderRadius: 2,
              bgcolor: 'background.paper',
              borderColor: '#e2e8f0',
              fontWeight: 500,
              '&:hover': {
                bgcolor: 'primary.50',
                borderColor: 'primary.light',
                color: 'primary.main',
              },
            }}
          />
        ))}
      </Box>
    </Box>
  );
}
