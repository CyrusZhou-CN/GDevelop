// @flow
import * as React from 'react';
import Fuse from 'fuse.js';
import { I18n } from '@lingui/react';
import { type I18n as I18nType } from '@lingui/core';
import { t, Trans } from '@lingui/macro';

import {
  createTree,
  type InstructionOrExpressionTreeNode,
  findInTree,
} from '../../InstructionOrExpression/CreateTree';
import {
  enumerateAllInstructions,
  enumerateFreeInstructions,
} from '../../InstructionOrExpression/EnumerateInstructions';
import {
  type EnumeratedInstructionMetadata,
  filterEnumeratedInstructionOrExpressionMetadataByScope,
} from '../../InstructionOrExpression/EnumeratedInstructionOrExpressionMetadata';
import { List, type ListItemRefType } from '../../UI/List';
import SearchBar, { type SearchBarInterface } from '../../UI/SearchBar';
import ScrollView, { type ScrollViewInterface } from '../../UI/ScrollView';
import { Tabs } from '../../UI/Tabs';
import { enumerateObjectsAndGroups } from '../../ObjectsList/EnumerateObjects';
import RaisedButton from '../../UI/RaisedButton';
import { ResponsiveLineStackLayout } from '../../UI/Layout';
import { renderInstructionOrExpressionTree } from './SelectorListItems/SelectorInstructionsTreeListItem';
import EmptyMessage from '../../UI/EmptyMessage';
import { getInstructionListItemValue } from './SelectorListItems/Keys';
import { type EventsScope } from '../../InstructionOrExpression/EventsScope';
import {
  type SearchResult,
  tuneMatches,
  sharedFuseConfiguration,
  getFuseSearchQueryForMultipleKeys,
} from '../../UI/Search/UseSearchStructuredItem';
import { Column, Line } from '../../UI/Grid';
import Add from '../../UI/CustomSvgIcons/Add';
import getObjectByName from '../../Utils/GetObjectByName';
import { enumerateFoldersInContainer } from '../../ObjectsList/EnumerateObjectFolderOrObject';
import { ProjectScopedContainersAccessor } from '../../InstructionOrExpression/EventsScope';
import ReadOnlyTreeView, {
  type ReadOnlyTreeViewInterface,
} from '../../UI/TreeView/ReadOnlyTreeView';
import { AutoSizer } from 'react-virtualized';
import { mapFor } from '../../Utils/MapFor';
import {
  getObjectTreeViewItemId,
  getObjectFolderTreeViewItemId,
  InstructionTreeViewItemContent,
  ObjectTreeViewItemContent,
  ObjectFolderTreeViewItem,
  GroupTreeViewItem,
  ObjectGroupTreeViewItemContent,
  ObjectGroupObjectTreeViewItemContent,
  RootTreeViewItem,
  LabelTreeViewItemContent,
  LeafTreeViewItem,
  type TreeViewItem,
  MoreResultsTreeViewItemContent,
} from './TreeViewItems';
import ObjectsRenderingService from '../../ObjectsRendering/ObjectsRenderingService';
import getObjectGroupByName from '../../Utils/GetObjectGroupByName';
import useForceUpdate from '../../Utils/UseForceUpdate';

const gd: libGDevelop = global.gd;

const ICON_SIZE = 24;
const DISPLAYED_INSTRUCTIONS_MAX_LENGTH = 20;
const getInstructionIconSrc = (key: string) => {
  return gd.JsPlatform.get()
    .getInstructionOrExpressionGroupMetadata(key)
    .getIcon();
};

export const styles = {
  noObjectsText: { opacity: 0.7 },
  indentedListItem: { paddingLeft: 45 },
};

export type TabName = 'objects' | 'free-instructions';

const moveDeprecatedInstructionsDown = (
  results: Array<SearchResult<EnumeratedInstructionMetadata>>
) => {
  const deprecatedResults = results.filter(result =>
    result.item.fullGroupName.includes('deprecated')
  );
  const notDeprecatedResults = results.filter(
    result => !result.item.fullGroupName.includes('deprecated')
  );
  return [...notDeprecatedResults, ...deprecatedResults];
};

const shouldApplySearchToItem = (item: TreeViewItem) =>
  item.content.applySearch;
