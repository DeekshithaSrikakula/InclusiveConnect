const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const Organization = require('../models/Organization');
const User = require('../models/User');
const Announcement = require('../models/Announcement');
const Acknowledgement = require('../models/Acknowledgement');
const {
  initialOrganizations,
  initialUsers,
  initialAnnouncements,
  initialAcknowledgements
} = require('../data/seedData');

const storePath = path.join(__dirname, '../data/localStore.json');
let useMongo = false;

function buildFreshSeed() {
  return {
    organizations: JSON.parse(JSON.stringify(initialOrganizations)),
    users: JSON.parse(JSON.stringify(initialUsers)),
    announcements: JSON.parse(JSON.stringify(initialAnnouncements)),
    acknowledgements: JSON.parse(JSON.stringify(initialAcknowledgements))
  };
}

function readLocalStore() {
  if (!fs.existsSync(storePath)) {
    const seed = buildFreshSeed();
    fs.writeFileSync(storePath, JSON.stringify(seed, null, 2), 'utf8');
    return seed;
  }
  try {
    const raw = fs.readFileSync(storePath, 'utf8');
    const parsed = JSON.parse(raw);
    // Upgrade store automatically if organizations array is missing from an older run
    if (!Array.isArray(parsed.organizations) || parsed.organizations.length === 0) {
      const seed = buildFreshSeed();
      fs.writeFileSync(storePath, JSON.stringify(seed, null, 2), 'utf8');
      return seed;
    }
    return parsed;
  } catch (err) {
    const seed = buildFreshSeed();
    fs.writeFileSync(storePath, JSON.stringify(seed, null, 2), 'utf8');
    return seed;
  }
}

async function syncToMongo(data) {
  if (!useMongo) return;
  try {
    await Promise.all([
      Organization.deleteMany({}),
      User.deleteMany({}),
      Announcement.deleteMany({}),
      Acknowledgement.deleteMany({})
    ]);
    if (data.organizations?.length) await Organization.insertMany(data.organizations);
    if (data.users?.length) await User.insertMany(data.users);
    if (data.announcements?.length) await Announcement.insertMany(data.announcements);
    if (data.acknowledgements?.length) await Acknowledgement.insertMany(data.acknowledgements);
  } catch (err) {
    console.warn('⚠️ MongoDB sync warning:', err.message);
  }
}

function writeLocalStore(data) {
  fs.writeFileSync(storePath, JSON.stringify(data, null, 2), 'utf8');
  if (useMongo) {
    syncToMongo(data);
  }
}

async function initDatabase() {
  const store = readLocalStore();
  const uri = process.env.MONGODB_URI && process.env.MONGODB_URI.trim();
  if (uri) {
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 6000 });
      useMongo = true;
      console.log('✅ Connected to MongoDB database');
      await syncToMongo(store);
      console.log('✅ Synced Organizations, Users, Announcements & Acknowledgements to MongoDB Atlas');
      return;
    } catch (err) {
      console.warn('⚠️ MongoDB URI unreachable, switching to persistent Local Store:', err.message);
    }
  }
  useMongo = false;
  console.log('✅ Using persistent Multi-Organization Local Store');
}

async function resetDemoDatabase() {
  const seed = buildFreshSeed();
  writeLocalStore(seed);
  if (useMongo) {
    await syncToMongo(seed);
  }
  return seed;
}

// ORGANIZATION OPERATIONS
async function getAllOrganizations() {
  return readLocalStore().organizations;
}

