import 'dotenv/config';
import { readJSONFile } from "./lib/file-handler.js";
import _ from "lodash";
import { SendTrackConversionRequest } from "./lib/partnerize.js";

async function main() {
    const conversions = readJSONFile('./data/conversions-to-process.json');
    for (let index = 0; index < conversions.length; index++) {
        const { campaignId, clickref, conversionref, country, currency, customerType, voucher, requestStr, timestamp, email } = conversions[index];
        console.log(`* ${index + 1}/${conversions.length}\tEmail: ${email}`);
        const responseStatus = await SendTrackConversionRequest({
            campaignId, clickref, conversionref, country, currency, customerType, voucher, requestStr,
            conversionTime: formatToConversionTime(new Date(timestamp))
        });

        if (responseStatus !== 200) {
            console.log(`Failed sending conversion track, Email: ${email}`);
        }
    }
}
function formatToConversionTime(timestamp) {
    const year = timestamp.getFullYear();
    const month = String(timestamp.getMonth() + 1).padStart(2, '0');
    const day = String(timestamp.getDate()).padStart(2, '0');
    const hours = String(timestamp.getHours()).padStart(2, '0');
    const minutes = String(timestamp.getMinutes()).padStart(2, '0');
    const seconds = String(timestamp.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

main()