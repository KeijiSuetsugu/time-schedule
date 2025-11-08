// pdfkitの型定義
declare module 'pdfkit' {
  import { Stream } from 'stream';

  interface PDFDocumentOptions {
    size?: [number, number] | string;
    margins?: {
      top?: number;
      bottom?: number;
      left?: number;
      right?: number;
    };
    info?: {
      Title?: string;
      Author?: string;
      Subject?: string;
      Keywords?: string;
      Creator?: string;
      Producer?: string;
      CreationDate?: Date;
      ModDate?: Date;
    };
    autoFirstPage?: boolean;
    bufferPages?: boolean;
    compress?: boolean;
    userPassword?: string;
    ownerPassword?: string;
    permissions?: {
      printing?: boolean | 'lowResolution';
      modifying?: boolean;
      copying?: boolean;
      annotating?: boolean;
      fillingForms?: boolean;
      contentAccessibility?: boolean;
      documentAssembly?: boolean;
    };
  }

  class PDFDocument extends Stream {
    constructor(options?: PDFDocumentOptions);
    
    // テキスト関連
    text(text: string, x?: number, y?: number, options?: any): PDFDocument;
    fontSize(size: number): PDFDocument;
    font(src: string, family?: string): PDFDocument;
    
    // 図形関連
    rect(x: number, y: number, width: number, height: number): PDFDocument;
    fill(color?: string): PDFDocument;
    stroke(color?: string): PDFDocument;
    
    // ページ関連
    addPage(options?: PDFDocumentOptions): PDFDocument;
    end(): void;
    
    // その他
    moveTo(x: number, y: number): PDFDocument;
    lineTo(x: number, y: number): PDFDocument;
    [key: string]: any;
  }

  export = PDFDocument;
}

