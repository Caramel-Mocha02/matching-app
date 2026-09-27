import { createTheme } from '@mui/material/styles'

// アプリ全体の色・フォント・角丸などをここで一括管理する
const theme = createTheme({
  palette: {
    primary: { main: '#e0607e', light: '#f3a5b6' }, // やわらかいローズピンク
    secondary: { main: '#5b8def' },
    background: { default: '#fbf7f8', paper: '#ffffff' },
    text: { primary: '#3a3336' },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: '"Hiragino Sans", "Noto Sans JP", "Helvetica Neue", Arial, sans-serif',
    button: { textTransform: 'none', fontWeight: 600 },
  },
  // 部品ごとの共通デザイン
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { borderRadius: 999 } }, // 丸みのあるボタン
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { borderRadius: 16, border: '1px solid #f0e4e7', boxShadow: '0 2px 12px rgba(224, 96, 126, 0.06)' },
      },
    },
  },
})

export default theme
