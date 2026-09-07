'use client';

/**
 * Login page built with Material UI.
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Container from '@mui/material/Container';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import LockPersonIcon from '@mui/icons-material/LockPerson';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

export default function LoginPage() {
  const { login, user, isLoading } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  const [email, setEmail] = useState('demo@example.com');
  const [password, setPassword] = useState('password');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isLoading && user) {
    router.replace('/');
    return null;
  }

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await login(email, password);
      router.replace('/');
    } catch {
      setError(t('login.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxWidth="xs" sx={{ py: 10 }}>
      <Card sx={{ p: 2, borderRadius: 4 }}>
        <CardContent>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h2" sx={{ fontSize: '3.5rem', mb: 1 }}>
              🥦
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
              {t('login.title')}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {t('login.subtitle')}
            </Typography>
          </Box>

          {/* Demo account helper notice */}
          <Alert
            severity="info"
            icon={<InfoOutlinedIcon />}
            sx={{
              mb: 3,
              borderRadius: 2,
              '& .MuiAlert-message': { width: '100%' },
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.8rem' }}>
              {t('login.demoNote')}
            </Typography>
            <Typography variant="caption" sx={{ fontFamily: 'monospace', display: 'block', mt: 0.5 }}>
              {t('login.demoEmail')} / {t('login.demoPassword')}
            </Typography>
          </Alert>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              label={t('login.email')}
              type="email"
              value={email}
              onChange={(e: { target: { value: string } }) => setEmail(e.target.value)}
              required
              fullWidth
              autoComplete="email"
              disabled={isSubmitting}
            />

            <TextField
              label={t('login.password')}
              type="password"
              value={password}
              onChange={(e: { target: { value: string } }) => setPassword(e.target.value)}
              required
              fullWidth
              autoComplete="current-password"
              disabled={isSubmitting}
            />

            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              fullWidth
              disabled={isSubmitting}
              startIcon={
                isSubmitting ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  <LockPersonIcon />
                )
              }
              sx={{ py: 1.2, mt: 1, borderRadius: 2.5 }}
            >
              {isSubmitting ? t('login.loggingIn') : t('login.button')}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}