const getTreeViewItemHeight = (item: TreeViewItem) =>
  item.content instanceof InstructionTreeViewItemContent ||
  item.content instanceof MoreResultsTreeViewItemContent
    ? 44
    : 32;
const getTreeViewItemName = (item: TreeViewItem) => item.content.getName();
const getTreeViewItemDescription = (item: TreeViewItem) =>
  item.content.getDescription();
const getTreeViewItemId = (item: TreeViewItem) => item.content.getId();
const getTreeViewItemHtmlId = (item: TreeViewItem, index: number) =>
  item.content.getHtmlId(index);

const getTreeViewItemThumbnail = (item: TreeViewItem) =>
  item.content.getThumbnail();
const getTreeViewItemDataset = (item: TreeViewItem) =>
  item.content.getDataSet();

type Props = {|
  project: gdProject,
  projectScopedContainersAccessor: ProjectScopedContainersAccessor,
  scope: EventsScope,
  currentTab: TabName,
  onChangeTab: TabName => void,
  isCondition: boolean,
  focusOnMount?: boolean,
  chosenInstructionType: ?string,
  onChooseInstruction: (type: string, EnumeratedInstructionMetadata) => void,
  chosenObjectName: ?string,
  onChooseObject: (objectName: string) => void,
  onSearchStartOrReset?: () => void,
  style?: Object,
  onClickMore?: () => void,
  i18n: I18nType,
|};

export type InstructionOrObjectSelectorInterface = {|
  reEnumerateInstructions: (i18n: I18nType) => void,
|};

const InstructionOrObjectSelector = React.forwardRef<
  Props,
  InstructionOrObjectSelectorInterface
