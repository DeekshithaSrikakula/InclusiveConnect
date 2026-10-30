const express = require('express');
const https = require('https');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {
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
  createOrUpdateAcknowledgement,
  resetDemoDatabase
} = require('../services/dbService');
const { generateAccessibleFormats } = require('../services/aiService');
const { sampleDraftTemplates } = require('../data/seedData');
const { JWT_SECRET, verifyToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

function signUserToken(user) {
  return jwt.sign(
    {
      _id: user._id,
      organizationId: user.organizationId || 'org_apex_mfg',
      orgCode: user.orgCode || 'APEX-101',
      name: user.name,
      email: user.email,
      employeeId: user.employeeId,
      role: user.role,
      department: user.department,
      preferredLanguage: user.preferredLanguage
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

// GET /api/demo-users -> Returns all organizations, users, and templates
router.get('/demo-users', async (req, res) => {
  try {
    const [organizations, users] = await Promise.all([
      getAllOrganizations(),
      getAllUsers()
    ]);
    const safeUsers = users.map(({ passwordHash, ...u }) => u);
    res.json({
      organizations,
      users: safeUsers,
      sampleTemplates: sampleDraftTemplates
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/organizations -> Register a brand new organization + Admin account
router.post('/organizations', async (req, res) => {
  try {
    const { orgName, orgCode, industry, adminName, adminEmail } = req.body;
    if (!orgName || !orgCode || !adminName) {
      return res
        .status(400)
        .json({ error: 'Organization Name, Code, and Admin Name are required.' });
    }
    const { organization, adminUser } = await createOrganizationWithAdmin({
      orgName,
      orgCode,
      industry,
      adminName,
      adminEmail
    });
    const token = signUserToken(adminUser);
    const { passwordHash, ...safeUser } = adminUser;
    res.status(201).json({
      organization,
      token,
      user: safeUser
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/employees/join -> Employee self-joins an organization via Org Code OR Admin adds an employee
router.post('/employees/join', async (req, res) => {
  try {
    const {
      organizationId,
      orgCode,
      name,
      employeeId,
      department,
      preferredLanguage
    } = req.body;

    if (!name || (!organizationId && !orgCode)) {
      return res
        .status(400)
        .json({ error: 'Employee Name and Organization Code are required.' });
    }

    const { user, organization } = await addEmployeeToOrganization({
      organizationId,
      orgCode,
      name,
      employeeId,
      department,
      preferredLanguage
    });

    const token = signUserToken(user);
    const { passwordHash, ...safeUser } = user;
    res.status(201).json({
      user: safeUser,
      organization,
      token
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/auth/login -> Supports quickDemoUserId OR Employee ID / Email + Password
router.post('/auth/login', async (req, res) => {
  try {
    const { identifier, password, quickDemoUserId } = req.body;
    let user = null;

    if (quickDemoUserId) {
      user = await findUserById(quickDemoUserId);
    } else {
      user = await findUserByCredential(identifier);
      if (user && password) {
        const valid = bcrypt.compareSync(password, user.passwordHash);
        if (!valid && password !== 'password123') {
          return res
            .status(401)
            .json({ error: 'Invalid password. (Default demo password is password123)' });
        }
      }
    }

    if (!user) {
      return res.status(404).json({
        error: 'User not found. Check your Employee ID or select a Quick Demo role.'
      });
    }

    const token = signUserToken(user);
    const { passwordHash, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/auth/language -> Update employee's preferred language
router.put('/auth/language', verifyToken, async (req, res) => {
  try {
    const { preferredLanguage } = req.body;
    const updated = await updateUserLanguage(req.user._id, preferredLanguage);
    if (!updated) {
      return res.status(404).json({ error: 'User not found' });
    }
    const { passwordHash, ...safeUser } = updated;
    res.json({ user: safeUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/announcements -> Scoped to the logged-in user's organization
router.get('/announcements', verifyToken, async (req, res) => {
  try {
    const orgId = req.user.organizationId || 'org_apex_mfg';
    const [announcements, acknowledgements, users] = await Promise.all([
      getAnnouncements(orgId),
      getAcknowledgements(orgId),
      getAllUsers(orgId)
    ]);

    const employees = users.filter((u) => u.role === 'EMPLOYEE');
    const totalEmployees = employees.length;

    const enriched = announcements.map((ann) => {
      const annAcks = acknowledgements.filter(
        (ack) => String(ack.announcementId) === String(ann._id)
      );
      const myAck = annAcks.find(
        (ack) => String(ack.userId) === String(req.user._id)
      );

      const pendingEmployees = employees
        .filter((emp) => !annAcks.some((ack) => String(ack.userId) === String(emp._id)))
        .map(({ passwordHash, ...emp }) => emp);

      return {
        ...ann,
        acknowledgementCount: annAcks.length,
        totalEmployees,
        completionRate:
          totalEmployees > 0
            ? Math.round((annAcks.length / totalEmployees) * 100)
            : 0,
        isAcknowledgedByMe: Boolean(myAck),
        myAcknowledgement: myAck || null,
        acknowledgements: annAcks,
        pendingEmployees
      };
    });

    res.json({
      announcements: enriched,
      totalEmployees,
      employees: employees.map(({ passwordHash, ...e }) => e)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/transform -> Admin triggers AI Simplification + Regional Translations
router.post('/ai/transform', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { title, originalContent, category } = req.body;
    if (!title || !originalContent) {
      return res.status(400).json({ error: 'Title and original content are required' });
    }
    const result = await generateAccessibleFormats({ title, originalContent, category });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/announcements -> Admin creates new announcement for their organization
router.post('/announcements', verifyToken, requireAdmin, async (req, res) => {
  try {
    const {
      title,
      category,
      priority,
      targetAudience,
      originalContent,
      simplifiedContent,
      keyActionRequired,
      translations
    } = req.body;

    if (!title || !originalContent) {
      return res.status(400).json({ error: 'Title and originalContent are required' });
    }

    let finalSimplified = simplifiedContent;
    let finalAction = keyActionRequired;
    let finalTranslations = translations;

    if (!finalSimplified || !finalTranslations) {
      const generated = await generateAccessibleFormats({
        title,
        originalContent,
        category
      });
      finalSimplified = finalSimplified || generated.simplifiedContent;
      finalAction = finalAction || generated.keyActionRequired;
      finalTranslations = finalTranslations || generated.translations;
    }

    const created = await createAnnouncement({
      organizationId: req.user.organizationId || 'org_apex_mfg',
      title,
      category: category || 'General',
      priority: priority || 'Normal',
      targetAudience: targetAudience || 'All Employees',
      originalContent,
      simplifiedContent: finalSimplified,
      keyActionRequired: finalAction || '',
      translations: finalTranslations,
      createdBy: req.user._id,
      createdByName: req.user.name
    });

    res.status(201).json({ announcement: created });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/announcements/:id
router.put('/announcements/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const updated = await updateAnnouncement(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Announcement not found' });
    }
    res.json({ announcement: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/announcements/:id
router.delete('/announcements/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    await deleteAnnouncement(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/acknowledgements -> Employee confirms reading & understanding
router.post('/acknowledgements', verifyToken, async (req, res) => {
  try {
    const { announcementId, languageViewed, modeViewed, usedAudio } = req.body;
    if (!announcementId) {
      return res.status(400).json({ error: 'announcementId is required' });
    }
    const fullUser = (await findUserById(req.user._id)) || req.user;
    const ack = await createOrUpdateAcknowledgement({
      announcementId,
      user: fullUser,
      languageViewed,
      modeViewed,
      usedAudio
    });
    res.status(201).json({ acknowledgement: ack });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analytics -> Scoped to the logged-in Admin's organization
router.get('/analytics', verifyToken, requireAdmin, async (req, res) => {
  try {
    const orgId = req.user.organizationId || 'org_apex_mfg';
    const [announcements, acknowledgements, users] = await Promise.all([
      getAnnouncements(orgId),
      getAcknowledgements(orgId),
      getAllUsers(orgId)
    ]);

    const employees = users.filter((u) => u.role === 'EMPLOYEE');
    const totalPossibleAcks = announcements.length * employees.length;
    const overallComplianceRate =
      totalPossibleAcks > 0
        ? Math.round((acknowledgements.length / totalPossibleAcks) * 100)
        : 0;

    const languageBreakdown = { en: 0, hi: 0, te: 0, ta: 0 };
    let audioAssistedCount = 0;

    acknowledgements.forEach((ack) => {
      if (languageBreakdown[ack.languageViewed] !== undefined) {
        languageBreakdown[ack.languageViewed]++;
      }
      if (ack.usedAudio) {
        audioAssistedCount++;
      }
    });

    res.json({
      totalAnnouncements: announcements.length,
      totalEmployees: employees.length,
      totalAcknowledgements: acknowledgements.length,
      overallComplianceRate,
      audioAssistedCount,
      languageBreakdown
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper to fetch a single MP3 chunk from Google Neural TTS
function fetchTtsChunk(textChunk, tl) {
  return new Promise((resolve, reject) => {
    const url = `https://translate.googleapis.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${encodeURIComponent(
      tl
    )}&q=${encodeURIComponent(textChunk)}`;
    https
      .get(
        url,
        {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        },
        (resp) => {
          if (resp.statusCode !== 200) {
            return reject(new Error(`TTS status ${resp.statusCode}`));
          }
          const chunks = [];
          resp.on('data', (d) => chunks.push(d));
          resp.on('end', () => resolve(Buffer.concat(chunks)));
        }
      )
      .on('error', reject);
  });
}

// Split long announcement text into natural <175 char phrases for TTS
function splitTextForTts(rawText) {
  const cleaned = (rawText || '')
    .replace(/[•*#]/g, ' ')
    .replace(/\(LOTO\)/gi, '')
    .replace(/Ext\.\s*(\d+)/gi, 'Extension $1')
    .replace(/\b2x\b/gi, 'double')
    .replace(/\n+/g, '. ')
    .replace(/\s+/g, ' ')
    .trim();

  const sentences = cleaned.split(/(?<=[.!?।])\s+/);
  const result = [];
  for (const s of sentences) {
    if (!s.trim()) continue;
    if (s.length <= 175) {
      result.push(s.trim());
    } else {
      const words = s.split(' ');
      let current = '';
      for (const w of words) {
        if ((current + ' ' + w).trim().length <= 175) {
          current = (current + ' ' + w).trim();
        } else {
          if (current) result.push(current);
          current = w;
        }
      }
      if (current) result.push(current);
    }
  }
  return result.slice(0, 12);
}

// GET /api/tts -> High-clarity Neural TTS MP3 stream for en, te, hi, ta
router.get('/tts', async (req, res) => {
  try {
    const { text = '', lang = 'en' } = req.query;
    if (!text.trim()) {
      return res.status(400).json({ error: 'Text is required' });
    }
    const langMap = {
      en: 'en-IN',
      te: 'te',
      hi: 'hi',
      ta: 'ta'
    };
    const tl = langMap[lang] || 'en-IN';
    const phrases = splitTextForTts(text);
    const buffers = [];
    for (const phrase of phrases) {
      const buf = await fetchTtsChunk(phrase, tl);
      buffers.push(buf);
    }
    const combined = Buffer.concat(buffers);
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': combined.length,
      'Cache-Control': 'public, max-age=3600'
    });
    res.send(combined);
  } catch (err) {
    res.status(500).json({ error: 'TTS failed: ' + err.message });
  }
});

// POST /api/reset-demo
router.post('/reset-demo', async (req, res) => {
  try {
    await resetDemoDatabase();
    res.json({ message: 'Demo database reset to initial state' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
