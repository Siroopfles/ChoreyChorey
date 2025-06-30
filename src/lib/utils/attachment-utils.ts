export type AttachmentSource = 'google-doc' | 'google-sheet' | 'google-slide' | 'google-drive' | 'onedrive' | 'dropbox' | 'figma' | 'gitlab' | 'bitbucket' | 'adobe-xd' | 'generic-link';

export function getAttachmentSource(url: string | undefined): AttachmentSource {
    if (!url) return 'generic-link';
    if (url.includes('docs.google.com/document/')) return 'google-doc';
    if (url.includes('docs.google.com/spreadsheets/')) return 'google-sheet';
    if (url.includes('docs.google.com/presentation/')) return 'google-slide';
    if (url.includes('drive.google.com')) return 'google-drive';
    if (url.includes('dropbox.com')) return 'dropbox';
    if (url.includes('onedrive.live.com') || url.includes('1drv.ms')) return 'onedrive';
    if (url.includes('figma.com')) return 'figma';
    if (url.includes('xd.adobe.com')) return 'adobe-xd';
    if (url.includes('gitlab.com')) return 'gitlab';
    if (url.includes('bitbucket.org')) return 'bitbucket';
    return 'generic-link';
}