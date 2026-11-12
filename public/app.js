// Browser code only. It never sees PayPal secrets or the Gemini API key.
const statusEl = document.getElementById("status");
const linesEl = document.getElementById("lines");
const giftButton = document.getElementById("gift-button");
const siBadge = document.getElementById("si-badge");
const siThinking = document.getElementById("si-thinking");
const choicesEl = document.getElementById("choices");
const consultEl = document.getElementById("consult");
const limitChoiceEl = document.getElementById("limit-choice");
const limitRaise = document.getElementById("limit-raise");
const limitWithin = document.getElementById("limit-within");
const optionsEl = document.getElementById("options");
const limitInput = document.getElementById("limit-input");
const limitHint = document.getElementById("limit-hint");
const restartButton = document.getElementById("restart");
const choiceBest = document.getElementById("choice-best");
const payLog = document.getElementById("pay-log");
const performanceNote = document.getElementById("performance-note");
const paypalResponse = document.getElementById("paypal-response");
const handoffCaption = document.getElementById("handoff-caption");
const siBall = document.getElementById("si-ball");
const appEl = document.querySelector(".app");
const roomTitle = document.getElementById("room-title");
const roomTwo = document.getElementById("room-two");
const chatEl = document.getElementById("chat");
const summaryCard = document.getElementById("summary-card");
const showEarlier = document.getElementById("show-earlier");
const earlierSlot = document.getElementById("earlier-slot");
const handoffLinesEl = document.getElementById("handoff-lines");
const roomThree = document.getElementById("room-three");
const roomTab1 = document.getElementById("show-room-1");
const roomTab2 = document.getElementById("show-room-2");
const roomTab3 = document.getElementById("show-room-3");
const supportLines = document.getElementById("support-lines");
const supportAfter = document.getElementById("support-after");
const supportChoices = document.getElementById("support-choices");
const supportLimit = document.getElementById("support-limit");
const supportRaise = document.getElementById("support-raise");
const supportSummary = document.getElementById("support-summary");
const supportPay = document.getElementById("support-pay");
const supportPaypal = document.getElementById("support-paypal");
const supportCaption = document.getElementById("support-caption");
const videoHeart = document.getElementById("video-heart");
const heartReady = document.getElementById("heart-ready");
const shoppingCap = document.getElementById("shopping-cap");
const supportCap = document.getElementById("support-cap");
const supportCapPanel = document.getElementById("support-cap-panel");
const supportAmount = document.getElementById("support-amount");
const supportAmountPicks = document.getElementById("support-amount-picks");
const supportAmountChoice = document.getElementById("support-amount-choice");
const supportAmountRaise = document.getElementById("support-amount-raise");
const supportQuick = document.getElementById("support-quick");
const supportOwn = document.getElementById("support-own-amount");
const supportWho = document.getElementById("support-who");
const supportBreads = document.getElementById("support-breads");
const supportAgain = document.getElementById("support-again");

const SI_SCENES = {
  notice_craving: { speaker: "Jane's SI", event: "notice_craving" },
  decline: { speaker: "Jane's SI", event: "decline" },
  choose_best: { speaker: "Jane's SI", event: "choose_best" },
  consult_bread4: { speaker: "Jane's SI", event: "consult_bread4" },
  notice_support: { speaker: "Viewer's SI", event: "notice_support" },
};

const SI_FALLBACK = {
  notice_craving: {
    message: "Wide, starry eyes on this call! 👀 Shall we send Avon a surprise bread gift?",
    action: "none",
    source: "offline",
  },
  decline: {
    message: "Okay, we'll do it another time.",
    action: "none",
    source: "offline",
  },
  choose_best: {
    message: "Great choice! The Four-Pack is a fair price per piece with FREE shipping. Sending it to Avon now!",
    action: "offer_gift",
    source: "offline",
  },
  consult_bread4: {
    message: "The Four-Pack is a fair price per piece with FREE shipping. Shall we send it to Avon?",
    action: "pick_bread4",
    source: "offline",
  },
  notice_support: {
    message: "You really loved those golden buns! Would you like to send Lux Baker a little support?",
    action: "none",
    source: "offline",
  },
};

const SI_ACTIONS = new Set(["offer_gift", "pick_bread4", "none"]);

const OPENING_CAP = 8;
const HANDOFF_LINE =
  "Your gift is waiting. How would you like to receive it?";
const SOFT_LINE =
  "On a bread break? 😄 Accept, and I'll deliver it to you or anyone in your contacts.";
const THANKS_ACCEPT = "Thank you! I'll enjoy every bite. 🥐";
const THANKS_YES = "Thanks, Jane! You've inspired me to share the sweetness, too. 🥐";
const THANKS_KEEP = "Thank you! Your gift made my heart sweet. I'll keep this one in my heart. 💛";
const THANKS_SENDER = "Thank you! 💛";
const CAPTURE_CAPTION = "Captured ✅ · Recipient's address shared only with the bakery";
const ROOM2_DELIVERY_PROPOSAL =
  "Proposed: the recipient enters delivery details. The sender does not need the address.";
const ROOM2_CONCEPT_LABEL = "Proposed option - no redeemable credit is issued.";
const ROOM2_PASS_LABEL = "Proposed option - no delivery to another friend is started.";
const ROOM2_DECLINE_NOTE = "Of course. Your friend will only see that it was declined.";
const SUPPORT_THANKS = "Thank you, everyone! Your support makes the next bake possible. 🥐";
const SUPPORT_PASS = "Okay, we'll just keep watching.";
const SUPPORT_QUICK = [1, 3, 10];
const WHO_LINE = "Who should receive this bread?";
const DELIVERY_LINE = "I'll take care of the delivery from here. Enjoy the bake! 🥐";
const FRIEND_THANKS_YES = "Thank you! You've inspired me to share the sweetness, too. 🥐";
const ROOM3_CLOSED = "Checkout closed. No money was sent. Press Send with PayPal to try again.";
const ROOM3_OVER_CAP = "This is over your cap. No money was sent.";
const ROOM3_PROBLEM = "Something went wrong. No money was sent. Press Send with PayPal to try again.";

let paypalReady = false;
let paypalSession = null;
let paypalOpening = false;
let room3CheckoutFault = "";
let checkoutKind = "room1";
let supportOffered = false;
let supportSettled = false;
let supportPurchased = false;
let room3Started = false;
let room3Done = false;
let room1Done = false;
let room2Done = false;
let supportGeneration = 0;
let supportPurpose = "support";
let supportPrefetch = null;
let pendingSupport = null;
let supportOrderId = null;
let supportHoldBusy = false;
let supportFitsOpen = false;
let room3GreyOverCap = false;
let room3BreadPaint = 0;
let room3CapRequest = 0;
let handoffOrderId = null;
let handoffBusy = false;
let handoffSummary = null;
let giftOffered = false;
let sceneEnded = false;
let sceneGeneration = 0;
let selectedSku = "bread-4";
let selectedSupportAmount = null;
let savedSupportCap = 5;
let pendingSupportAmount = null;
let pendingOverSku = "bread-4";
let thinkingCount = 0;
let savedLimitUsd = null;
let limitRequestId = 0;
let limitSaveTimer = 0;

let room1Status = { text: "Getting PayPal sandbox ready…", kind: "" };
let room3Status = { text: "Press the heart when you're ready.", kind: "" };

function setStatus(text, kind) {
  statusEl.textContent = text;
  statusEl.className = kind ? `note ${kind}` : "note";
  const saved = { text, kind: kind || "" };
  if (appEl.classList.contains("is-room-3")) room3Status = saved;
  else room1Status = saved;
}

function setSiBadge(source) {
  siBadge.textContent = source === "live" ? "SI: live" : "SI: offline script";
}

function hideChoices() {
  for (const group of [choicesEl, consultEl, limitChoiceEl, optionsEl]) {
    group.hidden = true;
    group.classList.remove("is-settled");
  }
}

function dollarText(value) {
  const cents = Math.round(Number(value) * 100);
  if (!Number.isFinite(cents)) return "";
  return String(cents / 100);
}

function shortfallText(quote) {
  const gapCents =
    Math.round(Number(quote.totalUsd) * 100) - Math.round(Number(quote.limitUsd) * 100);
  return dollarText(gapCents / 100);
}

function isSuggestion(body, event) {
  return (
    body &&
    typeof body.message === "string" &&
    SI_ACTIONS.has(body.action) &&
    body.action === SI_FALLBACK[event].action
  );
}

function addChatLine(text, speaker, target = linesEl) {
  const article = document.createElement("article");
  const person = speaker === "Jane";
  const avon = speaker === "Avon";
  const avonSi = speaker === "Avon's SI" || speaker === "Avon's SI · from Avon to Jane";
  const investor = speaker === "Big-hearted investor's SI";
  const creator = speaker === "Lux Baker's SI";
  const viewerSi = speaker === "Viewer's SI";
  const viewer = speaker === "Viewer";
  const friend = speaker === "Friend";
  const friendSi = speaker === "Friend's SI" || speaker === "Friend's SI · from Friend to you";
  article.className = person || viewer
    ? "bubble person"
    : avon || friend
      ? "bubble avon"
      : avonSi || friendSi
        ? "bubble avon-si"
        : investor
          ? "bubble investor"
          : creator
            ? "bubble creator"
            : "bubble jane";
  const label = document.createElement("span");
  label.className = "who";
  label.textContent = person
    ? "Jane"
    : viewer
      ? "Viewer"
      : avon
        ? "Avon"
        : friend
          ? "Friend"
          : avonSi || investor || creator || viewerSi || friendSi
            ? speaker
            : "Jane's SI";
  const body = document.createTextNode(text);
  article.append(label, body);
  target.append(article);
  return body;
}

