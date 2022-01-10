import { PairCandidate } from "./../model/find-pairs.model";
import { OutputFlags } from "@oclif/parser";
import { flags } from "@oclif/command";
import BaseCommand from "../base/base-command";
import {
  ImagePair,
  PairCandidateDelta,
  PairCandidateDeltas,
  ParsedImage,
  ScoringResult,
} from "../model";
import * as fs from "fs";
import { util } from "chai";
import { ImageParser } from "../helper/image-parser";

export default class FindPairs extends BaseCommand {
  static description = "Find pairs in a directory of images based on EXIF tags";

  static flags = {
    ...BaseCommand.flags,
    path: flags.string({
      description: "Path to directory to look for pairs",
    }),
    matchingMode: flags.string({
      description: "Choose method for finding pairs",
      options: ["pattern", "custom1"],
      required: true,
    }),
    startsWith: flags.string({
      description: "Specify which image comes first",
      options: ["RGB", "Radiometric"],
      dependsOn: ["patternRGB", "patternRadiometric"],
    }),
    patternRGB: flags.string({
      description: "Pattern to look for in a RGB image",
      dependsOn: ["startsWith", "patternRadiometric"],
    }),
    patternRadiometric: flags.string({
      description: "Pattern to look for in a Radiometric image",
      dependsOn: ["startsWith", "patternRGB"],
    }),
    dateTimeWithin: flags.string({
      description: "Margin for EXIF tag DateTimeOriginal. In seconds",
    }),
    altitudeWithin: flags.string({
      description: "Margin for EXIF tag GPSAltitude",
    }),
    longitudeWithin: flags.string({
      description: "Margin for EXIF tag GPSLongitude. In degrees",
    }),
    latitudeWithin: flags.string({
      description: "Margin for EXIF tag GPSLatitude. In degrees",
    }),
    score: flags.boolean({
      description: "Score pairing algorithm",
    }),
    scoringFilePath: flags.string({
      description: "Path to pairing file to score against",
      dependsOn: ["score"],
    }),
    verbose: flags.boolean({
      char: "v",
      description: "Verbose output flag",
      default: false,
    }),
    // export: {
    //   ...BaseCommand.flags.export,
    //   description: "Enable export of image pairs list",
    // },
  };

  async run() {
    if (this.parsedArgs && this.parsedFlags) {
      const parsedFlags = this.parsedFlags as OutputFlags<
        typeof FindPairs.flags
      >;
      const parsedArgs = this.parsedArgs;
      this.printFlags(parsedFlags);

      switch (parsedFlags.matchingMode) {
        case "pattern":
          if (
            parsedFlags.patternRGB &&
            parsedFlags.patternRadiometric &&
            parsedFlags.startsWith &&
            parsedArgs.path
          ) {
            await this.findByPattern(
              parsedFlags.patternRGB,
              parsedFlags.patternRadiometric,
              parsedFlags.startsWith,
              parsedArgs.path,
              parsedFlags
            );
          }
          break;

        case "custom1":
          {
            let verbose = parsedFlags.verbose;
            let dir = parsedFlags.path;
            if (!dir) {
              dir = await this.inquireForDirectoryPath(
                `Directory not provided in flags. Please choose..`
              );
            }
            this.validateDirExists(dir);
            const parser = await this.initializeParser(dir);

            const files = this.getShuffledFileList(parser);
            const tags = await this.getImageTags(files, parser, dir);
            const parsedImages = this.getParsedImages(files, tags);
            const parsedRGBs = this.getParsedRGBs(parsedImages);
            this.consoleLogIfVerbose(
              parsedRGBs.map((img) => img.name),
              "Found these RGB images:",
              verbose
            );
            const parsedRadiometrics = this.getParsedRadiometrics(parsedImages);
            this.consoleLogIfVerbose(
              parsedRadiometrics.map((img) => img.name),
              "Found these Radiometric images:",
              verbose
            );
            const pairs = await this.customFindOne(
              parsedRGBs,
              parsedRadiometrics,
              parsedFlags,
              parser
            );
            parser.destroy();
            if (parsedFlags.score) {
              let scoringFilePath = parsedFlags.scoringFilePath;
              if (!scoringFilePath) {
                scoringFilePath = await this.inquireForFilePath(
                  "Choose pairing file for scoring: ",
                  ".json"
                );
                this.showNewLine();
              }
              const res = this.score(scoringFilePath, pairs);
              if (res.incorrectPairs.length >= 1) {
                this.showNewLine();
                this.showSeparator();
                this.sig.warn("Pairing errors found in the following pairs:");
                this.showSeparator();
                this.showNewLine();
                console.log(res.incorrectPairs);
                this.showNewLine();
                this.showSeparator();
              }

              this.sig.success(`Pairing accuracy: ${res.accuracy}`);
              this.sig.complete("Done. Exiting now..");
            } else {
              if (pairs.length >= 1) {
                this.sig.info("Found the following pairs: ");
                console.log(pairs);
                this.exitWithSuccess("Done. Exiting now..");
              } else {
                this.sig.error("Found 0 pairs. Exiting now...");
              }
            }
          }
          break;

        default:
          break;
      }
    }
  }

