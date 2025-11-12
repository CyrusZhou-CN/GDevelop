// @flow
import * as React from 'react';
import { ChatBubble } from './ChatBubble';
import { Line } from '../../UI/Grid';
import { ChatMarkdownText } from './ChatMarkdownText';
import GDevelopThemeContext from '../../UI/Theme/GDevelopThemeContext';
import { getFunctionCallToFunctionCallOutputMap } from '../AiRequestUtils';
import { FunctionCallRow } from './FunctionCallRow';
import IconButton from '../../UI/IconButton';
import Like from '../../UI/CustomSvgIcons/Like';
import Dislike from '../../UI/CustomSvgIcons/Dislike';
import Copy from '../../UI/CustomSvgIcons/Copy';
import { Trans, t } from '@lingui/macro';
import {
  type AiRequest,
  type AiRequestMessageAssistantFunctionCall,
} from '../../Utils/GDevelopServices/Generation';
import {
  type EditorFunctionCallResult,
  type EditorCallbacks,
} from '../../EditorFunctions';
import classes from './ChatMessages.module.css';
import { DislikeFeedbackDialog } from './DislikeFeedbackDialog';
import LeftLoader from '../../UI/LeftLoader';
import Text from '../../UI/Text';
import AlertMessage from '../../UI/AlertMessage';
import {
  AiRequestContext,
  type ProjectSavesForAiRequest,
} from '../AiRequestContext';
import useAlertDialog from '../../UI/Alert/useAlertDialog';
import { type FileMetadataAndStorageProviderName } from '../../ProjectsStorage';

type Props = {|
  aiRequest: AiRequest,
  onSendFeedback: (
    aiRequestId: string,
    messageIndex: number,
    feedback: 'like' | 'dislike',
    reason?: string,
    freeFormDetails?: string
  ) => Promise<void>,
  editorFunctionCallResults: Array<EditorFunctionCallResult> | null,
  onProcessFunctionCalls: (
    functionCalls: Array<AiRequestMessageAssistantFunctionCall>,
    options: ?{|
      ignore?: boolean,
    |}
  ) => Promise<void>,
  editorCallbacks: EditorCallbacks,
  project: ?gdProject,
|};

