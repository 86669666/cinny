import { style } from '@vanilla-extract/css';
import { config } from 'folds';

export const ModelSwitcherDialog = style({
  width: '480px',
  maxWidth: '90vw',
  maxHeight: '80vh',
  padding: config.space.S400,
  backgroundColor: '#ffffff',
  color: '#1a1a1a',
  borderRadius: config.radii.R400,
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0,0,0,0.1)',
  border: '1px solid #e0e0e0',
  zIndex: 9999,
  position: 'relative',
});

export const ModelSwitcherBackdrop = style({
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.4)',
  zIndex: 9998,
});

export const ModelList = style({
  maxHeight: '400px',
  overflowY: 'auto',
  padding: `0 ${config.space.S100}`,
});

// ── Telegram-style model rows ──

export const ModelCardRow = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: `10px 12px`,
  borderRadius: config.radii.R300,
  cursor: 'pointer',
  transition: 'background 0.15s',
  ':hover': { backgroundColor: '#f1f5f9' },
});

export const ModelCardRowActive = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: `10px 12px`,
  borderRadius: config.radii.R300,
  backgroundColor: '#eef2ff',
  border: '1px solid #c7d2fe',
});

export const ModelCardRowInfo = style({
  display: 'flex',
  flex: 1,
  minWidth: 0,
});

export const ModelCardActiveBadge = style({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  color: '#4F46E5',
  padding: '2px 10px',
  borderRadius: config.radii.Pill,
  fontSize: '12px',
  fontWeight: 600,
});

export const ModelCardEmpty = style({
  padding: '24px',
  textAlign: 'center',
  color: '#94a3b8',
});
