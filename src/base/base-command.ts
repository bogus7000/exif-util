// src/base.ts
import { Command, flags } from "@oclif/command";
import { Input, OutputArgs, OutputFlags } from "@oclif/parser";
import * as signal from "signale";
import chalk = require("chalk");
import CFonts = require("cfonts");
import * as fs from "fs";
import { ImageParser } from "../helper/image-parser";
import cliUx from "cli-ux";

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

  async validateDir(dir: string): Promise<boolean> {
    this.sig.start(`Preparing to scan directory at ${dir}`);
    this.sig.await("Checking directory...");
    if (fs.existsSync(dir)) {
      this.sig.success("Directory exists");
      const parser = await this.initializeParser(dir);
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

  exitWithSuccess(message: string): void {
    this.sig.complete(`${message}`);
    this.showNewLine();
  }

  saveAsJSON(subject: string, path: string, toSave: any): void {
    this.sig.await(`Exporting ${subject}...`);
    let data = JSON.stringify(toSave);
    fs.writeFileSync(path, data);
    this.sig.success(`${subject} exported successfully. File: ${path}`);
  }

  abstract printFlags(flags: any): void;

  //   Helper
  protected showSeparator(): void {
    this.log("-----------------------------------------------------------");
  }

  protected showNewLine(): void {
    this.log("\n");
  }

  getNewProgressBar(subject: string): any {
    return cliUx.progress({
      format: `PROGRESS | {bar} | {value}/{total} ${subject}`,
      barCompleteChar: "\u2588",
      barIncompleteChar: "\u2591",
    });
  }

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
}
