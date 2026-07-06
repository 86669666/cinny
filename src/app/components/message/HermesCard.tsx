import React, { ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Button, Chip, Icon, Icons, Text, config } from 'folds';
import * as css from '../../styles/CustomHtml.css';

interface HermesAction {
  action: string;
  label: string;
  autoSend?: boolean;
  payload?: string;
}

interface HermesCardProps {
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

export function HermesCard({ children, page, total }: HermesCardProps) {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(page ? parseInt(page, 10) : 0);
  const totalPages = total ? parseInt(total, 10) : 1;
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // Extract content and actions from children
  const contentParts: ReactNode[] = [];
  const actions: HermesAction[] = [];

  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child)) {
      /* eslint-disable react/prop-types */
      const props = child.props as Record<string, unknown>;
      if (props['data-hermes-action']) {
        actions.push({
          action: (props['data-hermes-action'] as string) || '',
          label: extractText(child) || (props['data-hermes-action'] as string) || '',
          autoSend: props['data-hermes-action-auto'] === 'true',
          payload: (props['data-hermes-action-payload'] as string) || undefined,
        });
      } else {
        contentParts.push(child);
      }
      /* eslint-enable react/prop-types */
    } else {
      contentParts.push(child);
    }
  });

  const handleAction = (action: HermesAction) => {
    if (action.autoSend) {
      setLoadingAction(action.action);

      // Dispatch auto-send event for RoomInput to handle
      const messageText = `/${action.action} ${action.payload || ''}`.trim();
      const event = new CustomEvent('hermes-auto-action', {
        detail: {
          action: action.action,
          label: action.label,
          payload: action.payload,
          text: messageText,
        },
        bubbles: true,
      });
      document.dispatchEvent(event);

      // Reset loading after a short delay
      setTimeout(() => setLoadingAction(null), 2000);
    } else {
      // Original behavior: insert text into composer
      const messageInput = document.querySelector('[contenteditable="true"]') as HTMLElement;
      if (messageInput) {
        const event = new CustomEvent('hermes-action', {
          detail: { action: action.action, label: action.label },
          bubbles: true,
        });
        messageInput.dispatchEvent(event);

        // Insert the action text into the composer
        const text = `/${action.action}`;
        messageInput.focus();
        document.execCommand('insertText', false, text);
      }
    }
  };

  return (
    <Box direction="Column" className={css.HermesCard} gap="200" style={{ margin: `${config.space.S200} 0` }}>
      <Box className={css.HermesCardContent} direction="Column" gap="100">
        {contentParts.length > 0 ? contentParts : children}
      </Box>

      {actions.length > 0 && (
        <Box direction="Row" gap="200" wrap="Wrap" className={css.HermesCardActions}>
          {actions.map((action) => (
            <Chip
              key={action.action}
              variant={loadingAction === action.action ? 'Success' : 'Primary'}
              radii="Pill"
              onClick={() => handleAction(action)}
              disabled={loadingAction !== null}
              before={loadingAction === action.action ? <Icon size="50" src={Icons.Check} /> : undefined}
            >
              <Text size="B300">
                {loadingAction === action.action ? t('hermes.switching') : action.label}
              </Text>
            </Chip>
          ))}
        </Box>
      )}

      {totalPages > 1 && (
        <Box direction="Row" justifyContent="Center" alignItems="Center" gap="200">
          <Button
            size="300"
            variant="SurfaceVariant"
            radii="Pill"
            disabled={currentPage <= 0}
            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
          >
            <Icon size="50" src={Icons.ChevronLeft} />
          </Button>
          <Text size="T300">
            {currentPage + 1} / {totalPages}
          </Text>
          <Button
            size="300"
            variant="SurfaceVariant"
            radii="Pill"
            disabled={currentPage >= totalPages - 1}
            onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
          >
            <Icon size="50" src={Icons.ChevronRight} />
          </Button>
        </Box>
      )}
    </Box>
  );
}
