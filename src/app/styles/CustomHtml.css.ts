import { style } from '@vanilla-extract/css';
import { recipe } from '@vanilla-extract/recipes';
import { color, config, DefaultReset, toRem } from 'folds';
import { ContainerColor } from './ContainerColor.css';

export const MarginSpaced = style({
  marginBottom: config.space.S200,
  marginTop: config.space.S200,
  selectors: {
    '&:first-child': {
      marginTop: 0,
    },
    '&:last-child': {
      marginBottom: 0,
    },
  },
});

export const Paragraph = style([DefaultReset]);

export const Heading = style([
  DefaultReset,
  MarginSpaced,
  {
    marginTop: config.space.S400,
    selectors: {
      '&:first-child': {
        marginTop: 0,
      },
    },
  },
]);

export const BlockQuote = style([
  DefaultReset,
  MarginSpaced,
  {
    paddingLeft: config.space.S200,
    borderLeft: `${config.borderWidth.B700} solid ${color.SurfaceVariant.ContainerLine}`,
    fontStyle: 'italic',
  },
]);

const BaseCode = style({
  color: color.SurfaceVariant.OnContainer,
  background: color.SurfaceVariant.Container,
  border: `${config.borderWidth.B300} solid ${color.SurfaceVariant.ContainerLine}`,
  borderRadius: config.radii.R300,
});
const CodeFont = style({
  fontFamily: 'monospace',
});

export const Code = style([
  DefaultReset,
  BaseCode,
  CodeFont,
  {
    padding: `0 ${config.space.S100}`,
  },
]);

export const Spoiler = recipe({
  base: [
    DefaultReset,
    {
      padding: `0 ${config.space.S100}`,
      backgroundColor: color.SurfaceVariant.ContainerActive,
      borderRadius: config.radii.R300,
      selectors: {
        '&[aria-pressed=true]': {
          color: 'transparent',
        },
      },
    },
  ],
  variants: {
    active: {
      true: {
        color: 'transparent',
      },
    },
  },
});

export const CodeBlock = style([
  DefaultReset,
  BaseCode,
  MarginSpaced,
  {
    fontStyle: 'normal',
    position: 'relative',
    overflow: 'hidden',
  },
]);
export const CodeBlockHeader = style([
  ContainerColor({ variant: 'Surface' }),
  {
    padding: `0 ${config.space.S200} 0 ${config.space.S300}`,
    borderBottomWidth: config.borderWidth.B300,
    gap: config.space.S200,
  },
]);
export const CodeBlockInternal = style([
  CodeFont,
  {
    padding: `${config.space.S200} ${config.space.S200} 0`,
    minWidth: toRem(200),
  },
]);

export const CodeBlockBottomShadow = style({
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  pointerEvents: 'none',

  height: config.space.S400,
  background: `linear-gradient(to top, #00000022, #00000000)`,
});

const BaseList = style({});
export const List = style([
  BaseList,
  DefaultReset,
  MarginSpaced,
  {
    padding: `0 ${config.space.S100}`,
    paddingLeft: config.space.S600,
    selectors: {
      '& &': {
        marginTop: config.space.S200,
        marginBottom: config.space.S200,
      },
      'li:last-child &': {
        marginBottom: 0,
      },
    },
  },
]);

export const Img = style([
  DefaultReset,
  MarginSpaced,
  {
    maxWidth: toRem(296),
    borderRadius: config.radii.R300,
  },
]);

export const InlineChromiumBugfix = style({
  fontSize: 0,
  lineHeight: 0,
});

export const Mention = recipe({
  base: [
    DefaultReset,
    {
      backgroundColor: color.SurfaceVariant.Container,
      color: color.SurfaceVariant.OnContainer,
      boxShadow: `0 0 0 ${config.borderWidth.B300} ${color.SurfaceVariant.ContainerLine}`,
      padding: `0 ${toRem(2)}`,
      borderRadius: config.radii.R300,
      fontWeight: config.fontWeight.W500,
    },
  ],
  variants: {
    highlight: {
      true: {
        backgroundColor: color.Success.Container,
        color: color.Success.OnContainer,
        boxShadow: `0 0 0 ${config.borderWidth.B300} ${color.Success.ContainerLine}`,
      },
    },
    focus: {
      true: {
        boxShadow: `0 0 0 ${config.borderWidth.B300} ${color.SurfaceVariant.OnContainer}`,
      },
    },
  },
});

