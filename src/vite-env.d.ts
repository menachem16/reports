/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_SHEETS_SPREADSHEET_ID: string
  readonly VITE_GOOGLE_SHEETS_WEB_APP_URL: string
  readonly VITE_GOOGLE_SHEETS_API_KEY: string
  readonly VITE_GOOGLE_SHEETS_SHEET_NAME: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
