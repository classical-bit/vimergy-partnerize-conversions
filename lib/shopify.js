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

const FetchCollections = async (cursor = null) => {
  const query = `
    query ($cursor: String) {
      collections(first: 250, after: $cursor) {
        pageInfo{
          hasNextPage
          endCursor
        }
        edges {
          node {
            id
            title
            products(first: 250){
              edges {
                node {
                id 
                }
              }
            }
          }
        }
      }
    }`;

  return (await ShopifyGraphqlRequest(query, { cursor })).collections;
}

const FetchCollectionsAndProductsById = async (id) => {
  const query = `
          query {
              collection(id: "${id}") {
                  id
                  title
                  handle
                  descriptionHtml
                  metafields(first: 250) {
                    edges {
                      node {
                        type
                        key
                        namespace
                        value
                        description
                      }
                    }
                  }
                  products(first: 250) {
                    edges {
                      node {
                        id
                        handle
                        title
                        featuredImage {
                          altText
                          originalSrc
                        }
                        images(first: 10) {
                          edges {
                            node {
                              altText
                              originalSrc
                            }
                          }
                        }
                        variants(first: 250) {
                          edges {
                            node {
                              id
                              title
                              sku
                              price
                              compareAtPrice
                              image {
                                altText
                                originalSrc
                              }
                              barcode
                              inventoryPolicy
                              inventoryQuantity
                              inventoryManagement
                              taxCode
                              taxable
                              fulfillmentService {
                                id
                              }
                              weight
                              weightUnit
                              requiresShipping
                            }
                          }
                        }
                        metafields(first: 250) {
                          edges {
                            node {
                              type
                              key
                              namespace
                              value
                              description
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
      `;

  return (await ShopifyGraphqlRequest(query)).collection;
}

const FetchProductById = async (id) => {
  const query = `
          query {
              product(id: "${id}") {
                  id
                  handle
                  title
                  featuredImage {
                    altText
                    originalSrc
                  }
                  images(first: 10) {
                    edges {
                      node {
                        altText
                        originalSrc
                      }
                    }
                  }
                  variants(first: 250) {
                    edges {
                      node {
                        id
                        title
                        sku
                        price
                        compareAtPrice
                        image {
                          altText
                          originalSrc
                        }
                        barcode
                        inventoryPolicy
                        inventoryQuantity
                        inventoryManagement
                        taxCode
                        taxable
                        fulfillmentService {
                          id
                        }
                        weight
                        weightUnit
                        requiresShipping
                      }
                    }
                  }
                  metafields(first: 250) {
                    edges {
                      node {
                        type
                        key
                        namespace
                        value
                        description
                      }
                    }
                  }
                }
              }
      `;

  return (await ShopifyGraphqlRequest(query)).product;
}

const CreateProductWithVariants = async (productData) => {
  const mutation = `
      mutation productCreate($input: ProductInput!) {
        productCreate(input: $input) {
          userErrors {
            field
            message
          }
          product {
            id
            options {
              id
              name
              position
              values
            }
            variants(first: 5) {
              nodes {
                id
                title
                selectedOptions {
                  name
                  value
                }
              }
            }
          }
        }
      }
    `;

  const variables = {
    input: {
      title: productData.productName,
      images: productData.images.map((image) => {
        return {
          originalSource: image.originalSrc,
          alt: image.altText
        }
      }),
      options: productData.options,
      variants: productData.variants
    }
  };

  try {
    const response = await ShopifyGraphqlRequest(mutation, variables);
    console.log(response)
    if (response.productCreate.userErrors.length) {
      console.error('Error creating product:', response.data.productCreate.userErrors);
      return null;
    }
    return response.productCreate.product.id;
  } catch (error) {
    console.error('Error creating product:', error);
    return null;
  }
}

const AddTagsToProduct = async (productId, tags) => {
  const mutation = `
      mutation tagsAdd($productId: ID!, $tags: [String!]!) {
        tagsAdd(productId: $productId, tags: $tags) {
          product {
            id
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

  const variables = {
    productId,
    tags,
  };

  try {
    const response = await ShopifyGraphqlRequest(mutation, variables);
    if (response.data.tagsAdd.userErrors.length) {
      console.error('Error adding tags:', response.data.tagsAdd.userErrors);
    }
  } catch (error) {
    console.error('Error adding tags:', error);
  }
}

const AddProductToCollections = async (productId, collectionIds) => {
  const mutation = `
      mutation collectionsAddProducts($collectionIds: [ID!]!, $productId: ID!) {
        collectionsAddProducts(collectionIds: $collectionIds, products: [$productId]) {
          collections {
            id
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

  const variables = {
    collectionIds,
    productId,
  };

  try {
    const response = await ShopifyGraphqlRequest(mutation, variables);
    if (response.data.collectionsAddProducts.userErrors.length) {
      console.error('Error adding product to collections:', response.data.collectionsAddProducts.userErrors);
    }
  } catch (error) {
    console.error('Error adding product to collections:', error);
  }
}

const ActivateInventory = async (variantId, locationIds) => {
  const mutation = `
      mutation inventoryBulkToggleActivation($inventoryItemIds: [ID!]!) {
        inventoryBulkToggleActivation(inventoryItemIds: $inventoryItemIds) {
          bulkOperation {
            successCount
            failureCount
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

  const variables = {
    inventoryItemIds: variantId.map((id) => `gid://shopify/InventoryItem/${id}`),
  };
  try {
    const response = await ShopifyGraphqlRequest(mutation, variables);
    if (response.data.inventoryBulkToggleActivation.userErrors.length) {
      console.error('Error activating inventory:', response.data.inventoryBulkToggleActivation.userErrors);
    } else {
      console.log(`Successfully activated inventory for ${response.data.inventoryBulkToggleActivation.bulkOperation.successCount} variants.`);
    }
  } catch (error) {
    console.error('Error activating inventory:', error);
  }
}


export default {
  ShopifyGraphqlRequest,
  FetchCollections,
  FetchCollectionsAndProductsById,
  CreateProductWithVariants,
  AddTagsToProduct,
  AddProductToCollections,
  ActivateInventory,
  FetchProductById
};