async function createOrganizationWithAdmin({
  orgName,
  orgCode,
  industry,
  adminName,
  adminEmail
}) {
  const cleanCode = (orgCode || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, '');

  const store = readLocalStore();
  const exists = store.organizations.find(
    (o) => o.orgCode.toUpperCase() === cleanCode
  );
  if (exists) {
    throw new Error(`Organization Code "${cleanCode}" is already taken.`);
  }

  const orgId = 'org_' + Date.now();
  const newOrg = {
    _id: orgId,
    name: orgName.trim(),
    orgCode: cleanCode,
    industry: industry || 'General Organization',
    departments: ['Operations', 'HR & Administration', 'Field Staff', 'Support'],
    createdAt: new Date().toISOString()
  };

  const adminId = 'usr_admin_' + Date.now();
  const newAdmin = {
    _id: adminId,
    organizationId: orgId,
    orgCode: cleanCode,
    name: adminName.trim(),
    email: (adminEmail || `${cleanCode.toLowerCase()}@org.com`).trim().toLowerCase(),
    employeeId: `${cleanCode}-ADMIN`,
    passwordHash: bcrypt.hashSync('password123', 10),
    role: 'ADMIN',
    department: 'HR & Administration',
    designation: 'Organization Administrator',
    preferredLanguage: 'en',
    accessibilityNote: 'Organization Admin',
    createdAt: new Date().toISOString()
  };

  // Also create 2 sample employees for this new organization so the Admin can immediately test!
  const sampleEmp1 = {
    _id: 'usr_emp_te_' + Date.now(),
    organizationId: orgId,
    orgCode: cleanCode,
    name: 'Kiran Kumar (Sample Worker)',
    email: `kiran@${cleanCode.toLowerCase()}.com`,
    employeeId: `${cleanCode}-101`,
    passwordHash: bcrypt.hashSync('password123', 10),
    role: 'EMPLOYEE',
    department: 'Operations',
    designation: 'Staff Member',
    preferredLanguage: 'te',
    accessibilityNote: 'Telugu Speaker',
    createdAt: new Date().toISOString()
  };

  const sampleEmp2 = {
    _id: 'usr_emp_hi_' + (Date.now() + 1),
    organizationId: orgId,
    orgCode: cleanCode,
    name: 'pooja Verma (Sample Worker)',
    email: `pooja@${cleanCode.toLowerCase()}.com`,
    employeeId: `${cleanCode}-102`,
    passwordHash: bcrypt.hashSync('password123', 10),
    role: 'EMPLOYEE',
    department: 'Field Staff',
    designation: 'Associate',
    preferredLanguage: 'hi',
    accessibilityNote: 'Hindi Speaker',
    createdAt: new Date().toISOString()
  };

  const welcomeAnn = {
    _id: 'ann_welcome_' + Date.now(),
    organizationId: orgId,
    title: `Welcome to ${orgName} Accessible Communication Portal`,
    category: 'General',
    priority: 'Normal',
    targetAudience: 'All Employees',
    originalContent: `Welcome to the official ${orgName} workplace portal powered by InclusiveConnect. All organizational policies, safety instructions, and operational announcements will be published here with simplified summaries, regional translations, and audio narration.`,
    simplifiedContent: `• Welcome: This is the official notice board for ${orgName}.\n• Easy Language & Audio: You can read all workplace updates in English, Telugu, Hindi, or Tamil, or tap Listen to hear them aloud.\n• Confirm Reading: After reading any notice, tap the green "I Have Read & Understood" button.`,
    keyActionRequired: 'Select your preferred language at the top and confirm reading workplace announcements.',
    translations: {
      te: {
        title: `${orgName} సమాచార పోర్టల్‌కు స్వాగతం`,
        simplifiedContent: `• స్వాగతం: ఇది ${orgName} యొక్క అధికారిక సమాచార బోర్డు.\n• సులభమైన భాష & ఆడియో: మీరు అన్ని ప్రకటనలను తెలుగులో చదవవచ్చు లేదా ఆడియోలో వినవచ్చు.\n• ధృవీకరణ: సమాచారం చదివిన తర్వాత 'నేను చదివాను మరియు అర్థం చేసుకున్నాను' బటన్ నొక్కండి.`
      },
      hi: {
        title: `${orgName} सूचना पोर्टल में आपका स्वागत है`,
        simplifiedContent: `• स्वागत है: यह ${orgName} का आधिकारिक सूचना बोर्ड है।\n• सरल भाषा और ऑडियो: आप सभी कार्यस्थल सूचनाएं अपनी भाषा में पढ़ या सुन सकते हैं।\n• पुष्टि करें: सूचना पढ़ने के बाद हरे रंग का पुष्टि बटन दबाएं।`
      },
      ta: {
        title: `${orgName} தகவல் தளத்திற்கு வரவேற்கிறோம்`,
        simplifiedContent: `• நல்வரவு: இது ${orgName} நிறுவனத்தின் அதிகாரப்பூர்வ அறிவிப்புப் பலகை.\n• எளிய மொழி மற்றும் ஆடியோ: அனைத்துத் தகவல்களையும் உங்கள் மொழியில் படிக்கலாம் அல்லது கேட்கலாம்.\n• உறுதிப்படுத்தல்: படித்த பிறகு உறுதிப்படுத்தல் பொத்தானை அழுத்தவும்.`
      }
    },
    createdBy: adminId,
    createdByName: adminName.trim(),
    createdAt: new Date().toISOString()
  };

  store.organizations.push(newOrg);
  store.users.push(newAdmin, sampleEmp1, sampleEmp2);
  store.announcements.unshift(welcomeAnn);
  writeLocalStore(store);

  return { organization: newOrg, adminUser: newAdmin };
}

// USER / EMPLOYEE OPERATIONS
async function getAllUsers(organizationId) {
  const { users } = readLocalStore();
  if (organizationId) {
    return users.filter((u) => u.organizationId === organizationId);
  }
  return users;
}