export const ChatMessages = React.memo<Props>(function ChatMessages({
  aiRequest,
  onSendFeedback,
  editorFunctionCallResults,
  onProcessFunctionCalls,
  editorCallbacks,
  project,
}: Props) {
  const theme = React.useContext(GDevelopThemeContext);
  const {
    aiRequestProjectSaves: { projectSaves },
  } = React.useContext(AiRequestContext);
  const projectSavesForAiRequest: ProjectSavesForAiRequest = React.useMemo(
    () => projectSaves[aiRequest.id] || {},
    [aiRequest.id, projectSaves]
  );
  const { showAlert, showConfirmation } = useAlertDialog();

  const [messageFeedbacks, setMessageFeedbacks] = React.useState({});
  const [
    dislikeFeedbackDialogOpenedFor,
    setDislikeFeedbackDialogOpenedFor,
  ] = React.useState(null);

  const functionCallToFunctionCallOutput = getFunctionCallToFunctionCallOutputMap(
    {
      aiRequest,
    }
  );

  const onRestore = React.useCallback(
    async (messageIndex: number) => {
      if (!project) {
        await showAlert({
          title: t`Cannot restore project`,
          message: t`Open the project associated with this AI request to restore to this state.`,
        });
        return;
      }
      if (project.getProjectUuid() !== aiRequest.gameId) {
        await showAlert({
          title: t`Project mismatch`,
          message: t`The project associated with this AI request does not match the current project. Open the correct project to restore to this state.`,
        });
        return;
      }
      const projectSave = projectSavesForAiRequest[messageIndex];
      if (!projectSave) {
        await showAlert({
          title: t`No project save available`,
          message: t`No project save is available for this request message.`,
        });
        return;
      }

      const result = await showConfirmation({
        title: t`Restore project to this state?`,
        message: t`Are you sure you want to restore the project to the state saved at this point in the AI conversation? This will overwrite the current project state.`,
        confirmButtonLabel: t`Restore`,
        dismissButtonLabel: t`Cancel`,
        level: 'warning',
      });
      if (!result) return;

      const fileMetadataAndStorageProviderName: FileMetadataAndStorageProviderName = {
        fileIdentifier: 'random?', // id that links to project save?
        gameId: project.getProjectUuid(),
        // Assume it's the same as the current project.
        storageProviderName: getStorageProvider().internalName,
      };
      await openFromFileMetadataWithStorageProvider(
        fileMetadataAndStorageProviderName,
        {
          ignoreUnsavedChanges: true,
          openingMessage: t`Restoring project to previous version...`,
        }
      );
    },
    [aiRequest, project, showAlert, showConfirmation, projectSavesForAiRequest]
  );

  const getRestoreDisabledReason = React.useCallback(
    (messageIndex: number) => {
      if (!project) {
        return t`Open the project associated with this AI request to restore to this state.`;
      }
      if (project.getProjectUuid() !== aiRequest.gameId) {
        return t`The project associated with this AI request does not match the current project. Open the correct project to restore to this state.`;
      }
      if (!projectSavesForAiRequest[messageIndex]) {
        return t`No project save is available for this message.`;
      }
      return undefined;
    },
    [aiRequest.gameId, project, projectSavesForAiRequest]
  );

  return (
    <>
      {aiRequest.output.flatMap((message, messageIndex) => {
        if (message.type === 'message' && message.role === 'user') {
          return [
            <Line key={messageIndex} justifyContent="flex-end">
              <ChatBubble
                role="user"
                restoreProps={{
                  onRestore: () => {
                    onRestore(messageIndex);
                  },
                  disabledReason: getRestoreDisabledReason(messageIndex),
                }}
              >
                <ChatMarkdownText
                  source={message.content
                    .map(messageContent => messageContent.text)
                    .join('\n')}
                />
              </ChatBubble>
            </Line>,
          ];
        }
        if (message.type === 'message' && message.role === 'assistant') {
          return [
            ...message.content
              .map((messageContent, messageContentIndex) => {
                const key = `messageIndex${messageIndex}-${messageContentIndex}`;
                if (messageContent.type === 'output_text') {
                  const feedbackKey = `${messageIndex}-${messageContentIndex}`;
                  const currentFeedback = messageFeedbacks[feedbackKey];

                  const trimmedText = messageContent.text.trim();
                  if (!trimmedText) {
                    // Sometimes the AI can return an empty string or a string with just a line break.
                    return null;
                  }

                  return (
                    <Line key={key} justifyContent="flex-start">
                      <ChatBubble
                        role="assistant"
                        feedbackButtons={
                          <div className={classes.feedbackButtonsContainer}>
                            <IconButton
                              size="small"
                              tooltip={t`Copy`}
                              onClick={() => {
                                navigator.clipboard.writeText(
                                  messageContent.text
                                );
                              }}
                            >
                              <Copy fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              tooltip={t`This was helpful`}
                              onClick={() => {
                                setMessageFeedbacks({
                                  ...messageFeedbacks,
                                  [feedbackKey]: 'like',
                                });
                                onSendFeedback(
                                  aiRequest.id,
                                  messageIndex,
                                  'like'
                                );
                              }}
                            >
                              <Like
                                fontSize="small"
                                htmlColor={
                                  currentFeedback === 'like'
                                    ? theme.message.valid
                                    : undefined
                                }
                              />
                            </IconButton>
                            <IconButton
                              size="small"
                              tooltip={t`This needs improvement`}
                              onClick={() => {
                                setMessageFeedbacks({
                                  ...messageFeedbacks,
                                  [feedbackKey]: 'dislike',
                                });
                                setDislikeFeedbackDialogOpenedFor({
                                  aiRequestId: aiRequest.id,
                                  messageIndex,
                                });
                              }}
                            >
                              <Dislike
                                fontSize="small"
                                htmlColor={
                                  currentFeedback === 'dislike'
                                    ? theme.message.warning
                                    : undefined
                                }
                              />
                            </IconButton>
                          </div>
                        }
                      >
                        <ChatMarkdownText source={trimmedText} />
                      </ChatBubble>
                    </Line>
                  );
                }
                if (messageContent.type === 'reasoning') {
                  return (
                    <Line key={key} justifyContent="flex-start">
                      <ChatBubble role="assistant">
                        <ChatMarkdownText
                          source={messageContent.summary.text}
                        />
                      </ChatBubble>
                    </Line>
                  );
                }
                if (messageContent.type === 'function_call') {
                  const existingFunctionCallOutput = functionCallToFunctionCallOutput.get(
                    messageContent
                  );
                  // If there is already an existing function call output,
                  // there can't be an editor function call result.
                  // Indeed, sometimes, two functions will
                  // have the same call_id (because of the way some LLM APIs are implemented).
                  // The editorFunctionCallResult always applies to the last function call,
                  // which has no function call output associated to it yet.
                  const editorFunctionCallResult =
                    (!existingFunctionCallOutput &&
                      editorFunctionCallResults &&
                      editorFunctionCallResults.find(
                        functionCallOutput =>
                          functionCallOutput.call_id === messageContent.call_id
                      )) ||
                    null;
                  return (
                    <FunctionCallRow
                      project={project}
                      key={key}
                      onProcessFunctionCalls={onProcessFunctionCalls}
                      functionCall={messageContent}
                      editorFunctionCallResult={editorFunctionCallResult}
                      existingFunctionCallOutput={existingFunctionCallOutput}
                      editorCallbacks={editorCallbacks}
                    />
                  );
                }
                return null;
              })
              .filter(Boolean),
          ];
        }
        if (message.type === 'function_call_output') {
          return [];
        }

        return [];
      })}

      {aiRequest.status === 'error' ? (
        <Line justifyContent="flex-start">
          <AlertMessage kind="error">
            <Trans>
              The AI encountered an error while handling your request - this was
              request was not counted in your AI usage. Try again later.
            </Trans>
          </AlertMessage>
        </Line>
      ) : aiRequest.status === 'working' ? (
        <Line justifyContent="flex-start">
          <div className={classes.thinkingText}>
            <LeftLoader isLoading>
              <Text noMargin displayInlineAsSpan>
                <Trans>Thinking about your request...</Trans>
              </Text>
            </LeftLoader>
          </div>
        </Line>
      ) : null}
      {dislikeFeedbackDialogOpenedFor && (
        <DislikeFeedbackDialog
          mode={aiRequest.mode || 'chat'}
          open
          onClose={() => setDislikeFeedbackDialogOpenedFor(null)}
          onSendFeedback={(reason: string, freeFormDetails: string) => {
            onSendFeedback(
              dislikeFeedbackDialogOpenedFor.aiRequestId,
              dislikeFeedbackDialogOpenedFor.messageIndex,
              'dislike',
              reason,
              freeFormDetails
            );
          }}
        />
      )}
    </>
  );
});
