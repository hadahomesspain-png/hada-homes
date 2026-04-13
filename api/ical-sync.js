// Vercel Serverless Function: iCal Sync
// GET /api/ical-sync  → returns blocked dates as JSON (called by booking calendar)
// POST /api/ical-sync → forces a refresh (called by cron job)
//
// Strategy: fetch iCal from Airbnb (and optionally Booking.com),
// parse all VEVENT blocks, return blocked date ranges as JSON.
// Vercel Edge Cache keeps the response for 6 hours to avoid hammering Airbnb.

const https = require('https');
const http = require('http');

// iCal URLs — add Booking.com URL here when available
const ICAL_SOURCES = [
  {
    name: 'Airbnb',
    url: 'https://www.airbnb.com/calendar/ical/1615493521495170190.ics?t=7855b6f2ee5c4e178edf08cdc6ff22dd'
  }
  // Add Booking.com iCal URL here:
  // { name: 'Booking.com', url: 'https://...' }
];

// Fetch a URL and return the text body
function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, { timeout: 10000 }, (res) => {
      // Follow redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchUrl(res.headers.location).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

// Parse iCal text and extract blocked date ranges
function parseICal(icalText) {
  const blocked = [];
  const lines = icalText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

  let inEvent = false;
  let dtStart = null;
  let dtEnd = null;
  let summary = '';

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      inEvent = true;
      dtStart = null;
      dtEnd = null;
      summary = '';
    } else if (line === 'END:VEVENT') {
      if (inEvent && dtStart && dtEnd) {
        blocked.push({ start: dtStart, end: dtEnd, summary });
      }
      inEvent = false;
    } else if (inEvent) {
      if (line.startsWith('DTSTART')) {
        const val = line.split(':').slice(1).join(':').trim();
        dtStart = parseICalDate(val);
      } else if (line.startsWith('DTEND')) {
        const val = line.split(':').slice(1).join(':').trim();
        dtEnd = parseICalDate(val);
      } else if (line.startsWith('SUMMARY')) {
        summary = line.split(':').slice(1).join(':').trim();
      }
    }
  }

  return blocked;
}

// Convert iCal date string to YYYY-MM-DD
function parseICalDate(val) {
  // Handle VALUE=DATE:YYYYMMDD or YYYYMMDD or YYYYMMDDTHHMMSSZ
  const clean = val.replace(/VALUE=DATE:/i, '').replace(/T\d{6}Z?$/, '');
  if (clean.length === 8) {
    return `${clean.slice(0,4)}-${clean.slice(4,6)}-${clean.slice(6,8)}`;
  }
  return null;
}

// Generate all individual blocked dates from ranges
function expandRanges(ranges) {
  const blockedSet = new Set();
  for (const range of ranges) {
    if (!range.start || !range.end) continue;
    const start = new Date(range.start + 'T00:00:00');
    const end = new Date(range.end + 'T00:00:00');
    const cur = new Date(start);
    // iCal DTEND is exclusive (checkout day is free), so we go up to but not including end
    while (cur < end) {
      blockedSet.add(cur.toISOString().slice(0, 10));
      cur.setDate(cur.getDate() + 1);
    }
  }
  return Array.from(blockedSet).sort();
}

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const allRanges = [];
    const errors = [];

    // Fetch all iCal sources in parallel
    await Promise.all(ICAL_SOURCES.map(async (source) => {
      try {
        const icalText = await fetchUrl(source.url);
        const ranges = parseICal(icalText);
        allRanges.push(...ranges);
      } catch (err) {
        errors.push(`${source.name}: ${err.message}`);
        console.error(`iCal fetch error for ${source.name}:`, err.message);
      }
    }));

    const blockedDates = expandRanges(allRanges);
    const ranges = allRanges.map(r => ({ start: r.start, end: r.end, source: r.summary || 'Gereserveerd' }));

    // Cache for 6 hours (21600 seconds)
    res.setHeader('Cache-Control', 's-maxage=21600, stale-while-revalidate=3600');
    res.setHeader('Content-Type', 'application/json');

    return res.status(200).json({
      ok: true,
      updated: new Date().toISOString(),
      blockedDates,
      ranges,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (err) {
    console.error('iCal sync error:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
};
