import { Config } from "@remotion/cli/config";

Config.setPublicDir("../assets");

export default {
  logLevel: "verbose",
  ffmpeg: {
    codec: "h264",
  },
};
