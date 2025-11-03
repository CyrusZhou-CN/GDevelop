// @flow

import * as React from 'react';
import GDevelopThemeContext from '../UI/Theme/GDevelopThemeContext';
import { Trans } from '@lingui/macro';
import ReactMarkdown from 'react-markdown';

type Props = {|
  icon: React.Node,
  title: React.Node,
  children: string, // Markdown content
  type?: 'info' | 'warning' | 'tip' | 'note',
|};

const TextBasedCourseChapterCallout = ({
  icon,
  title,
  children,
  type = 'info',
}: Props) => {
  const gdevelopTheme = React.useContext(GDevelopThemeContext);

  const isDarkMode = gdevelopTheme.palette.type === 'dark';
  const backgroundColor = isDarkMode ? '#0f172a' : '#f3f4f6';
  const borderColor = isDarkMode
    ? 'rgba(255, 255, 255, 0.08)'
    : 'rgba(15, 23, 42, 0.15)';

  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        padding: 16,
        borderRadius: 8,
        borderColor,
        backgroundColor,
        alignItems: 'flex-start',
        fontFamily: gdevelopTheme.fontFamily || 'sans-serif',
      }}
    >
      <div style={{ fontSize: 24, lineHeight: 1 }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 'bold', marginBottom: 4 }}>{title}</div>

        <ReactMarkdown
          children={children}
          components={{
            p: ({ node, ...props }) => (
              <p style={{ margin: 0, lineHeight: 1.6 }} {...props} />
            ),
            code: ({ node, ...props }) => (
              <code
                style={{
                
                  padding: '2px 4px',
                  borderRadius: 4,
                  fontFamily: 'Menlo, Monaco, "Courier New", monospace',
                }}
                {...props}
              />
            ),
          }}
        />
      </div>
    </div>
  );
};

export default TextBasedCourseChapterCallout;
