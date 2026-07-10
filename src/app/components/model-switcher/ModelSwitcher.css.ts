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
