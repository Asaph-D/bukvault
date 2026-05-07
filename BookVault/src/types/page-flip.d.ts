declare module 'page-flip' {
  export class PageFlip {
    constructor(element: HTMLElement, settings?: any);
    loadFromHTML(pages: HTMLElement[]): void;
    loadFromImages(images: string[]): void;
    updateFromImages(images: string[]): void;
    on(event: string, cb: (e: any) => void): void;
    turnToPage(pageIndex: number): void;
    getCurrentPageIndex(): number;
    destroy(): void;
  }
}