function addPersonLine(text) {
  return addChatLine(text, "Jane");
}

function setRestartVisible(visible) {
  restartButton.classList.toggle("is-waiting", !visible);
  restartButton.inert = !visible;
}

function lockLimit() {
  limitInput.disabled = true;
  limitHint.classList.remove("is-waiting");
  setRestartVisible(true);
}

function unlockLimit() {
  limitInput.disabled = false;
  limitHint.classList.add("is-waiting");
  setRestartVisible(false);
}

function sceneIsCurrent(generation) {
  return generation === sceneGeneration;
}

function setThinking(active) {
  thinkingCount += active ? 1 : -1;
  if (thinkingCount < 0) thinkingCount = 0;
  siThinking.hidden = thinkingCount === 0;
}

function revealGiftButton() {
  giftOffered = true;
  giftButton.hidden = false;
  giftButton.disabled = paypalOpening || !paypalReady;
}

function showRoom1Retry(text, kind) {
  paypalOpening = false;
  performanceNote.hidden = true;
  checkoutKind = "room1";
  giftButton.textContent = "Send with PayPal";
  giftOffered = true;
  giftButton.hidden = false;
  giftButton.disabled = false;
  setStatus(text, kind || "");
}

function prepareClip(video, still, src) {
  if (!video) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) {
    video.hidden = true;
    video.removeAttribute("src");
    if (still) still.hidden = false;
    return;
  }
  video.addEventListener("error", () => {
    video.hidden = true;
    if (still) still.hidden = false;
  });
  video.addEventListener("loadeddata", () => {
    video.hidden = false;
    if (still) still.hidden = true;
    video.play().catch(() => {});
  });
  video.src = src;
}

function prepareRoom1Hero() {
  prepareClip(
    document.getElementById("room1-hero"),
    document.getElementById("room1-still"),
    "/video-call-drool.mp4",
  );
}

function prepareRoom3Steam() {
  prepareClip(
    document.getElementById("room3-steam"),
    document.getElementById("room3-steam-still"),
    "/bread-steam.mp4",
  );
}

function priceLabel(item) {
  const bread = Number(item.breadUsd).toFixed(2);
  const shipping = Number(item.shippingUsd);
  if (shipping === 0) return `${item.name}: $${bread} (FREE shipping)`;
  const ship = shipping.toFixed(2);
  const total = Number(item.totalUsd).toFixed(2);
  return `${item.name}: $${bread} + $${ship} shipping = $${total}`;
}

async function askSi(sceneKey) {
  const scene = SI_SCENES[sceneKey];
  try {
    const response = await fetch("/api/si-suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ speaker: scene.speaker, event: scene.event }),
      signal: AbortSignal.timeout(4000),
    });
    const body = await response.json().catch(() => null);
    if (!response.ok || !isSuggestion(body, sceneKey)) return SI_FALLBACK[sceneKey];
    return body;
  } catch {
    return SI_FALLBACK[sceneKey];
  }
}

async function showJaneLine(sceneKey) {
  const generation = sceneGeneration;
  const fallback = SI_FALLBACK[sceneKey];
  const textNode = addChatLine(fallback.message);
  setThinking(true);
  const suggestion = await askSi(sceneKey);
  setThinking(false);
  if (!sceneIsCurrent(generation)) return null;
  if (suggestion.source === "live") textNode.data = suggestion.message;
  setSiBadge(suggestion.source);
  return suggestion.source === "live" ? suggestion : fallback;
}

async function getBrowserSafeClientToken() {
  const response = await fetch("/paypal-api/auth/browser-safe-client-token");
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error("Expected JSON from client token endpoint");
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.message || `Token HTTP ${response.status}`);
  }
  if (!body.accessToken) throw new Error("Missing accessToken");
  return body.accessToken;
}

function room3CheckoutKind(purpose) {
  if (purpose === "friend") return "room3-friend";
  if (purpose === "forme") return "room3-forme";
  if (purpose === "support") return "room3-support";
  return "room1";
}

function createOrder() {
  const purpose = checkoutKind === "room3-support"
    ? "support"
    : checkoutKind === "room3-forme"
      ? "forme"
      : checkoutKind === "room3-friend"
        ? "friend"
        : "";
  const payload = purpose ? { sku: selectedSku, purpose } : { sku: selectedSku };
  if (purpose === "support") payload.amount = selectedSupportAmount;
  return fetch("/paypal-api/checkout/orders/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).then(async (response) => {
    const body = await response.json().catch(() => ({}));
    if (body.error === "LIMIT_EXCEEDED") {
      const error = new Error(body.message);
      error.code = "LIMIT_EXCEEDED";
      room3CheckoutFault = "cap";
      throw error;
    }
    if (!response.ok || !body.id) {
      throw new Error(body.message || "Could not start PayPal checkout");
    }
    return { orderId: body.id };
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function showSavedLimit(limitUsd) {
  const amount = Number(limitUsd);
  savedLimitUsd = amount;
  limitInput.value = amount;
  choiceBest.textContent = `3. Yes, go ahead within my cap (max $${amount})`;
}

async function resetOpeningCap() {
  const requestId = ++limitRequestId;
  showSavedLimit(OPENING_CAP);
  const response = await fetch("/api/gift-limit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ limitUsd: OPENING_CAP }),
  });
  const body = await response.json().catch(() => null);
  if (requestId !== limitRequestId) return null;
  if (!response.ok || !body || body.limitUsd == null) return null;
  showSavedLimit(body.limitUsd);
  return body;
}

async function saveLimitAmount(limitUsd) {
  window.clearTimeout(limitSaveTimer);
  const requestId = ++limitRequestId;
  const response = await fetch("/api/gift-limit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ limitUsd }),
  });
  const body = await response.json().catch(() => null);
  if (requestId !== limitRequestId) return null;
  if (!response.ok || !body || body.limitUsd == null) {
    if (savedLimitUsd != null) limitInput.value = savedLimitUsd;
    setStatus("Couldn't save the cap.", "error");
    return null;
  }
  showSavedLimit(body.limitUsd);
  setStatus(`Cap saved at max $${savedLimitUsd}.`);
  return body;
}

function saveLimit() {
  return saveLimitAmount(limitInput.value);
}

async function quoteBread(sku) {
  const response = await fetch(`/api/breads/${encodeURIComponent(sku)}`);
  const body = await response.json().catch(() => null);
  if (!response.ok || !body) return null;
  return body;
}

function overCapNote(limitUsd) {
  return `(over your $${wholeDollar(limitUsd)} cap)`;
}

function breadButton(item, label, number, blocked) {
  const button = document.createElement("button");
  button.className = "choice";
  button.type = "button";
  button.dataset.bread = item.sku;
  button.textContent = blocked ? `${number}. ${label} ${overCapNote(item.limitUsd)}` : `${number}. ${label}`;
  if (blocked) {
    button.disabled = true;
    button.classList.add("is-over-cap");
  }
  return button;
}

async function loadCatalog() {
  const response = await fetch("/api/breads");
  const body = await response.json().catch(() => null);
  if (!response.ok || !body?.breads) return null;
  return body;
}

async function showBreadChoices() {
  const body = await loadCatalog();
  optionsEl.replaceChildren();
  if (!body) {
    setStatus("Couldn't load prices from the server.", "error");
    return;
  }
  body.breads.forEach((item, index) => {
    optionsEl.append(breadButton(item, priceLabel(item), index + 1));
  });
  optionsEl.hidden = false;
}

function overLimitMessage(quote) {
  const limit = dollarText(quote.limitUsd);
  const total = dollarText(quote.totalUsd);
  const gap = shortfallText(quote);
  const shippingNote = Number(quote.shippingUsd) === 0 ? ", free shipping" : "";
  return `A $${limit} cap can't cover ${quote.name} ($${total}${shippingNote}). Raise it by $${gap}, to $${total}? Or pick something smaller that fits?`;
}

function showOverLimitChoice(quote) {
  pendingOverSku = quote.sku;
  addChatLine(overLimitMessage(quote));
  limitRaise.textContent = `1. Raise the cap to $${dollarText(quote.totalUsd)} and continue with ${quote.name}`;
  limitChoiceEl.classList.remove("is-settled");
  limitChoiceEl.hidden = false;
  setStatus("The cap is short. A person has to press a button for the next step.");
}

function listOverLimitMessage(quote) {
  const limit = dollarText(quote.limitUsd);
  const total = dollarText(quote.totalUsd);
  const gap = shortfallText(quote);
  const shipping =
    Number(quote.shippingUsd) === 0
      ? "(FREE shipping)"
      : `($${dollarText(quote.breadUsd)} + $${dollarText(quote.shippingUsd)} shipping)`;
  return `${quote.name} is $${total} ${shipping}, which is over your $${limit} cap. Raise it by $${gap}, to $${total}? Or pick something that fits?`;
}

