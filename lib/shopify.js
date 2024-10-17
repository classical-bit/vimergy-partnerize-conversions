import axios from 'axios';
const shopName = process.env.SHOPIFY_STORE_NAME;
const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
if (!shopName || !accessToken) {
  throw new Error('Shopify creds are not set in env.');
}

const ShopifyGraphqlRequest = async (query, variables = null) => {
  const response = await axios.post(
    `https://${shopName}/admin/api/2024-01/graphql.json`,
    { query, variables },
    {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      }
    });

  if (response.data.errors) {
    console.error('Shopify GQL Request failed:', response.data.errors)
    return null;
  }
  return response.data.data;
};

export async function GetOrder(id) {
  const query = `
  query {
  order(id: "gid://shopify/Order/${id}") {
    id
    name
    customer {
      email
      lastOrder {
        id
      }
      orders (first: 50) {
        edges {
          node {
            id
          }
        }
      }
    }
  }
}
  `;

  return (await ShopifyGraphqlRequest(query)).order;
}

export async function GetCustomerFirstOrderCreatedAt(customerId) {
  const query = `
      {
    customer(id: "${customerId}") {
      orders(first: 1) {
        edges {
          node {
            id
            name
            createdAt
          }
        }
      }
    }
  }
    `;

  const response = await ShopifyGraphqlRequest(query);
  if (response.customer.orders.edges[0]) {
    return response.customer.orders.edges[0].node.createdAt;
  }
  return undefined;
}

export async function GetCustomerIdByEmail(email) {
  const query = `
      {
    customers(first: 1, query: "email:${email}") {
      edges {
        node {
          id
        }
      }
    }
  }
    `;

  const response = await ShopifyGraphqlRequest(query);
  return response.customers.edges[0].node.id;
}