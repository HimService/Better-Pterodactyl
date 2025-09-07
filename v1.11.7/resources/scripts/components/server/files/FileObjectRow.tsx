import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileAlt, faFileArchive, faFileImport, faFolder } from '@fortawesome/free-solid-svg-icons';
import { encodePathSegments } from '@/helpers';
import { differenceInHours, format, formatDistanceToNow } from 'date-fns';
import React, { memo } from 'react';
import { FileObject } from '@/api/server/files/loadDirectory';
import FileDropdownMenu from '@/components/server/files/FileDropdownMenu';
import { ServerContext } from '@/state/server';
import { NavLink, useRouteMatch } from 'react-router-dom';
import tw from 'twin.macro';
import isEqual from 'react-fast-compare';
import SelectFileCheckbox from '@/components/server/files/SelectFileCheckbox';
import { usePermissions } from '@/plugins/usePermissions';
import { join } from 'path';
import { bytesToString } from '@/lib/formatters';
import GreyRowBox from '@/components/elements/GreyRowBox';

const Clickable: React.FC<{ file: FileObject }> = memo(({ file, children }) => {
    const [canRead] = usePermissions(['file.read']);
    const [canReadContents] = usePermissions(['file.read-content']);
    const directory = ServerContext.useStoreState((state) => state.files.directory);

    const match = useRouteMatch();

    const linkProps = {
        to: `${match.url}${file.isFile ? '/edit' : ''}#${encodePathSegments(join(directory, file.name))}`,
    };

    const isLink = (file.isFile && file.isEditable() && canReadContents) || (!file.isFile && canRead);

    return (
        <GreyRowBox
            as={isLink ? NavLink : 'div'}
            {...(isLink ? linkProps : {})}
            css={tw`flex items-center text-sm text-neutral-300 hover:text-neutral-100`}
            key={file.name}
            onContextMenu={(e: React.MouseEvent) => {
                e.preventDefault();
                window.dispatchEvent(new CustomEvent(`pterodactyl:files:ctx:${file.key}`, { detail: e.clientX }));
            }}
        >
            {children}
        </GreyRowBox>
    );
}, isEqual);

const FileObjectRow = ({ file }: { file: FileObject }) => (
    <Clickable file={file}>
        <SelectFileCheckbox name={file.name} />
        <div css={tw`flex-none text-neutral-400 ml-6 mr-4 text-lg w-8 text-center`}>
            {file.isFile ? (
                <FontAwesomeIcon icon={file.isSymlink ? faFileImport : file.isArchiveType() ? faFileArchive : faFileAlt} />
            ) : (
                <FontAwesomeIcon icon={faFolder} />
            )}
        </div>
        <div css={tw`flex-1 truncate`}>{file.name}</div>
        {file.isFile && <div css={tw`w-1/6 text-right mr-4 hidden sm:block`}>{bytesToString(file.size)}</div>}
        <div css={tw`w-1/5 text-right mr-4 hidden md:block`} title={file.modifiedAt.toString()}>
            {Math.abs(differenceInHours(file.modifiedAt, new Date())) > 48
                ? format(file.modifiedAt, 'MMM do, yyyy h:mma')
                : formatDistanceToNow(file.modifiedAt, { addSuffix: true })}
        </div>
        <FileDropdownMenu file={file} />
    </Clickable>
);

export default memo(FileObjectRow, (prevProps, nextProps) => {
    /* eslint-disable @typescript-eslint/no-unused-vars */
    const { isArchiveType, isEditable, ...prevFile } = prevProps.file;
    const { isArchiveType: nextIsArchiveType, isEditable: nextIsEditable, ...nextFile } = nextProps.file;
    /* eslint-enable @typescript-eslint/no-unused-vars */

    return isEqual(prevFile, nextFile);
});