async function addEmployeeToOrganization({
  organizationId,
  orgCode,
  name,
  employeeId,
  department,
  preferredLanguage
}) {
  const store = readLocalStore();
  let targetOrg = null;

  if (organizationId) {
    targetOrg = store.organizations.find((o) => o._id === organizationId);
  } else if (orgCode) {
    const clean = orgCode.trim().toUpperCase();
    targetOrg = store.organizations.find((o) => o.orgCode.toUpperCase() === clean);
  }

  if (!targetOrg) {
    throw new Error('Organization not found. Please check the Organization Code.');
  }

  const empCode =
    (employeeId || '').trim().toUpperCase() ||
    `${targetOrg.orgCode}-${Math.floor(100 + Math.random() * 900)}`;

  const newEmp = {
    _id: 'usr_emp_' + Date.now(),
    organizationId: targetOrg._id,
    orgCode: targetOrg.orgCode,
    name: name.trim(),
    email: `${empCode.toLowerCase()}@${targetOrg.orgCode.toLowerCase()}.com`,
    employeeId: empCode,
    passwordHash: bcrypt.hashSync('password123', 10),
    role: 'EMPLOYEE',
    department: (department || 'Operations').trim(),
    designation: 'Staff Member',
    preferredLanguage: preferredLanguage || 'te',
    accessibilityNote: `${(preferredLanguage || 'te').toUpperCase()} Speaker`,
    createdAt: new Date().toISOString()
  };

  store.users.push(newEmp);
  writeLocalStore(store);
  return { user: newEmp, organization: targetOrg };
}

async function findUserByCredential(identifier) {
  const clean = (identifier || '').trim().toLowerCase();
  const { users } = readLocalStore();
  return users.find(
    (u) =>
      u.email.toLowerCase() === clean ||
      u.employeeId.toLowerCase() === clean ||
      u._id === identifier
  );
}

async function findUserById(userId) {
  const { users } = readLocalStore();
  return users.find((u) => u._id === userId);
}

async function updateUserLanguage(userId, preferredLanguage) {
  const store = readLocalStore();
  const idx = store.users.findIndex((u) => u._id === userId);
  if (idx !== -1) {
    store.users[idx].preferredLanguage = preferredLanguage;
    writeLocalStore(store);
    return store.users[idx];
  }
  return null;
}

// ANNOUNCEMENT OPERATIONS
async function getAnnouncements(organizationId) {
  const { announcements } = readLocalStore();
  const filtered = organizationId
    ? announcements.filter((a) => a.organizationId === organizationId)
    : announcements;
  return [...filtered].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
}

async function createAnnouncement(payload) {
  const store = readLocalStore();
  const newAnn = {
    _id: 'ann_' + Date.now(),
    ...payload,
    createdAt: new Date().toISOString()
  };
  store.announcements.unshift(newAnn);
  writeLocalStore(store);
  return newAnn;
}

async function updateAnnouncement(id, payload) {
  const store = readLocalStore();
  const idx = store.announcements.findIndex((a) => String(a._id) === String(id));
  if (idx === -1) return null;
  store.announcements[idx] = {
    ...store.announcements[idx],
    ...payload
  };
  writeLocalStore(store);
  return store.announcements[idx];
}

async function deleteAnnouncement(id) {
  const store = readLocalStore();
  store.announcements = store.announcements.filter((a) => String(a._id) !== String(id));
  store.acknowledgements = store.acknowledgements.filter(
    (ack) => String(ack.announcementId) !== String(id)
  );
  writeLocalStore(store);
  return true;
}

// ACKNOWLEDGEMENT OPERATIONS
async function getAcknowledgements(organizationId) {
  const { acknowledgements } = readLocalStore();
  if (organizationId) {
    return acknowledgements.filter((ack) => ack.organizationId === organizationId);
  }
  return acknowledgements;
}

async function createOrUpdateAcknowledgement({
  announcementId,
  user,
  languageViewed,
  modeViewed,
  usedAudio
}) {
  const store = readLocalStore();
  const existing = store.acknowledgements.find(
    (ack) =>
      String(ack.announcementId) === String(announcementId) &&
      String(ack.userId) === String(user._id)
  );
  if (existing) {
    return existing;
  }

  const newAck = {
    _id: 'ack_' + Date.now(),
    organizationId: user.organizationId || 'org_apex_mfg',
    announcementId: String(announcementId),
    userId: String(user._id),
    userName: user.name,
    employeeId: user.employeeId,
    department: user.department,
    languageViewed: languageViewed || user.preferredLanguage || 'en',
    modeViewed: modeViewed || 'simplified',
    usedAudio: Boolean(usedAudio),
    acknowledgedAt: new Date().toISOString(),
    status: 'ACKNOWLEDGED'
  };
  store.acknowledgements.unshift(newAck);
  writeLocalStore(store);
  return newAck;
}

module.exports = {
  initDatabase,
  resetDemoDatabase,
  getAllOrganizations,
  createOrganizationWithAdmin,
  getAllUsers,
  addEmployeeToOrganization,
  findUserByCredential,
  findUserById,
  updateUserLanguage,
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getAcknowledgements,
  createOrUpdateAcknowledgement
};
