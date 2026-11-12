// Small server. Secrets come only from environment variables (local .env or Render).
// Never send Client Secret or API keys to the browser.
import express from "express";
import crypto from "node:crypto";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.set("trust proxy", 1);
app.use(express.json());

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_ENVIRONMENT = process.env.PAYPAL_ENVIRONMENT || "sandbox";
const PAYPAL_BASE_URL =
  PAYPAL_ENVIRONMENT === "production"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

function paymentRateLimit({ windowMs = 60_000, max = 30 } = {}) {
  const hits = new Map();
  return (req, res, next) => {
    const key = req.ip || req.socket?.remoteAddress || "unknown";
    const now = Date.now();
    let bucket = hits.get(key);
    if (!bucket || now >= bucket.resetAt) {
      bucket = { count: 0, resetAt: now + windowMs };
      hits.set(key, bucket);
    }
    bucket.count += 1;
    if (bucket.count > max) {
      return res.status(429).json({
        error: "RATE_LIMIT",
        message: "Too many payment requests. Please wait a moment and try again.",
      });
    }
    next();
  };
}

app.use("/paypal-api/", paymentRateLimit());

const BREADS = [
  { sku: "bread-1", name: "Solo Bun", note: "", breadUsd: 3, shippingUsd: 2 },
  { sku: "bread-2", name: "Twin Buns", note: "", breadUsd: 5, shippingUsd: 2 },
  { sku: "bread-4", name: "Four-Pack", note: "", breadUsd: 8, shippingUsd: 0 },
  { sku: "bread-8", name: "Party Eight", note: "eight popular breads", breadUsd: 16, shippingUsd: 0 },
];

const SUPPORT = { sku: "support-3", name: "Support", note: "", breadUsd: 3, shippingUsd: 0 };

let giftLimitUsd = 8;
let shoppingLimitUsd = 8;
let supportLimitUsd = 5;

function money(amount) {
  return amount.toFixed(2);
}

function findPricedItem(sku) {
  if (sku === SUPPORT.sku) return SUPPORT;
  return BREADS.find((bread) => bread.sku === sku) || null;
}

function limitAmount(capKind) {
  if (capKind === "shopping") return shoppingLimitUsd;
  if (capKind === "support") return supportLimitUsd;
  return giftLimitUsd;
}

function centAmount(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return { error: "BAD" };
  if (!Number.isInteger(amount)) return { error: "CENTS" };
  if (amount < 1) return { error: "LOW" };
  if (amount > 10000) return { error: "HIGH" };
  return { dollars: amount };
}

function quoteSupport(value) {
  const parsed = centAmount(value);
  if (parsed.error) return { error: parsed.error };
  const limit = supportLimitUsd;
  return {
    sku: SUPPORT.sku,
    name: SUPPORT.name,
    note: "",
    breadUsd: money(parsed.dollars),
    shippingUsd: money(0),
    totalUsd: money(parsed.dollars),
    limitUsd: money(limit),
    capKind: "support",
    allowed: parsed.dollars <= limit,
  };
}

function quoteBread(sku, capKind = "gift") {
  const item = findPricedItem(sku);
  if (!item) return null;
  const total = item.breadUsd + item.shippingUsd;
  const limit = limitAmount(capKind);
  return {
    sku: item.sku,
    name: item.name,
    note: item.note,
    breadUsd: money(item.breadUsd),
    shippingUsd: money(item.shippingUsd),
    totalUsd: money(total),
    limitUsd: money(limit),
    capKind,
    allowed: total <= limit,
  };
}

function catalog(capKind = "gift") {
  const items = capKind === "support" ? [SUPPORT] : BREADS;
  return {
    limitUsd: money(limitAmount(capKind)),
    breads: items.map((item) => quoteBread(item.sku, capKind)),
  };
}

function capKindFromPurpose(purpose) {
  if (purpose === "support") return "support";
  if (purpose === "forme" || purpose === "friend") return "shopping";
  return "gift";
}

const tokenCache = {
  api: { value: null, expiresAt: 0 },
  browser: { value: null, expiresAt: 0 },
};

function credentialsReady() {
  return Boolean(PAYPAL_CLIENT_ID && PAYPAL_CLIENT_SECRET);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function paypalFetch(url, options) {
  let response;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    response = await fetch(url, options);
    if (response.status !== 429) return response;
    await sleep(500 * 2 ** attempt);
  }
  return response;
}

