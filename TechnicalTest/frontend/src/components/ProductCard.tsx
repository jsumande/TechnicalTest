'use client';

/**
 * ProductCard component built with Material UI.
 *
 * Displays food product image, name, brand, category metadata,
 * and subscription-gated nutrition panel in Grid or List layout.
 */

import React, { useState } from 'react';
import Image from 'next/image';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import BrokenImageIcon from '@mui/icons-material/BrokenImage';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import LocalFireDepartmentOutlinedIcon from '@mui/icons-material/LocalFireDepartmentOutlined';
import { useLanguage } from '@/context/LanguageContext';
import { NutritionPanel } from './NutritionPanel';
import { SubscriptionBanner } from './SubscriptionBanner';
import type { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  isSubscribed: boolean;
  viewMode?: 'grid' | 'list';
  onQuickView?: (product: Product) => void;
}

export function ProductCard({
  product,
  isSubscribed,
  viewMode = 'grid',
  onQuickView,
}: ProductCardProps) {
  const { t } = useLanguage();
  const [imageError, setImageError] = useState(false);

  const { name, brand, imageUrl, categories, nutrition } = product;

  // List View Layout
  if (viewMode === 'list') {
    return (
      <Card
        component="article"
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          borderRadius: 3,
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.04)',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
          width: '100%',
          minWidth: 0,
          boxSizing: 'border-box',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.08)',
            borderColor: '#cbd5e1',
          },
        }}
      >
        {/* Media Box */}
        <Box
          sx={{
            position: 'relative',
            width: { xs: '100%', md: 160 },
            height: { xs: 130, md: 'auto' },
            minHeight: { md: 150 },
            bgcolor: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 1,
            borderRight: { md: '1px solid #f1f5f9' },
            borderBottom: { xs: '1px solid #f1f5f9', md: 'none' },
            flexShrink: 0,
            overflow: 'hidden',
          }}
        >
          {imageUrl && !imageError ? (
            <Image
              src={imageUrl}
              alt={name}
              fill
              sizes="(max-width: 768px) 100vw, 160px"
              style={{ objectFit: 'contain', padding: '6px' }}
              onError={() => setImageError(true)}
            />
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#cbd5e1', gap: 0.5 }}>
              <BrokenImageIcon sx={{ fontSize: 32 }} />
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.68rem' }}>
                {t('product.noImage')}
              </Typography>
            </Box>
          )}

          {/* Calorie Tag */}
          {nutrition?.energy_kcal != null && (
            <Chip
              size="small"
              icon={<LocalFireDepartmentOutlinedIcon sx={{ fontSize: '11px !important', color: '#ea580c' }} />}
              label={`${Math.round(nutrition.energy_kcal)} kcal`}
              sx={{
                position: 'absolute',
                top: 6,
                left: 6,
                bgcolor: 'rgba(255, 255, 255, 0.94)',
                backdropFilter: 'blur(4px)',
                fontWeight: 700,
                fontSize: '0.65rem',
                color: '#9a3412',
                border: '1px solid #fed7aa',
                height: 20,
              }}
            />
          )}
        </Box>

        {/* Content Box */}
        <CardContent sx={{ flexGrow: 1, p: 2, display: 'flex', flexDirection: 'column', minWidth: 0, width: '100%', boxSizing: 'border-box' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1, minWidth: 0 }}>
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              {/* Brand */}
              <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', color: '#0284c7', letterSpacing: '0.04em', fontSize: '0.7rem' }}>
                <Typography component="span" variant="caption" sx={{ display: 'none' }}>
                  {t('product.brand')}:
                </Typography>
                {brand ?? t('product.unknownBrand')}
              </Typography>

              {/* Title */}
              <Typography
                variant="h6"
                component="h3"
                sx={{
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  lineHeight: 1.25,
                  mt: 0.2,
                  mb: 0.5,
                  color: '#0f172a',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {name}
              </Typography>
            </Box>

            {onQuickView && (
              <IconButton
                size="small"
                title="Quick View"
                aria-label="Quick View"
                onClick={() => onQuickView(product)}
                sx={{
                  bgcolor: '#f1f5f9',
                  color: '#475569',
                  p: 0.5,
                  flexShrink: 0,
                  '&:hover': { bgcolor: '#e2e8f0', color: '#0f172a' },
                }}
              >
                <VisibilityOutlinedIcon sx={{ fontSize: 16 }} />
              </IconButton>
            )}
          </Box>

          {/* Categories */}
          {categories && (
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                mb: 1,
                display: 'block',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '100%',
                fontSize: '0.7rem',
              }}
            >
              {categories}
            </Typography>
          )}

          <Divider sx={{ my: 0.75, borderColor: '#f1f5f9' }} />

          {/* Nutrition Facts */}
          <Box sx={{ mt: 'auto', minWidth: 0, width: '100%' }}>
            {isSubscribed ? (
              <NutritionPanel nutrition={nutrition} compact />
            ) : (
              <SubscriptionBanner />
            )}
          </Box>
        </CardContent>
      </Card>
    );
  }

  // Grid View Layout (Compact Card)
  return (
    <Card
      component="article"
      sx={{
        height: '100%',
        width: '100%',
        minWidth: 0,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2.5,
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.04)',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.08)',
          borderColor: '#cbd5e1',
          '& .product-quick-view-btn': {
            opacity: 1,
            transform: 'translateY(0)',
          },
        },
      }}
    >
      {/* Product Image Media Container */}
      <Box
        sx={{
          position: 'relative',
          height: 125,
          width: '100%',
          bgcolor: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 1,
          borderBottom: '1px solid #f1f5f9',
          overflow: 'hidden',
        }}
      >
        {imageUrl && !imageError ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            style={{ objectFit: 'contain', padding: '6px', transition: 'transform 0.35s ease' }}
            onError={() => setImageError(true)}
          />
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#cbd5e1', gap: 0.5 }}>
            <BrokenImageIcon sx={{ fontSize: 32 }} />
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.68rem' }}>
              {t('product.noImage')}
            </Typography>
          </Box>
        )}

        {/* Floating Calorie Pill Badge */}
        {nutrition?.energy_kcal != null && (
          <Chip
            size="small"
            icon={<LocalFireDepartmentOutlinedIcon sx={{ fontSize: '11px !important', color: '#ea580c' }} />}
            label={`${Math.round(nutrition.energy_kcal)} kcal`}
            sx={{
              position: 'absolute',
              top: 6,
              left: 6,
              bgcolor: 'rgba(255, 255, 255, 0.94)',
              backdropFilter: 'blur(4px)',
              fontWeight: 700,
              fontSize: '0.65rem',
              color: '#9a3412',
              border: '1px solid #fed7aa',
              boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)',
              height: 20,
            }}
          />
        )}

        {/* Hover Quick View Action Button */}
        {onQuickView && (
          <Button
            className="product-quick-view-btn"
            variant="contained"
            size="small"
            startIcon={<VisibilityOutlinedIcon sx={{ fontSize: 13 }} />}
            onClick={() => onQuickView(product)}
            sx={{
              position: 'absolute',
              bottom: 6,
              opacity: 0,
              transform: 'translateY(4px)',
              transition: 'all 0.2s ease',
              bgcolor: 'rgba(15, 23, 42, 0.9)',
              color: '#ffffff',
              backdropFilter: 'blur(4px)',
              borderRadius: 1.5,
              px: 1,
              py: 0.2,
              fontSize: '0.68rem',
              fontWeight: 600,
              textTransform: 'none',
              '&:hover': {
                bgcolor: '#0f172a',
              },
            }}
          >
            Quick View
          </Button>
        )}
      </Box>

      {/* Product Information */}
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 1.5, minWidth: 0, width: '100%', boxSizing: 'border-box' }}>
        {/* Brand Tag */}
        <Typography
          variant="caption"
          sx={{
            fontWeight: 700,
            textTransform: 'uppercase',
            color: '#0284c7',
            letterSpacing: '0.04em',
            mb: 0.2,
            fontSize: '0.68rem',
            display: 'block',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '100%',
          }}
        >
          <Typography component="span" variant="caption" sx={{ display: 'none' }}>
            {t('product.brand')}:
          </Typography>
          {brand ?? t('product.unknownBrand')}
        </Typography>

        {/* Product Title */}
        <Typography
          variant="h6"
          component="h3"
          title={name}
          sx={{
            fontWeight: 700,
            fontSize: '0.84rem',
            lineHeight: 1.25,
            mb: 0.5,
            color: '#0f172a',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            minHeight: '2.1em',
            maxWidth: '100%',
          }}
        >
          {name}
        </Typography>

        {/* Categories */}
        {categories && (
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              mb: 0.75,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              display: 'block',
              fontSize: '0.68rem',
              maxWidth: '100%',
            }}
          >
            {categories}
          </Typography>
        )}

        <Divider sx={{ my: 0.75, borderColor: '#f1f5f9' }} />

        {/* Nutrition section gated by subscription */}
        <Box sx={{ mt: 'auto', width: '100%', minWidth: 0 }}>
          {isSubscribed ? (
            <NutritionPanel nutrition={nutrition} compact />
          ) : (
            <SubscriptionBanner />
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
