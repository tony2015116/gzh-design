import { toPng, toCanvas } from 'html-to-image';

export interface ExportImageOptions {
  pixelRatio?: number;
}

export const generateLongImage = async (
  elementId: string,
  options: ExportImageOptions = { pixelRatio: 2 }
): Promise<string> => {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Preview element not found');
  }

  try {
    return await toPng(element, { 
      pixelRatio: options.pixelRatio,
      backgroundColor: '#ffffff' 
    });
  } catch (error) {
    console.error('Failed to generate long image:', error);
    throw new Error('生成长图失败，可能是由于外部图片跨域导致的，请检查图片链接。');
  }
};

/**
 * Generate a Xiaohongshu cover image from a rendered cover DOM node.
 * Unlike the other helpers, the node is passed directly because it lives
 * inside the export panel (visually scaled down for preview).
 */
export const generateCoverImage = async (
  element: HTMLElement,
  options: ExportImageOptions = { pixelRatio: 2 }
): Promise<string> => {
  try {
    return await toPng(element, {
      pixelRatio: options.pixelRatio,
      backgroundColor: '#ffffff'
    });
  } catch (error) {
    console.error('Failed to generate cover image:', error);
    throw new Error('生成封面失败，请重试。');
  }
};

/**
 * Generate sliced images
 * @param elementId The ID of the DOM element
 * @param heightMultiplier The multiplier for height relative to width (e.g., 4/3 for a 3:4 aspect ratio)
 * @param options Export options
 * @returns Array of base64 image strings
 */
export const generateSlicedImages = async (
  elementId: string,
  heightMultiplier: number,
  options: ExportImageOptions = { pixelRatio: 2 }
): Promise<string[]> => {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Preview element not found');
  }

  try {
    const canvas = await toCanvas(element, { 
      pixelRatio: options.pixelRatio,
      backgroundColor: '#ffffff'
    });
    
    const fullWidth = canvas.width;
    const fullHeight = canvas.height;
    
    const sliceHeight = Math.floor(fullWidth * heightMultiplier);
    const numSlices = Math.ceil(fullHeight / sliceHeight);
    
    const slices: string[] = [];
    
    for (let i = 0; i < numSlices; i++) {
      const sliceCanvas = document.createElement('canvas');
      sliceCanvas.width = fullWidth;
      
      const currentSliceHeight = Math.min(sliceHeight, fullHeight - i * sliceHeight);
      sliceCanvas.height = currentSliceHeight;
      
      const ctx = sliceCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, fullWidth, currentSliceHeight);
        
        ctx.drawImage(
          canvas,
          0, Math.floor(i * sliceHeight), fullWidth, currentSliceHeight,
          0, 0, fullWidth, currentSliceHeight
        );
        
        slices.push(sliceCanvas.toDataURL('image/png'));
      }
    }
    
    return slices;
  } catch (error) {
    console.error('Failed to generate sliced images:', error);
    throw new Error('生成切片多图失败，可能是由于外部图片跨域导致的，请检查图片链接。');
  }
};