async function fetchAccessToken(browserSafe) {
  const cache = browserSafe ? tokenCache.browser : tokenCache.api;
  if (cache.value && Date.now() < cache.expiresAt) return cache.value;

  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString(
    "base64"
  );
  const body = browserSafe
    ? "grant_type=client_credentials&response_type=client_token&intent=sdk_init"
    : "grant_type=client_credentials";

  const response = await paypalFetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "PayPal-Request-Id": crypto.randomUUID(),
    },
    body,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const debugId = response.headers.get("paypal-debug-id");
    console.error("PayPal token error", {
      status: response.status,
      data,
      paypalDebugId: debugId,
    });
    const error = new Error("Failed to generate client token");
    error.status = response.status;
    error.debugId = debugId;
    throw error;
  }

  const bufferSec = 120;
  cache.value = data.access_token;
  cache.expiresAt = Date.now() + Math.max(0, (data.expires_in - bufferSec) * 1000);
  return data.access_token;
}

app.get("/paypal-api/auth/browser-safe-client-token", async (req, res) => {
  if (!credentialsReady()) {
    return res.status(500).json({
      error: "MISSING_CREDENTIALS",
      message:
        "Add the see-it-live-it Client ID and Client Secret to the .env file, then restart the server.",
    });
  }

  try {
    const accessToken = await fetchAccessToken(true);
    const expiresIn = Math.floor((tokenCache.browser.expiresAt - Date.now()) / 1000);
    res.json({ accessToken, expiresIn });
  } catch (error) {
    res.status(error.status || 500).json({
      error: "TOKEN_GENERATION_FAILED",
      message: "Failed to generate client token",
      debugId: error.debugId,
    });
  }
});

app.post("/paypal-api/checkout/orders/create", async (req, res) => {
  if (!credentialsReady()) {
    return res.status(500).json({
      error: "MISSING_CREDENTIALS",
      message:
        "Add the see-it-live-it Client ID and Client Secret to the .env file, then restart the server.",
    });
  }

  try {
    const purpose = req.body?.purpose || "gift";
    if (!["gift", "support", "forme", "friend"].includes(purpose)) {
      return res.status(400).json({ error: "UNKNOWN_BREAD" });
    }
    if (purpose === "support" && req.body?.sku !== SUPPORT.sku) {
      return res.status(400).json({ error: "UNKNOWN_BREAD" });
    }
    if ((purpose === "forme" || purpose === "friend") && req.body?.sku === SUPPORT.sku) {
      return res.status(400).json({ error: "UNKNOWN_BREAD" });
    }
    let picked;
    if (purpose === "support") {
      const quoted = quoteSupport(req.body?.amount);
      if (quoted.error) {
        return res.status(400).json({ error: "INVALID_AMOUNT", reason: quoted.error });
      }
      picked = quoted;
    } else {
      picked = quoteBread(req.body?.sku, capKindFromPurpose(purpose));
    }
    if (!picked) {
      return res.status(400).json({ error: "UNKNOWN_BREAD" });
    }
    if (!picked.allowed) {
      return res.status(409).json({
        error: "LIMIT_EXCEEDED",
        message: "That's over the cap. I'll ask Jane.",
        limitUsd: picked.limitUsd,
        totalUsd: picked.totalUsd,
      });
    }

    const accessToken = await fetchAccessToken(false);
    const payload = {
      intent: "AUTHORIZE",
      purchase_units: [
        {
          description: `${picked.name} · Lux Bakery gift`,
          custom_id: picked.sku,
          amount: {
            currency_code: "USD",
            value: picked.totalUsd,
            breakdown: {
              item_total: { currency_code: "USD", value: picked.breadUsd },
              shipping: { currency_code: "USD", value: picked.shippingUsd },
            },
          },
          items: [
            {
              name: `${picked.name} · Lux Bakery gift`,
              quantity: "1",
              sku: picked.sku,
              unit_amount: { currency_code: "USD", value: picked.breadUsd },
            },
          ],
        },
      ],
      application_context: {
        shipping_preference: "NO_SHIPPING",
      },
    };

    const response = await paypalFetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "PayPal-Request-Id": crypto.randomUUID(),
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const debugId = response.headers.get("paypal-debug-id");
      console.error("Create order failed", data, debugId);
      return res.status(response.status).json({
        error: "ORDER_CREATE_FAILED",
        message: "Could not start PayPal checkout",
        debugId,
      });
    }

    if (data.id) orderSkus.set(data.id, { sku: picked.sku, purpose });
    res.json({ id: data.id, status: data.status });
  } catch (error) {
    console.error("Create order failed", error);
    res.status(error.status || 500).json({
      error: "ORDER_CREATE_FAILED",
      message: "Could not start PayPal checkout",
      debugId: error.debugId,
    });
  }
});