>(
  (
    {
      project,
      projectScopedContainersAccessor,
      scope,
      currentTab,
      onChangeTab,
      isCondition,
      focusOnMount,
      chosenInstructionType,
      onChooseInstruction,
      chosenObjectName,
      onChooseObject,
      onSearchStartOrReset,
      style,
      onClickMore,
      i18n,
    },
    ref
  ) => {
    const searchBarRef = React.useRef<?SearchBarInterface>(null);
    const scrollViewRef = React.useRef<?ScrollViewInterface>(null);
    const treeViewRef = React.useRef<?ReadOnlyTreeViewInterface<TreeViewItem>>(
      null
    );
    const selectedInstructionItemRef = React.useRef<?ListItemRefType>(null);
    // Free instructions, to be displayed in a tab next to the objects.
    const freeInstructionsInfoTreeRef = React.useRef<InstructionOrExpressionTreeNode>(
      createTree(
        filterEnumeratedInstructionOrExpressionMetadataByScope(
          enumerateFreeInstructions(isCondition, i18n),
          scope
        )
      )
    );
    const initialInstructionTypePathRef = React.useRef<?Array<string>>(
      findInTree(freeInstructionsInfoTreeRef.current, chosenInstructionType)
    );
    // All the instructions, to be used when searching, so that the search is done
    // across all the instructions (including object and behaviors instructions).
    const allInstructionsInfoRef = React.useRef<
      Array<EnumeratedInstructionMetadata>
    >(
      filterEnumeratedInstructionOrExpressionMetadataByScope(
        enumerateAllInstructions(isCondition, i18n),
        scope
      )
    );
    const instructionSearchApiRef = React.useRef<Fuse>(
      new Fuse(allInstructionsInfoRef.current, {
        ...sharedFuseConfiguration,
        keys: [
          { name: 'displayedName', weight: 5 },
          { name: 'fullGroupName', weight: 1 },
          { name: 'description', weight: 3 },
        ],
      })
    );

    const [searchText, setSearchText] = React.useState<string>('');
    const [searchResults, setSearchResults] = React.useState<{
      instructions: Array<SearchResult<EnumeratedInstructionMetadata>>,
    }>({ instructions: [] });
    const [selectedItem, setSelectedItem] = React.useState<?TreeViewItem>(null);

    // The objects must never be kept in a state as they may be temporary copies.
    // Search for "ProjectScopedContainers wrongly containing temporary objects containers or objects"
    // in the codebase.
    const objectsContainersList = projectScopedContainersAccessor
      .get()
      .getObjectsContainersList();

    if (objectsContainersList.getObjectsContainersCount() === 0) {
      throw new Error(
        'Used InstructionOrObjectSelector without any object container.'
      );
    }
    // TODO Use a loop instead of looking for 2 object containers.
    if (objectsContainersList.getObjectsContainersCount() > 2) {
      console.error(
        'Used InstructionOrObjectSelector with more than 2 object containers.'
      );
    }
    const globalObjectsContainer =
      objectsContainersList.getObjectsContainersCount() > 1
        ? objectsContainersList.getObjectsContainer(0)
        : null;
    const objectsContainer = objectsContainersList.getObjectsContainer(
      objectsContainersList.getObjectsContainersCount() - 1
    );

    const initiallyOpenedFolderIdsRef = React.useRef<string[]>(
      [
        ...(globalObjectsContainer
          ? enumerateFoldersInContainer(globalObjectsContainer).map(
              folderWithPath => folderWithPath.folder
            )
          : []),
        ...enumerateFoldersInContainer(objectsContainer).map(
          folderWithPath => folderWithPath.folder
        ),
      ].map(getObjectFolderTreeViewItemId)
    );

    const forceUpdate = useForceUpdate();

    const reEnumerateInstructions = React.useCallback(
      (i18n: I18nType) => {
        freeInstructionsInfoTreeRef.current = createTree(
          filterEnumeratedInstructionOrExpressionMetadataByScope(
            enumerateFreeInstructions(isCondition, i18n),
            scope
          )
        );
        forceUpdate();
      },
      [forceUpdate, isCondition, scope]
    );

    React.useImperativeHandle(ref, () => ({ reEnumerateInstructions }));

    React.useLayoutEffect(
      () => {
        if (selectedInstructionItemRef.current && scrollViewRef.current) {
          scrollViewRef.current.scrollTo(selectedInstructionItemRef.current);
        }
        if (chosenObjectName) {
          const objectOrGroupName = chosenObjectName;
          const treeView = treeViewRef.current;
          if (!treeView) return;
          const object = getObjectByName(
            globalObjectsContainer,
            objectsContainer,
            objectOrGroupName
          );
          let itemId;
          if (object) {
            itemId = getObjectTreeViewItemId(object);
          } else {
            const group = getObjectGroupByName(
              globalObjectsContainer,
              objectsContainer,
              objectOrGroupName
            );
            if (group) {
              itemId = getObjectTreeViewItemId(group);
            }
          }
          if (!!itemId) {
            treeView.scrollToItemFromId(itemId, 'start');
          }
        }
      },
      [globalObjectsContainer, objectsContainer, chosenObjectName]
    );

    const getTreeViewItemChildren = (item: TreeViewItem) =>
      item.getChildren(searchText);

    const search = (searchText: string) => {
      if (!searchText) return;

      const matchingInstructions = moveDeprecatedInstructionsDown(
        instructionSearchApiRef.current
          .search(
            getFuseSearchQueryForMultipleKeys(searchText, [
              'displayedName',
              'fullGroupName',
              'description',
            ])
          )
          .map(result => ({
            item: result.item,
            matches: tuneMatches(result, searchText),
          }))
      );

      setSearchResults({ instructions: matchingInstructions });
    };

    const onSubmitSearch = () => {
      if (!searchText) return;
      // TODO: Add possibility to chose first object/group when submitting search.
      if (displayedInstructionsList.length > 0) {
        onChooseInstruction(
          displayedInstructionsList[0].item.type,
          displayedInstructionsList[0].item
        );
      }
    };

    React.useEffect(
      () => {
        if (treeViewRef.current) treeViewRef.current.updateRowHeights();
      },
      [searchText]
    );

    if (objectsContainersList.getObjectsContainersCount() === 0) {
      throw new Error(
        'Called InstructionOrObjectSelector without any object container.'
      );
    }

    // If the global objects container is not the project, consider that we're
    // not in the events of a layout or an external events sheet - but in an extension.
    const isOutsideLayout = globalObjectsContainer !== project;

    const { allObjectsList } = enumerateObjectsAndGroups(objectsContainersList);

    const isSearching = !!searchText;

    let filteredInstructionsList = [];

    if (isSearching) {
      filteredInstructionsList = searchResults.instructions;
    }
    const displayedInstructionsList = filteredInstructionsList.slice(
      0,
      DISPLAYED_INSTRUCTIONS_MAX_LENGTH
    );

    const remainingResultsCount = isSearching
      ? Math.max(
          filteredInstructionsList.length - DISPLAYED_INSTRUCTIONS_MAX_LENGTH,
          0
        )
      : 0;

    const hasResults = !isSearching || !!displayedInstructionsList.length;

    const globalObjectsRootFolder = globalObjectsContainer
      ? globalObjectsContainer.getRootFolder()
      : null;
    const objectsRootFolder = objectsContainer.getRootFolder();
    const groups = objectsContainer.getObjectGroups();
    const hasGroups = groups.count() > 0;
    const globalGroups = globalObjectsContainer
      ? globalObjectsContainer.getObjectGroups()
      : null;
    const hasGlobalGroups = globalGroups ? globalGroups.count() > 0 : false;

    const objectTreeViewItemProps = {
      project,
      getThumbnail: ObjectsRenderingService.getThumbnail.bind(
        ObjectsRenderingService
      ),
    };
    const objectFolderTreeViewItemProps = {
      project,
    };

    const getTreeViewItems = i18n =>
      [
        new ObjectFolderTreeViewItem({
          objectFolderOrObject: objectsRootFolder,
          global: false,
          isRoot: true,
          content: new LabelTreeViewItemContent(
            'scene-objects',
            i18n._(t`Scene Objects`)
          ),
          objectTreeViewItemProps,
          objectFolderTreeViewItemProps,
        }),
        globalObjectsRootFolder
          ? new ObjectFolderTreeViewItem({
              objectFolderOrObject: globalObjectsRootFolder,
              global: true,
              isRoot: true,
              content: new LabelTreeViewItemContent(
                'global-objects',
                i18n._(t`Global Objects`)
              ),
              objectTreeViewItemProps,
              objectFolderTreeViewItemProps,
            })
          : null,
        hasGroups
          ? new RootTreeViewItem(
              new LabelTreeViewItemContent('scene-groups', i18n._(t`Groups`)),
              mapFor(0, groups.count(), index => {
                const group = groups.getAt(index);
                return new GroupTreeViewItem(
                  new ObjectGroupTreeViewItemContent(group),
                  group,
                  globalObjectsContainer,
                  objectsContainer,
                  objectTreeViewItemProps
                );
              })
            )
          : null,
        hasGlobalGroups && globalGroups
          ? new RootTreeViewItem(
              new LabelTreeViewItemContent(
                'global-groups',
                i18n._(t`Global Groups`)
              ),
              mapFor(0, globalGroups.count(), index => {
                const group = globalGroups.getAt(index);
                return new GroupTreeViewItem(
                  new ObjectGroupTreeViewItemContent(group),
                  group,
                  globalObjectsContainer,
                  objectsContainer,
                  objectTreeViewItemProps
                );
              })
            )
          : null,
        displayedInstructionsList.length > 0
          ? new RootTreeViewItem(
              new LabelTreeViewItemContent(
                'instructions',
                i18n._(isCondition ? t`Conditions` : t`Actions`)
              ),
              [
                ...displayedInstructionsList.map(searchResult => {
                  return new LeafTreeViewItem(
                    new InstructionTreeViewItemContent(searchResult.item)
                  );
                }),
                remainingResultsCount
                  ? new LeafTreeViewItem(
                      new MoreResultsTreeViewItemContent(
                        i18n._(t`And ${remainingResultsCount} more results.`),
                        i18n._(
                          t`Refine your search with more specific keywords.`
                        )
                      )
                    )
                  : null,
              ].filter(Boolean)
            )
          : null,
      ].filter(Boolean);

    return (
      <I18n>
        {({ i18n }) => (
          <div
            id="instruction-or-object-selector"
            style={{
              // Important for the component to not take the full height in a dialog,
              // allowing to let the scrollview do its job.
              minHeight: 0,
              ...style,
            }}
          >
            <SearchBar
              id="search-bar"
              value={searchText}
              onChange={newSearchText => {
                const oldSearchText = searchText;
                if (!!newSearchText) search(newSearchText);
                setSearchText(newSearchText);
                // Notify if needed that we started or cleared a search
                if (
                  (!oldSearchText && newSearchText) ||
                  (oldSearchText && !newSearchText)
                ) {
                  if (onSearchStartOrReset) onSearchStartOrReset();
                }
              }}
              onRequestSearch={onSubmitSearch}
              ref={searchBarRef}
              autoFocus={focusOnMount ? 'desktop' : undefined}
              placeholder={
                isCondition
                  ? t`Search objects or conditions`
                  : t`Search objects or actions`
              }
            />
            {!isSearching && (
              <Line>
                <Column expand noMargin>
                  <Tabs
                    value={currentTab}
                    onChange={onChangeTab}
                    options={[
                      {
                        label: <Trans>Objects</Trans>,
                        value: 'objects',
                      },
                      {
                        label: isCondition ? (
                          <Trans>Other conditions</Trans>
                        ) : (
                          <Trans>Other actions</Trans>
                        ),
                        value: 'free-instructions',
                      },
                    ]}
                  />
                </Column>
              </Line>
            )}
            {currentTab === 'objects' ? (
              <div style={{ flex: 1 }}>
                <AutoSizer style={{ width: '100%' }} disableWidth>
                  {({ height }) => (
                    <ReadOnlyTreeView
                      ref={treeViewRef}
                      height={height}
                      estimatedItemSize={32}
                      items={getTreeViewItems(i18n)}
                      getItemHeight={getTreeViewItemHeight}
                      getItemName={getTreeViewItemName}
                      shouldApplySearchToItem={shouldApplySearchToItem}
                      getItemDescription={getTreeViewItemDescription}
                      getItemId={getTreeViewItemId}
                      getItemHtmlId={getTreeViewItemHtmlId}
                      getItemChildren={getTreeViewItemChildren}
                      getItemThumbnail={getTreeViewItemThumbnail}
                      getItemDataset={getTreeViewItemDataset}
                      selectedItems={selectedItem ? [selectedItem] : []}
                      initiallyOpenedNodeIds={[
                        'scene-objects',
                        'global-objects',
                        'scene-groups',
                        'global-groups',
                        ...initiallyOpenedFolderIdsRef.current,
                      ]}
                      onSelectItems={(items: TreeViewItem[]) => {
                        if (!items) return;
                        const item = items[0];
                        if (!item || item.isRoot) return;
                        const itemContentToSelect = item.content;
                        if (
                          itemContentToSelect instanceof
                          ObjectTreeViewItemContent
                        ) {
                          const objectFolderOrObjectToSelect = itemContentToSelect.getObjectFolderOrObject();
                          if (
                            !objectFolderOrObjectToSelect ||
                            objectFolderOrObjectToSelect.isFolder()
                          ) {
                            return;
                          }
                          onChooseObject(
                            objectFolderOrObjectToSelect.getObject().getName()
                          );
                          setSelectedItem(item);
                        } else if (
                          itemContentToSelect instanceof
                          ObjectGroupTreeViewItemContent
                        ) {
                          const group = itemContentToSelect.getGroup();
                          if (!group) return;
                          onChooseObject(group.getName());
                          setSelectedItem(item);
                        } else if (
                          itemContentToSelect instanceof
                          ObjectGroupObjectTreeViewItemContent
                        ) {
                          const object = itemContentToSelect.getObject();
                          if (!object) return;
                          onChooseObject(object.getName());
                          setSelectedItem(item);
                        } else if (
                          itemContentToSelect instanceof
                          InstructionTreeViewItemContent
                        ) {
                          const instructionMetadata = itemContentToSelect.getInstructionMetadata();
                          if (!instructionMetadata) return;
                          onChooseInstruction(
                            instructionMetadata.type,
                            instructionMetadata
                          );
                          setSelectedItem(item);
                        }
                      }}
                      searchText={searchText}
                      multiSelect={false}
                    />
                  )}
                </AutoSizer>
              </div>
            ) : (
              <ScrollView ref={scrollViewRef} autoHideScrollbar>
                <List>
                  <>
                    {renderInstructionOrExpressionTree({
                      instructionTreeNode: freeInstructionsInfoTreeRef.current,
                      onChoose: onChooseInstruction,
                      iconSize: ICON_SIZE,
                      useSubheaders: true,
                      selectedValue: chosenInstructionType
                        ? getInstructionListItemValue(chosenInstructionType)
                        : undefined,
                      initiallyOpenedPath:
                        initialInstructionTypePathRef.current,
                      selectedItemRef: selectedInstructionItemRef,
                      getGroupIconSrc: getInstructionIconSrc,
                    })}
                    {onClickMore && (
                      <ResponsiveLineStackLayout justifyContent="center">
                        <RaisedButton
                          primary
                          icon={<Add />}
                          onClick={onClickMore}
                          label={
                            isCondition ? (
                              <Trans>
                                Search for new conditions in extensions
                              </Trans>
                            ) : (
                              <Trans>
                                Search for new actions in extensions
                              </Trans>
                            )
                          }
                        />
                      </ResponsiveLineStackLayout>
                    )}
                  </>
                </List>
                {/* <List>
                {(isSearching || currentTab === 'objects') && (
                    <React.Fragment>
                      {filteredObjectsList.map(
                        ({ item: objectWithContext, matches }, index) =>
                          renderObjectListItem({
                            project: project,
                            objectWithContext: objectWithContext,
                            iconSize: iconSize,
                            onClick: () =>
                              onChooseObject(
                                objectWithContext.object.getName()
                              ),
                            matchesCoordinates: matches.length
                              ? matches[0].indices // Only field for objects is their name
                              : [],
                            selectedValue: chosenObjectName
                              ? getObjectOrObjectGroupListItemValue(
                                  chosenObjectName
                                )
                              : undefined,
                            id: 'object-item-' + index,
                            data: {
                              objectName: objectWithContext.object.getName(),
                            },
                          })
                      )}

                      {displayedObjectGroupsList.length > 0 && (
                        <Subheader>
                          <Trans>Object groups</Trans>
                        </Subheader>
                      )}
                      {displayedObjectGroupsList.map(
                        ({ item: groupWithContext, matches }, index) => {
                          const results = [];

                          results.push(
                            renderGroupObjectsListItem({
                              id: 'objectGroup-item-' + index,
                              data: {
                                objectName: groupWithContext.group.getName(),
                              },
                              groupWithContext,
                              iconSize,
                              onClick: () =>
                                onChooseObject(
                                  groupWithContext.group.getName()
                                ),
                              matchesCoordinates: matches.length
                                ? matches[0].indices // Only field for groups is their name
                                : [],
                              selectedValue: chosenObjectName
                                ? getObjectOrObjectGroupListItemValue(
                                    chosenObjectName
                                  )
                                : undefined,
                            })
                          );
                          if (isSearching) {
                            const { group, global } = groupWithContext;
                            const groupName = group.getName();
                            const objectsInGroup = group
                              .getAllObjectsNames()
                              .toJSArray()
                              .map(objectName => {
                                // A global object group can contain scene objects so we cannot use
                                // the group context to get directly get the object knowing the
                                // appropriate container.
                                const object = getObjectByName(
                                  globalObjectsContainer,
                                  objectsContainer,
                                  objectName
                                );
                                if (!object) return null;

                                return renderObjectListItem({
                                  project,
                                  objectWithContext: {
                                    object,
                                    global,
                                  },
                                  keyPrefix: `group-${groupName}`,
                                  withIndent: true,
                                  iconSize,
                                  onClick: () => onChooseObject(objectName),
                                  matchesCoordinates: [],
                                  selectedValue: chosenObjectName
                                    ? getObjectOrObjectGroupListItemValue(
                                        chosenObjectName
                                      )
                                    : undefined,
                                });
                              })
                              .filter(Boolean);
                            if (objectsInGroup.length === 0) {
                              results.push(
                                <ListItem
                                  key={`${group.getName()}-empty`}
                                  primaryText={
                                    <Text style={styles.noObjectsText} noMargin>
                                      <Trans>No objects in the group</Trans>
                                    </Text>
                                  }
                                  style={styles.indentedListItem}
                                />
                              );
                            } else {
                              results.push(...objectsInGroup);
                            }
                          }
                          return results;
                        }
                      )}
                      {filteredFoldersList.length > 0 && (
                        <Subheader>
                          <Trans>Folders</Trans>
                        </Subheader>
                      )}
                      {filteredFoldersList.map(
                        ({ item: folderWithPath, matches }) => {
                          const results = [];

                          results.push(
                            renderFolderListItem({
                              folderWithPath,
                              iconSize,
                              matchesCoordinates: matches.length
                                ? matches[0].indices
                                : [],
                            })
                          );
                          const objectsInFolder = getObjectsInFolder(
                            folderWithPath.folder
                          );
                          if (objectsInFolder.length === 0) {
                            results.push(
                              <ListItem
                                key={`${folderWithPath.path}-empty`}
                                primaryText={
                                  <Text style={styles.noObjectsText} noMargin>
                                    <Trans>No objects in the folder</Trans>
                                  </Text>
                                }
                                style={styles.indentedListItem}
                              />
                            );
                          } else {
                            results.push(
                              ...objectsInFolder.map(object =>
                                renderObjectListItem({
                                  project,
                                  selectedValue: chosenObjectName
                                    ? getObjectOrObjectGroupListItemValue(
                                        chosenObjectName
                                      )
                                    : undefined,
                                  keyPrefix: `folder-${folderWithPath.path}`,
                                  iconSize,
                                  matchesCoordinates: [],
                                  objectWithContext: {
                                    object,
                                    global: folderWithPath.global,
                                  },
                                  withIndent: true,
                                  onClick: () =>
                                    onChooseObject(object.getName()),
                                })
                              )
                            );
                          }

                          return results;
                        }
                      )}
                    </React.Fragment>
                  )}
                  {isSearching && displayedInstructionsList.length > 0 && (
                    <Subheader>
                      {isCondition ? (
                        <Trans>Conditions</Trans>
                      ) : (
                        <Trans>Actions</Trans>
                      )}
                    </Subheader>
                  )}
                  {isSearching &&
                    displayedInstructionsList.map(
                      ({ item: instructionMetadata, matches }) =>
                        renderInstructionOrExpressionListItem({
                          instructionOrExpressionMetadata: instructionMetadata,
                          iconSize: iconSize,
                          id: `instruction-item-${instructionMetadata.type.replace(
                            /:/g,
                            '-'
                          )}`,
                          onClick: () =>
                            onChooseInstruction(
                              instructionMetadata.type,
                              instructionMetadata
                            ),
                          selectedValue: chosenInstructionType
                            ? getInstructionListItemValue(chosenInstructionType)
                            : undefined,
                          matches,
                        })
                    )}
                  {!isSearching && currentTab === 'free-instructions' && (
                    <>
                      {renderInstructionOrExpressionTree({
                        instructionTreeNode: this.freeInstructionsInfoTree,
                        onChoose: onChooseInstruction,
                        iconSize,
                        useSubheaders: true,
                        selectedValue: chosenInstructionType
                          ? getInstructionListItemValue(chosenInstructionType)
                          : undefined,
                        initiallyOpenedPath: this.initialInstructionTypePath,
                        selectedItemRef: this._selectedItem,
                        getInstructionIcon,
                      })}
                      {onClickMore && (
                        <ResponsiveLineStackLayout justifyContent="center">
                          <RaisedButton
                            primary
                            icon={<Add />}
                            onClick={onClickMore}
                            label={
                              isCondition ? (
                                <Trans>
                                  Search for new conditions in extensions
                                </Trans>
                              ) : (
                                <Trans>
                                  Search for new actions in extensions
                                </Trans>
                              )
                            }
                          />
                        </ResponsiveLineStackLayout>
                      )}
                    </>
                  )}
                  {remainingResultsCount > 0 && (
                    <ListItem
                      primaryText={
                        <Trans>And {remainingResultsCount} more results.</Trans>
                      }
                      disabled
                      secondaryText={
                        <Trans>
                          Refine your search with more specific keyword to see
                          them.
                        </Trans>
                      }
                    />
                  )}
                </List> */}
                {!isSearching &&
                  currentTab === 'objects' &&
                  !allObjectsList.length && (
                    <EmptyMessage>
                      {isOutsideLayout ? (
                        <Trans>
                          There are no objects. Objects will appear if you add
                          some as parameters.
                        </Trans>
                      ) : (
                        <Trans>
                          There is no object in your game or in this scene.
                          Start by adding an new object in the scene editor,
                          using the objects list.
                        </Trans>
                      )}
                    </EmptyMessage>
                  )}
                {!hasResults && (
                  <EmptyMessage>
                    <Trans>
                      Nothing corresponding to your search. Choose an object
                      first or browse the list of actions/conditions.
                    </Trans>
                  </EmptyMessage>
                )}
              </ScrollView>
            )}
          </div>
        )}
      </I18n>
    );
  }
);

export default InstructionOrObjectSelector;
