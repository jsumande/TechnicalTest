'use client';

/**
 * NutritionPanel component built with Material UI.
 *
 * Displays a per-100g nutritional facts breakdown in a clean MUI Table.
 * Rendered when user has an active Stripe subscription.
 */

import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { useLanguage } from '@/context/LanguageContext';
import type { NutritionData } from '@/types';

interface NutritionPanelProps {
  nutrition: NutritionData | null;
  compact?: boolean;
}

interface NutrientRow {
  labelKey: string;
  value: number | null;
  unit: 'kcal' | 'g';
  indent?: boolean;
}

export function NutritionPanel({ nutrition, compact = false }: NutritionPanelProps) {
  const { t } = useLanguage();

  if (!nutrition) {
    return (
      <Typography variant="caption" sx={{ fontStyle: 'italic', color: 'text.secondary', mt: 0.5, display: 'block' }}>
        {t('nutrition.notAvailable')}
      </Typography>
    );
  }

  const rows: NutrientRow[] = [
    { labelKey: 'nutrition.energy',        value: nutrition.energy_kcal,    unit: 'kcal' },
    { labelKey: 'nutrition.fat',           value: nutrition.fat,            unit: 'g' },
    { labelKey: 'nutrition.saturatedFat',  value: nutrition.saturated_fat,  unit: 'g', indent: true },
    { labelKey: 'nutrition.carbohydrates', value: nutrition.carbohydrates,  unit: 'g' },
    { labelKey: 'nutrition.sugars',        value: nutrition.sugars,         unit: 'g', indent: true },
    { labelKey: 'nutrition.fiber',         value: nutrition.fiber,          unit: 'g' },
    { labelKey: 'nutrition.proteins',      value: nutrition.proteins,       unit: 'g' },
    { labelKey: 'nutrition.salt',          value: nutrition.salt,           unit: 'g' },
  ];

  const fmt = (val: number | null): string => (val !== null ? val.toFixed(1) : '—');

  return (
    <Box sx={{ mt: compact ? 1 : 1.5 }}>
      <Paper
        elevation={0}
        sx={{
          p: compact ? 1 : 1.5,
          bgcolor: '#f8fafc',
          borderRadius: 2,
          border: '1px solid #f1f5f9',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
          <Typography
            variant="caption"
            sx={{ fontWeight: 700, textTransform: 'uppercase', color: 'text.primary', letterSpacing: '0.04em', fontSize: '0.7rem' }}
          >
            {t('nutrition.title')}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.68rem' }}>
            {t('nutrition.per100g')}
          </Typography>
        </Box>

        <TableContainer>
          <Table size="small" aria-label="nutrition facts table">
            <TableBody>
              {rows.map(({ labelKey, value, unit, indent }) => (
                <TableRow key={labelKey} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell
                    component="th"
                    scope="row"
                    sx={{
                      py: compact ? 0.2 : 0.4,
                      px: 0.5,
                      borderBottom: '1px solid #f1f5f9',
                      fontSize: compact ? '0.7rem' : '0.75rem',
                      fontWeight: indent ? 400 : 600,
                      color: indent ? 'text.secondary' : 'text.primary',
                      pl: indent ? (compact ? 1.2 : 1.75) : 0.5,
                    }}
                  >
                    {t(labelKey)}
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      py: compact ? 0.2 : 0.4,
                      px: 0.5,
                      borderBottom: '1px solid #f1f5f9',
                      fontSize: compact ? '0.7rem' : '0.75rem',
                      fontFamily: 'monospace',
                      fontWeight: 600,
                    }}
                  >
                    {fmt(value)}{' '}
                    <Typography component="span" variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
                      {t(`nutrition.unit.${unit}`)}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
