import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileAlt, faFileArchive, faFileImport, faFolder } from '@fortawesome/free-solid-svg-icons';
import { encodePathSegments } from '@/helpers';
import { differenceInHours, format, formatDistanceToNow } from 'date-fns';
import React, { memo, useState } from 'react';
import { FileObject } from '@/api/server/files/loadDirectory';
import FileDropdownMenu from '@/components/server/files/FileDropdownMenu';
import { ServerContext } from '@/state/server';
import { NavLink, useRouteMatch } from 'react-router-dom';
import tw, { styled } from 'twin.macro';
import isEqual from 'react-fast-compare';
import SelectFileCheckbox from '@/components/server/files/SelectFileCheckbox';
import { usePermissions } from '@/plugins/usePermissions';
import { join } from 'path';
import { bytesToString } from '@/lib/formatters';
const Row = styled.div`
    ${tw`flex items-center bg-neutral-100 rounded-lg p-3 shadow-sm transition-all duration-150 mb-2`};

    [data-theme="dark"] & {
        ${tw`bg-neutral-800`};
    }

    &:hover {
        ${tw`shadow-md transform -translate-y-px`};
        & .file-icon {
            ${tw`text-cyan-500`};
        }
    }
`;

const IconContainer = styled.div`
    ${tw`flex-none ml-3 mr-4 text-xl w-8 text-center text-neutral-500 transition-colors duration-150`}
`;

const Clickable: React.FC<{ file: FileObject }> = memo(({ file, children }) => {
    const [canRead] = usePermissions(['file.read']);
    const [canReadContents] = usePermissions(['file.read-content']);
    const directory = ServerContext.useStoreState((state: any) => state.files.directory);

    const match = useRouteMatch();

    const isLink = (file.isFile && file.isEditable() && canReadContents) || (!file.isFile && canRead);

    return (
        <Row
            as={(isLink ? NavLink : 'div') as any}
            {...(isLink ? { to: `${match.url}${file.isFile ? '/edit' : ''}#${encodePathSegments(join(directory, file.name))}` } : {})}
            css={tw`flex flex-1 items-center text-sm no-underline text-current min-w-0`}
        >
            {children}
        </Row>
    );
}, isEqual);

const FileObjectRow = ({ file }: { file: FileObject }) => (
    <div
        css={tw`flex items-center relative`}
        key={file.name}
        onContextMenu={(e: React.MouseEvent<HTMLDivElement>) => {
            e.preventDefault();
            window.dispatchEvent(new CustomEvent(`pterodactyl:files:ctx:${file.key}`, { detail: e.clientX }));
        }}
    >
        <Clickable file={file}>
            <div css={tw`flex-none w-10 flex items-center justify-center`} onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}>
                <SelectFileCheckbox name={file.name} />
            </div>
            <IconContainer className={'file-icon'}>
                {file.isFile ? (
                    <FontAwesomeIcon
                        icon={file.isSymlink ? faFileImport : file.isArchiveType() ? faFileArchive : faFileAlt}
                    />
                ) : (
                    <FontAwesomeIcon icon={faFolder} />
                )}
            </IconContainer>
            <div css={tw`flex-1 truncate`}>{file.name}</div>
            {file.isFile && <div css={tw`w-1/6 text-right mr-6 hidden sm:block`}>{bytesToString(file.size)}</div>}
            <div css={tw`w-1/5 text-right mr-6 hidden md:block`} title={file.modifiedAt.toString()}>
                {Math.abs(differenceInHours(file.modifiedAt, new Date())) > 48
                    ? format(file.modifiedAt, 'MMM do, yyyy h:mma')
                    : formatDistanceToNow(file.modifiedAt, { addSuffix: true })}
            </div>
        </Clickable>
        <div css={tw`absolute right-0 mr-2`}>
            <FileDropdownMenu file={file} />
        </div>
    </div>
);

export default memo(FileObjectRow, (prevProps: { file: FileObject }, nextProps: { file: FileObject }) => {
    /* eslint-disable @typescript-eslint/no-unused-vars */
    const { isArchiveType, isEditable, ...prevFile } = prevProps.file;
    const { isArchiveType: nextIsArchiveType, isEditable: nextIsEditable, ...nextFile } = nextProps.file;
    /* eslint-enable @typescript-eslint/no-unused-vars */

    return isEqual(prevFile, nextFile);
});
