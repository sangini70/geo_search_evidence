import { createHmac } from "node:crypto";

export function createNaverSignature(timestamp, method, uri, secretKey) {
  const message = `${timestamp}.${method}.${uri}`;
  return createHmac("sha256", secretKey).update(message, "utf8").digest("base64");
}

export function createNaverHeaders({ timestamp, method, uri, accessLicense, customerId, secretKey }) {
  return {
    "Content-Type": "application/json; charset=UTF-8",
    "X-Timestamp": timestamp,
    "X-API-KEY": accessLicense,
    "X-Customer": String(customerId),
    "X-Signature": createNaverSignature(timestamp, method, uri, secretKey),
  };
}
