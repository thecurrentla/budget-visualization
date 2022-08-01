import fs from "fs";
import fetch from "node-fetch";

import { parse } from "csv-parse";

const CWD = process.cwd();
const CONFIG_PATH = `${CWD}/config.json`;
const CONFIG = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
const { sheet } = CONFIG.google;

async function getAndWriteSheet(opt, cb) {
  const base = "https://docs.google.com/spreadsheets/d/e";
  const url = `${base}/${opt.id}/pub?gid=${opt.gid}&single=true&output=csv`;

  try {
    const response = await fetch(url);
    // console.log(response.body);

    if (response.ok) {
      const body = await response.text();
      const file = `${CWD}/${opt.filepath || "src/data/data.json"}`;
      const file_json = file.replace(".csv", ".json");
      console.log(file_json);

      fs.writeFile(file, body, (err) => {
        if (err) throw err;
        console.log(
          "csv with id",
          "\x1b[32m",
          `${opt.id}`,
          "\x1b[0m",
          "and gid",
          "\x1b[32m",
          `${opt.gid}`,
          "\x1b[0m",
          "successfully written to",
          "\x1b[34m",
          `${file}\n`
        );
        cb();
      });

      // Parse as JSON, then write that
      // parse(
      //   body,
      //   {
      //     columns: true,
      //     skip_empty_lines: true,
      //   },
      //   function (err, records) {
      //     fs.writeFile(file_json, records, (err) => {
      //       if (err) throw err;
      //       console.log(
      //         "json with id",
      //         "\x1b[32m",
      //         `${opt.id}`,
      //         "\x1b[0m",
      //         "and gid",
      //         "\x1b[32m",
      //         `${opt.gid}`,
      //         "\x1b[0m",
      //         "successfully written to",
      //         "\x1b[34m",
      //         `${file_json}\n`
      //       );
      //       cb();
      //     });
      //   }
      // );
    }
  } catch (err) {
    console.error(err);
  }
}

function init() {
  let i = 0;
  const next = () => {
    const d = sheet[i];
    if (d.id)
      getAndWriteSheet(d, () => {
        i += 1;
        if (i < sheet.length) next();
        else process.exit();
      });
  };

  next();
}

init();
