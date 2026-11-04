export type ComponentType = 
  | 'title' 
  | 'subtitle' 
  | 'heading3'
  | 'heading4'
  | 'paragraph' 
  | 'highlight' 
  | 'quote' 
  | 'divider' 
  | 'image' 
  | 'image_caption' 
  | 'list' 
  | 'info_card' 
  | 'summary_card'
  | 'scroll_card'
  | 'long_image_card'
  | 'cover_card'
  | 'toc_card'
  | 'author_card'
  | 'code_block'
  | 'table';

export interface BlockComponent {
  id: string;
  type: ComponentType;
  content: string | BlockComponent[] | any;
  metadata?: any;
}