  getShuffledFileList(parser: ImageParser): string[] {
    let files = this.prepFileList(parser);
    return this.shuffleArray(files);
  }

  async getImageTags(
    files: string[],
    parser: ImageParser,
    dirPath: string
  ): Promise<any> {
    this.sig.pending("Extracting EXIF tags...");
    const tags: any[] = [];
    for (let index = 0; index < files.length; index++) {
      const fullPath = dirPath + "/" + files[index];
      const fileTags = await parser.getImageTags(fullPath, "file");
      tags.push(fileTags);
    }
    return tags;
  }

  getParsedImages(files: string[], tags: any[]): ParsedImage[] {
    return files.map((file, index) => {
      return { name: file, tags: tags[index] };
    });
  }

  getParsedRadiometrics(parsedImages: ParsedImage[]): ParsedImage[] {
    return parsedImages.filter((img) => this.isRadiometric(img));
  }

  getParsedRGBs(parsedImages: ParsedImage[]): ParsedImage[] {
    return parsedImages.filter((img) => !this.isRadiometric(img));
  }

  async customFindOne(
    RGBs: ParsedImage[],
    radiometrics: ParsedImage[],
    f: OutputFlags<typeof FindPairs.flags>,
    parser: ImageParser
  ): Promise<ImagePair[]> {
    const pairs: ImagePair[] = [];

    this.sig.pending("Looking for pairs...");
    for (let index = 0; index < radiometrics.length; index++) {
      const a = radiometrics[index];

      let match = "not found";
      let pairCandidates: PairCandidate[] = [];

      for (let i = 0; i < RGBs.length; i++) {
        const b = RGBs[i];

        const comparison = parser.compareImageTags(a.tags, b.tags);

        const candidateDeltas: PairCandidateDeltas = {};

        if (comparison.identical) {
          match = b.name;
          break;
        } else {
          if (f.dateTimeWithin) {
            candidateDeltas.dateTimeDiff = this.isWithin(
              b.tags.DateTimeOriginal,
              a.tags.DateTimeOriginal,
              f.dateTimeWithin
            );
          }

          if (f.latitudeWithin) {
            candidateDeltas.latitudeDiff = this.isWithin(
              b.tags.GPSLatitude,
              a.tags.GPSLatitude,
              f.latitudeWithin
            );
          }

          if (f.longitudeWithin) {
            candidateDeltas.longitudeDiff = this.isWithin(
              b.tags.GPSLongitude,
              a.tags.GPSLongitude,
              f.longitudeWithin
            );
          }

          if (f.altitudeWithin) {
            candidateDeltas.altitudeDiff = this.isWithin(
              b.tags.GPSAltitude,
              a.tags.GPSAltitude,
              f.altitudeWithin
            );
          }

          let withinChecks: boolean[] = [];

          for (const key in candidateDeltas) {
            if (Object.prototype.hasOwnProperty.call(candidateDeltas, key)) {
              const element = candidateDeltas[key] as PairCandidateDelta;
              withinChecks.push(element.within);
            }
          }

          const allWithin = withinChecks.every((check) => check === true);

          if (allWithin) {
            pairCandidates.push({ name: b.name, deltas: candidateDeltas });
          }
        }
      }

      if (pairCandidates.length > 0) {
        let closestCandidate = this.getClosestCandidate(pairCandidates);
        match = closestCandidate.name;
      }
      pairs.push({ a: a.name, b: match });
    }

    return pairs;
  }

