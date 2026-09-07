'use client';

/**
 * Navbar component built with Material UI.
 *
 * Renders the top navigation bar with:
 *  - App title and subtitle (translated)
 *  - Language selector dropdown
 *  - Authentication actions (Login button, Logout button, Subscription badge)
 */

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Chip from '@mui/material/Chip';
import LogoutIcon from '@mui/icons-material/Logout';
import LoginIcon from '@mui/icons-material/Login';
import CardMembershipIcon from '@mui/icons-material/CardMembership';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { LanguageSelector } from './LanguageSelector';

export function Navbar() {
  const { user, isSubscribed, logout, isLoading } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <AppBar position="sticky" elevation={0}>
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ justifyContent: 'space-between', py: 1 }}>
          {/* Logo & App Title */}
          <Box
            component={Link}
            href="/"
            sx={{
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none',
              color: 'inherit',
              gap: 1.5,
            }}
          >
            <Typography variant="h5" component="span" sx={{ fontSize: '1.75rem' }}>
              🥦
            </Typography>
            <Box>
              <Typography
                variant="h6"
                component="div"
                sx={{
                  fontWeight: 700,
                  color: 'primary.main',
                  lineHeight: 1.2,
                }}
              >
                {t('nav.title')}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  display: { xs: 'none', sm: 'block' },
                }}
              >
                {t('nav.subtitle')}
              </Typography>
            </Box>
          </Box>

          {/* Right Actions: Language Selector + Auth Actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <LanguageSelector />

            {!isLoading && (
              <>
                {user ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    {/* Subscription status badge */}
                    <Chip
                      component={Link}
                      href="/subscription"
                      clickable
                      icon={<CardMembershipIcon sx={{ fontSize: '1rem !important' }} />}
                      label={t(`subscription.${user.subscriptionStatus}`)}
                      color={isSubscribed ? 'success' : 'default'}
                      variant={isSubscribed ? 'filled' : 'outlined'}
                      size="small"
                      sx={{
                        fontWeight: 600,
                        textTransform: 'capitalize',
                        display: { xs: 'none', sm: 'inline-flex' },
                      }}
                    />

                    {/* Logout Button */}
                    <Button
                      variant="outlined"
                      color="inherit"
                      size="small"
                      startIcon={<LogoutIcon />}
                      onClick={handleLogout}
                      sx={{
                        color: 'text.secondary',
                        borderColor: '#e2e8f0',
                        '&:hover': {
                          color: 'error.main',
                          borderColor: 'error.light',
                          bgcolor: 'error.50',
                        },
                      }}
                    >
                      {t('nav.logout')}
                    </Button>
                  </Box>
                ) : (
                  <Button
                    component={Link}
                    href="/login"
                    variant="contained"
                    color="primary"
                    size="small"
                    startIcon={<LoginIcon />}
                  >
                    {t('nav.login')}
                  </Button>
                )}
              </>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
