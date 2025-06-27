'use client';

import type { AttachmentSource } from '@/lib/utils';
import { Link, Figma } from 'lucide-react';

const GoogleDriveIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M7.64803 21.75L12 13.065H20.352L16 21.75H7.64803Z" fill="#34A853"/>
      <path d="M12 4.5L16.176 12L20.352 4.5H12Z" fill="#FFC107"/>
      <path d="M3.64795 12L7.82395 19.5L12 12H3.64795Z" fill="#1E88E5"/>
    </svg>
);

const DropboxIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M4 2.5L0 5.5L4 8.5L8 5.5L4 2.5Z" fill="#0061FE"/>
        <path d="M4 8.5L8 5.5L12 8.5L8 11.5L4 8.5Z" fill="#0061FE"/>
        <path d="M8 5.5L12 2.5L16 5.5L12 8.5L8 5.5Z" fill="#007FF8"/>
        <path d="M12 8.5L8 11.5L12 14.5L16 11.5L12 8.5Z" fill="#3B92FF"/>
    </svg>
);

const OneDriveIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M4.36364 7.72727C4.36364 6.83636 5.06364 6 5.92727 6H19.5C20.0818 6 20.6182 6.36364 20.8545 6.89091C21.0909 7.41818 20.9818 8.00909 20.5909 8.4L16.0909 14.2C15.7 14.6545 15.1182 14.9091 14.5 14.9091H5.34545C4.55455 14.9091 3.86364 14.3364 3.73636 13.5455L2.50909 6.2C2.41818 5.67273 2.59091 5.14545 2.97273 4.77273L3.00909 4.73636C3.41818 4.31818 4.02727 4.09091 4.63636 4.09091H16.8182C17.3 4.09091 17.7273 4.41818 17.8545 4.88182L18.4364 7H5.92727C5.06364 7 4.36364 7.72727 4.36364 8.61818V8.61818L4.36364 7.72727Z" fill="#0078D4"/>
    </svg>
);

const FigmaIcon = () => <Figma className="h-4 w-4"/>;

export const AttachmentIcon = ({ source }: { source: AttachmentSource }) => {
  switch (source) {
    case 'google-drive': return <GoogleDriveIcon />;
    case 'dropbox': return <DropboxIcon />;
    case 'onedrive': return <OneDriveIcon />;
    case 'figma': return <FigmaIcon />;
    default: return <Link className="h-4 w-4" />;
  }
};
