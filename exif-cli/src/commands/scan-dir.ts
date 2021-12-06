import { Command, flags } from "@oclif/command";
import { ImageParser, ImageTagsComparison } from "./util/image-parser";

export default class ScanDir extends Command {
  static description = "Scan a directory with images images";

  static flags = {
    help: flags.help({ char: "h" }),
  };

  static args = [
    { name: "directory", required: true, description: "Path to directory" },
  ];

  async run() {
    const { args, flags } = this.parse(ScanDir);

    const { argv } = this.parse(ScanDir);
    console.log(`running my command with args: ${argv[0]}, ${argv[1]}`);

    // if (args.file && flags.force) {
    //   this.log(`you input --force and --file: ${args.file}`);
    // }
    const parser = new ImageParser(argv[0]);
    await parser.init();
    const files = parser.files;
    const results: ImageTagsComparison[] = [];

    console.log("Scanning files...");
    console.log("-------------------------");
    for (let index = 0; index < files.length; index += 2) {
      console.log("Scanning files " + index + " and " + (index + 1) + "...");
      const tags1 = await parser.getImageTags(files[index]);
      const tags2 = await parser.getImageTags(files[index + 1]);
      const result = parser.compareImageTags(tags1, tags2);
      delete result["img1Tags"];
      delete result["img2Tags"];
      results.push(result);
    }

    console.log("-------------------------");
    console.log("Scan complete. Comparison Table -> ");
    console.table(results);
    console.log("-------------------------");
    console.log("Scan complete. Report -> ");
    console.log("Scanned files: " + files.length);
    console.log("Scanned file pairs: " + results.length);
    const withDiff = results.filter((res) => !res.identical);
    console.log(
      "Pairs with identical tags: " + (results.length - withDiff.length)
    );
    console.log("Pairs with differences in tags: " + withDiff.length);
    console.log(
      `Average Altitude Delta: ${parser
        .calculateAvgDelta(parser.altDeltas)
        .toFixed(10)} degrees`
    );
    console.log(
      `Average Latitude Delta: ${parser
        .calculateAvgDelta(parser.latDeltas)
        .toFixed(10)} degrees`
    );
    console.log(
      `Average Longitude Delta: ${parser
        .calculateAvgDelta(parser.longDeltas)
        .toFixed(10)} degrees`
    );
    console.log(
      `Average DateTime Delta: ${parser
        .calculateAvgDelta(parser.dateDeltas)
        .toFixed(10)} seconds`
    );
    // console.log(results[0].img1Tags);
    // console.log(results[0].img2Tags);
    parser.destroy();
  }
}
