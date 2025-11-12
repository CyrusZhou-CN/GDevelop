// @flow
import * as React from 'react';
import { I18n } from '@lingui/react';
import classes from './ChatBubble.module.css';
import Paper from '../../UI/Paper';
import ArrowTopThenLeft from '../../UI/CustomSvgIcons/ArrowTopThenLeft';
import IconButton from '../../UI/IconButton';
import GDevelopThemeContext from '../../UI/Theme/GDevelopThemeContext';
import { t } from '@lingui/macro';
import { type MessageDescriptor } from '../../Utils/i18n/MessageDescriptor.flow';

const styles = {
  chatBubble: {
    paddingTop: 5,
    paddingLeft: 16,
    paddingRight: 16,
    paddingBottom: 5,
  },
  assistantChatBubbleLight: {
    background: 'linear-gradient(90deg, #F5F5F7 77%, #EAE3FF 100%)',
  },
  assistantChatBubbleDark: {
    background: 'linear-gradient(90deg, #25252E 0%, #312442 100%)',
  },
};

type ChatBubbleProps = {|
  children: React.Node,
  feedbackButtons?: React.Node,
  role: 'assistant' | 'user',
  restoreProps?: {|
    onRestore: () => void,
    disabledReason?: MessageDescriptor,
  |},
|};

export const ChatBubble = ({
  children,
  feedbackButtons,
  role,
  restoreProps,
}: ChatBubbleProps) => {
  const theme = React.useContext(GDevelopThemeContext);
  const isLightTheme = theme.palette.type === 'light';

  return (
    <I18n>
      {({ i18n }) => (
        <div className={classes.chatBubbleContainer}>
          <div className={classes.chatBubbleRestoreArrow}>
            {restoreProps && (
              <IconButton
                size="small"
                onClick={restoreProps.onRestore}
                disabled={!!restoreProps.disabledReason}
                tooltip={
                  restoreProps.disabledReason
                    ? restoreProps.disabledReason
                    : t`Restore project to this point`
                }
                showTooltipEvenIfDisabled
              >
                <ArrowTopThenLeft fontSize="small" />
              </IconButton>
            )}
          </div>
          <Paper
            background={role === 'user' ? 'light' : 'medium'}
            style={{
              ...styles.chatBubble,
              ...(role === 'assistant'
                ? isLightTheme
                  ? styles.assistantChatBubbleLight
                  : styles.assistantChatBubbleDark
                : {}),
            }}
          >
            <div className={classes.chatBubbleContent}>{children}</div>
            {feedbackButtons}
          </Paper>
        </div>
      )}
    </I18n>
  );
};
