import { Command, flags } from "@oclif/command";
const CFonts = require("cfonts");
const chalk = require("chalk");
import * as signal from "signale";
import inquirer = require("inquirer");
import { ImageParser } from "../helper/image-parser";

export default class ScanFile extends Command {
  static description = "describe the command here";

  static flags = {
    help: flags.help({ char: "h" }),
  };

  static args = [{ name: "file", description: "Path file" }];

  options = {
    scope: "exif-util",
  };

  async run() {
    this.welcome();

    const { args } = this.parse(ScanFile);

    let file = args.file;
    if (!file) {
      const sig = new signal.Signale({
        ...this.options,
      });
      sig.warn(`File not provided in args. Please choose one`);
      this.showSeparator();
      this.log("\n");
      const homedir: string = require("os").homedir();
      inquirer.registerPrompt("fuzzypath", require("inquirer-fuzzy-path"));
      await inquirer
        .prompt([
          {
            type: "fuzzypath",
            name: "file",
            itemType: "file",
            rootPath: homedir,
            message: "Select file for scanning:",
            suggestOnly: false,
            depthLimit: 2,
          },
        ])
        .then((response) => {
          file = response.file;
          this.log("\n");
          this.showSeparator();
        })
        .catch((err) => {
          this.catch(err);
        });
    }

    if (file) {
      const sig = new signal.Signale({
        ...this.options,
      });

      // Initialize parser
      const parser = await this.initializeParser();
      const tags = await parser.getImageTags(file, "file");

      this.showSeparator();
      this.log("\n");
      this.log(tags);
      this.log("\n");
      this.showSeparator();
      sig.complete("File scan complete. Exiting now...");
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
