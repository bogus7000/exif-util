import { flags } from "@oclif/command";
import BaseCommand from "../base/base-command";

export default class FindPairs extends BaseCommand {
  static description = "Find pairs in a directory of images based on EXIF tags";

  static flags = {
    ...BaseCommand.flags,
    byAltitude: flags.string({
      description: "Margin for EXIF tag GPSAltitude",
    }),
    byLongitude: flags.string({
      description: "Margin for EXIF tag GPSLongitude",
    }),
    byLatitude: flags.string({
      description: "Margin for EXIF tag GPSLatitude",
    }),
    byDateTime: flags.string({
      description:
        "Margin for EXIF tag DateTimeOriginal. Provide UNIX timestamp in seconds",
      required: true,
    }),
  };

  static args = [
    {
      name: "directory",
      required: true,
      description: "Directory to scan for pairs",
    },
  ];

  async run() {
    this.welcome();
    const { args, flags } = this.parse(FindPairs);
    console.log(args);
    console.log(flags);
  }
}
