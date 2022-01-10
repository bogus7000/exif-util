// src/base.ts
import { Command, flags } from "@oclif/command";
import { Input, OutputArgs, OutputFlags } from "@oclif/parser";
import * as signal from "signale";
import chalk = require("chalk");
import CFonts = require("cfonts");
import * as fs from "fs";
import { ImageParser } from "../helper/image-parser";
import cliUx from "cli-ux";
import inquirer = require("inquirer");
import os = require("os");
import { ParsedImage } from "../model";

export default abstract class BaseCommand extends Command {
  static flags = {
    help: flags.help({ char: "h" }),
    export: flags.boolean({
      description: "Enable export",
      default: false,
    }),
    exportAs: flags.string({
      description: "Set export format. Currently supported: [json]",
      options: ["json"],
      dependsOn: ["export"],
    }),
  };
  static args = [
    {
      name: "path",
      required: true,
      description: "Path to file or directory",
    },
  ];

  protected parsedArgs?: OutputArgs;
  protected parsedFlags?: OutputFlags<typeof BaseCommand.flags>;
  protected sig!: signal.Signale<signal.DefaultMethods>;
  private sigOptions = {
    scope: "exif-util",
  };

  async init(): Promise<void> {
    // init Signale
    this.sig = new signal.Signale({
      ...this.sigOptions,
    });
    // init args and flags
    const { args, flags } = this.parse(
      this.constructor as Input<typeof BaseCommand.flags>
    );
    this.parsedArgs = args;
    this.parsedFlags = flags;
    this.welcome();
  }

  async catch(err: any) {
    return super.catch(err);
  }

  async initializeParser(dir: string): Promise<ImageParser> {
    this.sig.await("Initializing parser...");
    const parser = new ImageParser(dir);
    await parser.init();
    this.sig.success("Parser initialized");
    return parser;
  }

  prepFileList(parser: ImageParser): string[] {
    this.sig.await("Reading files...");
    const files = parser.files;
    if (files.length >= 1) {
      this.sig.success("File list ready");
    } else {
      throw new Error("Directory is empty");
    }
    return files;
  }

  saveAsJSON(subject: string, path: string, toSave: any): void {
    this.sig.await(`Exporting ${subject}...`);
    let data = JSON.stringify(toSave);
    fs.writeFileSync(path, data);
    this.sig.success(`${subject} exported successfully. File: ${path}`);
  }

  abstract printFlags(flags: any): void;

  // ------------------------------------ Helper
  // --------------------------- UI Elements
  protected welcome(): void {
    console.clear();
    this.showNewLine();
    CFonts.say("exif-util", {
      font: "simple",
      align: "left",
      space: false,
      colors: ["green"],
      background: "transparent",
      env: "node",
    });
    this.showNewLine();
    this.log(
      chalk.bgGreen.black(`  exif-util version ${this.config.version}   `)
    );
    this.showNewLine();
    this.showSeparator();
  }

  protected showSeparator(): void {
    this.log("-----------------------------------------------------------");
  }

  protected showNewLine(): void {
    this.log("\n");
  }

  protected getNewProgressBar(subject = ""): any {
    return cliUx.progress({
      format: `PROGRESS | {bar} | {value}/{total} ${subject}`,
      barCompleteChar: "\u2588",
      barIncompleteChar: "\u2591",
    });
  }

  // --------------------------- Inquirer Prompts
  protected async inquireForDirectoryPath(message: string): Promise<string> {
    this.sig.warn(message);
    this.showSeparator();
    this.log("\n");

    const homedir: string = os.homedir();
    inquirer.registerPrompt("fuzzypath", require("inquirer-fuzzy-path"));
    const dir = await inquirer
      .prompt([
        {
          type: "fuzzypath",
          name: "directory",
          excludePath: (nodePath: string) => nodePath.includes("."),
          excludeFilter: (nodePath: string) => nodePath.includes("."),
          itemType: "directory",
          rootPath: homedir,
          message: "Select a target directory for scanning:",
          suggestOnly: false,
          depthLimit: 6,
        },
      ])
      .then((response: any) => {
        return response.directory;
      })
      .catch((err) => {
        this.catch(err);
      });
    this.log("\n");
    this.showSeparator();
    return dir;
  }

  protected async inquireForFilePath(
    message: string,
    filterEndsWith: string
  ): Promise<string> {
    this.sig.warn(message);
    this.showSeparator();
    this.log("\n");

    const homedir: string = os.homedir();
    inquirer.registerPrompt("fuzzypath", require("inquirer-fuzzy-path"));
    const file = await inquirer
      .prompt([
        {
          type: "fuzzypath",
          name: "file",
          excludeFilter: (nodePath: string) =>
            !nodePath.toLowerCase().endsWith(filterEndsWith),
          itemType: "file",
          rootPath: homedir,
          message: message,
          suggestOnly: false,
          depthLimit: 6,
        },
      ])
      .then((response: any) => {
        return response.file;
      })
      .catch((err) => {
        this.catch(err);
      });
    this.log("\n");
    this.showSeparator();
    return file;
  }

  // --------------------------- Validation
  protected validateDirExists(dir: string): boolean {
    this.sig.start(`Preparing to scan directory at ${dir}`);
    this.sig.await("Checking directory...");
    if (fs.existsSync(dir)) {
      this.sig.success("Directory exists");
      return true;
    } else {
      throw new Error("Directory does not exist");
    }
  }

  protected async validateDirPattern(path: string): Promise<boolean> {
    this.sig.start(`Preparing to scan directory at ${path}`);
    this.sig.await("Checking directory...");
    if (fs.existsSync(path)) {
      this.sig.success("Directory exists");
      const parser = await this.initializeParser(path);
      const files = this.prepFileList(parser);
      let allFilesAreJPEG = false;
      files.forEach((element) => {
        if (element.toLocaleLowerCase().endsWith("jpg")) {
          allFilesAreJPEG = true;
        } else {
          allFilesAreJPEG = false;
        }
      });
      parser.destroy();
      if (allFilesAreJPEG) {
        return true;
      } else {
        throw new Error(
          "Directory has files other than JPEG images. Clean up and try again"
        );
      }
    } else {
      throw new Error("Directory does not exist");
    }
  }

  isRadiometric(img: ParsedImage): boolean {
    return img.tags.RawThermalImage || img.tags.ThermalData;
  }

  // --------------------------- Misc

  /**
   * Returns a shuffled array. Leaves original array intact.
   * Uses a basic implementation of Fisher-Yates algorithm for shuffling.
   * @param {any[]} array - Array to shuffle
   * @return {*}  {any[]} - Shuffled array
   * @memberof BaseCommand
   */
  shuffleArray(array: any[]): any[] {
    const clone = Array.from(array);
    for (let i = clone.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1));
      [clone[i], clone[j]] = [clone[j], clone[i]];
    }
    return clone;
  }

  // --------------------------- Logging
  consoleLogIfVerbose(output: any, message: string, verbose: boolean): void {
    if (verbose) {
      this.sig.info(message);
      console.log(output);
    }
  }

  exitWithSuccess(message: string): void {
    this.sig.complete(`${message}`);
    this.showNewLine();
  }
}