export const Command = recipe({
  base: [
    DefaultReset,
    {
      padding: `0 ${toRem(2)}`,
      borderRadius: config.radii.R300,
      fontWeight: config.fontWeight.W500,
    },
  ],
  variants: {
    focus: {
      true: {
        boxShadow: `0 0 0 ${config.borderWidth.B300} ${color.Warning.OnContainer}`,
      },
    },
    active: {
      true: {
        backgroundColor: color.Warning.Container,
        color: color.Warning.OnContainer,
        boxShadow: `0 0 0 ${config.borderWidth.B300} ${color.Warning.ContainerLine}`,
      },
    },
  },
});

export const EmoticonBase = style([
  DefaultReset,
  {
    display: 'inline-block',
    padding: '0.05rem',
    height: '1em',
    verticalAlign: 'middle',
  },
]);

export const Emoticon = recipe({
  base: [
    DefaultReset,
    {
      display: 'inline-flex',
      justifyContent: 'center',
      alignItems: 'center',

      height: '1em',
      minWidth: '1em',
      fontSize: '1.33em',
      lineHeight: '1em',
      verticalAlign: 'middle',
      position: 'relative',
      top: '-0.35em',
      borderRadius: config.radii.R300,
    },
  ],
  variants: {
    focus: {
      true: {
        boxShadow: `0 0 0 ${config.borderWidth.B300} ${color.SurfaceVariant.OnContainer}`,
      },
    },
  },
});

export const EmoticonImg = style([
  DefaultReset,
  {
    height: '1em',
    cursor: 'default',
  },
]);

export const highlightText = style([
  DefaultReset,
  {
    backgroundColor: 'yellow',
    color: 'black',
  },
]);

export const HermesCard = style([
  DefaultReset,
  {
    border: `1px solid ${color.Surface.ContainerLine}`,
    borderRadius: config.radii.R400,
    padding: config.space.S300,
    backgroundColor: color.Surface.Container,
  },
]);

export const HermesCardContent = style([
  DefaultReset,
  {},
]);

export const HermesCardActions = style([
  DefaultReset,
  {
    paddingTop: config.space.S200,
    borderTop: `1px solid ${color.Surface.ContainerLine}`,
  },
]);

// ── Telegram-style Model Switcher Card ──

// Outer card container
export const ModelCardPanel = style([
  DefaultReset,
  {
    border: `${config.borderWidth.B300} solid ${color.Surface.ContainerLine}`,
    borderRadius: config.radii.R500,
    backgroundColor: color.Surface.Container,
    overflow: 'hidden',
    margin: `${config.space.S200} 0`,
  },
]);

