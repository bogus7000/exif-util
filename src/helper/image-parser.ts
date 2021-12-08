import { promises as fs } from "fs";
import * as util from "util";
const exec = util.promisify(require("child_process").exec);

export interface ImageTagsComparison {
  img1: string;
  img2: string;
  identical: boolean;
  difference?: string;
  img1Tags?: any;
  img2Tags?: any;
}

export interface DirScanReport {
  imagesScanned: number;
  imagePairsScanned: number;
  pairsWithIdenticalTags: number;
  pairsWithDifferentTags: number;
  avgAltDelta: string;
  minAltDelta: string;
  maxAltDelta: string;
  avgLatDelta: string;
  minLatDelta: string;
  maxLatDelta: string;
  avgLongDelta: string;
  minLongDelta: string;
  maxLongDelta: string;
  avgDateTimeDelta: string;
  minDateTimeDelta: string;
  maxDateTimeDelta: string;
}

export class ImageParser {
  private dirPath: string | undefined;
  private _files: string[] = [];
  public get files(): string[] {
    return this._files;
  }
  private _altDeltas: number[] = [];
  private _latDeltas: number[] = [];
  private _longDeltas: number[] = [];
  private _dateDeltas: number[] = [];

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
  ): Promise<any> {
    let tags: any;

    const options = "-j -n -sort";
    if (mode === "file") {
      let fileCommand = `exiftool ${imgPath} ${options}`;
      const { stdout, stderr } = await exec(fileCommand);
      tags = JSON.parse(this.escapeSpecialChars(stdout))[0];
    } else {
      let dirCommand = `exiftool ${this.dirPath + "/" + imgPath} ${options}`;
      const { stdout, stderr } = await exec(dirCommand);
      tags = JSON.parse(this.escapeSpecialChars(stdout))[0];
    }

    if (!tags) {
      throw new Error("Could not extract tags");
    }

    const split = tags.DateTimeOriginal.split(" ");
    const start = split[0].replaceAll(":", "-");
    const end = split[1].split(".")[0];
    const newDate = start + "T" + end;
    tags.DateTimeOriginal = parseInt(
      (new Date(newDate).getTime() / 1000).toFixed(0)
    );

    return tags;
  }

  escapeSpecialChars(dirtyJson: string): string {
    return dirtyJson.replace(/\\n/g, "\\n");
  }

  public compareImageTags(a: any, b: any): ImageTagsComparison {
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

  private getDeltaString(a: number, b: number, label: string): string {
    let delta = 0;
    delta = this.calculateDelta(a, b);
    this.logDiff(delta, label);
    return `${label}: [${a}] vs [${b}]. Delta: [${delta.toFixed(10)}]; `;
  }

  private logDiff(delta: number, label: string): void {
    switch (label) {
      case "GPSAltitude":
        this._altDeltas.push(delta);
        break;

      case "GPSLatitude":
        this._latDeltas.push(delta);
        break;

      case "GPSLongitude":
        this._longDeltas.push(delta);
        break;

      case "DateTimeOriginal":
        this._dateDeltas.push(delta);
        break;

      default:
        break;
    }
  }

  public calculateAvgDelta(arr: number[]): number {
    if (arr.length >= 1) {
      const reducer = (accumulator: number, curr: number) => accumulator + curr;
      return arr.reduce(reducer) / arr.length;
    } else {
      return 0;
    }
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
      minAltDelta: Math.min(...this._altDeltas).toFixed(round),
      maxAltDelta: Math.max(...this._altDeltas).toFixed(round),
      avgLatDelta: this.calculateAvgDelta(this._latDeltas).toFixed(round),
      minLatDelta: Math.min(...this._latDeltas).toFixed(round),
      maxLatDelta: Math.max(...this._latDeltas).toFixed(round),
      avgLongDelta: this.calculateAvgDelta(this._longDeltas).toFixed(round),
      minLongDelta: Math.min(...this._longDeltas).toFixed(round),
      maxLongDelta: Math.max(...this._longDeltas).toFixed(round),
      avgDateTimeDelta: this.calculateAvgDelta(this._dateDeltas).toFixed(round),
      minDateTimeDelta: Math.min(...this._dateDeltas).toFixed(round),
      maxDateTimeDelta: Math.max(...this._dateDeltas).toFixed(round),
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