const heldAuthorizations = new Map();
const orderSkus = new Map();

function validOrderId(orderId) {
  return typeof orderId === "string" && /^[A-Za-z0-9]+$/.test(orderId);
}

async function readPaypalBody(response) {
  if (response.status === 204) return {};
  return response.json().catch(() => ({}));
}

function paypalIssue(data) {
  return data?.details?.[0]?.issue || data?.name || "";
}

async function paypalPost(path, requestId, sendJson) {
  const accessToken = await fetchAccessToken(false);
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "PayPal-Request-Id": requestId,
    Prefer: "return=representation",
  };
  if (sendJson) headers["Content-Type"] = "application/json";
  const response = await paypalFetch(`${PAYPAL_BASE_URL}${path}`, {
    method: "POST",
    headers,
    body: sendJson ? "{}" : undefined,
  });
  const data = await readPaypalBody(response);
  return { response, data };
}

function authorizationFromOrder(data) {
  const authorizations = data?.purchase_units?.[0]?.payments?.authorizations;
  if (!Array.isArray(authorizations) || !authorizations[0]) return null;
  return authorizations[0];
}

app.post("/paypal-api/checkout/orders/:orderId/authorize", async (req, res) => {
  const { orderId } = req.params;
  if (!validOrderId(orderId)) {
    return res.status(400).json({ error: "BAD_ORDER", message: "That order id is not valid." });
  }

  const existing = heldAuthorizations.get(orderId);
  if (existing?.state === "authorized") {
    return res.json({
      orderId,
      orderStatus: existing.orderStatus,
      authorizationStatus: existing.authorizationStatus,
    });
  }
  if (existing) {
    return res.status(409).json({
      error: "ALREADY_DECIDED",
      message: "This hold was already finished.",
    });
  }

  try {
    const { response, data } = await paypalPost(
      `/v2/checkout/orders/${encodeURIComponent(orderId)}/authorize`,
      `authorize-${orderId}`,
      true
    );
    if (!response.ok) {
      const debugId = response.headers.get("paypal-debug-id");
      const issue = paypalIssue(data);
      console.error("Authorize failed", { status: response.status, issue, paypalDebugId: debugId });
      return res.status(response.status).json({
        error: issue || "AUTHORIZE_FAILED",
        message:
          issue === "INSTRUMENT_DECLINED"
            ? "That payment method was declined. Please try again."
            : "PayPal could not hold the payment.",
        debugId,
      });
    }

    const authorization = authorizationFromOrder(data);
    if (!authorization?.id || authorization.status !== "CREATED") {
      console.error("Authorize missing hold", {
        orderStatus: data?.status || null,
        authorizationStatus: authorization?.status || null,
      });
      return res.status(502).json({
        error: "AUTHORIZE_FAILED",
        message: "PayPal did not hold the payment.",
      });
    }

    const record = orderSkus.get(orderId);
    const sku = typeof record === "string" ? record : record?.sku || "";
    const purpose = typeof record === "string" ? "gift" : record?.purpose || "gift";
    heldAuthorizations.set(orderId, {
      authorizationId: authorization.id,
      orderStatus: data.status,
      authorizationStatus: authorization.status,
      state: "authorized",
      sku,
      purpose,
    });
    res.json({
      orderId: data.id,
      orderStatus: data.status,
      authorizationStatus: authorization.status,
    });
  } catch (error) {
    console.error("Authorize failed", { status: error.status || 500, paypalDebugId: error.debugId });
    res.status(error.status || 500).json({
      error: "AUTHORIZE_FAILED",
      message: "PayPal could not hold the payment.",
      debugId: error.debugId,
    });
  }
});

