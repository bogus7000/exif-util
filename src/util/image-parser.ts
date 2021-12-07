import { ExifParserFactory, ExifTags } from "ts-exif-parser";
import { promises as fs } from "fs";

export interface ImageTagsComparison {
  img1: string;
  img2: string;
  identical: boolean;
  difference?: string;
  img1Tags?: ExifTags;
  img2Tags?: ExifTags;
}

export interface DirScanReport {
  imagesScanned: number;
  imagePairsScanned: number;
  pairsWithIdenticalTags: number;
  pairsWithDifferentTags: number;
  avgAltDelta: string;
  avgLatDelta: string;
  avgLonDelta: string;
  avgDateTimeDelta: string;
}

export class ImageParser {
  private dirPath: string | undefined;
  private _files: string[] = [];
  public get files(): string[] {
    return this._files;
  }
  private _altDeltas: number[] = [];
  public get altDeltas(): number[] {
    return this._altDeltas;
  }
  private _latDeltas: number[] = [];
  public get latDeltas(): number[] {
    return this._latDeltas;
  }
  private _longDeltas: number[] = [];
  public get longDeltas(): number[] {
    return this._longDeltas;
  }
  private _dateDeltas: number[] = [];
  public get dateDeltas(): number[] {
    return this._dateDeltas;
  }

  constructor(dirPath?: string) {
    if (dirPath) {
      this.dirPath = dirPath;
    }
  }

  public async init(): Promise<void> {
    if (this.dirPath) {
      this._files = await fs.readdir(this.dirPath);
    }
  }

  public async getImageTags(
    imgPath: string,
    mode: "dir" | "file" = "dir"
  ): Promise<ExifTags> {
    let file: Buffer;
    if (mode === "file") {
      file = await fs.readFile(imgPath);
    } else {
      file = await fs.readFile(this.dirPath + "/" + imgPath);
    }
    let tags: ExifTags = {};
    const result = ExifParserFactory.create(file).parse().tags;
    if (result) {
      tags = result;
    } else {
      throw new Error("Could not extract tags");
    }
    return tags;
  }

  public compareImageTags(a: ExifTags, b: ExifTags): ImageTagsComparison {
    const sameAltitude = a.GPSAltitude === b.GPSAltitude;
    const sameLatitude = a.GPSLatitude === b.GPSLatitude;
    const sameLongitude = a.GPSLongitude === b.GPSLongitude;
    const sameDateTime = a.DateTimeOriginal === b.DateTimeOriginal;
    const identical =
      sameAltitude && sameLatitude && sameLongitude && sameDateTime;

    const res: ImageTagsComparison = {
      img1: a.ImageDescription?.split("/")[2] || "",
      img2: b.ImageDescription?.split("/")[2] || "",
      identical,
      img1Tags: a,
      img2Tags: b,
    };

    if (!identical) {
      let diff = "";

      if (!sameAltitude) {
        if (a.GPSAltitude && b.GPSAltitude) {
          diff =
            diff +
            this.getDeltaString(a.GPSAltitude, b.GPSAltitude, "GPSAltitude");
        }
      }

      if (!sameLatitude) {
        if (a.GPSLatitude && b.GPSLatitude) {
          diff =
            diff +
            this.getDeltaString(a.GPSLatitude, b.GPSLatitude, "GPSLatitude");
        }
      }

      if (!sameLongitude) {
        if (a.GPSLongitude && b.GPSLongitude) {
          diff =
            diff +
            this.getDeltaString(a.GPSLongitude, b.GPSLongitude, "GPSLongitude");
        }
      }

      if (!sameDateTime) {
        if (a.DateTimeOriginal && b.DateTimeOriginal) {
          diff =
            diff +
            this.getDeltaString(
              a.DateTimeOriginal,
              b.DateTimeOriginal,
              "DateTimeOriginal"
            );
        }
      }

      res.difference = diff;
    }

    return res;
  }

  private getDeltaString(a: number, b: number, label: keyof ExifTags): string {
    let delta = 0;
    delta = this.calculateDelta(a, b);
    this.logDiff(delta, label);
    return `${label}: [${a}] vs [${b}]. Delta: [${delta.toFixed(6)}]; `;
  }

  private logDiff(delta: number, label: keyof ExifTags): void {
    switch (label) {
      case "GPSAltitude":
        this.altDeltas.push(delta);
        break;

      case "GPSLatitude":
        this.latDeltas.push(delta);
        break;

      case "GPSLongitude":
        this.longDeltas.push(delta);
        break;

      case "DateTimeOriginal":
        this.dateDeltas.push(delta);
        break;

      default:
        break;
    }
  }

  public calculateAvgDelta(arr: number[]): number {
    const reducer = (accumulator: number, curr: number) => accumulator + curr;
    return arr.reduce(reducer) / arr.length;
  }

  public getScanReport(
    comparisonResults: ImageTagsComparison[],
    round: number
  ): DirScanReport {
    return {
      imagesScanned: this.files.length,
      imagePairsScanned: this.files.length / 2,
      pairsWithIdenticalTags: comparisonResults.filter((res) => res.identical)
        .length,
      pairsWithDifferentTags: comparisonResults.filter((res) => !res.identical)
        .length,
      avgAltDelta: this.calculateAvgDelta(this._altDeltas).toFixed(round),
      avgLatDelta: this.calculateAvgDelta(this._latDeltas).toFixed(round),
      avgLonDelta: this.calculateAvgDelta(this._longDeltas).toFixed(round),
      avgDateTimeDelta: this.calculateAvgDelta(this._dateDeltas).toFixed(round),
    };
  }

  private calculateDelta(a: number, b: number): number {
    const fromA = a > b;
    if (fromA) {
      return a - b;
    } else {
      return b - a;
    }
  }

  public destroy(): void {
    this._files = [];
    this._altDeltas = [];
    this._longDeltas = [];
    this._latDeltas = [];
    this._dateDeltas = [];
  }
}
