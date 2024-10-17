import { readJSONFile, writeJSONFile } from "./lib/file-handler.js";

function main() {
    const logs = [];
    for (let i = 0; i <= 133; i++) {
        const l = readJSONFile('./cloudwatch_logs/log_events_' + i + '.json');
        logs.push(...l);
    }
    writeJSONFile('./log_events', JSON.stringify(logs));
}

main()