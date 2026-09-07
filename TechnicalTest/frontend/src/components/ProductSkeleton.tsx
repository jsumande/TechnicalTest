'use client';

import React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Skeleton from '@mui/material/Skeleton';

interface ProductSkeletonProps {
  viewMode?: 'grid' | 'list';
}

export function ProductSkeleton({ viewMode = 'grid' }: ProductSkeletonProps) {
  if (viewMode === 'list') {
    return (
      <Card
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          borderRadius: 3,
          border: '1px solid #e2e8f0',
          boxShadow: 'none',
          p: 2,
          gap: 2.5,
          alignItems: { sm: 'center' },
        }}
      >
        <Skeleton variant="rounded" width={140} height={140} sx={{ borderRadius: 2, flexShrink: 0 }} />
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Skeleton variant="text" width="60%" height={28} />
          <Skeleton variant="text" width="30%" height={20} sx={{ mt: 0.5 }} />
          <Skeleton variant="text" width="45%" height={16} sx={{ mt: 1 }} />
        </Box>
        <Box sx={{ width: { xs: '100%', sm: 180 }, flexShrink: 0 }}>
          <Skeleton variant="rounded" height={60} sx={{ borderRadius: 2 }} />
        </Box>
      </Card>
    );
  }

  return (
    <Card
      sx={{
        height: '100%',
        borderRadius: 3,
        border: '1px solid #e2e8f0',
        boxShadow: 'none',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Skeleton variant="rectangular" height={190} />
      <CardContent sx={{ p: 2.5, flexGrow: 1 }}>
        <Skeleton variant="text" width="40%" height={16} sx={{ mb: 1 }} />
        <Skeleton variant="text" width="90%" height={26} />
        <Skeleton variant="text" width="70%" height={26} sx={{ mb: 2 }} />
        <Skeleton variant="rounded" width="50%" height={22} sx={{ mb: 2, borderRadius: 1.5 }} />
        <Skeleton variant="rounded" height={80} sx={{ borderRadius: 2 }} />
      </CardContent>
    </Card>
  );
}
