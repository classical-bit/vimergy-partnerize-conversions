import 'dotenv/config';
import { readJSONFile, writeJSONFile } from "./lib/file-handler.js";
import _ from "lodash";
import { GetCustomerFirstOrderCreatedAt, GetCustomerIdByEmail } from "./lib/shopify.js";

async function main() {
    const jsonOutput = [];
    const logs = readJSONFile('./cloudwatch_logs/log_events_all.json')
        .filter(log => {
            if (log.message.substring(0, 'END RequestId'.length) === 'END RequestId') return false;
            if (log.message.substring(0, 'REPORT RequestId'.length) === 'REPORT RequestId') return false;
            if (log.message.substring(0, 'INIT_START'.length) === 'INIT_START') return false;
            if (log.message.substring(0, 'START RequestId'.length) === 'START RequestId') return false;
            return isValidDateType(log.message.substring(0, 24));
        })
        .map(addReqId);

    const logsGroupedByReqId = _.groupBy(logs, 'reqId');
    for (const reqId in logsGroupedByReqId) {
        const outPut = {};
        // console.log(reqId)
        const reqLogs = logsGroupedByReqId[reqId];

        const eventLog = reqLogs.find(l => isEventLogEvent(l));
        if (!eventLog) {
            console.log(`Event Log Not found. ReqId: ${reqId}`);
            continue;
        }
        const { timestamp, message } = eventLog;
        const body = getBodyFrom(message);

        let customerType = undefined;
        const customerTypeLog = reqLogs.find(l => isCustomerTypeLogEvent(l));
        if (!customerTypeLog) {
            console.log(`Timestamp: ${new Date(timestamp).toISOString()} Email: ${body.email} Customer type NOT found.`);
            const customerId = await GetCustomerIdByEmail(body.email);
            const customerFirstOrderCreatedAt = await GetCustomerFirstOrderCreatedAt(customerId);
            console.log(`Timestamp: ${new Date(timestamp).toISOString()} Email: ${body.email} Order createdAt: ${customerFirstOrderCreatedAt}`);

            if (new Date(timestamp) < new Date(customerFirstOrderCreatedAt)) {
                customerType = 'New';
            } else {
                customerType = 'Existing';
            }
            outPut.customerId = customerId;
            outPut.firstOrderCreatedAt = customerFirstOrderCreatedAt;
        } else {
            customerType = getCustomerTypeFrom(customerTypeLog.message);
        }

        jsonOutput.push({
            ...outPut,
            timestamp,
            customerType,
            email: body.email,
            campaignId: body.campaignId,
            clickref: body.clickref,
            conversionref: body.conversionref,
            country: body.country,
            currency: body.currency,
            voucher: body.voucher,
            requestStr: body.requestStr,
        });
        // console.log(campaignId, clickref, conversionref, country, currency, voucher, requestStr)
    }

    writeJSONFile('conversions-to-process', JSON.stringify(jsonOutput));
}

function getCustomerTypeFrom(message) {
    if (message.substring(80, 83) === 'New') return 'New';
    if (message.substring(80, 88) === 'Existing') return 'Existing';
    throw new Error(`No Customer Type in Message: ${message}`);
}

function isCustomerTypeLogEvent(log) {
    return log.message.substring(67, 79) === 'customerType';
}
function isEventLogEvent(log) {
    return log.message.substring(67, 72) === 'event';
}

function addReqId(log) {
    return {
        ...log,
        reqId: log.message.substring(25, 61)
    };
}

function isValidDateType(string) {
    return !isNaN(new Date(string));
}

function getBodyFrom(message) {
    const bodyStart = message.indexOf('body: ') + 6;
    const bodyEnd = message.indexOf(',\n  isBase64Encoded');
    const bodyString = message.slice(bodyStart + 1, bodyEnd - 1);
    return JSON.parse(bodyString);
}

async function makeConversionRequest({ campaignId, clickref, conversionref, country, currency, customerType, voucher, itemsArrStr }) {
    const requestdata = `campaign:${campaignId}/clickref:${clickref}/conversionref:${conversionref}/country:${country}/currency:${currency}/customertype:${customerType}/voucher:${voucher}${itemsArrStr}`;
    console.log("requestdata", requestdata);
    // const response = await fetch(`https://prf.hn/conversion/tracking_mode:api/${requestdata}`, {
    //     mode: 'no-cors',
    //     method: "POST",
    //     headers: {
    //         "Content-type": "application/json; charset=UTF-8",
    //         'Access-Control-Allow-Origin': 'https://myvimergy.myshopify.com',
    //     }
    // });
}

const ce =
    main()