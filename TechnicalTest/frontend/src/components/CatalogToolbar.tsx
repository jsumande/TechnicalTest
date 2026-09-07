'use client';

import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import Chip from '@mui/material/Chip';
import GridViewRoundedIcon from '@mui/icons-material/GridViewRounded';
import ViewListRoundedIcon from '@mui/icons-material/ViewListRounded';
import SortRoundedIcon from '@mui/icons-material/SortRounded';
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

export type SortOption =
  | 'relevance'
  | 'name_asc'
  | 'name_desc'
  | 'energy_desc'
  | 'sugar_asc'
  | 'protein_desc';

interface CatalogToolbarProps {
  totalCount: number;
  filteredCount: number;
  query: string | null;
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  onResetFilters: () => void;
}

const SORT_LABELS: Record<SortOption, string> = {
  relevance: 'Sort: Relevance',
  name_asc: 'Sort: Name (A → Z)',
  name_desc: 'Sort: Name (Z → A)',
  energy_desc: 'Sort: Energy (kcal)',
  sugar_asc: 'Sort: Low Sugar',
  protein_desc: 'Sort: High Protein',
};

export function CatalogToolbar({
  totalCount,
  filteredCount,
  query,
  categories,
  selectedCategory,
  onSelectCategory,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  onResetFilters,
}: CatalogToolbarProps) {
  const hasActiveFilters = selectedCategory !== 'all' || sortBy !== 'relevance';

  return (
    <Box
      sx={{
        bgcolor: '#ffffff',
        borderRadius: 3,
        border: '1px solid #e2e8f0',
        p: { xs: 2, sm: 2.25 },
        mb: 3,
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* Top Row: Results Meta + Sort & View Controls */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 1.5,
          pb: categories.length > 1 ? 1.5 : 0,
          borderBottom: categories.length > 1 ? '1px solid #f1f5f9' : 'none',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        {/* Count and query info */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>
            {filteredCount} {filteredCount === 1 ? 'Product' : 'Products'}
          </Typography>

          {query && (
            <Chip
              size="small"
              label={`"${query}"`}
              sx={{
                fontWeight: 600,
                fontSize: '0.72rem',
                bgcolor: '#eff6ff',
                color: '#1d4ed8',
                border: '1px solid #bfdbfe',
                height: 24,
              }}
            />
          )}

          {selectedCategory !== 'all' && (
            <Chip
              size="small"
              label={selectedCategory}
              onDelete={() => onSelectCategory('all')}
              sx={{
                fontWeight: 600,
                fontSize: '0.72rem',
                bgcolor: '#f0fdf4',
                color: '#15803d',
                border: '1px solid #bbf7d0',
                height: 24,
              }}
            />
          )}
        </Box>

        {/* Right side controls: Sort + View Mode Switcher */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: { xs: '100%', sm: 'auto' }, justifyContent: 'flex-end' }}>
          {/* Sort Dropdown */}
          <FormControl size="small" sx={{ minWidth: 165 }}>
            <Select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              displayEmpty
              inputProps={{ 'aria-label': 'Sort products' }}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <SortRoundedIcon sx={{ fontSize: 16, color: '#64748b' }} />
                  <Typography component="span" sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>
                    {SORT_LABELS[selected as SortOption] || 'Sort by'}
                  </Typography>
                </Box>
              )}
              sx={{
                borderRadius: 2,
                fontSize: '0.8rem',
                bgcolor: '#f8fafc',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#e2e8f0',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#cbd5e1',
                },
              }}
            >
              <MenuItem value="relevance">Relevance</MenuItem>
              <MenuItem value="name_asc">Name (A → Z)</MenuItem>
              <MenuItem value="name_desc">Name (Z → A)</MenuItem>
              <MenuItem value="energy_desc">Highest Energy (kcal)</MenuItem>
              <MenuItem value="sugar_asc">Lowest Sugar</MenuItem>
              <MenuItem value="protein_desc">Highest Protein</MenuItem>
            </Select>
          </FormControl>

          {/* Grid / List View Toggle */}
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, val) => val && onViewModeChange(val)}
            size="small"
            aria-label="catalog view mode"
            sx={{
              bgcolor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 2,
              '& .MuiToggleButton-root': {
                border: 0,
                borderRadius: '6px !important',
                m: '2px',
                p: '5px',
                color: '#64748b',
                '&.Mui-selected': {
                  bgcolor: '#ffffff',
                  color: '#0f172a',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                },
              },
            }}
          >
            <ToggleButton value="grid" aria-label="grid view" title="Grid View">
              <GridViewRoundedIcon sx={{ fontSize: 18 }} />
            </ToggleButton>
            <ToggleButton value="list" aria-label="list view" title="List View">
              <ViewListRoundedIcon sx={{ fontSize: 18 }} />
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      {/* Bottom Row: Dynamic Category Pills (Natural Wrap without Horizontal Scrollbar) */}
      {categories.length > 1 && (
        <Box sx={{ pt: 1.5, width: '100%', boxSizing: 'border-box' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#64748b', mr: 0.5, flexShrink: 0 }}>
              <FilterAltOutlinedIcon sx={{ fontSize: 15 }} />
              <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '0.68rem' }}>
                Filter:
              </Typography>
            </Box>

            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <Chip
                  key={cat}
                  label={cat === 'all' ? 'All Categories' : cat}
                  size="small"
                  clickable
                  onClick={() => onSelectCategory(cat)}
                  sx={{
                    fontWeight: isSelected ? 700 : 500,
                    fontSize: '0.72rem',
                    height: 24,
                    bgcolor: isSelected ? '#0f172a' : '#f1f5f9',
                    color: isSelected ? '#ffffff' : '#475569',
                    border: '1px solid',
                    borderColor: isSelected ? '#0f172a' : '#e2e8f0',
                    transition: 'all 0.15s ease',
                    '&:hover': {
                      bgcolor: isSelected ? '#1e293b' : '#e2e8f0',
                    },
                  }}
                />
              );
            })}

            {hasActiveFilters && (
              <Chip
                icon={<RestartAltIcon sx={{ fontSize: 14 }} />}
                label="Reset"
                size="small"
                variant="outlined"
                onClick={onResetFilters}
                sx={{
                  fontWeight: 600,
                  fontSize: '0.72rem',
                  height: 24,
                  borderColor: '#cbd5e1',
                  color: '#64748b',
                  '&:hover': { bgcolor: '#f8fafc' },
                }}
              />
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
}
