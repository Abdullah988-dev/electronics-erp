const sql = require("mssql/msnodesqlv8");

const connectionString =
  "Driver={ODBC Driver 17 for SQL Server};Server=(localdb)\\MSSQLLocalDB;Database=ElectronicsERP;Trusted_Connection=Yes;";

const config = {
  connectionString: connectionString,
};

async function connectDB() {
  try {
    const pool = await sql.connect(config);
    console.log("✅ SQL Server connected successfully (LocalDB via Windows Auth)");
    return pool;
  } catch (err) {
    console.error("❌ Database connection failed:", err.message);
    throw err;
  }
}

module.exports = { connectDB, sql };