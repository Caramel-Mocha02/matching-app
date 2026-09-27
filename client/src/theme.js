import { createTheme } from '@mui/material/styles'

// アプリ全体の色・フォント・角丸などをここで一括管理する
const theme = createTheme({
  palette: {
    primary: { main: '#e0607e' }, // やわらかいローズピンク
    secondary: { main: '#5b8def' },
    background: { default: '#fbf7f8' },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: '"Hiragino Sans", "Noto Sans JP", "Helvetica Neue", Arial, sans-serif',
    button: { textTransform: 'none', fontWeight: 600 },
  },
})

export default theme
