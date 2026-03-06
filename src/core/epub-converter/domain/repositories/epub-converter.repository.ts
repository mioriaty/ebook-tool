export interface IEpubConverterRepository {
  convertToTxt(epubArrayBuffer: ArrayBuffer): Promise<Blob>;
}
