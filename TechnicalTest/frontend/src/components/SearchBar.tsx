'use client';

/**
 * SearchBar component built with Material UI.
 *
 * Provides a text search field with integrated loading indicator
 * and search button.
 */

import React, { useState } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';
import SearchIcon from '@mui/icons-material/Search';
import { useLanguage } from '@/context/LanguageContext';

interface SearchBarProps {
  /** Called when the user submits a search */
  onSearch: (query: string) => void;
  /** Whether a search is currently in progress */
  isLoading?: boolean;
}

export function SearchBar({ onSearch, isLoading = false }: SearchBarProps) {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');

  const handleSubmit = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed.length > 0 && !isLoading) {
      onSearch(trimmed);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'stretch' }}>
        <TextField
          fullWidth
          value={query}
          onChange={(e: { target: { value: string } }) => setQuery(e.target.value)}
          placeholder={t('search.placeholder')}
          disabled={isLoading}
          variant="outlined"
          size="medium"
          autoComplete="off"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
              inputProps: {
                'aria-label': t('search.placeholder'),
              },
              sx: {
                bgcolor: 'background.paper',
                borderRadius: 3,
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#e2e8f0',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'primary.light',
                },
              },
            },
          }}
        />

        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={isLoading || query.trim().length === 0}
          sx={{
            px: { xs: 2.5, sm: 4 },
            borderRadius: 3,
            whiteSpace: 'nowrap',
            fontSize: '0.95rem',
          }}
          startIcon={
            isLoading ? (
              <CircularProgress size={18} color="inherit" />
            ) : undefined
          }
        >
          {isLoading ? t('search.loading') : t('search.button')}
        </Button>
      </Box>
    </Box>
  );
}
