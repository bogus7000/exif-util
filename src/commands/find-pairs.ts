import { OutputFlags } from "@oclif/parser";
import { flags } from "@oclif/command";
import BaseCommand from "../base/base-command";

export default class FindPairs extends BaseCommand {
  static description = "Find pairs in a directory of images based on EXIF tags";

  static flags = {
    ...BaseCommand.flags,
    matchingMode: flags.string({
      description: "Choose method for finding pairs",
      options: ["pattern"],
      required: true,
      dependsOn: ["startsWith"],
    }),
    startsWith: flags.string({
      description: "Specify which image comes first",
      options: ["RGB", "Radiometric"],
      dependsOn: ["matchingMode", "patternRGB", "patternRadiometric"],
    }),
    patternRGB: flags.string({
      description: "Pattern to look for in a RGB image",
      dependsOn: ["matchingMode", "startsWith", "patternRadiometric"],
    }),
    patternRadiometric: flags.string({
      description: "Pattern to look for in a Radiometric image",
      dependsOn: ["matchingMode", "startsWith", "patternRGB"],
    }),
    // dateTimeWithin: flags.string({
    //   description: "Margin for EXIF tag DateTimeOriginal. In seconds",
    // }),
    // altitudeWithin: flags.string({
    //   description: "Margin for EXIF tag GPSAltitude",
    // }),
    // longitudeWithin: flags.string({
    //   description: "Margin for EXIF tag GPSLongitude. In degrees",
    // }),
    // latitudeWithin: flags.string({
    //   description: "Margin for EXIF tag GPSLatitude. In degrees",
    // }),
    export: {
      ...BaseCommand.flags.export,
      description: "Enable export of image pairs list",
    },
  };

  static args = [
    {
      ...BaseCommand.args[0],
      description: "Path to directory to look for pairs",
    },
  ];

  async run() {
    if (this.parsedArgs && this.parsedFlags) {
      // Read flags and args
      const flags = this.parsedFlags as OutputFlags<typeof FindPairs.flags>;
      const args = this.parsedArgs;

      // Notify on set flags
      this.printFlags(flags);

      if (
        flags.patternRGB &&
        flags.patternRadiometric &&
        flags.startsWith &&
        args.path
      ) {
        await this.findByPattern(
          flags.patternRGB,
          flags.patternRadiometric,
          flags.startsWith,
          args.path,
          flags
        );
      }
    }
  }

  printFlags(flags: any): void {
    if (flags.export) {
      this.sig.info("--export is enabled");

      if (flags.exportAs) {
        this.sig.info(`--exportAs set to ${flags.exportAs}`);
      } else {
        this.sig.warn(
          `Export format not specified. Export will not be executed`
        );
        this.sig.info(`Use --exportAs flag to specify format`);
      }
    }

    if (flags.matchingMode) {
      this.sig.info(`--matchingMode set to "${flags.matchingMode}"`);

      if (flags.startsWith) {
        this.sig.info(`--startsWith set to "${flags.startsWith}"`);
      }

      if (flags.patternRGB) {
        this.sig.info(`--patternRGB set to "${flags.patternRGB}"`);
      }

      if (flags.patternRadiometric) {
        this.sig.info(
          `--patternRadiometric set to "${flags.patternRadiometric}"`
        );
      }
    }
  }

  async findByPattern(
    patternRGB: string,
    patternRadiometric: string,
    startsWith: "RGB" | "Radiometric",
    directory: string,
    flags: any
  ): Promise<void> {
    const isDirectoryValid = await this.validateDir(directory);

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
        console.log(files);
        this.showNewLine();
        this.showSeparator();
        if (flags.export && flags.exportAs) {
          switch (flags.exportAs) {
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
}
