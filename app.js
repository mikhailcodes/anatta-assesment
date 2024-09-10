const { createAdminApiClient } = require('@shopify/admin-api-client');
const args = require('minimist')(process.argv.slice(2));

const client = createAdminApiClient({
    storeDomain: 'anatta-test-store.myshopify.com',
    apiVersion: '2024-10',
    accessToken: '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',
});

const productName = args.name || '';

if (!productName) {
    console.error('Please provide a product name using --name');
    process.exit(1);
}

async function fetchProducts() {
    const operation = `
    query {
      products(first: 100, query: "${productName}") {
        edges {
          node {
            title
            variants(first: 10) {
              edges {
                node {
                  title
                  price
                }
              }
            }
          }
        }
      }
    }
  `;

    try {
        const { data, errors } = await client.request(operation);

        if (errors && errors.length) {
            console.error('GraphQL Errors:', errors);
            return;
        }

        const products = data.products.edges;

        if (!products.length) {
            console.log(`No products found for name: "${productName}"`);
            return;
        }

        const result = products.flatMap(product => {
            const title = product.node.title;
            return product.node.variants.edges
                .sort((a, b) => Number.parseFloat(a.node.price) - Number.parseFloat(b.node.price))
                .map(variant => `${title} - ${variant.node.title} - price $${variant.node.price}`);
        });

        if (result.length) {
            console.log(result.join('\n'));
        } else {
            console.log('No variants found for the products.');
        }
    } catch (error) {
        console.error('Error fetching products:', error);
    }
}

fetchProducts();