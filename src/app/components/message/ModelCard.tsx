import React, { ReactNode, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text } from 'folds';
import * as css from '../../styles/CustomHtml.css';

// ── Types ──

interface ModelEntry {
  model: string;
  active: boolean;
  provider: string;
  label: string;
}

interface ModelCardProps {
  children: ReactNode;
  page?: string;
  total?: string;
}

// ── Helpers ──

function extractText(node: ReactNode): string {
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (React.isValidElement(node)) {
    let text = '';
    React.Children.forEach(node.props.children, (child) => {
      text += extractText(child);
    });
    return text;
  }
  return '';
}

function parseModels(children: ReactNode): ModelEntry[] {
  const models: ModelEntry[] = [];
  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child)) {
      /* eslint-disable react/prop-types */
      const props = child.props as Record<string, unknown>;
      if (props['data-hermes-model']) {
        models.push({
          model: props['data-hermes-model'] as string,
          active: props['data-hermes-model-active'] === 'true',
          provider: (props['data-hermes-model-provider'] as string) || '',
          label: extractText(child) || (props['data-hermes-model'] as string),
        });
      }
      /* eslint-enable react/prop-types */
    }
  });
  return models;
}

// ── Icons (inline SVG, no dependency) ──

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function ChevronLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function ChevronRight() {
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

const MODELS_PER_PAGE = 5;

export function ModelCard({ children, page, total }: ModelCardProps) {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(false);
  const [switchingModel, setSwitchingModel] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [clientPage, setClientPage] = useState(0);
  const [activeProvider, setActiveProvider] = useState<string | null>(null);

  const models = parseModels(children);
  const serverTotalPages = total ? parseInt(total, 10) : 1;
  const serverPage = page ? parseInt(page, 10) : 0;

  // Derive ordered unique providers
  const providers = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const m of models) {
      if (m.provider && !seen.has(m.provider)) {
        seen.add(m.provider);
        result.push(m.provider);
      }
    }
    return result;
  }, [models]);

  const filtered = useMemo(() => {
    let list = models;
    if (activeProvider) {
      list = list.filter((m) => m.provider === activeProvider);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (m) =>
          m.model.toLowerCase().includes(q) ||
          m.label.toLowerCase().includes(q) ||
          m.provider.toLowerCase().includes(q),
      );
    }
    return list;
  }, [models, activeProvider, query]);

  const clientTotalPages = Math.max(1, Math.ceil(filtered.length / MODELS_PER_PAGE));
  const pagedModels = filtered.slice(
    clientPage * MODELS_PER_PAGE,
    (clientPage + 1) * MODELS_PER_PAGE,
  );
  const safeClientPage = clientPage >= clientTotalPages ? 0 : clientPage;

  const handleSwitch = (modelEntry: ModelEntry) => {
    if (modelEntry.active || switchingModel || dismissed) return;
    setSwitchingModel(modelEntry.model);
    setDismissed(true);

    const messageText = `/model ${modelEntry.model}`;
    const event = new CustomEvent('hermes-auto-action', {
      detail: { action: 'model', label: modelEntry.label, payload: modelEntry.model, text: messageText },
      bubbles: true,
    });
    document.dispatchEvent(event);
  };

  const selectProvider = (provider: string | null) => {
    setActiveProvider(provider);
    setQuery('');
    setClientPage(0);
  };

  if (dismissed || models.length === 0) return null;

  return (
    <div className={css.ModelCardPanel}>
      {/* Header */}
      <div className={css.ModelCardHeader}>
        <span className={css.ModelCardTitle}>{t('hermes.model_switcher')}</span>
        <button
          className={css.ModelCardCloseBtn}
          onClick={() => setDismissed(true)}
          aria-label="Close"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        {serverTotalPages > 1 && (
          <span className={css.ModelCardPageIndicator}>
            {t('hermes.page_n', { current: serverPage + 1, total: serverTotalPages })}
          </span>
        )}
      </div>

      {/* Provider tabs — only show when > 1 provider */}
      {providers.length > 1 && (
        <div className={css.ModelCardTabs}>
          <button
            className={activeProvider === null ? css.ModelCardTabActive : css.ModelCardTab}
            onClick={() => selectProvider(null)}
          >
            {t('hermes.all')}
          </button>
          {providers.map((p) => (
            <button
              key={p}
              className={activeProvider === p ? css.ModelCardTabActive : css.ModelCardTab}
              onClick={() => selectProvider(p)}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Search */}
      <div className={css.ModelCardSearch}>
        <span className={css.ModelCardSearchIcon}>
          <SearchIcon />
        </span>
        <input
          className={css.ModelCardSearchInput}
          type="text"
          placeholder={t('hermes.search_models')}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setClientPage(0);
          }}
          autoFocus
        />
      </div>

      {/* Model rows */}
      <div className={css.ModelCardList}>
        {pagedModels.length === 0 ? (
          <div className={css.ModelCardEmpty}>
            <Text size="T300">{t('hermes.no_models')}</Text>
          </div>
        ) : (
          pagedModels.map((m) => (
            <div
              key={m.model}
              className={m.active ? css.ModelCardRowActive : css.ModelCardRow}
              onClick={() => !m.active && handleSwitch(m)}
              role="button"
              tabIndex={m.active ? -1 : 0}
              aria-pressed={m.active}
            >
              <div className={css.ModelCardRowInfo}>
                <span className={css.ModelCardRowName}>{m.label}</span>
                {m.provider && (
                  <span className={css.ModelCardRowProvider}>
                    <span className={css.ModelCardProviderDot} />
                    {m.provider}
                  </span>
                )}
              </div>

              <div className={css.ModelCardRowAction}>
                {m.active ? (
                  <span className={css.ModelCardActiveBadge}>
                    <CheckIcon />
                    {t('hermes.active_model')}
                  </span>
                ) : (
                  <button
                    className={css.ModelCardSwitchBtn}
                    disabled={switchingModel !== null}
                    onClick={(e) => { e.stopPropagation(); handleSwitch(m); }}
                  >
                    {switchingModel === m.model ? t('hermes.switching') : t('hermes.switch_model')}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {clientTotalPages > 1 && (
        <div className={css.ModelCardFooter}>
          <button
            className={css.ModelCardPageBtn}
            disabled={safeClientPage <= 0}
            onClick={() => setClientPage((p) => Math.max(0, p - 1))}
          >
            <ChevronLeft />
          </button>
          <span className={css.ModelCardPageNum}>
            {safeClientPage + 1} / {clientTotalPages}
          </span>
          <button
            className={css.ModelCardPageBtn}
            disabled={safeClientPage >= clientTotalPages - 1}
            onClick={() => setClientPage((p) => Math.min(clientTotalPages - 1, p + 1))}
          >
            <ChevronRight />
          </button>
        </div>
      )}
    </div>
  );
}
