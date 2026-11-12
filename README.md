# Lux Bakery Gift

SI = Super Intelligence, our word for the AI friend who helps decide.

Gift what you see in chat, without sharing addresses. People decide; SI friends and PayPal handle the rest.

## What it does

Jane is on a video chat, eating bread. Friend Avon sees it, Avon's eyes sparkling, and sounds hungry: “Is it moist? Is it sweet? Crispy outside, soft inside? That looks so good...” Jane's SI asks Jane whether to send Avon a surprise bread gift. The person answers with one of four buttons:

1. No.
2. Show the bread choices and prices.
3. Yes, continue within the cap the person set (default maximum $8).
4. Yes, check with me once more just before payment.

The person’s answer appears in a bubble on the left. Replies from Jane's SI appear on the right, so the order of the conversation stays clear. An address is never sent to SI. The person approves in the PayPal sandbox (test) window. That step only authorizes the payment. Money is not captured yet. The screen then opens a second room, Jane's SI 🤝 Avon's SI. Avon presses **Accept gift** to capture, or **No thanks**. The first No thanks does not void. Avon's SI asks once more. Avon can still accept, give the gift to someone Avon loves (which also captures), or say no again, which voids the hold. None of those buttons press themselves.

## Demo catalog

Prices and shipping come from the server. The client cannot set them.

| Pack | Bread | Shipping | Total |
| --- | --- | --- | --- |
| Solo Bun | $3 | $2 | $5 |
| Twin Buns | $5 | $2 | $7 |
| Four-Pack | $8 | free | $8 |
| Party Eight (eight popular breads) | $16 | free | $16 |

## Spending cap

The cap starts at a maximum of $8, including after a refresh or a server restart. A cap changed on screen lasts for that visit only. The server checks it again before creating a PayPal order and ignores any price the browser sends. The field is open on the first screen. After the person presses a choice, it locks until they press **Back to the start to change the cap**.

If the Four-Pack ($8, free shipping) fits, Jane's SI recommends it and a short log appears. A small glowing ball then flies from the chat to **Send as a gift**, bounces once, and disappears. PayPal sandbox opens in a new browser window, and a person confirms there. See Honest limits.

If the Four-Pack is over the cap, Jane's SI says so before any purchase and offers two buttons: raise the cap to the server total and continue with the Four-Pack, or list only the packs that fit. Nothing is bought unless the person presses one of those buttons.

## Try it (For Judges)

Open <HOSTED_DEMO_URL>.

Test credentials are in the Devpost testing instructions.

Follow the scene in order. On the first screen, Jane's SI asks about a surprise gift and the four choices appear. The corner badge reads **SI: offline script** when the app is using its script, or **SI: live** when a Gemini reply arrived in time and passed the checks.

Lower the cap on the first screen, before you choose, if you want to see the over-cap path. Choice 3 then offers to raise the cap or to pick inside it, using the server’s prices. After you choose, the cap field stays locked until you press **Back to the start to change the cap**.

What the app already handles:

- **Over the cap.** The server does not call PayPal. Choice 3 shows the raise-or-pick question. Choosing a listed pack that no longer fits tells the person the cap was exceeded and does not start checkout.
- **Checkout closed.** If the PayPal sandbox (test) window is closed before confirmation, the status says the checkout was closed and the gift was not sent. There is no authorization and no capture.
- **Held, then Avon's choice.** After PayPal authorizes, room 2 opens and the caption says the payment is not captured yet. Accept, or giving the gift to someone else, captures it. A second No thanks voids it, and no charge is taken. The demo address stays on the server. After a capture it is written only to the bakery log. It is never shown on screen and never sent to SI.
- **SI unavailable.** With no `GEMINI_API_KEY`, or if the model times out after 3 seconds, returns an error, or returns text the server rejects, the scripted line stays and the badge stays **SI: offline script**. The app continues through the same buttons. There is no second model. With a key, a reply that arrives within 3 seconds and matches the scene can replace the script and switch the badge to **SI: live**.

## Honest limits

This sandbox app cannot charge a saved payment method. The glowing ball does not finish a payment. It only opens the PayPal sandbox (test) window, and a person must confirm there. The screen says this is a visual demo, that a saved card is blocked, and that this step is shown as pre-approved because it is within the cap. A note appears only after PayPal responds, with PayPal’s status and order id. Authorize is not the same as capture. The caption says which one happened. The free Gemini tier can be slow; when it is, Jane's SI switches to a prepared script and says so.

## Privacy and safety

SI receives the scene only: who is speaking, and what just happened. It does not receive an address, email, phone number, card, or payment details. SI suggests. The person sets the cap and presses the button that starts checkout. PayPal sandbox holds the payment, and Avon presses a button before any capture or void. The demo address is never shown and never sent to SI.

## Run locally

Prerequisites: Node.js.

```bash
npm install
cp .env.example .env
npm start
```

Open http://localhost:3000.

Use the Client ID and Secret from your own PayPal Sandbox app. Copy `.env.example` to `.env` and fill in:

- `PAYPAL_CLIENT_ID` — sandbox app client id
- `PAYPAL_CLIENT_SECRET` — sandbox app secret, server only
- `PAYPAL_ENVIRONMENT` — `sandbox`
- `PORT` — `3000` unless you choose another port
- `GEMINI_API_KEY` — optional; leave it empty to stay on **SI: offline script**
- `AI_MODEL` — optional; the default model is `gemini-3.5-flash-lite`

## Built with

Node.js and Express, PayPal JS SDK v6 (sandbox Orders), the Google Gemini API, and Cursor.

License: MIT.