app.post("/paypal-api/checkout/orders/:orderId/accept", async (req, res) => {
  const { orderId } = req.params;
  const held = heldAuthorizations.get(orderId);
  if (!validOrderId(orderId) || !held || held.state !== "authorized") {
    return res.status(409).json({
      error: "NO_HOLD",
      message: "There is no held payment to capture.",
    });
  }

  try {
    const { response, data } = await paypalPost(
      `/v2/payments/authorizations/${encodeURIComponent(held.authorizationId)}/capture`,
      `capture-${orderId}`,
      true
    );
    if (!response.ok) {
      const debugId = response.headers.get("paypal-debug-id");
      const issue = paypalIssue(data);
      console.error("Capture failed", { status: response.status, issue, paypalDebugId: debugId });
      return res.status(response.status).json({
        error: issue || "CAPTURE_FAILED",
        message: "PayPal could not capture the held payment.",
        debugId,
      });
    }

    held.state = "captured";
    const captureId = data.id || null;
    const captureStatus = data.status || "COMPLETED";
    res.json({
      orderId,
      captureStatus,
      captureId,
    });
  } catch (error) {
    console.error("Capture failed", { status: error.status || 500, paypalDebugId: error.debugId });
    res.status(error.status || 500).json({
      error: "CAPTURE_FAILED",
      message: "PayPal could not capture the held payment.",
      debugId: error.debugId,
    });
  }
});

app.post("/paypal-api/checkout/orders/:orderId/decline", async (req, res) => {
  const { orderId } = req.params;
  const held = heldAuthorizations.get(orderId);
  if (!validOrderId(orderId) || !held || held.state !== "authorized") {
    return res.status(409).json({
      error: "NO_HOLD",
      message: "There is no held payment to cancel.",
    });
  }

  try {
    const { response, data } = await paypalPost(
      `/v2/payments/authorizations/${encodeURIComponent(held.authorizationId)}/void`,
      `void-${orderId}`
    );
    if (!response.ok) {
      const debugId = response.headers.get("paypal-debug-id");
      const issue = paypalIssue(data);
      console.error("Void failed", { status: response.status, issue, paypalDebugId: debugId });
      return res.status(response.status).json({
        error: issue || "VOID_FAILED",
        message: "PayPal could not cancel the held payment.",
        debugId,
      });
    }

    held.state = "voided";
    res.json({
      orderId,
      authorizationStatus: "VOIDED",
    });
  } catch (error) {
    console.error("Void failed", { status: error.status || 500, paypalDebugId: error.debugId });
    res.status(error.status || 500).json({
      error: "VOID_FAILED",
      message: "PayPal could not cancel the held payment.",
      debugId: error.debugId,
    });
  }
});

const SI_SPEAKERS = new Set(["Jane's SI", "Viewer's SI"]);
const SI_EVENTS = new Set(["notice_craving", "decline", "choose_best", "consult_bread4", "notice_support"]);
const SI_ACTIONS = new Set(["offer_gift", "pick_bread4", "none"]);
const SI_EXPECTED = {
  notice_craving: "none",
  decline: "none",
  choose_best: "offer_gift",
  consult_bread4: "pick_bread4",
  notice_support: "none",
};
const SI_DEFAULT_MODEL = "gemini-3.5-flash-lite";
const SI_TIMEOUT_MS = 3000;

const SI_EVENT_FACTS = {
  notice_craving:
    "Jane is eating bread and enjoying it. On the video call, a friend is drooling and staring in a cute, comic way. Do not use that friend's name in the reaction. Then ask Jane to send Avon a surprise bread gift. Do not pick a product yet.",
  decline:
    "Jane said no to sending Avon a gift. Close the scene kindly. The gift that was declined would have been for Avon.",
  choose_best:
    "Jane already said yes: go ahead within the cap. Tell Jane the Four-Pack is being sent to Avon because the per-piece price is a just-right amount per piece, and because it is the smallest bundle with free shipping. Do not ask a question. Do not say the payment is complete.",
  consult_bread4:
    "Jane asked to be consulted once more just before paying for Avon's gift. Suggest the Four-Pack for Avon because the price per piece feels right and shipping is free, and ask whether to go ahead or see other options. Do not start payment.",
  notice_support:
    "A viewer just loved a bread-baking video by the creator Lux Baker. Offer to send Lux Baker a little support. Do not name a price. Do not mention Avon.",
};

