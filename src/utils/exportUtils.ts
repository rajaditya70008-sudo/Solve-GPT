/**
 * Utility function to export / download media assets (photos and videos)
 * to the user's local device cleanly and reliably.
 */
export async function exportAsset(
  urlOrData: string,
  filename: string
): Promise<boolean> {
  if (!urlOrData) return false;

  try {
    // If it's already a data URI or blob URI, download directly
    if (urlOrData.startsWith('data:') || urlOrData.startsWith('blob:')) {
      const link = document.createElement('a');
      link.href = urlOrData;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return true;
    }

    // For HTTP/HTTPS remote URLs, fetch as blob to trigger download without opening in browser tab
    const response = await fetch(urlOrData);
    if (!response.ok) {
      throw new Error(`Failed to fetch asset: ${response.statusText}`);
    }
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      URL.revokeObjectURL(objectUrl);
    }, 2000);
    return true;
  } catch (error) {
    console.warn('Blob download attempt failed, falling back to standard link download:', error);
    try {
      const link = document.createElement('a');
      link.href = urlOrData;
      link.download = filename;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return true;
    } catch (fallbackError) {
      console.error('Asset export failed completely:', fallbackError);
      return false;
    }
  }
}
