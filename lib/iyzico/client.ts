import "server-only";
import Iyzipay from "iyzipay";

// Proxy kullanılıyor: new Iyzipay() build-time'da DEĞİL, ilk request anında çalışır.
// Turbopack modülü build sırasında değerlendirir; module-level instantiation build'i kırar.

let _client: Iyzipay | null = null;

function getClient(): Iyzipay {
  if (!_client) {
    if (
      !process.env.IYZICO_API_KEY ||
      !process.env.IYZICO_SECRET_KEY ||
      !process.env.IYZICO_BASE_URL
    ) {
      throw new Error(
        "iyzico ortam değişkenleri eksik: IYZICO_API_KEY, IYZICO_SECRET_KEY, IYZICO_BASE_URL",
      );
    }
    _client = new Iyzipay({
      apiKey:    process.env.IYZICO_API_KEY,
      secretKey: process.env.IYZICO_SECRET_KEY,
      uri:       process.env.IYZICO_BASE_URL,
    });
  }
  return _client;
}

const iyzipay = new Proxy({} as Iyzipay, {
  get(_target, prop: string | symbol) {
    const client = getClient();
    return (client as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export default iyzipay;
