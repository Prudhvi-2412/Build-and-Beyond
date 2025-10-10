const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const companyRoutes = require('./routes/companyRoutes');
const customerRoutes = require('./routes/customerRoutes');
const projectRoutes = require('./routes/projectRoutes');
const workerRoutes = require('./routes/workerRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { PORT } = require('./config/constants');

const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.json());
app.use(express.static('Final Pages'));
app.use(cors({ origin: true, credentials: true }));
/* app.use('/uploads', express.static(path.join(__dirname, 'Uploads'))); */

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Connect DB
connectDB();

// Routes
app.get('/', (req, res) => res.render('landing_page'));
app.get('/signin_up', (req, res) => res.render('signin_up_'));
app.get('/adminpage', (req, res) => res.render('adminlogin'));
app.get('/logout', (req,res)=>{
    res.clearCookie('token');
    res.redirect('/');
});
app.get('/platformadmindashboard', (req, res) => res.render('platform_admin/platform_admin_dashboard'));

app.use(authRoutes);
app.use(customerRoutes);
app.use(companyRoutes);
app.use(projectRoutes);
app.use(workerRoutes);
app.use(adminRoutes);

// Start server
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));