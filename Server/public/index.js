require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors'); // 🔹 importieren
const mqtt = require('mqtt');

const app = express();

// 🔹 Middleware
app.use(bodyParser.json());
app.use(cors()); // 🔹 CORS aktivieren

// 🔹 MQTT Verbindung
const MQTT_URL = process.env.MQTT_URL || 'mqtt://localhost:1883';
const client = mqtt.connect(MQTT_URL);

client.on('connect', () => console.log("✅ MQTT connected"));

// 🔹 Test GET-Endpunkt
app.get('/', (req, res) => {
  res.send("Backend läuft!");
});

// 🔹 REST-Endpoint für Bestellung
app.post('/order/complete', (req, res) => {
  console.log("📌 POST /order/complete aufgerufen");
  console.log("Body:", req.body);

  const { orderId, lockerId, products } = req.body;

  const message = JSON.stringify({
    cmd: "open",
    orderId,
    products, // ← mehrere Produkte mit Menge
    ts: Date.now()
  });

  const topic = `locker/${lockerId}/commands`;

  if (client && client.connected) {
    client.publish(topic, message, { qos: 1 });
    console.log(`📡 MQTT Nachricht gesendet: ${message}`);
  } else {
    console.error("❌ MQTT nicht verbunden!");
  }

  res.json({ status: "ok", orderId, lockerId, products });
});

// 🔹 Server starten
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server läuft auf http://localhost:${PORT}`));
