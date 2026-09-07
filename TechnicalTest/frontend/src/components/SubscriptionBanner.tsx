'use client';

/**
 * SubscriptionBanner component built with Material UI.
 *
 * Rendered within ProductCard when user does not have an active subscription.
 * Provides a call to action to subscribe via Stripe Checkout.
 */

import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import BoltIcon from '@mui/icons-material/Bolt';
import { useLanguage } from '@/context/LanguageContext';
import api from '@/lib/api';
import type { CheckoutResponse } from '@/types';

export function SubscriptionBanner() {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await api.post<CheckoutResponse>('/api/subscription/checkout');
      window.location.href = res.data.url;
    } catch {
      setError(t('errors.generic'));
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ mt: 1 }}>
      <Alert
        severity="warning"
        icon={<LockOutlinedIcon sx={{ color: '#b45309', fontSize: 20 }} />}
        sx={{
          borderRadius: 2,
          bgcolor: '#fffbeb',
          color: '#92400e',
          border: '1px solid #fde68a',
          py: 0.75,
          px: 1.25,
          '& .MuiAlert-message': {
            width: '100%',
            p: 0,
          },
          '& .MuiAlert-icon': {
            mr: 1,
            py: 0.25,
          },
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#78350f', fontSize: '0.78rem', lineHeight: 1.2 }}>
          {t('subscription.required')}
        </Typography>
        <Typography variant="caption" sx={{ display: 'block', color: '#92400e', mt: 0.25, fontSize: '0.7rem', lineHeight: 1.2 }}>
          {t('subscription.description')}
        </Typography>

        {error && (
          <Typography variant="caption" sx={{ color: 'error.main', display: 'block', mt: 0.5 }}>
            {error}
          </Typography>
        )}

        <Button
          variant="contained"
          size="small"
          onClick={handleSubscribe}
          disabled={isLoading}
          startIcon={
            isLoading ? (
              <CircularProgress size={12} color="inherit" />
            ) : (
              <BoltIcon sx={{ fontSize: '1rem !important' }} />
            )
          }
          sx={{
            mt: 1,
            bgcolor: '#b45309',
            color: '#ffffff',
            fontWeight: 600,
            fontSize: '0.72rem',
            py: 0.35,
            px: 1.25,
            borderRadius: 1.5,
            textTransform: 'none',
            '&:hover': {
              bgcolor: '#92400e',
            },
          }}
        >
          {t('subscription.subscribe')}
        </Button>
      </Alert>
    </Box>
  );
}
