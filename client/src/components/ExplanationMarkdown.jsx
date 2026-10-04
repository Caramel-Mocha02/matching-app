import ReactMarkdown from 'react-markdown'
import { Box, Stack, Typography } from '@mui/material'
import ThumbUpAltOutlinedIcon from '@mui/icons-material/ThumbUpAltOutlined'
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined'

import { POINT_COLORS } from '../lib/scoreTone.js'

// 見出しの言葉から、そのまとまりの色を決める（色は lib/scoreTone.js でまとめて管理）
const SECTION_STYLES = {
  good: { ...POINT_COLORS.good, icon: <ThumbUpAltOutlinedIcon sx={{ fontSize: 18 }} /> },
  caution: { ...POINT_COLORS.caution, icon: <ReportProblemOutlinedIcon sx={{ fontSize: 18 }} /> },
  other: { color: '#3a3336', bg: 'transparent', icon: null },
}
const toneOf = (title) => (title.includes('良い') ? 'good' : title.includes('注意') ? 'caution' : 'other')

// 「### 見出し」ごとに文章を分ける → [{ title, body }]（最初の見出しより前の文章は title が空）
function splitSections(markdown) {
  const sections = []
  let current = { title: '', body: [] }
  for (const line of markdown.split('\n')) {
    const heading = line.match(/^#{1,3}\s+(.*)$/)
    if (heading) {
      sections.push(current)
      current = { title: heading[1].trim(), body: [] }
    } else if (line.startsWith('>') && current.title) {
      // 最後のひとこと（> の行）は、直前の見出しの枠に入れず、独立させる
      sections.push(current)
      current = { title: '', body: [line] }
    } else {
      current.body.push(line)
    }
  }
  sections.push(current)
  return sections.filter((s) => s.title || s.body.join('').trim())
}

// まとまり1つ分の本文。太字（**キーワード**）はまとまりの色で強調する
function SectionBody({ markdown, color }) {
  return (
    <ReactMarkdown
      components={{
        p: ({ children }) => <Typography variant="body2" sx={{ lineHeight: 1.8, my: 0.5 }}>{children}</Typography>,
        ul: ({ children }) => <Box component="ul" sx={{ pl: 2.5, my: 0.5 }}>{children}</Box>,
        li: ({ children }) => (
          <Typography component="li" variant="body2" sx={{ lineHeight: 1.8, mb: 0.5 }}>{children}</Typography>
        ),
        strong: ({ children }) => <Box component="strong" sx={{ color, fontWeight: 700 }}>{children}</Box>,
        // 最後のひとこと（> で始まる行）は、ピンクの線で目立たせる
        blockquote: ({ children }) => (
          <Box sx={{ borderLeft: 4, borderColor: 'primary.main', bgcolor: '#fdeef2', px: 1.5, py: 0.5, mt: 1, borderRadius: 1 }}>
            {children}
          </Box>
        ),
      }}
    >
      {markdown}
    </ReactMarkdown>
  )
}

// AI が書いたマークダウンの説明文を、見出しごとに色分けして表示する
export default function ExplanationMarkdown({ markdown }) {
  return (
    <Stack spacing={1.5}>
      {splitSections(markdown).map((section, i) => {
        const style = SECTION_STYLES[toneOf(section.title)]
        return (
          <Box key={i} sx={{ bgcolor: style.bg, borderRadius: 2, px: section.title ? 1.5 : 0, py: section.title ? 1 : 0 }}>
            {section.title && (
              <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', color: style.color, mb: 0.5 }}>
                {style.icon}
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{section.title}</Typography>
              </Stack>
            )}
            <SectionBody markdown={section.body.join('\n')} color={style.color} />
          </Box>
        )
      })}
    </Stack>
  )
}
