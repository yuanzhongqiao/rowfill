const tsConfig = require("./tsconfig.server.json");
const tsConfigPaths = require("tsconfig-paths");

let { baseUrl, paths } = tsConfig.compilerOptions;

// Check if baseUrl and paths are defined
if (!baseUrl || !paths) {
  throw new Error("baseUrl or paths are not defined in tsconfig.server.json");
}

// Transform paths to point to the dist directory
for (let key in paths) {
  paths[key][0] = paths[key][0]
    .replace("src", "dist")
    .replace(".ts", ".js");
}

// Register the paths
tsConfigPaths.register({ baseUrl, paths })