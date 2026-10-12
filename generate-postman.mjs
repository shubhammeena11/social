
import fs from "node:fs";
import path from "node:path";

const apiDirectory = path.join(process.cwd(), "app", "api");
const outputFile = path.join(
  process.cwd(),
  "postman-collection.json"
);

const methods = ["GET", "POST", "PUT", "PATCH", "DELETE"];

function scanRoutes(directory) {
  const results = [];

  if (!fs.existsSync(directory)) {
    throw new Error("Could not find app/api. Run this script from your project root.");
  }

  for (const entry of fs.readdirSync(directory, {
    withFileTypes: true,
  })) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      results.push(...scanRoutes(fullPath));
      continue;
    }

    if (entry.name !== "route.js" && entry.name !== "route.ts") {
      continue;
    }

    const source = fs.readFileSync(fullPath, "utf8");

    const exportedMethods = methods.filter((method) => {
      const pattern = new RegExp(
        String.raw`export\s+(?:async\s+)?function\s+${method}\b|export\s+(?:const|let|var)\s+${method}\b`
      );

      return pattern.test(source);
    });

    const relativePath = path
      .relative(apiDirectory, fullPath)
      .split(path.sep)
      .slice(0, -1);

    const urlPath = "/api/" + relativePath
      .map((segment) =>
        segment.replace(/\[([^\]]+)\]/g, ":$1")
      )
      .join("/");

    for (const method of exportedMethods) {
      results.push({
        name: `${method} ${urlPath}`,
        method,
        urlPath,
      });
    }
  }

  return results;
}

const routes = scanRoutes(apiDirectory);

const items = routes.map((route) => {
  const needsBody = ["POST", "PUT", "PATCH"].includes(
    route.method
  );

  const url = {
    raw: "{{baseUrl}}" + route.urlPath,
    host: ["{{baseUrl}}"],
    path: route.urlPath.split("/").filter(Boolean),
    variable: [
      ...route.urlPath.matchAll(/:([^/]+)/g),
    ].map((match) => ({
      key: match[1],
      value: "",
    })),
  };

  return {
    name: route.name,
    request: {
      method: route.method,
      header: needsBody
        ? [{ key: "Content-Type", value: "application/json" }]
        : [],
      url,
      ...(needsBody
        ? {
            body: {
              mode: "raw",
              raw: "{}",
              options: {
                raw: { language: "json" },
              },
            },
          }
        : {}),
    },
  };
});

const collection = {
  info: {
    name: "Social Media API",
    schema:
      "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
  },
  variable: [
    {
      key: "baseUrl",
      value: "http://localhost:3000",
    },
  ],
  item: items,
};

fs.writeFileSync(
  outputFile,
  JSON.stringify(collection, null, 2)
);

console.log(`Found ${routes.length} API requests.`);
console.log(`Collection created: ${outputFile}`);