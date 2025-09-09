const { Customer, Company, Worker, ConstructionProjectSchema, Bid } = require('../models');

const getAdminDashboard = async (req, res) => {
  try {
    // Fetch all data from collections
    const customers = await Customer.find({});
    const companies = await Company.find({});
    const workers = await Worker.find({});
    const projects = await ConstructionProjectSchema.find({});
    const bids = await Bid.find({});

    // Calculate counts from the arrays
    const customersCount = customers.length;
    const companiesCount = companies.length;
    const workersCount = workers.length;

    res.render("admin/admin_dashboard", {
      customers: customers,
      companies: companies,
      workers: workers,
      customersCount: customersCount,
      companiesCount: companiesCount,
      workersCount: workersCount,
      projects: projects,
      bids: bids,
    });
    
  } catch (err) {
    res.status(500).send("Server Error");
  }
};

module.exports = {
  getAdminDashboard
};