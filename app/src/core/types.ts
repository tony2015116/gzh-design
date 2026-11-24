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
  // TODO: 改成按 type 区分的联合类型；目前各块组件自行解读 content/metadata
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  content: string | BlockComponent[] | any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: any;
}
