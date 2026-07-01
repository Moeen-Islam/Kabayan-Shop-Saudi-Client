/**
 * Utility to optimize image URLs.
 * If the URL is an Unsplash image, rewrites parameters to request optimized size and format.
 * Otherwise, returns the original URL.
 */
export function getOptimizedImageUrl(url: string, width: number, quality = 75): string {
  if (!url) return "";
  
  if (url.includes("unsplash.com")) {
    try {
      // Unsplash URLs can be parsed as URL objects
      const parsedUrl = new URL(url);
      
      // Update or set width and quality parameters
      parsedUrl.searchParams.set("w", width.toString());
      parsedUrl.searchParams.set("q", quality.toString());
      
      // Force auto format (e.g., webp/avif) for better compression and fit to crop
      parsedUrl.searchParams.set("auto", "format");
      parsedUrl.searchParams.set("fit", "crop");
      
      return parsedUrl.toString();
    } catch (e) {
      // Fallback to string replacement if URL parsing fails
      let opt = url;
      if (opt.includes("w=")) {
        opt = opt.replace(/w=\d+/, `w=${width}`);
      } else {
        opt += (opt.includes("?") ? "&" : "?") + `w=${width}`;
      }
      if (opt.includes("q=")) {
        opt = opt.replace(/q=\d+/, `q=${quality}`);
      } else {
        opt += `&q=${quality}`;
      }
      if (!opt.includes("auto=")) {
        opt += `&auto=format`;
      }
      return opt;
    }
  }
  
  return url;
}
