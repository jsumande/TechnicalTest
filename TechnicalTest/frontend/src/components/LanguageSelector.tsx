'use client';

/**
 * Language selector dropdown built with Material UI.
 *
 * Renders an accessible MUI Select component with 4 supported language options:
 * English (en), Dutch (nl), German (de), French (fr).
 *
 * Updates LanguageContext on change and persists choice to localStorage.
 */

import React from 'react';
import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import Typography from '@mui/material/Typography';
import { useLanguage } from '@/context/LanguageContext';
import type { Language } from '@/types';

/** Available language options shown in the selector */
const LANGUAGE_OPTIONS: { code: Language; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'nl', label: 'Nederlands', flag: '🇳🇱' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
];

export function LanguageSelector() {
  const { lang, setLang } = useLanguage();

  const handleChange = (e: { target: { value: unknown } }) => {
    setLang(e.target.value as Language);
  };

  return (
    <FormControl size="small" sx={{ minWidth: 140 }}>
      <Select
        value={lang}
        onChange={handleChange}
        displayEmpty
        inputProps={{ 'aria-label': 'Select language' }}
        sx={{
          bgcolor: 'background.paper',
          borderRadius: 2,
          fontSize: '0.875rem',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#e2e8f0',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'primary.main',
          },
        }}
      >
        {LANGUAGE_OPTIONS.map(({ code, label, flag }) => (
          <MenuItem key={code} value={code} sx={{ fontSize: '0.875rem' }}>
            <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography component="span" sx={{ fontSize: '1.1rem' }}>
                {flag}
              </Typography>
              <Typography component="span" sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
                {label}
              </Typography>
            </Box>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
