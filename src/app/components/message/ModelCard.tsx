import React, { ReactNode, useState } from 'react';
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
  const [switchingModel, setSwitchingModel] = useState<string | null>(null);

  const models = parseModels(children);
  const serverTotalPages = total ? parseInt(total, 10) : 1;
  const serverPage = page ? parseInt(page, 10) : 0;

  // Client-side pagination for the flat list within this page
  const [clientPage, setClientPage] = useState(0);
  const clientTotalPages = Math.max(1, Math.ceil(models.length / MODELS_PER_PAGE));
  const pagedModels = models.slice(
    clientPage * MODELS_PER_PAGE,
    (clientPage + 1) * MODELS_PER_PAGE
  );

  const handleSwitch = (modelEntry: ModelEntry) => {
    if (modelEntry.active || switchingModel) return;
    setSwitchingModel(modelEntry.model);

    const messageText = `/model ${modelEntry.model}`;
    const event = new CustomEvent('hermes-auto-action', {
      detail: { action: 'model', label: modelEntry.label, payload: modelEntry.model, text: messageText },
      bubbles: true,
    });
    document.dispatchEvent(event);

    // Fallback: insert text into composer
    const input = document.querySelector('[contenteditable="true"]') as HTMLElement;
    if (input) {
      input.focus();
      document.execCommand('insertText', false, messageText);
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true, cancelable: true }));
    }

    setTimeout(() => setSwitchingModel(null), 3000);
  };

  if (models.length === 0) {
    return (
      <div className={css.ModelCardPanel}>
        <div className={css.ModelCardEmpty}>
          <Text size="T300">{t('hermes.no_models')}</Text>
        </div>
      </div>
    );
  }

  // ── Render ──

  return (
    <div className={css.ModelCardPanel}>
      {/* Header */}
      <div className={css.ModelCardHeader}>
        <span className={css.ModelCardTitle}>{t('hermes.model_switcher')}</span>
        {serverTotalPages > 1 && (
          <span className={css.ModelCardPageIndicator}>
            {t('hermes.page_n', { current: serverPage + 1, total: serverTotalPages })}
          </span>
        )}
      </div>

      {/* Model rows */}
      <div className={css.ModelCardList}>
        {pagedModels.map((m) => (
          <div
            key={m.model}
            className={m.active ? css.ModelCardRowActive : css.ModelCardRow}
            onClick={() => !m.active && handleSwitch(m)}
            role="button"
            tabIndex={m.active ? -1 : 0}
            aria-pressed={m.active}
          >
            {/* Info */}
            <div className={css.ModelCardRowInfo}>
              <span className={css.ModelCardRowName}>{m.label}</span>
              {m.provider && (
                <span className={css.ModelCardRowProvider}>
                  <span className={css.ModelCardProviderDot} />
                  {m.provider}
                </span>
              )}
            </div>

            {/* Action */}
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
        ))}
      </div>

      {/* Pagination footer */}
      {clientTotalPages > 1 && (
        <div className={css.ModelCardFooter}>
          <button
            className={css.ModelCardPageBtn}
            disabled={clientPage <= 0}
            onClick={() => setClientPage((p) => Math.max(0, p - 1))}
          >
            <ChevronLeft />
          </button>
          <span className={css.ModelCardPageNum}>
            {clientPage + 1} / {clientTotalPages}
          </span>
          <button
            className={css.ModelCardPageBtn}
            disabled={clientPage >= clientTotalPages - 1}
            onClick={() => setClientPage((p) => Math.min(clientTotalPages - 1, p + 1))}
          >
            <ChevronRight />
          </button>
        </div>
      )}
    </div>
  );
}
