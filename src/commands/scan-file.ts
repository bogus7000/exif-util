import { Command, flags } from "@oclif/command";
const CFonts = require("cfonts");
const chalk = require("chalk");
import * as signal from "signale";
import inquirer = require("inquirer");
import { ImageParser } from "../helper/image-parser";
import * as fs from "fs";

export default class ScanFile extends Command {
  static description = "describe the command here";

  static flags = {
    help: flags.help({ char: "h" }),
    file: flags.string({
      name: "file",
      description: "Path to file",
    }),
    export: flags.boolean({
      description: "Enable export of image exif tags",
      default: false,
    }),
    exportAs: flags.string({
      description: "Set export format. Currently supported: [json]",
      options: ["json"],
      dependsOn: ["export"],
    }),
  };

  options = {
    scope: "exif-util",
  };

  async run() {
    this.welcome();

    const sig = new signal.Signale({
      ...this.options,
    });

    const { flags } = this.parse(ScanFile);

    if (flags.export) {
      sig.info("--export is enabled");

      if (flags.exportAs) {
        sig.info(`--exportAs set to ${flags.exportAs}`);
      } else {
        sig.warn(`Export format not specified. Export will not be executed`);
        sig.info(`Use --exportAs flag to specify format`);
      }
    }

    let file = flags.file;
    if (!file) {
      const sig = new signal.Signale({
        ...this.options,
      });
      sig.warn(`File not provided in flags. Please choose one`);
      this.showSeparator();
      this.log("\n");
      const homedir: string = require("os").homedir();
      inquirer.registerPrompt("fuzzypath", require("inquirer-fuzzy-path"));
      await inquirer
        .prompt([
          {
            type: "fuzzypath",
            name: "file",
            excludeFilter: (nodePath: string) =>
              !nodePath.toLowerCase().endsWith(".jpg"),
            itemType: "file",
            rootPath: homedir,
            message: "Select file for scanning:",
            suggestOnly: false,
            depthLimit: 2,
          },
        ])
        .then((response: any) => {
          file = response.file;
          this.log("\n");
          this.showSeparator();
        })
        .catch((err) => {
          this.catch(err);
        });
    }

    if (file) {
      // Initialize parser
      const parser = await this.initializeParser();
      const tags = await parser.getImageTags(file, "file");

      this.showSeparator();
      this.log("\n");
      this.log(tags);
      this.log("\n");
      this.showSeparator();

      if (flags.export && flags.exportAs) {
        this.exportTags(tags, file);
      }

      sig.complete("File scan complete. Exiting now...");
      this.showSeparator();
      this.log("\n");

      parser.destroy();
    }
  }

  // Main steps

  // Step 0
  welcome(): void {
    console.clear();
    this.log("\n");
    CFonts.say("exif-util", {
      font: "simple", // define the font face
      align: "left", // define text alignment
      colors: ["green"], // define all colors
      background: "transparent", // define the background color, you can also use `backgroundColor` here as key
      letterSpacing: 1, // define letter spacing
      lineHeight: 1, // define the line height
      space: false, // define if the output text should have empty lines on top and on the bottom
      maxLength: "10", // define how many character can be on one line
      gradient: false, // define your two gradient colors
      independentGradient: false, // define if you want to recalculate the gradient for each new line
      transitionGradient: false, // define if this is a transition between colors directly
      env: "node", // define the environment CFonts is being executed in
    });
    this.log("\n");
    this.log(
      chalk.bgGreen.black(`  exif-util version ${this.config.version}   `)
    );
    this.log("\n");
    this.showSeparator();
  }

  // Step 1
  async initializeParser(): Promise<ImageParser> {
    const sig = new signal.Signale({
      ...this.options,
    });
    sig.await("Initializing parser...");
    const parser = new ImageParser();
    await parser.init();
    sig.success("Parser initialized");
    return parser;
  }

  // Step 2
  exportTags(tags: any, file: string): void {
    const sig = new signal.Signale({
      ...this.options,
    });

    const split = file.split("/");
    let fileName = split.pop();
    fileName = fileName?.split(".")[0];
    const path = split.join("/") + "/" + `${fileName}_exif_tags.json`;

    sig.await("Exporting tags...");
    let data = JSON.stringify(tags);
    fs.writeFileSync(path, data);
    sig.success(`Tags exported successfully. File: ${path}`);
  }

  // Helper
  private showSeparator(): void {
    this.log("-------------------------");
  }

  async catch(error: any) {
    const sig = new signal.Signale({
      ...this.options,
    });

    this.log("\n");
    sig.error(error);
    this.exit(1);
  }
}
