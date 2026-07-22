export type ComponentType = 
  | 'title' 
  | 'subtitle' 
  | 'paragraph' 
  | 'highlight' 
  | 'quote' 
  | 'divider' 
  | 'image' 
  | 'image_caption' 
  | 'list' 
  | 'info_card' 
  | 'summary_card'
  | 'code_block'
  | 'table';

export interface BlockComponent {
  id: string;
  type: ComponentType;
  content: string | BlockComponent[] | any;
  metadata?: any;
}
