import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Box,
  Text,
  Button,
  Overlay,
  OverlayCenter,
  Icon,
  Icons,
  Input,
  config,
} from 'folds';
import FocusTrap from 'focus-trap-react';
import * as css from './ModelSwitcher.css';

// ── Types ──

interface ModelEntry {
  id: string;
  name: string;
  provider: string;
  active: boolean;
}

interface ProviderGroup {
  name: string;
  models: ModelEntry[];
}

interface ModelSwitcherProps {
  open: boolean;
  onClose: () => void;
}

// ── Constants ──

const MODELS: ModelEntry[] = [
  { id: 'default', name: 'Mixture of Agents', provider: 'HLM', active: false },
  { id: 'dsv4-flash0', name: 'DeepSeek v4 Flash', provider: 'HLM', active: false },
  { id: 'img1-duck', name: 'Image Duck', provider: 'HLM', active: false },
  { id: '54mini-splus', name: 'Mini S Plus', provider: 'HLM', active: false },
  { id: '55-ycyp1', name: 'YCYP v1', provider: 'HLM', active: false },
  { id: 'dsv4-pro0', name: 'DeepSeek v4 Pro', provider: 'HLM', active: true },
  { id: 'fable5-ycy1', name: 'Fable 5', provider: 'HLM', active: false },
  { id: 'opus48-ycy1', name: 'Opus 4.8', provider: 'HLM', active: false },
  { id: 'sonnet5-ycy1', name: 'Sonnet 5', provider: 'HLM', active: false },
  { id: 'sonnet5-fish1', name: 'Sonnet 5 Fish', provider: 'HLM', active: false },
];

const STORAGE_KEY = 'cinny-hermes-selected-model';
const PAGE_SIZE = 5;

// ── Helpers ──

function getStoredModel(): string {
  try { return localStorage.getItem(STORAGE_KEY) || 'dsv4-pro0'; }
  catch { return 'dsv4-pro0'; }
}

function setStoredModel(modelId: string) {
  try { localStorage.setItem(STORAGE_KEY, modelId); }
  catch { /* ignore */ }
}

// ── Inline SVG Icons ──

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// ── Component ──

