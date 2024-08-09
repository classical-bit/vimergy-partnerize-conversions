import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify";
import fs from "fs";
import _ from "lodash";

export function writeCSV(fileName, columns, rows) {
    console.log("writing", fileName);
    const writableStream = fs.createWriteStream(`./data/${fileName}.csv`);
    const stringifier = stringify({ header: true, columns: columns });
    rows.forEach(row => {
        stringifier.write(row)
    });
    stringifier.pipe(writableStream);
    console.log("finished writing csv:", fileName);
}

export function readCSV(filePath) {
    console.log("reading csv:", filePath);
    const data = parse(
        fs.readFileSync(filePath, "utf8"),
        {
            columns: (headers) => headers.map(header => _.kebabCase(header)),
            relax_quotes: true
        }
    );
    console.log(filePath, "count:", data.length);
    return data;
}

export function readJSONFile(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

export function writeJSONFile(fileName, body) {
    fs.writeFileSync(`./data/${fileName}.json`, Buffer.from(body));
}

export async function isFileOk(filePath) {
    return await fs.promises.access(filePath, fs.constants.F_OK).then(() => true).catch(() => false);
}