const SI_FALLBACK = {
  "Jane's SI|notice_craving": {
    message: "Wide, starry eyes on this call! 👀 Shall we send Avon a surprise bread gift?",
    action: "none",
  },
  "Jane's SI|decline": {
    message: "Okay, we'll do it another time.",
    action: "none",
  },
  "Jane's SI|choose_best": {
    message: "Great choice! The Four-Pack is a fair price per piece with FREE shipping. Sending it to Avon now!",
    action: "offer_gift",
  },
  "Jane's SI|consult_bread4": {
    message: "The Four-Pack is a fair price per piece with FREE shipping. Shall we send it to Avon?",
    action: "pick_bread4",
  },
  "Viewer's SI|notice_support": {
    message: "You really loved those golden buns! Would you like to send Lux Baker a little support?",
    action: "none",
  },
};

function mentionsPiecePrice(text) {
  return /per[\s-]?piece|apiece|each piece|a piece|per bun|each bun/.test(text);
}

function mentionsFreeShipping(text) {
  return (
    /free shipping|shipping is free|ships free|no shipping fee|no shipping charge/.test(text) ||
    /shipping[^.]{0,24}(?:\$0(?:\.00)?|\bfree\b)/.test(text)
  );
}

function giftsAvon(text) {
  return /send(?:ing)? avon|avon a |gift (?:for|to) avon|for avon|to avon/.test(text);
}

function giftsJane(text) {
  return /your eyes|send you|sending you|gift for you|gift to you/.test(text);
}

function avonNameCount(text) {
  return (text.match(/\bavon\b/g) || []).length;
}

function hasPersonPronoun(text) {
  return /\b(they|them|their|theirs|he|him|his|she|her|hers)\b/.test(text);
}

function hasEnvy(text) {
  return /\b(envy|envious|jealous|jealousy)\b/.test(text);
}

function hasCravingJoke(text) {
  return /\b(drool|drooling|sparkle|sparkling|sparkly|starry|eyes|eye)\b/.test(text);
}

