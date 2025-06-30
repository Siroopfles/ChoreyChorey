
import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:3000",
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
  env: {
    TEST_USER_EMAIL: 'user@test.com',
    TEST_USER_PASSWORD: 'password'
  }
});