function showListOverLimit(quote) {
  pendingOverSku = quote.sku;
  addChatLine(listOverLimitMessage(quote));
  limitRaise.textContent = `1. Raise the cap to $${dollarText(quote.totalUsd)} and continue with ${quote.name}`;
  limitChoiceEl.classList.remove("is-settled");
  limitChoiceEl.hidden = false;
  setStatus("The cap is short. Press one of these buttons.");
}

async function showAffordableBreads() {
  const generation = sceneGeneration;
  const body = await loadCatalog();
  if (!sceneIsCurrent(generation)) return;
  optionsEl.replaceChildren();
  if (!body) {
    setStatus("Couldn't load prices from the server.", "error");
    return;
  }
  body.breads.forEach((item, index) => {
    optionsEl.append(breadButton(item, priceLabel(item), index + 1, item.allowed !== true));
  });
  optionsEl.classList.remove("is-settled");
  optionsEl.hidden = false;
}

function wholeDollar(value) {
  const amount = Number(value);
  return Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
}

function showCheckoutReady(quote) {
  checkoutKind = "room1";
  selectedSku = quote.sku;
  const price = Number(quote.totalUsd).toFixed(2);
  const cap = wholeDollar(quote.limitUsd);
  const card = document.createElement("p");
  card.className = "summary-card";
  card.textContent = `🥐 ${quote.name} · $${price} · Within your $${cap} cap ✅`;
  linesEl.append(card);
  const line =
    quote.sku === "bread-4"
      ? "Four-Pack, $8, within your cap. Opening PayPal! 🥐"
      : `${quote.name}, $${wholeDollar(quote.totalUsd)}, within your cap. Opening PayPal! 🥐`;
  addChatLine(line);
  performanceNote.hidden = false;
  beginPayPalCheckout();
  if (paypalOpening) performanceNote.hidden = true;
}

async function offerBread(sku) {
  const quote = await quoteBread(sku);
  if (!quote) {
    setStatus("Couldn't check the price.", "error");
    return null;
  }
  if (!quote.allowed) {
    showListOverLimit(quote);
    return quote;
  }
  selectedSku = sku;
  showTapToSend(quote);
  setStatus(`${priceLabel(quote)} Press the gift button when you're ready.`);
  revealGiftButton();
  return quote;
}

function tapToSendLine(quote) {
  const amount = wholeDollar(quote.totalUsd);
  if (Number(quote.shippingUsd) === 0) {
    return `${quote.name}, $${amount}, free shipping, within your cap. Tap to send! 🥐`;
  }
  return `${quote.name}, $${amount} with shipping, within your cap. Tap to send! 🥐`;
}

function showTapToSend(quote) {
  document.querySelector(".tap-line")?.remove();
  const body = addChatLine(tapToSendLine(quote));
  const bubble = body.parentElement;
  bubble.classList.add("tap-line");
  giftButton.before(bubble);
}

async function showPayLog(lines) {
  payLog.hidden = false;
  payLog.replaceChildren();
  for (const line of lines) {
    const item = document.createElement("li");
    item.textContent = line;
    payLog.append(item);
    await sleep(450);
  }
}

function showPayPalResponse(pairs) {
  paypalResponse.hidden = false;
  const lines = ["PayPal response"];
  for (const [label, value] of pairs) lines.push(`${label}: ${value}`);
  paypalResponse.textContent = lines.join("\n");
}

function paypalLatestLine(kind, status, orderId) {
  const id = orderId || "none";
  if (kind === "void") {
    return `PayPal response · Authorization: ${status || "VOIDED"} · No charge · Order ID: ${id}`;
  }
  const shown = status || "COMPLETED";
  const mark = shown === "COMPLETED" ? " ✅" : "";
  return `PayPal response · Capture: ${shown}${mark} · Order ID: ${id}`;
}

function appendPayPalStatus(parent, text) {
  const card = document.createElement("p");
  card.className = "paypal-response paypal-status-latest";
  card.textContent = text;
  parent.append(card);
}

function setCaption(text) {
  handoffCaption.hidden = false;
  handoffCaption.textContent = text;
}

function addHandoffLine(text, speaker) {
  return addChatLine(text, speaker, handoffLinesEl);
}

function setSummary(state) {
  if (!handoffSummary) return;
  const total = Number(handoffSummary.totalUsd).toFixed(2);
  summaryCard.textContent = `🥐 ${handoffSummary.name} · $${total} · ${state}`;
}

function makePrivacyPanel(kind, title) {
  const panel = document.createElement("section");
  panel.className = `privacy-panel ${kind}-panel`;
  const label = document.createElement("p");
  label.className = "privacy-label";
  label.textContent = title;
  panel.append(label);
  return panel;
}

function receiverPathNote(decision) {
  if (decision === "bread") return ROOM2_DELIVERY_PROPOSAL;
  if (decision === "credit") return ROOM2_CONCEPT_LABEL;
  if (decision === "pass") return ROOM2_PASS_LABEL;
  return null;
}

function showSplitPrivacyResult({
  parent,
  decision,
  accepted,
  choiceText,
  choiceSpeaker,
  siSpeaker,
  thanks,
  thanksSpeaker,
  paypalText,
}) {
  parent.replaceChildren();
  const sender = makePrivacyPanel("sender", "Sender sees");
  addChatLine(accepted ? "Accepted" : "Declined", siSpeaker, sender);
  addChatLine(thanks, thanksSpeaker, sender);

  const receiver = makePrivacyPanel("receiver", "Receiver sees");
  addChatLine(choiceText, choiceSpeaker, receiver);
  if (decision === "decline") {
    addChatLine(ROOM2_DECLINE_NOTE, siSpeaker, receiver);
  } else {
    const note = receiverPathNote(decision);
    if (note) addChatLine(note, siSpeaker, receiver);
  }
  if (paypalText) appendPayPalStatus(receiver, paypalText);

  parent.append(sender, receiver);
}

function recipientChoiceOptions() {
  return [
    ["bread", "1. Receive the bread"],
    ["credit", "2. Same-store credit"],
    ["pass", "3. Give it to another friend"],
    ["decline", "4. No thanks"],
  ];
}

function recipientConceptNote() {
  const note = document.createElement("p");
  note.className = "concept-note";
  note.textContent = `${ROOM2_CONCEPT_LABEL} Choices 2 and 3 are concepts only.`;
  return note;
}

function renderAvonChoices() {
  const choices = document.createElement("div");
  choices.className = "choices avon-picks";
  const label = document.createElement("span");
  label.className = "who";
  label.textContent = "Avon";
  for (const [decision, text] of recipientChoiceOptions()) {
    const button = document.createElement("button");
    button.className = "choice avon-pick";
    button.type = "button";
    button.textContent = text;
    button.addEventListener("click", () => finishHandoff(decision, button));
    choices.append(button);
  }
  const wrap = document.createElement("div");
  wrap.className = "avon-picks";
  wrap.append(label, choices, recipientConceptNote());
  handoffLinesEl.append(wrap);
}

function hiddenMessageCount() {
  return linesEl.querySelectorAll("article").length;
}

function setEarlierLabel(open) {
  showEarlier.textContent = open
    ? "▾ Hide earlier chat"
    : `▸ Show earlier chat (${hiddenMessageCount()})`;
}

function glowEarlierButton() {
  showEarlier.classList.remove("hint-glow");
  showEarlier.getBoundingClientRect();
  showEarlier.classList.add("hint-glow");
}

function openRoomTwo() {
  earlierSlot.hidden = true;
  earlierSlot.append(chatEl);
  chatEl.classList.add("is-earlier-hidden");
  setEarlierLabel(false);
  glowEarlierButton();
  appEl.classList.add("is-room-two");
  roomTwo.hidden = false;
  showRoom("1");
}

function closeRoomTwo() {
  chatEl.classList.remove("is-earlier-hidden");
  roomTwo.after(chatEl);
  earlierSlot.hidden = true;
  handoffLinesEl.replaceChildren();
  roomTwo.querySelectorAll(".paypal-status-latest").forEach((card) => card.remove());
  summaryCard.textContent = "";
  handoffSummary = null;
  appEl.classList.remove("is-room-two");
  roomTwo.hidden = true;
  room2Done = false;
  showEarlier.classList.remove("hint-glow");
  setEarlierLabel(false);
  paintRoomPills();
}

async function showAvonHandoff(orderId, orderStatus, authorizationStatus) {
  const generation = sceneGeneration;
  handoffOrderId = orderId;
  handoffBusy = false;
  const quote = await quoteBread(selectedSku);
  if (!sceneIsCurrent(generation)) return;
  handoffSummary = {
    name: quote?.name || "Four-Pack",
    totalUsd: quote?.totalUsd || "8.00",
  };
  openRoomTwo();
  setSummary("Payment held (not captured yet)");
  setCaption("Payment authorized — not captured yet");
  showPayPalResponse([
    ["Order", orderStatus],
    ["Authorization", authorizationStatus],
    ["Order ID", orderId || "none"],
  ]);
  addHandoffLine(HANDOFF_LINE, "Avon's SI");
  renderAvonChoices();
  setStatus("Avon is choosing. A person has to press a button.");
}

