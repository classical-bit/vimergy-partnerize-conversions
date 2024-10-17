import 'dotenv/config';
import { GetConversions } from './lib/partnerize.js';
import { readJSONFile, writeCSV, writeJSONFile } from './lib/file-handler.js';
import { GetOrder } from './lib/shopify.js';

async function main() {
    const invalidTypeCustomers = [];
    const campaignId = '1101l6322';
    const conversions = await GetConversions(campaignId);

    for (const conversion of conversions) {
        const { campaign_id, conversion_id, customer_type, conversion_reference: order_id } = conversion;
        if (customer_type === 'new') {
            const order = await GetOrder(order_id);
            const ordersCount = order.customer.orders.edges.length;
            const lastOrderId = order.customer.lastOrder.id.slice(20);

            if (ordersCount > 1) {
                const _c = {
                    campaign_id,
                    conversion_id,
                    order_id,
                    customer_type,
                    customer_email: order.customer.email,
                    orders_count: ordersCount,
                    lastOrderId
                };
                invalidTypeCustomers.push(_c)
                console.log(JSON.stringify(_c));
            }
        }
    }

    writeCSV('invalid-new-type-customers', Object.keys(invalidTypeCustomers[0]), invalidTypeCustomers);
}

main();
