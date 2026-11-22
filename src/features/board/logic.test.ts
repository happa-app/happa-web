import { test } from "node:test";
import assert from "node:assert/strict";
import {
  formatBizum,
  formatIban,
  isValidBizum,
  isValidIban,
  maskIban,
  normalizeBizum,
  normalizeIban,
  wifiQrText,
} from "./logic.ts";

test("texto del QR del WiFi", () => {
  assert.equal(wifiQrText({ ssid: "Casa", password: "clave1234", security: "wpa" }), "WIFI:T:WPA;S:Casa;P:clave1234;;");
  assert.equal(wifiQrText({ ssid: "Vieja", password: "12345", security: "wep" }), 'WIFI:T:WEP;S:Vieja;P:"12345";;');
});

test("el QR escapa los caracteres especiales de la red y la contraseña", () => {
  assert.equal(
    wifiQrText({ ssid: 'Casa "Ana"; 2', password: "a:b,c\\d", security: "wpa" }),
    'WIFI:T:WPA;S:Casa \\"Ana\\"\\; 2;P:a\\:b\\,c\\\\d;;',
  );
});

test("una red o contraseña que parece hexadecimal va entre comillas (si no, Android la lee como hex)", () => {
  assert.equal(
    wifiQrText({ ssid: "12345678", password: "deadbeef01", security: "wpa" }),
    'WIFI:T:WPA;S:"12345678";P:"deadbeef01";;',
  );
  assert.equal(wifiQrText({ ssid: "Casa", password: "clave1234", security: "wpa" }), "WIFI:T:WPA;S:Casa;P:clave1234;;");
});

test("red sin contraseña", () => {
  assert.equal(wifiQrText({ ssid: "Bar", password: "", security: "nopass" }), "WIFI:T:nopass;S:Bar;;");
});

test("IBAN: se normaliza, se comprueba y se enseña", () => {
  assert.equal(normalizeIban(" es91 2100 0418 4502 0005 1332 "), "ES9121000418450200051332");
  assert.equal(isValidIban("ES9121000418450200051332"), true);
  assert.equal(isValidIban("ES9121000418450200051333"), false);
  assert.equal(isValidIban("ES91"), false);
  assert.equal(maskIban("ES9121000418450200051332"), "ES91 …1332");
  assert.equal(formatIban("ES9121000418450200051332"), "ES91 2100 0418 4502 0005 1332");
});

test("Bizum: se normaliza, se comprueba y se enseña", () => {
  assert.equal(normalizeBizum("+34 600 12 34 56"), "600123456");
  assert.equal(normalizeBizum("0034600123456"), "600123456");
  assert.equal(normalizeBizum("600-123-456"), "600123456");
  assert.equal(isValidBizum("600123456"), true);
  assert.equal(isValidBizum("712345678"), true);
  assert.equal(isValidBizum("912345678"), false);
  assert.equal(isValidBizum("60012345"), false);
  assert.equal(formatBizum("600123456"), "600 123 456");
});