function settleChoices(group) {
  group.classList.add("is-settled");
  for (const choice of group.querySelectorAll("button")) choice.disabled = true;
}

function reopenChoices(group) {
  group.classList.remove("is-settled");
  for (const choice of group.querySelectorAll("button")) choice.disabled = false;
}

async function finishHandoff(decision, button) {
  if (!handoffOrderId || handoffBusy) return;
  handoffBusy = true;
  const generation = sceneGeneration;
  const orderId = handoffOrderId;
  const group = button.closest(".choices");
  settleChoices(group);
  const choiceText = button.textContent.trim();
  const accepts = decision === "bread" || decision === "credit" || decision === "pass";
  const path = accepts ? "accept" : "decline";
  try {
    const response = await fetch(`/paypal-api/checkout/orders/${orderId}/${path}`, {
      method: "POST",
    });
    const body = await response.json().catch(() => ({}));
    if (!sceneIsCurrent(generation)) return;
    if (!response.ok) {
      handoffBusy = false;
      reopenChoices(group);
      setStatus(body.message || "PayPal could not finish that step.", "error");
      return;
    }
    roomTwo.querySelectorAll(".paypal-status-latest").forEach((card) => card.remove());
    if (path === "accept") {
      setSummary("Accepted");
      setCaption("Captured ✅");
      showSplitPrivacyResult({
        parent: handoffLinesEl,
        decision,
        accepted: true,
        choiceText,
        choiceSpeaker: "Avon",
        siSpeaker: "Avon's SI",
        thanks: THANKS_SENDER,
        thanksSpeaker: "Avon's SI · from Avon to Jane",
        paypalText: paypalLatestLine("capture", body.captureStatus, body.orderId || orderId),
      });
      setStatus("Gift accepted.");
    } else {
      setSummary("Declined");
      setCaption("Authorization voided · No charge");
      showSplitPrivacyResult({
        parent: handoffLinesEl,
        decision,
        accepted: false,
        choiceText,
        choiceSpeaker: "Avon",
        siSpeaker: "Avon's SI",
        thanks: THANKS_KEEP,
        thanksSpeaker: "Avon's SI · from Avon to Jane",
        paypalText: paypalLatestLine("void", body.authorizationStatus, body.orderId || orderId),
      });
      setStatus("Gift declined.");
    }
    room2Done = true;
    paintRoomPills();
  } catch (error) {
    console.error(error);
    if (!sceneIsCurrent(generation)) return;
    handoffBusy = false;
    reopenChoices(group);
    setStatus("PayPal could not finish that step.", "error");
  }
}

async function askAboutLimit() {
  const quote = await quoteBread(selectedSku);
  if (!quote) {
    setStatus("Couldn't check the cap.", "error");
    return;
  }
  showListOverLimit(quote);
}

function flyBallToGift() {
  const target = giftButton.getBoundingClientRect();
  const start = linesEl.getBoundingClientRect();
  siBall.hidden = false;
  siBall.classList.remove("bounce");
  siBall.style.transition = "none";
  siBall.style.left = `${start.left + 24}px`;
  siBall.style.top = `${start.top + 12}px`;
  siBall.getBoundingClientRect();
  siBall.style.transition = "left 0.7s ease-in, top 0.7s ease-in";
  siBall.style.left = `${target.left + target.width / 2 - 9}px`;
  siBall.style.top = `${target.top + target.height / 2 - 9}px`;
  return new Promise((resolve) => {
    const done = () => {
      siBall.removeEventListener("transitionend", done);
      siBall.classList.add("bounce");
      setTimeout(() => {
        siBall.hidden = true;
        siBall.classList.remove("bounce");
        resolve();
      }, 280);
    };
    siBall.addEventListener("transitionend", done);
  });
}

function rememberAnswer(button) {
  button.closest(".choices")?.classList.add("is-settled");
  lockLimit();
  addPersonLine(button.textContent.trim());
}

document.getElementById("choice-no").addEventListener("click", async () => {
  if (sceneEnded) return;
  const generation = sceneGeneration;
  sceneEnded = true;
  room1Done = true;
  rememberAnswer(document.getElementById("choice-no"));
  hideChoices();
  paintRoomPills();
  await showJaneLine("decline");
  if (!sceneIsCurrent(generation)) return;
  setStatus("That's the end of the scene.");
});

document.getElementById("choice-options").addEventListener("click", () => {
  if (sceneEnded) return;
  rememberAnswer(document.getElementById("choice-options"));
  hideChoices();
  setStatus("Pick a bread yourself.");
  showBreadChoices();
});

document.getElementById("choice-best").addEventListener("click", async () => {
  if (sceneEnded) return;
  const generation = sceneGeneration;
  rememberAnswer(document.getElementById("choice-best"));
  hideChoices();
  const quote = await quoteBread("bread-4");
  if (!sceneIsCurrent(generation)) return;
  if (!quote) {
    setStatus("Couldn't check the cap.", "error");
    return;
  }
  if (!quote.allowed) {
    showOverLimitChoice(quote);
    return;
  }

  showCheckoutReady(quote);
});

limitRaise.addEventListener("click", async () => {
  if (sceneEnded) return;
  const generation = sceneGeneration;
  rememberAnswer(limitRaise);
  limitChoiceEl.hidden = true;
  const sku = pendingOverSku || "bread-4";
  const quote = await quoteBread(sku);
  if (!sceneIsCurrent(generation)) return;
  if (!quote) {
    setStatus("Couldn't check the cap.", "error");
    return;
  }
  const saved = await saveLimitAmount(quote.totalUsd);
  if (!sceneIsCurrent(generation) || !saved) return;
  const again = await quoteBread(sku);
  if (!sceneIsCurrent(generation)) return;
  if (!again?.allowed) {
    setStatus("Still over the cap. Checkout did not start.", "error");
    return;
  }
  showCheckoutReady(again);
});

limitWithin.addEventListener("click", async () => {
  if (sceneEnded) return;
  rememberAnswer(limitWithin);
  limitChoiceEl.hidden = true;
  await showAffordableBreads();
});

limitInput.addEventListener("input", () => {
  if (limitInput.disabled) return;
  window.clearTimeout(limitSaveTimer);
  limitSaveTimer = window.setTimeout(saveLimit, 200);
});

limitInput.addEventListener("change", () => {
  if (limitInput.disabled) return;
  window.clearTimeout(limitSaveTimer);
  saveLimit();
});

function paintRoomPills() {
  const inRoom3 = appEl.classList.contains("is-room-3");
  const avonTurn = !roomTwo.hidden;
  const room2Locked = inRoom3 || !avonTurn;
  roomTab1.textContent = avonTurn || room1Done ? "Room 1 ✓" : "Room 1";
  roomTab1.classList.toggle("is-on", !inRoom3 && !avonTurn);
  roomTab2.textContent = !avonTurn ? "Room 2 🔒" : inRoom3 ? "Room 2 ✓ 🔒" : room2Done ? "Room 2 ✓" : "Room 2";
  roomTab2.classList.toggle("is-locked", room2Locked);
  roomTab2.classList.toggle("is-on", !room2Locked);
  roomTab2.disabled = room2Locked;
  roomTab2.title = avonTurn ? "" : "Opens after PayPal approval in Room 1";
  roomTab3.textContent = room3Done ? "Room 3 ✓" : "Room 3";
  roomTab3.classList.toggle("is-on", inRoom3);
  if (inRoom3) roomTitle.textContent = "Room 3: Watch & Support";
  else if (avonTurn) roomTitle.textContent = "Room 2: Avon decides";
  else roomTitle.textContent = "Jane's SI";
}

function showRoom(which) {
  const room3 = which === "3";
  appEl.classList.toggle("is-room-3", room3);
  roomThree.hidden = !room3;
  const savedStatus = room3 ? room3Status : room1Status;
  statusEl.textContent = savedStatus.text;
  statusEl.className = savedStatus.kind ? `note ${savedStatus.kind}` : "note";
  paintRoomPills();
}

function resetHeart() {
  videoHeart.disabled = false;
  videoHeart.classList.add("is-beating");
  heartReady.hidden = false;
}

function pressHeart() {
  videoHeart.classList.remove("is-beating");
  heartReady.hidden = true;
}

function hideAmountPanel() {
  supportAmount.hidden = true;
  supportAmountPicks.hidden = false;
  supportAmountChoice.hidden = true;
  supportOwn.value = "";
  rememberWholeDollar(supportOwn);
  pendingSupportAmount = null;
}

function hideSupportSteps() {
  for (const group of [supportChoices, supportWho, supportBreads, supportLimit, supportAgain, supportAmountChoice]) {
    group.hidden = true;
    group.classList.remove("is-settled");
  }
  for (const button of supportChoices.querySelectorAll("button")) {
    button.disabled = false;
    button.classList.remove("is-over-cap");
  }
  hideAmountPanel();
  refreshSupportMoney();
  for (const button of supportWho.querySelectorAll("button")) button.disabled = false;
}

