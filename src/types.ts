export type CatalogLayout = 3 | 4;

export interface ProductItem {
  id: string;
  image: string;
  code: string;
  title: string;
  description: string;
  showSpotDot?: boolean; // The circular accent dot seen on top-left of image in demo
  spotDotColor?: string;
}

export interface CatalogPage {
  id: string;
  name: string;
  layout: CatalogLayout;
  seriesSubtitle: string;
  collectionTitle: string;
  headerDescription: string;
  footerLeft: string;
  footerCenter: string;
  footerPageNumber: string;
  items: ProductItem[];
}

export interface CatalogState {
  pages: CatalogPage[];
  activePageIndex: number;
}
