import React, { ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Button, Chip, Text, config } from 'folds';
import * as css from '../../styles/CustomHtml.css';

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

export function ModelCard({ children, page, total }: ModelCardProps) {
  const { t } = useTranslation();
  const [switchingModel, setSwitchingModel] = useState<string | null>(null);

  const models = parseModels(children);
  const currentPage = page ? parseInt(page, 10) : 0;
  const totalPages = total ? parseInt(total, 10) : 1;

  const handleSwitch = (modelEntry: ModelEntry) => {
    if (modelEntry.active || switchingModel) return;

    setSwitchingModel(modelEntry.model);

    // Dispatch auto-send event for the model switch
    const messageText = `/model ${modelEntry.model}`;
    const event = new CustomEvent('hermes-auto-action', {
      detail: {
        action: 'model',
        label: modelEntry.label,
        payload: modelEntry.model,
        text: messageText,
      },
      bubbles: true,
    });
    document.dispatchEvent(event);

    // Fallback: insert and try to send
    const messageInput = document.querySelector('[contenteditable="true"]') as HTMLElement;
    if (messageInput) {
      messageInput.focus();
      document.execCommand('insertText', false, messageText);

      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        bubbles: true,
        cancelable: true,
      });
      messageInput.dispatchEvent(enterEvent);
    }

    // Reset switching state after a delay
    setTimeout(() => setSwitchingModel(null), 3000);
  };

  if (models.length === 0) {
    return (
      <Box direction="Column" className={css.HermesCard} gap="200" style={{ margin: `${config.space.S200} 0` }}>
        <Text size="T300">{t('hermes.no_models')}</Text>
      </Box>
    );
  }

  return (
    <Box direction="Column" className={css.HermesCard} gap="200" style={{ margin: `${config.space.S200} 0` }}>
      <Text size="H4" className={css.Heading}>
        {t('hermes.model_switcher')}
      </Text>

      <Box direction="Column" className={css.ModelCard}>
        {models.map((modelEntry) => (
          <Box
            key={modelEntry.model}
            direction="Row"
            alignItems="Center"
            justifyContent="SpaceBetween"
            className={modelEntry.active ? css.ModelCardItemActive : css.ModelCardItem}
          >
            <Box className={css.ModelCardItemInfo}>
              <Text className={css.ModelCardItemName} size="T300" truncate>
                {modelEntry.label}
              </Text>
              {modelEntry.provider && (
                <Text className={css.ModelCardItemProvider} size="T200">
                  {modelEntry.provider}
                </Text>
              )}
            </Box>

            {modelEntry.active ? (
              <Chip variant="Success" radii="Pill" disabled>
                <Text size="B300">{t('hermes.active_model')}</Text>
              </Chip>
            ) : (
              <Button
                size="300"
                variant="Primary"
                radii="Pill"
                onClick={() => handleSwitch(modelEntry)}
                disabled={switchingModel !== null}
              >
                <Text size="B300">
                  {switchingModel === modelEntry.model
                    ? t('hermes.switching')
                    : t('hermes.switch_model')}
                </Text>
              </Button>
            )}
          </Box>
        ))}
      </Box>

      {totalPages > 1 && (
        <Box direction="Row" justifyContent="Center" alignItems="Center" gap="200">
          <Text size="T300">
            {currentPage + 1} / {totalPages}
          </Text>
        </Box>
      )}
    </Box>
  );
}