function resetSupportScene() {
  supportGeneration += 1;
  room3Done = false;
  supportOffered = false;
  supportSettled = false;
  supportPurchased = false;
  supportPurpose = "support";
  supportPrefetch = null;
  pendingSupport = null;
  supportOrderId = null;
  supportHoldBusy = false;
  selectedSupportAmount = null;
  pendingSupportAmount = null;
  supportFitsOpen = false;
  room3GreyOverCap = false;
  room3BreadPaint += 1;
  resetHeart();
  supportLines.replaceChildren();
  supportAfter.replaceChildren();
  supportBreads.replaceChildren();
  hideSupportSteps();
  supportSummary.hidden = true;
  supportSummary.textContent = "";
  supportPay.hidden = true;
  supportPaypal.hidden = true;
  supportPaypal.textContent = "";
  supportCaption.hidden = true;
  supportCaption.textContent = "";
}

function openRoom3() {
  room3Started = true;
  paypalOpening = false;
  resetSupportScene();
  showRoom("3");
  setStatus("Press the heart when you're ready.");
  prefetchSupportLine();
}

function prefetchSupportLine() {
  const generation = supportGeneration;
  const pending = askSi("notice_support");
  supportPrefetch = { generation, ready: null };
  pending.then((suggestion) => {
    if (!supportPrefetch || supportPrefetch.generation !== generation) return;
    supportPrefetch.ready = suggestion;
  });
}

function showSupportOffer() {
  if (supportOffered || supportSettled || videoHeart.disabled) return;
  supportOffered = true;
  pressHeart();
  const ready = supportPrefetch && supportPrefetch.generation === supportGeneration
    ? supportPrefetch.ready
    : null;
  const live = ready?.source === "live" ? ready.message : "";
  addChatLine(live || SI_FALLBACK.notice_support.message, "Viewer's SI", supportLines);
  setSiBadge(live ? "live" : "offline");
  refreshSupportMoney();
  supportChoices.hidden = false;
}

function addViewerChoice(text) {
  addChatLine(text, "Viewer", supportLines);
}

function showWatchAgain() {
  room3Done = true;
  supportAgain.hidden = false;
  supportAgain.classList.remove("is-settled");
  paintRoomPills();
}

function supportCard(quote) {
  const amount = wholeDollar(quote.totalUsd);
  if (quote.sku === "support-3") {
    return `💸 Support · $${amount}, within your $${wholeDollar(quote.limitUsd)} support cap`;
  }
  return `🥐 ${quote.name} · $${amount}, within your shopping cap`;
}

function showSupportReady(quote, purpose) {
  supportPurpose = purpose;
  checkoutKind = room3CheckoutKind(purpose);
  selectedSku = quote.sku;
  if (purpose === "support") selectedSupportAmount = Number(quote.totalUsd);
  supportLimit.hidden = true;
  hideAmountPanel();
  supportSummary.hidden = false;
  supportSummary.textContent = supportCard(quote);
  supportPay.hidden = false;
  paypalOpening = false;
  supportPay.disabled = false;
  if (paypalReady) setStatus("Press Send with PayPal when you're ready.");
  else setStatus("The PayPal window isn't ready yet. Please press Send with PayPal.", "error");
}

function room3OverMessage(quote) {
  const limit = dollarText(quote.limitUsd);
  const total = dollarText(quote.totalUsd);
  const gap = shortfallText(quote);
  const capName = quote.sku === "support-3" ? "support cap" : "shopping cap";
  const name = quote.sku === "support-3" ? "Support" : quote.name;
  const shipping =
    quote.sku === "support-3" ? "," : Number(quote.shippingUsd) === 0 ? ", free shipping," : " with shipping,";
  return `${name} is $${total}${shipping} over your $${limit} ${capName}. Raise it by $${gap}? Or pick something smaller?`;
}

function showSupportOverLimit(quote, purpose) {
  pendingSupport = { sku: quote.sku, purpose };
  addChatLine(room3OverMessage(quote), "Viewer's SI", supportLines);
  const capName = quote.sku === "support-3" ? "support cap" : "shopping cap";
  supportRaise.textContent = `1. Raise the ${capName} to $${dollarText(quote.totalUsd)} and continue with ${quote.name}`;
  supportLimit.classList.remove("is-settled");
  supportLimit.hidden = false;
  supportPay.hidden = true;
  setStatus("The cap is short. Press one of these buttons.");
}

async function quoteRoom3(sku, cap) {
  const response = await fetch(`/api/breads/${encodeURIComponent(sku)}?cap=${encodeURIComponent(cap)}`);
  const body = await response.json().catch(() => null);
  if (!response.ok || !body) return null;
  return body;
}

function offeredSupportAmount() {
  const cap = Number(supportCap.value);
  const safe = Number.isFinite(cap) && cap >= 1 ? cap : 1;
  return safe >= 3 ? 3 : safe;
}

function supportMoneyLabel() {
  return `1. 💸 Send $${wholeDollar(offeredSupportAmount())} support`;
}

function refreshSupportMoney() {
  const money = document.getElementById("support-money");
  if (!money || money.disabled) return;
  money.textContent = supportMoneyLabel();
}

function supportOverLine(amount, cap) {
  return `$${wholeDollar(amount)} is over your $${wholeDollar(cap)} support cap. Raise it, or pick something smaller?`;
}

function supportLowLine() {
  return "Support starts at $1. Please enter $1 or more.";
}

function supportHighLine(amount) {
  return `$${wholeDollar(amount)} is above the $10000 demo maximum. Please pick a smaller amount.`;
}

function classifySupportAmount(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return { error: "bad" };
  if (!Number.isInteger(amount)) return { error: "cents" };
  if (amount < 1) return { error: "low", dollars: amount };
  if (amount > 10000) return { error: "high", dollars: amount };
  const cap = Number(supportCap.value);
  if (amount > cap) return { error: "over", dollars: amount, cap };
  return { dollars: amount };
}

function rememberWholeDollar(input) {
  if (input.value === "" || /^\d+$/.test(input.value)) input.dataset.whole = input.value;
}

function guardWholeDollar(input) {
  rememberWholeDollar(input);
  input.addEventListener("keydown", (event) => {
    if ([".", ",", "e", "E", "+", "-"].includes(event.key)) event.preventDefault();
  });
  input.addEventListener("beforeinput", (event) => {
    if (typeof event.data === "string" && /[^0-9]/.test(event.data)) event.preventDefault();
  });
  input.addEventListener("input", () => {
    if (input.value === "" || /^\d+$/.test(input.value)) {
      input.dataset.whole = input.value;
      return;
    }
    input.value = input.dataset.whole || "";
  });
}

function paintQuickAmounts() {
  const cap = Number(supportCap.value);
  supportQuick.replaceChildren();
  SUPPORT_QUICK.forEach((amount, index) => {
    const button = document.createElement("button");
    button.className = "choice";
    button.type = "button";
    button.dataset.amount = String(amount);
    const over = amount > cap + 1e-9;
    button.textContent = over
      ? `${index + 1}. $${wholeDollar(amount)} (over your $${wholeDollar(cap)} support cap)`
      : `${index + 1}. $${wholeDollar(amount)}`;
    if (over) {
      button.disabled = true;
      button.classList.add("is-over-cap");
    }
    supportQuick.append(button);
  });
  supportQuick.hidden = false;
  supportQuick.classList.remove("is-settled");
}

function openAmountPanel() {
  supportFitsOpen = false;
  supportAmount.hidden = false;
  supportAmountPicks.hidden = false;
  supportAmountChoice.hidden = true;
  supportAmountChoice.classList.remove("is-settled");
  supportCapPanel.value = supportCap.value;
  paintQuickAmounts();
}

function showSupportAmountAsk(amount) {
  pendingSupportAmount = amount;
  supportAmount.hidden = false;
  supportAmountPicks.hidden = true;
  supportAmountChoice.hidden = false;
  supportAmountChoice.classList.remove("is-settled");
  for (const button of supportAmountChoice.querySelectorAll("button")) button.disabled = false;
  supportAmountRaise.textContent = `1. Raise my cap to $${wholeDollar(amount)} and send`;
  addChatLine(supportOverLine(amount, Number(supportCap.value)), "Viewer's SI", supportLines);
}

async function chooseSupportAmount(amount) {
  const generation = supportGeneration;
  const response = await fetch(
    `/api/breads/support-3?cap=support&amount=${encodeURIComponent(amount)}`,
  );
  const quote = await response.json().catch(() => null);
  if (generation !== supportGeneration) return;
  if (!response.ok || !quote || quote.error) {
    if (quote?.reason === "LOW") addChatLine(supportLowLine(), "Viewer's SI", supportLines);
    else if (quote?.reason === "HIGH") addChatLine(supportHighLine(amount), "Viewer's SI", supportLines);
    else if (quote?.reason === "CENTS") setStatus("Please enter a whole dollar, from $1 to $10000.", "error");
    else setStatus("Couldn't check the amount.", "error");
    if (supportAmount.hidden) unlockSupportChoices();
    return;
  }
  if (!quote.allowed) {
    showSupportAmountAsk(Number(quote.totalUsd));
    return;
  }
  settleGroup(supportChoices);
  showSupportReady(quote, "support");
}

