'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import CloseIcon from '@mui/icons-material/Close';
import BrokenImageIcon from '@mui/icons-material/BrokenImage';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import VerifiedIcon from '@mui/icons-material/Verified';
import { useLanguage } from '@/context/LanguageContext';
import { NutritionPanel } from './NutritionPanel';
import { SubscriptionBanner } from './SubscriptionBanner';
import type { Product } from '@/types';

interface ProductDetailModalProps {
  product: Product | null;
  open: boolean;
  onClose: () => void;
  isSubscribed: boolean;
}

export function ProductDetailModal({
  product,
  open,
  onClose,
  isSubscribed,
}: ProductDetailModalProps) {
  const { t } = useLanguage();
  const [imgError, setImgError] = useState(false);

  if (!product) return null;

  const { name, brand, imageUrl, categories, nutrition, id } = product;

  // Split categories for chip rendering
  const categoryList = categories
    ? categories
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean)
    : [];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: 4,
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        },
      }}
    >
      <DialogTitle
        sx={{
          m: 0,
          p: 2.5,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #f1f5f9',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            size="small"
            label="Open Food Facts"
            icon={<VerifiedIcon sx={{ fontSize: '14px !important', color: '#16a34a' }} />}
            sx={{
              fontWeight: 600,
              fontSize: '0.75rem',
              bgcolor: '#f0fdf4',
              color: '#15803d',
              border: '1px solid #bbf7d0',
            }}
          />
          {id && (
            <Chip
              size="small"
              icon={<QrCode2Icon sx={{ fontSize: '14px !important' }} />}
              label={id}
              variant="outlined"
              sx={{ fontSize: '0.72rem', color: 'text.secondary' }}
            />
          )}
        </Box>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            color: (theme) => theme.palette.grey[500],
            '&:hover': { bgcolor: '#f1f5f9' },
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: { xs: 2.5, md: 4 } }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '300px 1fr' },
            gap: 4,
          }}
        >
          {/* Left Column: Large Product Image Media Container */}
          <Box>
            <Paper
              elevation={0}
              sx={{
                position: 'relative',
                height: 280,
                borderRadius: 3,
                bgcolor: '#f8fafc',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 3,
                overflow: 'hidden',
              }}
            >
              {imageUrl && !imgError ? (
                <Image
                  src={imageUrl}
                  alt={name}
                  fill
                  sizes="300px"
                  style={{ objectFit: 'contain', padding: '16px' }}
                  onError={() => setImgError(true)}
                />
              ) : (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 1,
                    color: '#94a3b8',
                  }}
                >
                  <BrokenImageIcon sx={{ fontSize: 56 }} />
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {t('product.noImage')}
                  </Typography>
                </Box>
              )}
            </Paper>

            {/* Brand Card */}
            <Box
              sx={{
                mt: 2,
                p: 1.5,
                bgcolor: '#f8fafc',
                borderRadius: 2,
                border: '1px solid #f1f5f9',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase' }}>
                {t('product.brand')}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                {brand ?? t('product.unknownBrand')}
              </Typography>
            </Box>
          </Box>

          {/* Right Column: Title, Categories, and Nutrition */}
          <Box>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 800, mb: 1, color: '#0f172a', lineHeight: 1.25 }}>
              {name}
            </Typography>

            {/* Categories Tag Chips */}
            {categoryList.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 3, mt: 1.5 }}>
                {categoryList.map((cat, idx) => (
                  <Chip
                    key={idx}
                    label={cat}
                    size="small"
                    sx={{
                      fontSize: '0.72rem',
                      fontWeight: 500,
                      bgcolor: '#f1f5f9',
                      color: '#475569',
                      border: '1px solid #e2e8f0',
                    }}
                  />
                ))}
              </Box>
            )}

            <Divider sx={{ my: 2, borderColor: '#f1f5f9' }} />

            {/* Nutrition facts section */}
            <Box>
              {isSubscribed ? (
                <NutritionPanel nutrition={nutrition} />
              ) : (
                <Box sx={{ mt: 1 }}>
                  <SubscriptionBanner />
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
