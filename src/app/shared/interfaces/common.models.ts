export interface Link {
  href: string;
  hreflang?: string;
  title?: string;
  type?: string;
  deprecation?: string;
  profile?: string;
  name?: string;
  templated?: boolean;
}

export interface Links {
  [key: string]: Link;
}

export interface PageMetadata {
  size: number;
  totalElements: number;
  totalPages: number;
  number: number;
}

export interface HATEOASResponse<K extends string, T> {
  _embedded?: { [key in K]: T[] };
  _links?: Links;
  page?: PageMetadata;
}

export interface PagedResponse<T> extends HATEOASResponse<string, T> {}

export interface NavItem {
  path: string;
  label: string;
  icon: string;
  section: string;
}

export interface SelectionOption {
  id: string;
  label: string;
  description?: string;
}
