
'use server';

import { storage } from '@/lib/firebase';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';

export async function uploadAttachmentFromDataUrl(
  dataUrl: string,
  fileName: string,
  organizationId: string
): Promise<{ url: string; error: null } | { url: null; error: string }> {
  try {
    if (!dataUrl.startsWith('data:image')) {
      throw new Error('Invalid data URL. Only images are supported.');
    }
    const uniqueFileName = `${crypto.randomUUID()}-${fileName}`;
    const storageRef = ref(storage, `attachments/${organizationId}/${uniqueFileName}`);
    
    const uploadResult = await uploadString(storageRef, dataUrl, 'data_url');
    const downloadURL = await getDownloadURL(uploadResult.ref);

    return { url: downloadURL, error: null };
  } catch (e: any) {
    console.error("Error uploading attachment:", e);
    return { url: null, error: e.message };
  }
}