  score(pairingPath: string, pairs: ImagePair[]): ScoringResult {
    const referencePairs: ImagePair[] = JSON.parse(
      fs.readFileSync(pairingPath, "utf8")
    );
    let correct = 0;
    const incorrectPairs: ImagePair[] = [];

    pairs.forEach((element, index) => {
      const pair = referencePairs.find(
        (x) => x.a === element.a && x.b === element.b
      );
      if (pair) {
        correct += 1;
      } else {
        incorrectPairs.push(element);
      }
    });

    return {
      accuracy: ((100 * correct) / pairs.length).toFixed(1) + " %",
      incorrectPairs,
    };
  }

  getClosestCandidate(candidates: PairCandidate[]): PairCandidate {
    let closest = candidates[0];
    candidates.forEach((element) => {
      let results: number[] = [];

      if (element.deltas.dateTimeDiff && closest.deltas.dateTimeDiff) {
        if (
          element.deltas.dateTimeDiff.delta < closest.deltas.dateTimeDiff.delta
        ) {
          results.push(-1);
        } else if (
          element.deltas.dateTimeDiff.delta ===
          closest.deltas.dateTimeDiff.delta
        ) {
          results.push(0);
        } else {
          results.push(1);
        }
      }
      if (element.deltas.latitudeDiff && closest.deltas.latitudeDiff) {
        if (
          element.deltas.latitudeDiff.delta < closest.deltas.latitudeDiff.delta
        ) {
          results.push(-1);
        } else if (
          element.deltas.latitudeDiff.delta ===
          closest.deltas.latitudeDiff.delta
        ) {
          results.push(0);
        } else {
          results.push(1);
        }
      }
      if (element.deltas.longitudeDiff && closest.deltas.longitudeDiff) {
        if (
          element.deltas.longitudeDiff.delta <
          closest.deltas.longitudeDiff.delta
        ) {
          results.push(-1);
        } else if (
          element.deltas.longitudeDiff.delta ===
          closest.deltas.longitudeDiff.delta
        ) {
          results.push(0);
        } else {
          results.push(1);
        }
      }
      if (element.deltas.altitudeDiff && closest.deltas.altitudeDiff) {
        if (
          element.deltas.altitudeDiff.delta < closest.deltas.altitudeDiff.delta
        ) {
          results.push(-1);
        } else if (
          element.deltas.altitudeDiff.delta ===
          closest.deltas.altitudeDiff.delta
        ) {
          results.push(0);
        } else {
          results.push(1);
        }
      }

      const aIsCloserCount = results.filter((x) => x === -1).length;
      const bIsCloserCount = results.filter((x) => x === 1).length;

      if (aIsCloserCount > bIsCloserCount) {
        closest = element;
      } else {
        return;
      }
    });

    return closest;
  }

  isWithin(a: string, b: string, margin: string): PairCandidateDelta {
    const within = parseFloat(margin);
    const diff = Math.abs(parseFloat(a) - parseFloat(b));
    return { delta: diff, within: diff <= within };
  }

