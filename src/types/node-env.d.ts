declare namespace NodeJS {
  export interface ProcessEnv {
    KC_CLIENT_ID: string
    KC_CLIENT_SECRET: string
    KC_ISSUER: string,
    KC_REDIRECT_URI: string,
    NEXTAUTH_URL: string,
    NEXT_PUBLIC_API_TOKEN: string,
  }
}