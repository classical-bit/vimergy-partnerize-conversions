import axios from 'axios';

const PARTNERIZE_AUTH_KEY = process.env.PARTNERIZE_AUTH_KEY
if (!PARTNERIZE_AUTH_KEY) {
    throw new Error("Parnerize auth key is undefiend.");
}

const options = {
    headers: {
        'Authorization': `Basic ${Buffer.from(PARTNERIZE_AUTH_KEY).toString("base64")}`,
    }
};
const baseUrl = 'https://api.partnerize.com';

export async function GetConversions(campaignId) {
    const conversions = [];
    try {
        let nextPage = undefined;
        do {
            if (nextPage) {
                console.log('request - partnerize - Get', nextPage);
                const response = await axios.get(baseUrl + nextPage, options);
                conversions.push(...response.data.conversions.map(c => c.conversion_data));
                nextPage = response.data.hypermedia.pagination.next_page;
            } else {
                const url = `/reporting/report_advertiser/campaign/${campaignId}/conversion.json`;
                console.log('request - partnerize - Get', url);
                const response = await axios.get(baseUrl + url, options);
                conversions.push(...response.data.conversions.map(c => c.conversion_data));
                nextPage = response.data.hypermedia.pagination.next_page;
            }
        } while (nextPage);
    } catch (err) {
        console.log("error while getting conversions:", err);
        return [];
    }
    console.log('campaign_id:', campaignId, 'conversions_count:', conversions.length);
    return conversions;
}