  checkDirectoryPattern(
    patternRGB: string,
    patternRadiometric: string,
    startsWith: "RGB" | "Radiometric",
    files: string[]
  ): boolean {
    let valid = false;
    this.sig.watch("Checking directory pattern...");
    const progressBar = this.getNewProgressBar("Files");
    this.showSeparator();
    this.showNewLine();
    progressBar.start(files.length / 2, 0);
    for (let index = 0; index < files.length; index += 2) {
      let patternMatch1 = false;
      let patternMatch2 = false;

      switch (startsWith) {
        case "Radiometric":
          patternMatch1 = files[index].endsWith(patternRadiometric);
          patternMatch2 = files[index + 1].endsWith(patternRGB);
          break;

        case "RGB":
          patternMatch1 = files[index].endsWith(patternRGB);
          patternMatch2 = files[index + 1].endsWith(patternRadiometric);
          break;

        default:
          break;
      }
      valid = patternMatch1 && patternMatch2;
      progressBar.increment();
    }
    progressBar.stop();
    this.showNewLine();
    this.showSeparator();
    return valid;
  }

  printFlags(f: OutputFlags<typeof FindPairs.flags>): void {
    if (f.export) {
      this.sig.info("--export is enabled");

      if (f.exportAs) {
        this.sig.info(`--exportAs set to ${f.exportAs}`);
      } else {
        this.sig.warn(
          `Export format not specified. Export will not be executed`
        );
        this.sig.info(`Use --exportAs flag to specify format`);
      }
    }

    if (f.matchingMode) {
      this.sig.info(`--matchingMode set to "${f.matchingMode}"`);

      if (f.startsWith) {
        this.sig.info(`--startsWith set to "${f.startsWith}"`);
      }

      if (f.patternRGB) {
        this.sig.info(`--patternRGB set to "${f.patternRGB}"`);
      }

      if (f.patternRadiometric) {
        this.sig.info(`--patternRadiometric set to "${f.patternRadiometric}"`);
      }

      if (f.patternRadiometric) {
        this.sig.info(`--patternRadiometric set to "${f.patternRadiometric}"`);
      }

      if (f.dateTimeWithin) {
        this.sig.info(`--dateTimeWithin set to "${f.dateTimeWithin}"`);
      }

      if (f.altitudeWithin) {
        this.sig.info(`--altitudeWithin set to "${f.altitudeWithin}"`);
      }

      if (f.longitudeWithin) {
        this.sig.info(`--longitudeWithin set to "${f.longitudeWithin}"`);
      }

      if (f.latitudeWithin) {
        this.sig.info(`--latitudeWithin set to "${f.latitudeWithin}"`);
      }
    }
  }

  async findByPattern(
    patternRGB: string,
    patternRadiometric: string,
    startsWith: "RGB" | "Radiometric",
    directory: string,
    f: OutputFlags<typeof FindPairs.flags>
  ): Promise<void> {
    const isDirectoryValid = await this.validateDirPattern(directory);

    if (isDirectoryValid) {
      const parser = await this.initializeParser(directory);
      const files = this.prepFileList(parser);
      parser.destroy();
      const isPatternValid = this.checkDirectoryPattern(
        patternRGB,
        patternRadiometric,
        startsWith,
        files
      );
      if (isPatternValid) {
        this.sig.success("Pattern matched. Printing files in order now");
        this.showSeparator();
        this.showNewLine();
        this.showNewLine();
        this.showSeparator();
        if (f.export && f.exportAs) {
          switch (f.exportAs) {
            case "json":
              const path = directory + "/" + "pairs.json";
              this.saveAsJSON("Pairs", path, files);
              break;

            default:
              break;
          }
        }
        this.exitWithSuccess("Found pairs successfully. Exiting now");
      } else {
        throw new Error("Pattern did not match. Try again");
      }
    }
  }
}
