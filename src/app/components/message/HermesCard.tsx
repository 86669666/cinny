import React, { ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Button, Chip, Header, Icon, Icons, Text, config } from 'folds';
import * as css from '../../styles/CustomHtml.css';

interface HermesCardProps {
  children: ReactNode;
  page?: string;
  total?: string;
  actions?: HermesAction[];
}

interface HermesAction {
  action: string;
  label: string;
}

function parseActions(children: ReactNode): HermesAction[] {
  // Extract data-hermes-action spans from children
  const actions: HermesAction[] = [];
  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child) && child.type === 'span') {
      const props = child.props as Record<string, unknown>;
      if (props['data-hermes-action']) {
        const actionText = extractText(child);
        actions.push({
          action: props['data-hermes-action'] as string,
          label: actionText || (props['data-hermes-action'] as string),
        });
      }
    }
  });
  return actions;
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

  // Extract content and actions from children
  const contentParts: ReactNode[] = [];
  const actions: HermesAction[] = [];

  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child)) {
      const props = child.props as Record<string, unknown>;
      if (props['data-hermes-action'] || (child.type === 'span' && props['data-hermes-action'])) {
        actions.push({
          action: (props['data-hermes-action'] as string) || '',
          label: extractText(child) || (props['data-hermes-action'] as string) || '',
        });
      } else {
        contentParts.push(child);
      }
    } else {
      contentParts.push(child);
    }
  });

  const handleAction = (action: HermesAction) => {
    // Dispatch action event or send message
    const messageInput = document.querySelector('[contenteditable="true"]') as HTMLElement;
    if (messageInput) {
      const event = new CustomEvent('hermes-action', {
        detail: { action: action.action, label: action.label },
        bubbles: true,
      });
      messageInput.dispatchEvent(event);

      // Insert the action text into the composer
      const text = `/${action.action}`;
      if (messageInput) {
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
          {actions.map((action, idx) => (
            <Chip
              key={`${action.action}-${idx}`}
              variant="Primary"
              radii="Pill"
              onClick={() => handleAction(action)}
            >
              <Text size="B300">{action.label}</Text>
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
