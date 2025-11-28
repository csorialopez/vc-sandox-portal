import Keycloak from "keycloak-js";

//config para flujo estándar OIDC (Authorization Code + PKCE)
const keycloak = new Keycloak({
  url: "https://kc-desa.interfase.uy/", // raíz de tu servidor Keycloak
  realm: "verifiable-credential-portal",
  clientId: "miapp-web", // el ID del cliente que creaste en Keycloak
});

export default keycloak;
