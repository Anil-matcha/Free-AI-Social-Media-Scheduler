/**
 * Utility to download a remote media file using fetch.
 * This converts the file to a blob and triggers a browser download.
 */
export async function downloadMedia(url, filename = "seedance-creation.mp4") {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch media");
    
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = filename;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the object URL
    URL.revokeObjectURL(objectUrl);
  } catch (error) {
    console.error("Download failed:", error);
    // Fallback: target blank if fetch fails
    window.open(url, "_blank");
  }
}