async function showRoom3Breads(greyOverCap = false) {
  const paint = ++room3BreadPaint;
  const generation = supportGeneration;
  room3GreyOverCap = greyOverCap === true;
  const response = await fetch("/api/breads?cap=shopping");
  const body = await response.json().catch(() => null);
  if (paint !== room3BreadPaint || generation !== supportGeneration) return;
  supportBreads.replaceChildren();
  if (!response.ok || !body?.breads) {
    setStatus("Couldn't load prices from the server.", "error");
    return;
  }
  body.breads.forEach((item, index) => {
    const button = document.createElement("button");
    button.className = "choice";
    button.type = "button";
    button.dataset.pack = item.sku;
    const over = room3GreyOverCap && item.allowed !== true;
    button.textContent = over
      ? `${index + 1}. ${priceLabel(item)} ${overCapNote(item.limitUsd)}`
      : `${index + 1}. ${priceLabel(item)}`;
    if (over) {
      button.disabled = true;
      button.classList.add("is-over-cap");
    }
    supportBreads.append(button);
  });
  supportBreads.classList.remove("is-settled");
  supportBreads.hidden = false;
}

function showSupportFits() {
  if (supportChoices.classList.contains("is-settled")) return;
  supportFitsOpen = true;
  supportChoices.classList.remove("is-settled");
  for (const button of supportChoices.querySelectorAll("button")) {
    button.disabled = false;
    button.classList.remove("is-over-cap");
  }
  refreshSupportMoney();
  supportChoices.hidden = false;
  hideAmountPanel();
}

function askWho() {
  addChatLine(WHO_LINE, "Viewer's SI", supportLines);
  supportWho.hidden = false;
  supportWho.classList.remove("is-settled");
}

async function choosePack(sku) {
  const generation = supportGeneration;
  const quote = await quoteRoom3(sku, "shopping");
  if (generation !== supportGeneration) return;
  if (!quote) {
    setStatus("Couldn't check the price.", "error");
    return;
  }
  if (!quote.allowed) {
    showSupportOverLimit(quote, supportPurpose);
    return;
  }
  showSupportReady(quote, supportPurpose);
}

function markPurchased() {
  supportPurchased = true;
  supportSettled = true;
  videoHeart.disabled = true;
}

function showPayResult(pairs) {
  supportPaypal.hidden = false;
  const lines = ["PayPal response"];
  for (const [label, value] of pairs) lines.push(`${label}: ${value}`);
  supportPaypal.textContent = lines.join("\n");
}

function showRoom3Captured(orderId, captureStatus, purpose, thanks, latestLine) {
  markPurchased();
  supportPay.hidden = true;
  supportCaption.hidden = false;
  supportCaption.textContent = purpose === "friend" ? CAPTURE_CAPTION : "Captured ✅";
  if (!latestLine) {
    showPayResult([
      ["Capture", captureStatus || "COMPLETED"],
      ["Order ID", orderId || "none"],
    ]);
  }
  if (purpose === "support") addChatLine(SUPPORT_THANKS, "Lux Baker's SI", supportAfter);
  if (purpose === "forme") addChatLine(DELIVERY_LINE, "Viewer's SI", supportAfter);
  if (purpose === "friend" && thanks) {
    addChatLine(thanks, "Friend's SI · from Friend to you", supportAfter);
  }
  if (latestLine) appendPayPalStatus(supportAfter, latestLine);
  showWatchAgain();
  setStatus("PayPal's response is written below.");
}

function renderFriendChoices() {
  const choices = document.createElement("div");
  choices.className = "choices";
  const label = document.createElement("span");
  label.className = "who";
  label.textContent = "Friend";
  for (const [decision, text] of recipientChoiceOptions()) {
    const button = document.createElement("button");
    button.className = "choice";
    button.type = "button";
    button.textContent = text;
    button.addEventListener("click", () => finishFriendChoice(decision, button));
    choices.append(button);
  }
  const wrap = document.createElement("div");
  wrap.className = "avon-picks";
  wrap.append(label, choices, recipientConceptNote());
  supportAfter.append(wrap);
}

function showFriendHandoff(orderId, orderStatus, authorizationStatus) {
  supportOrderId = orderId;
  supportHoldBusy = false;
  supportPay.hidden = true;
  supportCaption.hidden = false;
  supportCaption.textContent = "Payment authorized — not captured yet";
  showPayResult([
    ["Order", orderStatus],
    ["Authorization", authorizationStatus],
    ["Order ID", orderId || "none"],
  ]);
  addChatLine(HANDOFF_LINE, "Friend's SI", supportAfter);
  renderFriendChoices();
  setStatus("A person has to press a button.");
}

async function finishFriendChoice(decision, button) {
  if (!supportOrderId || supportHoldBusy || supportPurchased) return;
  const generation = supportGeneration;
  const orderId = supportOrderId;
  const group = button.closest(".choices");
  group.classList.add("is-settled");
  for (const choice of group.querySelectorAll("button")) choice.disabled = true;
  const choiceText = button.textContent.trim();
  const accepts = decision === "bread" || decision === "credit" || decision === "pass";
  const path = accepts ? "accept" : "decline";
  supportHoldBusy = true;
  try {
    const response = await fetch(`/paypal-api/checkout/orders/${orderId}/${path}`, { method: "POST" });
    const body = await response.json().catch(() => ({}));
    if (generation !== supportGeneration) return;
    if (!response.ok) {
      supportHoldBusy = false;
      group.classList.remove("is-settled");
      for (const choice of group.querySelectorAll("button")) choice.disabled = false;
      setStatus(body.message || "PayPal could not finish that step.", "error");
      return;
    }
    supportCaption.hidden = false;
    if (path === "accept") {
      supportCaption.textContent = "Captured ✅";
      showSplitPrivacyResult({
        parent: supportAfter,
        decision,
        accepted: true,
        choiceText,
        choiceSpeaker: "Friend",
        siSpeaker: "Friend's SI",
        thanks: THANKS_SENDER,
        thanksSpeaker: "Friend's SI · from Friend to you",
        paypalText: paypalLatestLine("capture", body.captureStatus, body.orderId || orderId),
      });
      markPurchased();
      supportPay.hidden = true;
      showWatchAgain();
      setStatus("Gift accepted.");
    } else {
      supportCaption.textContent = "Authorization voided · No charge";
      showSplitPrivacyResult({
        parent: supportAfter,
        decision,
        accepted: false,
        choiceText,
        choiceSpeaker: "Friend",
        siSpeaker: "Friend's SI",
        thanks: THANKS_KEEP,
        thanksSpeaker: "Friend's SI · from Friend to you",
        paypalText: paypalLatestLine("void", body.authorizationStatus, body.orderId || orderId),
      });
      showWatchAgain();
      setStatus("Gift declined.");
    }
  } catch (error) {
    console.error(error);
    if (generation !== supportGeneration) return;
    supportHoldBusy = false;
    setStatus("PayPal could not finish that step.", "error");
  }
}

function releaseRoom3Pay(text) {
  paypalOpening = false;
  room3CheckoutFault = "";
  supportPay.hidden = false;
  supportPay.disabled = false;
  setStatus(text, "error");
}

async function finishSupportCheckout(orderId) {
  const generation = supportGeneration;
  const purpose = supportPurpose;
  try {
    const response = await fetch(`/paypal-api/checkout/orders/${orderId}/authorize`, { method: "POST" });
    const body = await response.json().catch(() => ({}));
    if (generation !== supportGeneration) return;
    if (!response.ok || !body.authorizationStatus) {
      releaseRoom3Pay(ROOM3_PROBLEM);
      return;
    }
    if (purpose === "friend") {
      paypalOpening = false;
      showRoom("3");
      showFriendHandoff(body.orderId || orderId, body.orderStatus, body.authorizationStatus);
      return;
    }
    const capture = await fetch(`/paypal-api/checkout/orders/${orderId}/accept`, { method: "POST" });
    const captured = await capture.json().catch(() => ({}));
    if (generation !== supportGeneration) return;
    paypalOpening = false;
    if (!capture.ok) {
      releaseRoom3Pay(ROOM3_PROBLEM);
      return;
    }
    showRoom("3");
    showRoom3Captured(captured.orderId || orderId, captured.captureStatus, purpose);
  } catch (error) {
    console.error(error);
    if (generation !== supportGeneration) return;
    releaseRoom3Pay(ROOM3_PROBLEM);
  }
}

async function saveRoom3Cap(kind, amount) {
  const requestId = ++room3CapRequest;
  const payload = kind === "support" ? { supportUsd: amount } : { shoppingUsd: amount };
  const response = await fetch("/api/room3-caps", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => null);
  if (requestId !== room3CapRequest) return null;
  if (!response.ok || !body) {
    setStatus("Couldn't save the cap.", "error");
    return null;
  }
  if (kind === "support") {
    savedSupportCap = Number(body.supportUsd);
    supportCap.value = savedSupportCap;
    supportCapPanel.value = savedSupportCap;
    rememberWholeDollar(supportCap);
    rememberWholeDollar(supportCapPanel);
  } else shoppingCap.value = Number(body.shoppingUsd);
  return body;
}