// Card header
export const ModelCardHeader = style([
  DefaultReset,
  {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${config.space.S300} ${config.space.S400}`,
    borderBottom: `${config.borderWidth.B300} solid ${color.Surface.ContainerLine}`,
    backgroundColor: color.SurfaceVariant.Container,
  },
]);

export const ModelCardTitle = style([
  DefaultReset,
  {
    fontWeight: config.fontWeight.W600,
    fontSize: config.fontSize.H5,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
]);

export const ModelCardPageIndicator = style([
  DefaultReset,
  {
    fontSize: config.fontSize.T200,
    color: color.SurfaceVariant.OnContainer,
    whiteSpace: 'nowrap',
    marginLeft: config.space.S200,
  },
]);

// Model list
export const ModelCardList = style([
  DefaultReset,
  {
    display: 'flex',
    flexDirection: 'column',
  },
]);

// Individual model row — large tap target, clear separation
export const ModelCardRow = style([
  DefaultReset,
  {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    padding: `${config.space.S300} ${config.space.S400}`,
    borderBottom: `${config.borderWidth.B300} solid ${color.Surface.ContainerLine}`,
    cursor: 'pointer',
    gap: config.space.S300,
    transition: 'background-color 0.15s ease',
    selectors: {
      '&:last-child': {
        borderBottom: 'none',
      },
      '&:hover': {
        backgroundColor: color.SurfaceVariant.Container,
      },
    },
  },
]);

// Active model row — green tint
export const ModelCardRowActive = style([
  ModelCardRow,
  {
    backgroundColor: color.Success.Container,
    borderLeft: `3px solid ${color.Success.Main}`,
    selectors: {
      '&:hover': {
        backgroundColor: color.Success.Container,
      },
    },
  },
]);

// Model info area (left side)
export const ModelCardRowInfo = style([
  DefaultReset,
  {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    minWidth: 0,
    flex: 1,
    paddingLeft: 0,
  },
]);

export const ModelCardRowName = style([
  DefaultReset,
  {
    fontWeight: config.fontWeight.W500,
    fontSize: config.fontSize.T300,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
]);

export const ModelCardRowProvider = style([
  DefaultReset,
  {
    fontSize: config.fontSize.T200,
    color: color.SurfaceVariant.OnContainer,
    display: 'flex',
    alignItems: 'center',
    gap: config.space.S100,
  },
]);

// Provider dot
export const ModelCardProviderDot = style([
  DefaultReset,
  {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: color.SurfaceVariant.OnContainer,
    opacity: 0.5,
    flexShrink: 0,
  },
]);

// Right side — action button area, MINIMUM 80px to avoid misclicks
export const ModelCardRowAction = style([
  DefaultReset,
  {
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
    minWidth: toRem(80),
    justifyContent: 'flex-end',
  },
]);

// Active badge — shows checkmark + "Active"
export const ModelCardActiveBadge = style([
  DefaultReset,
  {
    display: 'inline-flex',
    alignItems: 'center',
    gap: config.space.S100,
    padding: `${config.space.S100} ${config.space.S300}`,
    borderRadius: config.radii.Pill,
    backgroundColor: color.Success.Main,
    color: '#fff',
    fontSize: config.fontSize.T200,
    fontWeight: config.fontWeight.W500,
    whiteSpace: 'nowrap',
  },
]);

// Switch button
export const ModelCardSwitchBtn = style([
  DefaultReset,
  {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: `${config.space.S100} ${config.space.S300}`,
    borderRadius: config.radii.Pill,
    border: `${config.borderWidth.B300} solid ${color.Primary.Main}`,
    backgroundColor: 'transparent',
    color: color.Primary.Main,
    fontSize: config.fontSize.T200,
    fontWeight: config.fontWeight.W500,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    minWidth: toRem(64),
    transition: 'all 0.15s ease',
    selectors: {
      '&:hover': {
        backgroundColor: color.Primary.Main,
        color: '#fff',
      },
      '&[disabled]': {
        opacity: 0.4,
        cursor: 'default',
      },
    },
  },
]);

// Pagination footer
export const ModelCardFooter = style([
  DefaultReset,
  {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: config.space.S300,
    padding: `${config.space.S200} ${config.space.S400} ${config.space.S300}`,
    borderTop: `${config.borderWidth.B300} solid ${color.Surface.ContainerLine}`,
  },
]);

export const ModelCardPageBtn = style([
  DefaultReset,
  {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: toRem(32),
    height: toRem(32),
    borderRadius: config.radii.R300,
    border: 'none',
    backgroundColor: color.SurfaceVariant.Container,
    color: color.SurfaceVariant.OnContainer,
    cursor: 'pointer',
    fontSize: config.fontSize.T300,
    transition: 'background-color 0.15s ease',
    selectors: {
      '&:hover:not([disabled])': {
        backgroundColor: color.SurfaceVariant.ContainerActive,
      },
      '&[disabled]': {
        opacity: 0.3,
        cursor: 'default',
      },
    },
  },
]);

export const ModelCardPageNum = style([
  DefaultReset,
  {
    fontSize: config.fontSize.T200,
    color: color.SurfaceVariant.OnContainer,
    minWidth: toRem(40),
    textAlign: 'center',
  },
]);

// Empty state
export const ModelCardCloseBtn = style([
  DefaultReset,
  {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: toRem(28),
    height: toRem(28),
    borderRadius: config.radii.R300,
    border: 'none',
    backgroundColor: 'transparent',
    color: color.SurfaceVariant.OnContainer,
    opacity: 0.6,
    cursor: 'pointer',
    flexShrink: 0,
    marginLeft: 'auto',
    transition: 'opacity 0.15s ease',
    selectors: {
      '&:hover': {
        opacity: 1,
        backgroundColor: color.SurfaceVariant.ContainerActive,
      },
    },
  },
]);

export const ModelCardSearch = style([
  DefaultReset,
  {
    display: 'flex',
    alignItems: 'center',
    gap: config.space.S200,
    padding: `${config.space.S200} ${config.space.S400}`,
    borderBottom: `${config.borderWidth.B300} solid ${color.Surface.ContainerLine}`,
    backgroundColor: color.Surface.Container,
  },
]);

export const ModelCardSearchInput = style([
  DefaultReset,
  {
    width: '100%',
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    fontSize: config.fontSize.T300,
    color: color.Surface.OnContainer,
    padding: `${config.space.S100} 0`,
    '::placeholder': {
      color: color.SurfaceVariant.OnContainer,
      opacity: 0.6,
    },
  },
]);

export const ModelCardSearchIcon = style([
  DefaultReset,
  {
    display: 'flex',
    flexShrink: 0,
    color: color.SurfaceVariant.OnContainer,
    opacity: 0.5,
  },
]);

// Empty state
export const ModelCardEmpty = style([
  DefaultReset,
  {
    padding: config.space.S500,
    textAlign: 'center',
    fontSize: config.fontSize.T300,
    color: color.SurfaceVariant.OnContainer,
  },
]);