function wordCount(message) {
  return (message.match(/[A-Za-z0-9$']+/g) || []).length;
}

function phraseOk(event, message) {
  const text = message.toLowerCase();
  if (text.includes("cheapest") || giftsJane(text) || hasEnvy(text) || wordCount(message) > 20) return false;
  if (event === "notice_craving") {
    return avonNameCount(text) === 1 && giftsAvon(text) && !hasPersonPronoun(text);
  }
  if (event === "notice_support") {
    return /\blux baker\b/.test(text) && avonNameCount(text) === 0 && !hasCravingJoke(text);
  }
  if (event === "choose_best" || event === "consult_bread4") {
    const plain =
      mentionsPiecePrice(text) &&
      mentionsFreeShipping(text) &&
      giftsAvon(text) &&
      avonNameCount(text) === 1 &&
      !hasPersonPronoun(text) &&
      !hasCravingJoke(text);
    if (!plain) return false;
    if (event === "choose_best" && message.trim().endsWith("?")) return false;
    return true;
  }
  return true;
}

function offlineSuggestion(speaker, event) {
  return {
    ...SI_FALLBACK[`${speaker}|${event}`],
    source: "offline",
  };
}

function sentenceCount(message) {
  return message
    .split(/[.!?！？。]+/)
    .map((part) => part.trim())
    .filter(Boolean).length;
}

function parseSuggestion(text) {
  let raw = String(text || "").trim();
  if (raw.startsWith("```")) {
    raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
  if (typeof parsed.message !== "string" || !SI_ACTIONS.has(parsed.action)) return null;

  const message = parsed.message.trim();
  const count = sentenceCount(message);
  if (!message || message.length > 280 || count < 1 || count > 3) return null;
  if (message.includes("@") || message.toLowerCase().includes("cheapest")) return null;

  return { message, action: parsed.action };
}

function buildSiPrompt(speaker, event) {
  if (event === "notice_support") {
    return [
      "Write one short, kind chat line in English for a bakery gift demo.",
      "Reply in English only. Do not use Korean.",
      "Speaker role label: Viewer's SI. This is a role label, not a legal name.",
      "You are the viewer's SI, speaking to the viewer.",
      "The viewer just loved Lux Baker's bread-baking video, especially the golden buns.",
      "Offer to send Lux Baker a little support. Use the name Lux Baker once.",
      "Do not mention Avon, Jane, eyes, drool, sparkling, prices, cards, or addresses.",
      "Do not start a payment. A person must press a button later.",
      "Use 20 words or fewer. One idea only.",
      "Write a new line in this spirit. Do not copy it word for word:",
      "You really loved those golden buns! Would you like to send Lux Baker a little support?",
      'Reply with JSON only: {"message":"up to three short sentences","action":"none"}',
      "The action value must be exactly none.",
    ].join("\n");
  }
  const lines = [
    "Write one short, kind chat line in English for a bakery gift demo.",
    "Reply in English only. Do not use Korean.",
    `Speaker role label: ${speaker}. This is a role label, not a legal name.`,
    "You are Jane's SI, speaking to Jane.",
    "Never write envy, jealous, or jealousy.",
    "Use the name Avon exactly once, and only as the person who receives the gift. Do not use they, he, she, them, him, or her.",
    `What happened: ${SI_EVENT_FACTS[event]}`,
    "Never write the word cheapest.",
    "Do not mention addresses, email, phone numbers, cards, or payment details.",
    "You may use the demo names Jane, Avon, and Lux. Do not invent any other personal name.",
    "Do not start a payment. A person must press a button later.",
    "Use 20 words or fewer. One idea only.",
  ];
  if (event === "notice_craving") {
    lines.push(
      "Jane is eating bread and enjoying it. Jane's eyes are not sparkling.",
      "A friend on the video call is watching, eyes sparkling, practically drooling.",
      "This opening line may be slightly comic, warm, and cutely exaggerated. Describe that cute reaction first, without the name, then offer the gift.",
      "Do not name a product or a price yet.",
      "The eye joke belongs only in this opening line.",
      "Write a new cute line in this spirit. Do not copy an example word for word:",
      "Wide, starry eyes on this call! 👀 Shall we send Avon a surprise bread gift?"
    );
  } else if (event === "choose_best") {
    lines.push(
      "Tone: warm, short, and plain. No jokes. Do not mention eyes, drool, sparkling, or staring.",
      "Jane already approved this step. Tell Jane. Do not ask. Do not end with a question mark.",
      "Go straight to the Four-Pack.",
      "Product label: Four-Pack. Bread price 8 USD and shipping 0 USD. It is the smallest bundle with free shipping. The per-piece price is a just-right amount per piece.",
      "Say both ideas in your own words: a fair price per piece, and FREE shipping. The pack is for Avon.",
      "In this spirit: Great choice! The Four-Pack is a fair price per piece with FREE shipping. Sending it to Avon now!"
    );
  } else if (event === "consult_bread4") {
    lines.push(
      "Tone: warm, short, and plain. No jokes. Do not mention eyes, drool, sparkling, or staring.",
      "Jane asked to check once more, so end by asking. A question mark at the end is right here.",
      "Go straight to the Four-Pack.",
      "Product label: Four-Pack. Bread price 8 USD and shipping 0 USD. It is the smallest bundle with free shipping. The per-piece price is a just-right amount per piece.",
      "Say both ideas in your own words: a fair price per piece, and FREE shipping. The pack is for Avon.",
      "In this spirit: Great choice! The Four-Pack is a fair price per piece with FREE shipping. Shall we send it to Avon?"
    );
  } else {
    lines.push(
      "Tone: warm, short, and plain. No jokes. Do not mention eyes, drool, sparkling, or staring.",
      "Do not name a product or a price yet."
    );
  }
  lines.push(
    `Reply with JSON only: {"message":"up to three short sentences","action":"${SI_EXPECTED[event]}"}`,
    `The action value must be exactly ${SI_EXPECTED[event]}.`
  );
  return lines.join("\n");
}

function generateContentText(data) {
  const parts = data?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return "";
  return parts
    .filter((part) => part && typeof part.text === "string" && part.thought !== true)
    .map((part) => part.text)
    .join("");
}

async function askGemini(model, speaker, event) {
  const started = Date.now();
  const seconds = () => Number(((Date.now() - started) / 1000).toFixed(2));
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [
            { role: "user", parts: [{ text: buildSiPrompt(speaker, event) }] },
          ],
        }),
        signal: AbortSignal.timeout(SI_TIMEOUT_MS),
      }
    );

    if (!response.ok) {
      console.error("SI model request failed", { model, event, status: response.status, seconds: seconds() });
      return { ok: false, timedOut: false, rateLimited: response.status === 429, suggestion: null };
    }

    const data = await response.json();
    console.log("SI model request", { model, event, status: response.status, seconds: seconds() });
    return {
      ok: true,
      timedOut: false,
      rateLimited: false,
      suggestion: parseSuggestion(generateContentText(data)),
    };
  } catch (error) {
    const timedOut = error.name === "TimeoutError" || error.name === "AbortError";
    console.error("SI model request failed", { model, event, timedOut, seconds: seconds() });
    return { ok: false, timedOut, rateLimited: false, suggestion: null };
  }
}