async function resetRoom3Caps() {
  const requestId = ++room3CapRequest;
  shoppingCap.value = 8;
  supportCap.value = 5;
  supportCapPanel.value = 5;
  rememberWholeDollar(supportCap);
  rememberWholeDollar(supportCapPanel);
  const response = await fetch("/api/room3-caps", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ shoppingUsd: 8, supportUsd: 5 }),
  });
  const body = await response.json().catch(() => null);
  if (requestId !== room3CapRequest || !response.ok || !body) return;
  shoppingCap.value = Number(body.shoppingUsd);
  savedSupportCap = Number(body.supportUsd);
  supportCap.value = savedSupportCap;
  supportCapPanel.value = savedSupportCap;
  rememberWholeDollar(supportCap);
  rememberWholeDollar(supportCapPanel);
}

function startOpening() {
  const generation = sceneGeneration;
  const pending = showJaneLine("notice_craving");
  if (!sceneIsCurrent(generation)) return;
  choicesEl.hidden = false;
  setStatus("Pick a button. Checkout has not started.");
  pending.then((suggestion) => {
    if (!sceneIsCurrent(generation) || !suggestion || limitInput.disabled) return;
    if (suggestion.action === "none") {
      choicesEl.hidden = false;
      setStatus("Pick a button. Checkout has not started.");
    }
  });
}

function restartScene() {
  sceneGeneration += 1;
  sceneEnded = false;
  room1Done = false;
  giftOffered = false;
  paypalOpening = false;
  checkoutKind = "room1";
  showRoom("1");
  handoffOrderId = null;
  handoffBusy = false;
  closeRoomTwo();
  selectedSku = "bread-4";
  pendingOverSku = "bread-4";
  window.clearTimeout(limitSaveTimer);
  thinkingCount = 0;
  siThinking.hidden = true;
  linesEl.replaceChildren();
  document.querySelector(".tap-line")?.remove();
  hideChoices();
  optionsEl.replaceChildren();
  payLog.replaceChildren();
  payLog.hidden = true;
  performanceNote.hidden = true;
  paypalResponse.hidden = true;
  paypalResponse.textContent = "";
  handoffCaption.hidden = true;
  handoffCaption.textContent = "";
  giftButton.hidden = true;
  giftButton.textContent = "Send as a gift";
  siBall.hidden = true;
  siBall.classList.remove("bounce");
  unlockLimit();
  setStatus("Pick a button. Checkout has not started.");
  startOpening();
}

restartButton.addEventListener("click", restartScene);

resetOpeningCap();
resetRoom3Caps();

showEarlier.addEventListener("click", () => {
  const open = earlierSlot.hidden;
  earlierSlot.hidden = !open;
  chatEl.classList.toggle("is-earlier-hidden", !open);
  setEarlierLabel(open);
});

document.getElementById("choice-consult").addEventListener("click", async () => {
  if (sceneEnded) return;
  const generation = sceneGeneration;
  rememberAnswer(document.getElementById("choice-consult"));
  hideChoices();
  const suggestion = await showJaneLine("consult_bread4");
  if (!sceneIsCurrent(generation) || !suggestion) return;
  if (suggestion.action === "pick_bread4") consultEl.hidden = false;
});

document.getElementById("consult-yes").addEventListener("click", async () => {
  if (sceneEnded) return;
  const generation = sceneGeneration;
  rememberAnswer(document.getElementById("consult-yes"));
  consultEl.hidden = true;
  const quote = await quoteBread("bread-4");
  if (!sceneIsCurrent(generation)) return;
  if (!quote) {
    setStatus("Couldn't check the cap.", "error");
    return;
  }
  if (!quote.allowed) {
    showListOverLimit(quote);
    return;
  }
  showCheckoutReady(quote);
});

document.getElementById("consult-options").addEventListener("click", () => {
  if (sceneEnded) return;
  rememberAnswer(document.getElementById("consult-options"));
  consultEl.hidden = true;
  setStatus("Pick another bread. The server sets the price and shipping.");
  showBreadChoices();
});

optionsEl.addEventListener("click", (event) => {
  const button = event.target.closest("[data-bread]");
  if (!button || button.disabled || sceneEnded) return;
  rememberAnswer(button);
  optionsEl.hidden = true;
  offerBread(button.dataset.bread);
});

roomTab1.addEventListener("click", () => showRoom("1"));
roomTab2.addEventListener("click", () => {
  const avonOnScreen = !roomTwo.hidden && !appEl.classList.contains("is-room-3");
  if (!avonOnScreen) return;
  statusEl.textContent = "You're here 😊";
  statusEl.className = "note";
});
roomTab3.addEventListener("click", () => {
  if (room3Started) showRoom("3");
  else openRoom3();
});

videoHeart.addEventListener("click", () => {
  if (videoHeart.disabled) return;
  showSupportOffer();
});

function settleGroup(group) {
  group.classList.add("is-settled");
  for (const button of group.querySelectorAll("button")) button.disabled = true;
}

function lockSupportChoices() {
  supportFitsOpen = false;
  settleGroup(supportChoices);
}

function unlockSupportChoices() {
  supportChoices.classList.remove("is-settled");
  for (const button of supportChoices.querySelectorAll("button")) {
    button.disabled = false;
    button.classList.remove("is-over-cap");
  }
  refreshSupportMoney();
}

document.getElementById("support-money").addEventListener("click", () => {
  if (supportSettled || supportChoices.classList.contains("is-settled")) return;
  const button = document.getElementById("support-money");
  lockSupportChoices();
  addViewerChoice(button.textContent.trim());
  chooseSupportAmount(offeredSupportAmount());
});

document.getElementById("support-custom").addEventListener("click", () => {
  if (supportSettled || supportChoices.classList.contains("is-settled")) return;
  lockSupportChoices();
  addViewerChoice("2. 💸 Choose another amount");
  openAmountPanel();
});

document.getElementById("support-bread").addEventListener("click", () => {
  if (supportSettled || supportChoices.classList.contains("is-settled")) return;
  supportFitsOpen = false;
  addViewerChoice(document.getElementById("support-bread").textContent.trim());
  settleGroup(supportChoices);
  supportChoices.hidden = true;
  hideAmountPanel();
  askWho();
});

document.getElementById("support-no").addEventListener("click", () => {
  if (supportSettled || supportChoices.classList.contains("is-settled")) return;
  supportFitsOpen = false;
  supportSettled = true;
  addViewerChoice("4. No thanks");
  settleGroup(supportChoices);
  supportChoices.hidden = true;
  hideAmountPanel();
  addChatLine(SUPPORT_PASS, "Viewer's SI", supportLines);
  showWatchAgain();
  setStatus("That's the end of this scene.");
});

document.getElementById("who-me").addEventListener("click", () => {
  if (supportSettled) return;
  supportPurpose = "forme";
  addViewerChoice("1. 🙋 For me");
  settleGroup(supportWho);
  supportWho.hidden = true;
  showRoom3Breads();
});

document.getElementById("who-friend").addEventListener("click", () => {
  if (supportSettled) return;
  supportPurpose = "friend";
  addViewerChoice("2. 💌 For a friend in my contacts");
  settleGroup(supportWho);
  supportWho.hidden = true;
  showRoom3Breads();
});

supportBreads.addEventListener("click", (event) => {
  const button = event.target.closest("[data-pack]");
  if (!button || button.disabled || supportSettled) return;
  room3GreyOverCap = false;
  room3BreadPaint += 1;
  addViewerChoice(button.textContent.trim());
  settleGroup(supportBreads);
  supportBreads.hidden = true;
  choosePack(button.dataset.pack);
});

supportRaise.addEventListener("click", async () => {
  if (supportSettled || !pendingSupport) return;
  const generation = supportGeneration;
  addViewerChoice(supportRaise.textContent.trim());
  settleGroup(supportLimit);
  const quote = await quoteRoom3(pendingSupport.sku, pendingSupport.purpose === "support" ? "support" : "shopping");
  if (generation !== supportGeneration || !quote) return;
  const saved = await saveRoom3Cap(pendingSupport.purpose === "support" ? "support" : "shopping", quote.totalUsd);
  if (generation !== supportGeneration || !saved) return;
  const again = await quoteRoom3(pendingSupport.sku, pendingSupport.purpose === "support" ? "support" : "shopping");
  if (generation !== supportGeneration || !again) return;
  if (!again.allowed) {
    showSupportOverLimit(again, pendingSupport.purpose);
    return;
  }
  showSupportReady(again, pendingSupport.purpose);
});

document.getElementById("support-within").addEventListener("click", async () => {
  if (supportSettled) return;
  const generation = supportGeneration;
  addViewerChoice("2. Pick within the cap");
  supportLimit.hidden = true;
  if (pendingSupport?.purpose === "support") await showSupportFits();
  else await showRoom3Breads(true);
  if (generation !== supportGeneration) return;
  setStatus("Pick a button. Checkout has not started.");
});

document.getElementById("watch-again").addEventListener("click", () => {
  openRoom3();
});

document.getElementById("restart-room-3").addEventListener("click", () => {
  openRoom3();
});

async function saveRoom3FromInput(kind) {
  const amount = Number(shoppingCap.value);
  if (kind !== "shopping" || !Number.isFinite(amount)) return;
  const saved = await saveRoom3Cap("shopping", amount);
  if (!saved) return;
  if (room3GreyOverCap && !supportBreads.hidden) await showRoom3Breads(true);
}

