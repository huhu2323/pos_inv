/** Design tokens from Stitch project "Unified POS Management System" (Precision POS). */
export const stitchDesignTokens = {
  fonts: {
    headline: '"Hanken Grotesk", "Roboto", "Helvetica", "Arial", sans-serif',
    body: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    mono: '"JetBrains Mono", "Roboto Mono", "Courier New", monospace',
  },
  layout: {
    sidebarWidth: 280,
    sidebarCollapsedWidth: 76,
    cartSummaryWidth: 400,
    touchTargetMin: 48,
  },
  shape: {
    borderRadius: 4,
    borderRadiusLg: 8,
    borderRadiusXl: 12,
  },
  light: {
    primary: {
      main: '#003d9b',
      dark: '#002e75',
      light: '#0052cc',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#00687b',
      dark: '#004e5d',
      light: '#50dcff',
      contrastText: '#ffffff',
    },
    success: {
      main: '#006844',
      dark: '#004e32',
      light: '#72e9af',
      contrastText: '#ffffff',
    },
    error: {
      main: '#ba1a1a',
      dark: '#93000a',
      light: '#ffdad6',
      contrastText: '#ffffff',
    },
    warning: {
      main: '#ed6c02',
      dark: '#e65100',
      light: '#ffb74d',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f9f9ff',
      paper: '#ffffff',
    },
    surface: {
      container: '#e8edff',
      containerHigh: '#e0e8ff',
      variant: '#d7e2ff',
    },
    text: {
      primary: '#041b3c',
      secondary: '#434654',
    },
    divider: '#c3c6d6',
    outline: '#737685',
  },
  dark: {
    primary: {
      main: '#b2c5ff',
      dark: '#90caf9',
      light: '#dae2ff',
      contrastText: '#001848',
    },
    secondary: {
      main: '#48d7f9',
      dark: '#29b6f6',
      light: '#afecff',
      contrastText: '#001f27',
    },
    success: {
      main: '#65dca4',
      dark: '#72e9af',
      light: '#82f9be',
      contrastText: '#002113',
    },
    error: {
      main: '#ffb4ab',
      dark: '#ff8a80',
      light: '#ffdad6',
      contrastText: '#690005',
    },
    warning: {
      main: '#ffb74d',
      dark: '#ffa726',
      light: '#ffcc80',
      contrastText: '#1a1000',
    },
    background: {
      default: '#041b3c',
      paper: '#1d3052',
    },
    surface: {
      container: '#122131',
      containerHigh: '#1c2b3c',
      variant: '#273647',
    },
    text: {
      primary: '#edf0ff',
      secondary: '#c7c4d7',
    },
    divider: '#464554',
    outline: '#908fa0',
  },
} as const

export const monoFontFamily = stitchDesignTokens.fonts.mono
