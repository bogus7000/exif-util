import { Command, flags } from "@oclif/command";
import {
  DirScanReport,
  ImageParser,
  ImageTagsComparison,
} from "../util/image-parser";
import cli from "cli-ux";

export default class ScanDir extends Command {
  static description = "Scan a directory with images images";

  static flags = {
    help: flags.help({ char: "h" }),
  };

  static args = [
    { name: "directory", required: true, description: "Path to directory" },
  ];

  async run() {
    console.clear();

    const { argv } = this.parse(ScanDir);

    cli.action.start("Initializing parser...");
    const parser = new ImageParser(argv[0]);
    await parser.init();
    cli.action.stop();
    cli.action.start("Preparing file list...");
    const files = parser.files;
    cli.action.stop();

    const results: ImageTagsComparison[] = [];
    this.log("Scanning files...");
    this.showSeparator();

    const customBar = cli.progress({
      format: "PROGRESS | {bar} | {value}/{total} Image Pairs",
      barCompleteChar: "\u2588",
      barIncompleteChar: "\u2591",
    });
    customBar.start(files.length / 2, 0);
    for (let index = 0; index < files.length; index += 2) {
      const tags1 = await parser.getImageTags(files[index]);
      const tags2 = await parser.getImageTags(files[index + 1]);
      const result = parser.compareImageTags(tags1, tags2);
      delete result["img1Tags"];
      delete result["img2Tags"];
      results.push(result);
      customBar.increment();
    }
    customBar.stop();

    this.showSeparator();

    const report = parser.getScanReport(results, 10);
    this.showReportTree(report);

    parser.destroy();
  }

  private showReportTree(report: DirScanReport): void {
    const tree = cli.tree();
    tree.insert(`Images Scanned: ${report.imagesScanned}`);
    tree.insert(`Pairs Scanned: ${report.imagePairsScanned}`);
    tree.insert(`Pairs With Identical Tags: ${report.pairsWithIdenticalTags}`);
    tree.insert(`Pairs With Different Tags: ${report.pairsWithDifferentTags}`);
    tree.insert(`Average Longitude Delta: ${report.avgLonDelta} degrees`);
    tree.insert(`Average Latitude Delta: ${report.avgLatDelta} degrees`);
    tree.insert(`Average Altitude Delta: ${report.avgAltDelta} degrees`);
    tree.insert(`Average DateTime Delta: ${report.avgDateTimeDelta} seconds`);
    this.log("Scan Report");
    tree.display();
  }

  private showSeparator(): void {
    this.log("-------------------------");
  }
}