async function commitSupportCap(raw) {
  let next = Number(raw);
  if (!Number.isInteger(next)) {
    supportCap.value = savedSupportCap;
    supportCapPanel.value = savedSupportCap;
    rememberWholeDollar(supportCap);
    rememberWholeDollar(supportCapPanel);
    return null;
  }
  if (!Number.isFinite(next) || next < 1) next = 1;
  supportCap.value = next;
  supportCapPanel.value = next;
  rememberWholeDollar(supportCap);
  rememberWholeDollar(supportCapPanel);
  const saved = await saveRoom3Cap("support", next);
  if (!saved) {
    supportCap.value = savedSupportCap;
    supportCapPanel.value = savedSupportCap;
    rememberWholeDollar(supportCap);
    rememberWholeDollar(supportCapPanel);
    return null;
  }
  refreshSupportMoney();
  if (!supportAmount.hidden && !supportAmountPicks.hidden) paintQuickAmounts();
  if (supportFitsOpen && !supportChoices.hidden && !supportChoices.classList.contains("is-settled")) {
    showSupportFits();
  }
  return saved;
}

guardWholeDollar(supportCap);
guardWholeDollar(supportCapPanel);
guardWholeDollar(supportOwn);

shoppingCap.addEventListener("change", () => saveRoom3FromInput("shopping"));
supportCap.addEventListener("change", () => commitSupportCap(supportCap.value));
supportCapPanel.addEventListener("change", () => commitSupportCap(supportCapPanel.value));

supportQuick.addEventListener("click", (event) => {
  const button = event.target.closest("[data-amount]");
  if (!button || button.disabled || supportSettled) return;
  addViewerChoice(button.textContent.trim());
  chooseSupportAmount(Number(button.dataset.amount));
});

document.getElementById("support-use-amount").addEventListener("click", () => {
  if (supportSettled) return;
  const raw = supportOwn.value;
  const parsed = classifySupportAmount(raw);
  const typed = parsed.dollars != null && Number.isFinite(parsed.dollars)
    ? wholeDollar(parsed.dollars)
    : String(raw).trim();
  addViewerChoice(typed ? `Use this amount: $${typed}` : "Use this amount");
  if (parsed.error === "low") {
    addChatLine(supportLowLine(), "Viewer's SI", supportLines);
    return;
  }
  if (parsed.error === "high") {
    addChatLine(supportHighLine(parsed.dollars), "Viewer's SI", supportLines);
    return;
  }
  if (parsed.error === "over") {
    showSupportAmountAsk(parsed.dollars);
    return;
  }
  if (parsed.error) {
    setStatus("Please enter a whole dollar, from $1 to $10000.", "error");
    return;
  }
  chooseSupportAmount(parsed.dollars);
});

supportAmountRaise.addEventListener("click", async () => {
  if (supportSettled || pendingSupportAmount == null) return;
  const generation = supportGeneration;
  const amount = pendingSupportAmount;
  addViewerChoice(supportAmountRaise.textContent.trim());
  settleGroup(supportAmountChoice);
  const saved = await commitSupportCap(amount);
  if (generation !== supportGeneration) return;
  if (!saved) {
    supportAmountChoice.classList.remove("is-settled");
    for (const button of supportAmountChoice.querySelectorAll("button")) button.disabled = false;
    return;
  }
  await chooseSupportAmount(amount);
});

document.getElementById("support-amount-smaller").addEventListener("click", () => {
  if (supportSettled) return;
  addViewerChoice("2. Pick a smaller amount");
  supportAmountChoice.hidden = true;
  supportAmountPicks.hidden = false;
  pendingSupportAmount = null;
  paintQuickAmounts();
});

prepareRoom1Hero();
prepareRoom3Steam();
startOpening();

function room3Checkout() {
  return checkoutKind.startsWith("room3");
}

function beginPayPalCheckout() {
  const button = room3Checkout() ? supportPay : giftButton;
  const blocked = "The browser blocked the new PayPal window. Press Send with PayPal to open it.";
  const room1PayLabel = giftButton.textContent.trim() === "Send with PayPal" ? "Send with PayPal" : "Send as a gift";
  const notReady = room3Checkout()
    ? "The PayPal window isn't ready yet. Please press Send with PayPal."
    : `The PayPal window isn't ready yet. Please press ${room1PayLabel}.`;
  if (paypalOpening) return;
  if (!paypalSession) {
    if (room3Checkout()) {
      supportPay.hidden = false;
      supportPay.disabled = false;
    } else {
      revealGiftButton();
      giftButton.disabled = false;
    }
    setStatus(notReady, "error");
    return;
  }
  paypalOpening = true;
  room3CheckoutFault = "";
  button.disabled = true;
  setStatus("Opening PayPal in a new window…");
  paypalSession.start({ presentationMode: "popup" }, createOrder()).catch((error) => {
    console.error(error);
    paypalOpening = false;
    button.disabled = false;
    if (error?.code === "LIMIT_EXCEEDED") {
      if (room3Checkout()) {
        supportPay.hidden = false;
        supportPay.disabled = false;
        setStatus(ROOM3_OVER_CAP, "error");
      } else showRoom1Retry(ROOM3_OVER_CAP, "error");
    } else if (error?.code === "ERR_DEV_UNABLE_TO_OPEN_POPUP") {
      if (room3Checkout()) {
        supportPay.hidden = false;
        button.disabled = false;
        setStatus(blocked, "error");
      } else showRoom1Retry(ROOM3_PROBLEM, "error");
    } else if (room3Checkout()) {
      supportPay.hidden = false;
      supportPay.disabled = false;
      setStatus(ROOM3_PROBLEM, "error");
    } else {
      showRoom1Retry(ROOM3_PROBLEM, "error");
    }
  });
}

async function onPayPalWebSdkLoaded() {
  try {
    const clientToken = await getBrowserSafeClientToken();
    const sdkInstance = await window.paypal.createInstance({
      clientToken,
      components: ["paypal-payments"],
      pageType: "checkout",
    });

    const eligible = await sdkInstance.findEligibleMethods({
      currencyCode: "USD",
      amount: "16.00",
    });

    if (!eligible.isEligible("paypal")) {
      setStatus("PayPal checkout is not available in this browser.", "error");
      return;
    }

    const session = sdkInstance.createPayPalOneTimePaymentSession({
      onApprove: async (data) => {
        if (room3Checkout()) {
          await finishSupportCheckout(data.orderId);
          return;
        }
        paypalOpening = false;
        const generation = sceneGeneration;
        const response = await fetch(
          `/paypal-api/checkout/orders/${data.orderId}/authorize`,
          { method: "POST" }
        );
        const body = await response.json().catch(() => ({}));
        if (!sceneIsCurrent(generation)) return;
        if (response.ok && body.authorizationStatus) {
          giftButton.hidden = true;
          showAvonHandoff(body.orderId || data.orderId, body.orderStatus, body.authorizationStatus);
          return;
        }
        showRoom1Retry(ROOM3_PROBLEM, "error");
      },
      onCancel: () => {
        paypalOpening = false;
        room3CheckoutFault = "";
        if (room3Checkout()) {
          supportPay.hidden = false;
          supportPay.disabled = false;
          setStatus(ROOM3_CLOSED, "");
          return;
        }
        showRoom1Retry(ROOM3_CLOSED);
      },
      onError: (error) => {
        paypalOpening = false;
        console.error(error.code, error.message);
        if (room3CheckoutFault === "cap") {
          room3CheckoutFault = "";
          if (room3Checkout()) {
            supportPay.hidden = false;
            supportPay.disabled = false;
            setStatus(ROOM3_OVER_CAP, "error");
          } else showRoom1Retry(ROOM3_OVER_CAP, "error");
          return;
        }
        if (room3Checkout()) {
          supportPay.hidden = false;
          supportPay.disabled = false;
          setStatus(ROOM3_PROBLEM, "error");
          return;
        }
        showRoom1Retry(ROOM3_PROBLEM, "error");
      },
    });

    paypalSession = session;
    paypalReady = true;
    if (giftOffered && !paypalOpening) giftButton.disabled = false;
    if (!supportPay.hidden && !paypalOpening) {
      supportPay.disabled = false;
      if (statusEl.textContent === "The PayPal window isn't ready yet. Please press Send with PayPal.") {
        setStatus("Press Send with PayPal when you're ready.");
      }
    }

    giftButton.addEventListener("click", () => {
      if (paypalOpening) return;
      checkoutKind = "room1";
      if (giftButton.textContent.trim() === "Send with PayPal") addPersonLine("Send with PayPal");
      beginPayPalCheckout();
    });
    supportPay.addEventListener("click", () => {
      if (paypalOpening) return;
      supportPurpose = supportPurpose === "friend" || supportPurpose === "forme" ? supportPurpose : "support";
      checkoutKind = room3CheckoutKind(supportPurpose);
      addViewerChoice("Send with PayPal");
      beginPayPalCheckout();
    });
  } catch (error) {
    console.error(error);
    setStatus(error.message || "Payments unavailable.", "error");
  }
}
