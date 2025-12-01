const { Client } = require("pg");
const schema = require("./schema.ts"); // adjust path if needed
const { getTableConfig } = require("drizzle-orm/pg-core");

/* ===============================
   CONFIG
================================ */

const DB_CONFIG = {
  host: "aws-1-us-east-2.pooler.supabase.com",
  user: "postgres.dsktxcpuljzwjrvxeksp",
  password: "Strongwinds123-",
  database: "postgres",
  ssl: { rejectUnauthorized: false }
};

/* ===============================
   DB INSPECTOR
================================ */

async function getDatabaseSchema(client) {
  const tablesRes = await client.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
  `);

  const schema = {};

  for (const row of tablesRes.rows) {
    const table = row.table_name;

    const columnsRes = await client.query(
      `
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = $1
    `,
      [table]
    );

    schema[table] = {};
    for (const col of columnsRes.rows) {
      schema[table][col.column_name] = {
        type: col.data_type,
        nullable: col.is_nullable === "YES",
        default: col.column_default,
      };
    }
  }

  return schema;
}

/* ===============================
   DRIZZLE SCHEMA PARSER
================================ */

function getDrizzleSchema() {
  const result = {};

  for (const key of Object.keys(schema)) {
    const table = schema[key];
    try {
      const config = getTableConfig(table);
      result[config.name] = {};

      for (const col of config.columns) {
        result[config.name][col.name] = {
          type: col.dataType,
          nullable: !col.notNull,
          default: col.default,
        };
      }
    } catch {
      // Ignore non-table exports
    }
  }

  return result;
}

/* ===============================
   DIFF ENGINE
================================ */

function diffSchemas(db, app) {
  const report = {
    missingTables: [],
    extraTables: [],
    columnIssues: [],
  };

  // Table diffs
  for (const table of Object.keys(app)) {
    if (!db[table]) report.missingTables.push(table);
  }

  for (const table of Object.keys(db)) {
    if (!app[table]) report.extraTables.push(table);
  }

  // Column diffs
  for (const table of Object.keys(app)) {
    if (!db[table]) continue;

    const appCols = app[table];
    const dbCols = db[table];

    for (const col of Object.keys(appCols)) {
      if (!dbCols[col]) {
        report.columnIssues.push({
          table,
          column: col,
          issue: "MISSING_COLUMN",
        });
        continue;
      }

      const a = appCols[col];
      const d = dbCols[col];

      if (a.nullable !== d.nullable) {
        report.columnIssues.push({
          table,
          column: col,
          issue: "NULLABLE_MISMATCH",
          app: a.nullable,
          db: d.nullable,
        });
      }

      if (a.type && d.type && !String(d.type).includes(String(a.type))) {
        report.columnIssues.push({
          table,
          column: col,
          issue: "TYPE_MISMATCH",
          app: a.type,
          db: d.type,
        });
      }
    }

    // Extra DB columns
    for (const col of Object.keys(dbCols)) {
      if (!appCols[col]) {
        report.columnIssues.push({
          table,
          column: col,
          issue: "EXTRA_COLUMN",
        });
      }
    }
  }

  return report;
}

/* ===============================
   RUNNER
================================ */

async function run() {
  const client = new Client(DB_CONFIG);
  await client.connect();

  console.log("🔍 Reading database schema...");
  const dbSchema = await getDatabaseSchema(client);

  console.log("📦 Reading Drizzle schema...");
  const drizzleSchema = getDrizzleSchema();

  console.log("⚖️  Comparing...");
  const report = diffSchemas(dbSchema, drizzleSchema);

  console.log("\n=============================");
  console.log("✅ SCHEMA DIFF REPORT");
  console.log("=============================\n");

  console.log("❌ Missing Tables:", report.missingTables);
  console.log("➕ Extra Tables:", report.extraTables);

  console.log("\n⚠️ Column Issues:");
  // for (const issue of report.columnIssues) {
  //   console.log(issue);
  // }

  await client.end();
}

run().catch(console.error);
