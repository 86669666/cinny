import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Text,
  Button,
  Overlay,
  OverlayCenter,
  Icon,
  Icons,
  Input,
} from 'folds';
import FocusTrap from 'focus-trap-react';
import * as css from './ModelSwitcher.css';

interface Model {
  id: string;
  provider: string;
  name: string;
}

const MODELS: Model[] = [
  { id: 'default', provider: 'HLM', name: 'Mixture of Agents' },
  { id: 'dsv4-flash0', provider: 'HLM', name: 'DeepSeek v4 Flash' },
  { id: 'img1-duck', provider: 'HLM', name: 'Image Duck' },
  { id: '54mini-splus', provider: 'HLM', name: 'Mini S Plus' },
  { id: '55-ycyp1', provider: 'HLM', name: 'YCYP v1' },
  { id: 'dsv4-pro0', provider: 'HLM', name: 'DeepSeek v4 Pro' },
  { id: 'fable5-ycy1', provider: 'HLM', name: 'Fable 5' },
  { id: 'opus48-ycy1', provider: 'HLM', name: 'Opus 4.8' },
  { id: 'sonnet5-ycy1', provider: 'HLM', name: 'Sonnet 5' },
  { id: 'sonnet5-fish1', provider: 'HLM', name: 'Sonnet 5 Fish' },
];

const PAGE_SIZE = 5;
const STORAGE_KEY = 'cinny-hermes-selected-model';
const API_KEY = 'keke-webui-key-2026';

function getStoredModel(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) || 'dsv4-pro0';
  } catch {
    return 'dsv4-pro0';
  }
}

function setStoredModel(modelId: string) {
  try {
    localStorage.setItem(STORAGE_KEY, modelId);
  } catch {
    // ignore
  }
}

interface ModelSwitcherProps {
  open: boolean;
  onClose: () => void;
}

export function ModelSwitcher({ open, onClose }: ModelSwitcherProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentModel, setCurrentModel] = useState(getStoredModel);
  const [page, setPage] = useState(0);

  // Refresh current model from localStorage on each open
  useEffect(() => {
    if (open) {
      setCurrentModel(getStoredModel());
      setSearchQuery('');
      setPage(0);
    }
  }, [open]);

  const filteredModels = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return MODELS.filter((model) =>
      model.name.toLowerCase().includes(query) ||
      model.id.toLowerCase().includes(query) ||
      model.provider.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const totalPages = Math.ceil(filteredModels.length / PAGE_SIZE);
  const pageModels = filteredModels.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleModelSwitch = async (modelId: string) => {
    setCurrentModel(modelId);
    setStoredModel(modelId);

    // Try API switch first
    try {
      await fetch('http://localhost:8642/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model: modelId,
          messages: [{ role: 'system', content: 'ping' }],
          max_tokens: 1,
          stream: false,
        }),
      });
    } catch {
      // API unavailable — insert command as fallback
    }

    // Close modal FIRST, then insert /model command into room composer
    onClose();

    setTimeout(() => {
      const input = document.querySelector(
        '[contenteditable="true"]'
      ) as HTMLElement | null;
      if (input && !document.activeElement?.closest('[contenteditable="true"]')) {
        input.focus();
        document.execCommand('insertText', false, `/model ${modelId}`);
      }
    }, 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const key = e.key;
    if (key >= '1' && key <= '9') {
      const num = parseInt(key, 10) - 1;
      const idx = page * PAGE_SIZE + num;
      if (idx < filteredModels.length) {
        e.preventDefault();
        handleModelSwitch(filteredModels[idx].id);
      }
    }
    if (key === 'ArrowLeft') { e.preventDefault(); if (page > 0) setPage(page - 1); }
    if (key === 'ArrowRight') { e.preventDefault(); if (page < totalPages - 1) setPage(page + 1); }
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
            gap="300"
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
                variant="Secondary"
                size="300"
                radii="300"
                onClick={onClose}
                aria-label="Close"
              >
                <Icon src={Icons.Cross} size="50" />
              </Button>
            </Box>

            {/* Current model */}
            <Box direction="Column" gap="100">
              <Text size="T300" priority="300">
                Current model: <strong>{currentModel}</strong>
              </Text>
              <Text size="T200" priority="300">
                Provider: custom:hlm
              </Text>
            </Box>

            <Text size="T300">
              Click to choose a model — or type 1-{pageModels.length} for quick select:
            </Text>

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
            <Box direction="Column" gap="200" className={css.ModelList}>
              {filteredModels.length === 0 ? (
                <Text size="T300" priority="300">
                  No models found
                </Text>
              ) : (
                pageModels.map((model, index) => {
                  const isCurrent = model.id === currentModel;
                  const globalIndex = page * PAGE_SIZE + index + 1;
                  return (
                    <Button
                      key={model.id}
                      variant="Primary"
                      fill={isCurrent ? 'Solid' : 'None'}
                      size="400"
                      radii="400"
                      onClick={() => !isCurrent && handleModelSwitch(model.id)}
                      style={{
                        justifyContent: 'flex-start',
                        gap: '12px',
                        width: '100%',
                      }}
                    >
                      <Box
                        style={{
                          backgroundColor: '#4F46E5',
                          color: '#FFFFFF',
                          borderRadius: '50%',
                          minWidth: '24px',
                          minHeight: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '12px',
                        }}
                      >
                        {globalIndex}
                      </Box>
                      <Box direction="Column" alignItems="Start" style={{ flex: 1 }}>
                        <Text size="T400">
                          {model.name} — {model.provider}
                        </Text>
                      </Box>
                      {isCurrent && (
                        <Icon src={Icons.Check} size="50" filled />
                      )}
                    </Button>
                  );
                })
              )}
            </Box>

            {/* Pagination */}
            {totalPages > 1 && (
              <Box gap="100" justifyContent="Center" alignItems="Center">
                <Button
                  size="300"
                  variant="Secondary"
                  radii="300"
                  disabled={page === 0}
                  onClick={() => setPage(page - 1)}
                >
                  <Icon src={Icons.ChevronLeft} size="50" />
                </Button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <Button
                    key={i}
                    size="300"
                    variant={i === page ? 'Primary' : 'Secondary'}
                    fill={i === page ? 'Solid' : 'None'}
                    radii="300"
                    onClick={() => setPage(i)}
                  >
                    <Text size="T300">{i + 1}</Text>
                  </Button>
                ))}
                <Button
                  size="300"
                  variant="Secondary"
                  radii="300"
                  disabled={page === totalPages - 1}
                  onClick={() => setPage(page + 1)}
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
