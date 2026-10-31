/**
 * Knex Migration: Initial Schema for Ladies Boutique Point-of-Sale
 * Tables: users, categories, products, customers, sales, sale_items, payments
 */

exports.up = async function (knex) {
  // 1. Users table
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 100).notNullable();
    table.string('email', 150).unique().notNullable();
    table.string('password_hash', 255).notNullable();
    table.string('role', 20).notNullable().defaultTo('cashier'); // 'cashier', 'manager', 'admin'
    table.timestamps(true, true);
  });

  // 2. Categories table
  await knex.schema.createTable('categories', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 100).unique().notNullable();
    table.text('description');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // 3. Products table
  await knex.schema.createTable('products', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('sku', 64).unique().notNullable(); // Index on SKU for barcode scanning
    table.string('name', 255).notNullable();
    table.text('description');
    table.uuid('category_id').references('id').inTable('categories').onDelete('SET NULL');
    table.decimal('cost_price', 10, 2).notNullable().defaultTo(0.0);
    table.decimal('price', 10, 2).notNullable();
    table.integer('stock').notNullable().defaultTo(0);
    table.integer('low_stock_threshold').notNullable().defaultTo(5);
    table.string('size', 20); // S, M, L, XL, Free Size
    table.string('color', 50);
    table.text('image_url');
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamps(true, true);

    table.index('sku', 'idx_products_sku');
    table.index('category_id', 'idx_products_category');
  });

  // 4. Customers table
  await knex.schema.createTable('customers', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 150).notNullable();
    table.string('phone', 30).unique();
    table.string('email', 150);
    table.integer('loyalty_points').defaultTo(0);
    table.decimal('total_spent', 12, 2).defaultTo(0.0);
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index('phone', 'idx_customers_phone');
  });

  // 5. Sales (Invoices) table
  await knex.schema.createTable('sales', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('invoice_number', 50).unique().notNullable();
    table.uuid('user_id').references('id').inTable('users').onDelete('RESTRICT').notNullable();
    table.uuid('customer_id').references('id').inTable('customers').onDelete('SET NULL');
    table.decimal('subtotal', 10, 2).notNullable();
    table.decimal('discount_amount', 10, 2).notNullable().defaultTo(0.0);
    table.decimal('tax_rate', 5, 4).notNullable().defaultTo(0.05);
    table.decimal('tax_amount', 10, 2).notNullable().defaultTo(0.0);
    table.decimal('total_amount', 10, 2).notNullable();
    table.string('status', 20).notNullable().defaultTo('completed');
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index('created_at', 'idx_sales_created_at');
    table.index('customer_id', 'idx_sales_customer_id');
  });

  // 6. Sale Items line table
  await knex.schema.createTable('sale_items', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('sale_id').references('id').inTable('sales').onDelete('CASCADE').notNullable();
    table.uuid('product_id').references('id').inTable('products').onDelete('RESTRICT').notNullable();
    table.integer('quantity').notNullable();
    table.decimal('unit_price', 10, 2).notNullable();
    table.decimal('discount_percent', 5, 2).notNullable().defaultTo(0.0);
    table.decimal('line_total', 10, 2).notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index('sale_id', 'idx_sale_items_sale_id');
    table.index('product_id', 'idx_sale_items_product_id');
  });

  // 7. Payments table
  await knex.schema.createTable('payments', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('sale_id').references('id').inTable('sales').onDelete('CASCADE').notNullable();
    table.string('method', 30).notNullable(); // 'cash', 'card', 'qr', 'split'
    table.decimal('amount', 10, 2).notNullable();
    table.string('reference_code', 100);
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index('sale_id', 'idx_payments_sale_id');
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('payments');
  await knex.schema.dropTableIfExists('sale_items');
  await knex.schema.dropTableIfExists('sales');
  await knex.schema.dropTableIfExists('customers');
  await knex.schema.dropTableIfExists('products');
  await knex.schema.dropTableIfExists('categories');
  await knex.schema.dropTableIfExists('users');
};