export function ModelSwitcher({ open, onClose }: ModelSwitcherProps) {
  const [currentModel, setCurrentModel] = useState(getStoredModel);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [activeProvider, setActiveProvider] = useState<string | null>(null);
  const [switchingModel, setSwitchingModel] = useState<string | null>(null);

  // Refresh on open
  useEffect(() => {
    if (open) {
      setCurrentModel(getStoredModel());
      setSearchQuery('');
      setPage(0);
      setActiveProvider(null);
    }
  }, [open]);

  // Derive provider groups
  const providers = useMemo(() => {
    const seen = new Set<string>();
    return MODELS.reduce<string[]>((acc, m) => {
      if (!seen.has(m.provider)) { seen.add(m.provider); acc.push(m.provider); }
      return acc;
    }, []);
  }, []);

  // Filter: provider → search → paginate
  const filtered = useMemo(() => {
    let list = MODELS.map((m) => ({ ...m, active: m.id === currentModel }));
    if (activeProvider) list = list.filter((m) => m.provider === activeProvider);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((m) =>
        m.id.toLowerCase().includes(q) ||
        m.name.toLowerCase().includes(q) ||
        m.provider.toLowerCase().includes(q)
      );
    }
    return list;
  }, [activeProvider, searchQuery, currentModel]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const safePage = page >= totalPages ? 0 : page;
  const pageModels = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  const handleSwitch = useCallback((modelId: string) => {
    if (modelId === currentModel || switchingModel) return;
    setSwitchingModel(modelId);
    setCurrentModel(modelId);
    setStoredModel(modelId);

    // Dispatch event — RoomView listens and sends /model command via Matrix
    const event = new CustomEvent('hermes-auto-action', {
      detail: { action: 'model', text: `/model ${modelId}` },
      bubbles: true,
    });
    document.dispatchEvent(event);

    setTimeout(() => {
      setSwitchingModel(null);
      onClose();
    }, 200);
  }, [currentModel, switchingModel, onClose]);

  const selectProvider = (provider: string | null) => {
    setActiveProvider(provider);
    setSearchQuery('');
    setPage(0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const key = e.key;
    if (key >= '1' && key <= '9') {
      const idx = safePage * PAGE_SIZE + parseInt(key, 10) - 1;
      if (idx < filtered.length) { e.preventDefault(); handleSwitch(filtered[idx].id); }
    }
    if (key === 'ArrowLeft') { e.preventDefault(); if (safePage > 0) setPage(safePage - 1); }
    if (key === 'ArrowRight') { e.preventDefault(); if (safePage < totalPages - 1) setPage(safePage + 1); }
  };

  if (!open) return null;

  return (
    <Overlay open={open} backdrop={<Box className={css.ModelSwitcherBackdrop} />}>
      <OverlayCenter>
        <FocusTrap
          focusTrapOptions={{
            initialFocus: false,
            onDeactivate: onClose,
            clickOutsideDeactivates: true,
            escapeDeactivates: true,
          }}
        >
          <Box
            className={css.ModelSwitcherDialog}
            direction="Column"
            gap="200"
            onKeyDown={handleKeyDown}
            tabIndex={-1}
          >
            {/* Header */}
            <Box justifyContent="SpaceBetween" alignItems="Center" gap="200">
              <Box alignItems="Center" gap="200">
                <Icon src={Icons.Setting} size="300" />
                <Text size="H4">Model Configuration</Text>
              </Box>
              <Button
                variant="Secondary" size="300" radii="300"
                onClick={onClose} aria-label="Close"
              >
                <Icon src={Icons.Cross} size="50" />
              </Button>
            </Box>

            {/* Current model status */}
            <Box direction="Column" gap="100">
              <Text size="T200" priority="300">
                Current model: <strong>{currentModel}</strong> · Provider: custom:hlm
              </Text>
            </Box>

            {/* Provider tabs — Telegram-style */}
            {providers.length > 1 && (
              <Box gap="100" wrap="Wrap">
                <Button
                  size="300" radii="Pill"
                  variant={activeProvider === null ? 'Primary' : 'Secondary'}
                  fill={activeProvider === null ? 'Solid' : 'None'}
                  onClick={() => selectProvider(null)}
                >
                  <Text size="T300">All</Text>
                </Button>
                {providers.map((p) => (
                  <Button
                    key={p}
                    size="300" radii="Pill"
                    variant={activeProvider === p ? 'Primary' : 'Secondary'}
                    fill={activeProvider === p ? 'Solid' : 'None'}
                    onClick={() => selectProvider(p)}
                  >
                    <Text size="T300">{p}</Text>
                  </Button>
                ))}
              </Box>
            )}

            {/* Search */}
            <Input
              size="400"
              placeholder="Search models..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setSearchQuery(e.target.value);
                setPage(0);
              }}
              before={<Icon src={Icons.Search} size="50" />}
            />

            {/* Model list */}
            <Box direction="Column" gap="100" className={css.ModelList}>
              {pageModels.length === 0 ? (
                <Box className={css.ModelCardEmpty}>
                  <Text size="T300" priority="300">No models found</Text>
                </Box>
              ) : (
                pageModels.map((model, index) => {
                  const isCurrent = model.active;
                  const globalIndex = safePage * PAGE_SIZE + index + 1;
                  return (
                    <Box
                      key={model.id}
                      className={isCurrent ? css.ModelCardRowActive : css.ModelCardRow}
                      onClick={() => !isCurrent && handleSwitch(model.id)}
                      role="button"
                      tabIndex={isCurrent ? -1 : 0}
                      aria-pressed={isCurrent}
                    >
                      {/* Number badge + info */}
                      <Box className={css.ModelCardRowInfo} gap="200" alignItems="Center">
                        <Box
                          style={{
                            backgroundColor: isCurrent ? '#4F46E5' : '#94a3b8',
                            color: '#FFFFFF',
                            borderRadius: '50%',
                            minWidth: '24px', minHeight: '24px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 700, fontSize: '12px', flexShrink: 0,
                          }}
                        >
                          {globalIndex}
                        </Box>
                        <Box direction="Column">
                          <Text size="T400">{model.name}</Text>
                          <Text size="T200" priority="300">{model.id} — {model.provider}</Text>
                        </Box>
                      </Box>

                      {/* Action button */}
                      <Box shrink="No">
                        {isCurrent ? (
                          <Box className={css.ModelCardActiveBadge} gap="100" alignItems="Center">
                            <CheckIcon />
                            <Text size="T200">Active</Text>
                          </Box>
                        ) : (
                          <Button
                            size="300" radii="300"
                            variant="Primary" fill="Soft"
                            disabled={switchingModel !== null}
                            onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleSwitch(model.id); }}
                          >
                            <Text size="T200">
                              {switchingModel === model.id ? 'Switching...' : 'Switch'}
                            </Text>
                          </Button>
                        )}
                      </Box>
                    </Box>
                  );
                })
              )}
            </Box>

            {/* Pagination — Telegram-style */}
            {totalPages > 1 && (
              <Box gap="100" justifyContent="Center" alignItems="Center">
                <Button
                  size="300" variant="Secondary" radii="300"
                  disabled={safePage <= 0}
                  onClick={() => setPage(safePage - 1)}
                >
                  <Icon src={Icons.ChevronLeft} size="50" />
                </Button>
                <Text size="T300">{safePage + 1} / {totalPages}</Text>
                <Button
                  size="300" variant="Secondary" radii="300"
                  disabled={safePage >= totalPages - 1}
                  onClick={() => setPage(safePage + 1)}
                >
                  <Icon src={Icons.ChevronRight} size="50" />
                </Button>
              </Box>
            )}
          </Box>
        </FocusTrap>
      </OverlayCenter>
    </Overlay>
  );
}
