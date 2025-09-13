// src/app.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const documentRouter = require('./routes/documentRoutes');
const dossierRouter = require('./routes/dossierRoutes');
const departmentRoutes = require('./routes/departmentRouter');
const rendezvousRoutes = require('./routes/rendezVousRoutes');
const disponibiliteRoutes = require('./routes/disponibiliteRouter');
const notificationRoutes = require('./routes/notificationRoutes');
const meetRoutes = require('./routes/lookupsRoutes');
const authRoutes = require('./routes/authRoutes');
const kpiRoutes = require('./routes/kpiRoutes');
// (Optionnel) route de debug refresh
// const debugGmail = require('./routes/debugGmail');

const app = express();

app.use(cors());
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(bodyParser.json({ limit: '50mb' }));

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/departments', departmentRoutes);
app.use('/document', documentRouter);
app.use('/dossier', dossierRouter);
app.use('/rendezvous', rendezvousRoutes);
app.use('/disponibilite', disponibiliteRoutes);
app.use('/notifications', notificationRoutes);
app.use('/routes', meetRoutes);
app.use('/kpi', kpiRoutes);
// app.use(debugGmail);

module.exports = app;