app.post("/api/si-suggest", async (req, res) => {
  const body = req.body;
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return res.status(400).json({ error: "INVALID_SCENE" });
  }

  const extraKey = Object.keys(body).find((key) => key !== "speaker" && key !== "event");
  if (extraKey) {
    return res.status(400).json({ error: "SCENE_ONLY" });
  }

  const { speaker, event } = body;
  const supportScene = event === "notice_support";
  if (!SI_SPEAKERS.has(speaker) || !SI_EVENTS.has(event) || supportScene !== (speaker === "Viewer's SI")) {
    return res.status(400).json({ error: "UNKNOWN_SCENE" });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.json(offlineSuggestion(speaker, event));
  }

  const primaryModel = process.env.AI_MODEL || SI_DEFAULT_MODEL;
  const first = await askGemini(primaryModel, speaker, event);
  const firstSuggestion =
    first.suggestion &&
    first.suggestion.action === SI_EXPECTED[event] &&
    phraseOk(event, first.suggestion.message)
      ? first.suggestion
      : null;
  if (firstSuggestion) {
    return res.json({ ...firstSuggestion, source: "live" });
  }

  res.json(offlineSuggestion(speaker, event));
});

app.get("/api/gift-limit", (req, res) => {
  res.json({ limitUsd: money(giftLimitUsd) });
});

function roomCapKind(value) {
  return value === "shopping" || value === "support" ? value : "gift";
}

app.get("/api/breads", (req, res) => {
  res.json(catalog(roomCapKind(req.query.cap)));
});

app.get("/api/breads/:sku", (req, res) => {
  if (req.params.sku === SUPPORT.sku && req.query.amount != null && String(req.query.amount) !== "") {
    const quoted = quoteSupport(req.query.amount);
    if (quoted.error) return res.status(400).json({ error: "INVALID_AMOUNT", reason: quoted.error });
    return res.json(quoted);
  }
  const picked = quoteBread(req.params.sku, roomCapKind(req.query.cap));
  if (!picked) return res.status(404).json({ error: "UNKNOWN_BREAD" });
  res.json(picked);
});

app.post("/api/room3-caps", (req, res) => {
  const body = req.body || {};
  let shopping = null;
  let support = null;
  if (body.shoppingUsd != null) {
    shopping = Number(body.shoppingUsd);
    if (!Number.isFinite(shopping) || shopping < 0 || shopping > 100) {
      return res.status(400).json({ error: "INVALID_LIMIT" });
    }
  }
  if (body.supportUsd != null) {
    const parsed = centAmount(body.supportUsd);
    if (parsed.error) return res.status(400).json({ error: "INVALID_LIMIT" });
    support = parsed.dollars;
  }
  if (shopping == null && support == null) {
    return res.status(400).json({ error: "INVALID_LIMIT" });
  }
  if (shopping != null) shoppingLimitUsd = Math.round(shopping * 100) / 100;
  if (support != null) supportLimitUsd = support;
  res.json({
    shoppingUsd: money(shoppingLimitUsd),
    supportUsd: money(supportLimitUsd),
  });
});

app.post("/api/gift-limit", (req, res) => {
  const value = Number(req.body?.limitUsd);
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    return res.status(400).json({ error: "INVALID_LIMIT" });
  }
  giftLimitUsd = Math.round(value * 100) / 100;
  res.json(catalog());
});

app.use(express.static("public"));

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => {
  console.log(`Lux Bakery Gift listening on http://localhost:${port}`);
  console.log(
    `PayPal API host: ${PAYPAL_ENVIRONMENT === "production" ? "live" : "sandbox"} (${PAYPAL_BASE_URL})`,
  );
  if (PAYPAL_ENVIRONMENT === "production") {
    console.log("Warning: PAYPAL_ENVIRONMENT is production. Demo expects sandbox.");
  }
  if (!credentialsReady()) {
    console.log("PayPal credentials are missing. Set env vars, then restart.");
  }
});
