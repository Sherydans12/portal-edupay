import {
  Environment,
  IntegrationApiKeys,
  IntegrationCommerceCodes,
  Options,
  WebpayPlus,
} from "transbank-sdk";

const webpayEnvironment = (
  process.env.WEBPAY_ENVIRONMENT ??
  process.env.WEBPAY_ENV ??
  ""
)
  .trim()
  .toUpperCase();

const isProduction = webpayEnvironment === "PRODUCTION";

function getProductionCredentials() {
  const commerceCode = process.env.WEBPAY_COMMERCE_CODE?.trim();
  const apiKey = process.env.WEBPAY_API_KEY?.trim();

  if (!commerceCode || !apiKey) {
    throw new Error(
      "WEBPAY_COMMERCE_CODE y WEBPAY_API_KEY son obligatorias cuando WEBPAY_ENVIRONMENT es PRODUCTION",
    );
  }

  return { commerceCode, apiKey };
}

const options = isProduction
  ? (() => {
      const { commerceCode, apiKey } = getProductionCredentials();
      return new Options(commerceCode, apiKey, Environment.Production);
    })()
  : new Options(
      IntegrationCommerceCodes.WEBPAY_PLUS,
      IntegrationApiKeys.WEBPAY,
      Environment.Integration,
    );

const tx = new WebpayPlus.Transaction(
  options,
);

export { tx as webpayTransaction };
