export type KeyValue = { [key: string]: string };

export interface Sections {
  sections: {
    [key: string]: Section;
  };
}
export interface Section {
  _id: string;
  sectionTitle: string;
  summary: string;
  menuSvgPath: string;
  headerSvgPath: string;
}

export interface Workshop {
  _id: string;
  sectionId: string;
  workshopDocumentGroupId: string;
  sortId: number;
  name: string;
  summary: string;
  thumbnail: string;
  workshopDocuments: WorkshopDocumentIdentifier[];
}

export interface WorkshopDocumentIdentifier {
  _id: string;
  name: string;
  sortId: number;
}

export interface WorkshopDocument {
  _id: string;
  workshopGroupId: string;
  sortId: number;
  name: string;
  pageType: string;
  lastUpdated: Date;
  html: string;
}
