'use client';

/**
 * Subscription management page built with Material UI.
 * Wrapped in React Suspense boundary for Next.js 14 CSR useSearchParams compliance.
 */

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Container from '@mui/material/Container';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import CardMembershipIcon from '@mui/icons-material/CardMembership';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SettingsIcon from '@mui/icons-material/Settings';
import ShoppingCartCheckoutIcon from '@mui/icons-material/ShoppingCartCheckout';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import api from '@/lib/api';
import type { CheckoutResponse, PortalResponse } from '@/types';

function SubscriptionContent() {
  const { user, isSubscribed, isLoading, refreshUser } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();

  const isSuccess = searchParams.get('success') === 'true';
  const isCanceled = searchParams.get('canceled') === 'true';

  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (isSuccess) {
      // Sync subscription with Stripe & refresh auth context
      api.post('/api/subscription/sync').finally(() => {
        refreshUser();
      });
      const timer = setTimeout(() => {
        api.post('/api/subscription/sync').finally(() => {
          refreshUser();
        });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, refreshUser]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [isLoading, user, router]);

  const handleSubscribe = async () => {
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await api.post<CheckoutResponse>('/api/subscription/checkout');
      window.location.href = res.data.url;
    } catch {
      setActionError(t('errors.generic'));
      setActionLoading(false);
    }
  };

  const handleManagePortal = async () => {
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await api.post<PortalResponse>('/api/subscription/portal');
      window.location.href = res.data.url;
    } catch {
      setActionError(t('errors.generic'));
      setActionLoading(false);
    }
  };

  if (isLoading || !user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      {isSuccess && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            {t('subscription.successTitle')}
          </Typography>
          <Typography variant="body2">{t('subscription.successMessage')}</Typography>
        </Alert>
      )}

      {isCanceled && (
        <Alert severity="warning" sx={{ mb: 3, borderRadius: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            {t('subscription.canceledTitle')}
          </Typography>
          <Typography variant="body2">{t('subscription.canceledMessage')}</Typography>
        </Alert>
      )}

      <Card sx={{ p: 2, borderRadius: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <CardMembershipIcon color="primary" sx={{ fontSize: 32 }} />
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
              {t('subscription.pageTitle')}
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4 }}>
            {t('subscription.pageDescription')}
          </Typography>

          {/* Subscription Status */}
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="caption"
              sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', display: 'block', mb: 1 }}
            >
              {t('subscription.status')}
            </Typography>
            <Chip
              label={t(`subscription.${user.subscriptionStatus}`)}
              color={isSubscribed ? 'success' : 'default'}
              variant={isSubscribed ? 'filled' : 'outlined'}
              sx={{ fontWeight: 700, px: 1, textTransform: 'capitalize' }}
            />
          </Box>

          {/* Account Detail */}
          <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #f1f5f9', mb: 3 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              <Typography component="span" variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                Account:
              </Typography>{' '}
              {user.email}
            </Typography>
          </Box>

          {actionError && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {actionError}
            </Alert>
          )}

          {/* Actions */}
          {isSubscribed ? (
            <Box>
              <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
                🎉 {t('subscription.successMessage')}
              </Alert>
              <Button
                variant="contained"
                color="inherit"
                fullWidth
                size="large"
                disabled={actionLoading}
                onClick={handleManagePortal}
                startIcon={
                  actionLoading ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <SettingsIcon />
                  )
                }
                sx={{
                  bgcolor: '#1e293b',
                  color: '#ffffff',
                  py: 1.3,
                  borderRadius: 2.5,
                  '&:hover': {
                    bgcolor: '#0f172a',
                  },
                }}
              >
                {actionLoading ? '...' : t('subscription.manage')}
              </Button>
            </Box>
          ) : (
            <Box>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                {t('subscription.noSubscription')}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.primary', mb: 3 }}>
                {t('subscription.description')}
              </Typography>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                size="large"
                disabled={actionLoading}
                onClick={handleSubscribe}
                startIcon={
                  actionLoading ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <ShoppingCartCheckoutIcon />
                  )
                }
                sx={{ py: 1.3, borderRadius: 2.5 }}
              >
                {actionLoading ? '...' : t('subscription.subscribe')}
              </Button>
            </Box>
          )}

          <Button
            variant="text"
            color="inherit"
            fullWidth
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push('/')}
            sx={{ mt: 2, color: 'text.secondary' }}
          >
            ← Back to search
          </Button>
        </CardContent>
      </Card>
    </Container>
  );
}

export default function SubscriptionPage() {
  return (
    <Suspense
      fallback={
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress />
        </Box>
      }
    >
      <SubscriptionContent />
    </Suspense>
  );
}
