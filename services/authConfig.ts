import { PublicClientApplication, Configuration, LogLevel } from "@azure/msal-browser";

// MSAL configuration
const msalConfig: Configuration = {
    auth: {
        // This is your application's Client ID from your Azure AD App Registration.
        clientId: "60a7f607-9f9a-4f2b-bc47-29762ef062a7", 
        // IMPORTANT: Replace 'YOUR_TENANT_ID_HERE' with your actual Azure Directory (tenant) ID.
        // This configures the app for a single tenant, matching your App Registration.
        authority: "https://login.microsoftonline.com/58957fba-de10-48ca-a6c9-e5cfea334ca9",
        // The redirect URI must match one of the URIs configured in your App Registration.
        redirectUri: "/",
    },
    cache: {
        cacheLocation: "sessionStorage", // This is more secure than localStorage
        storeAuthStateInCookie: false,
    },
    system: {
        loggerOptions: {
            loggerCallback: (level, message, containsPii) => {
                if (containsPii) {
                    return;
                }
                switch (level) {
                    case LogLevel.Error:
                        console.error(message);
                        return;
                    case LogLevel.Info:
                        // console.info(message);
                        return;
                    case LogLevel.Verbose:
                        // console.debug(message);
                        return;
                    case LogLevel.Warning:
                        console.warn(message);
                        return;
                }
            }
        }
    }
};

// Scopes required for the application
export const loginRequest = {
    scopes: ["User.Read"] // Basic scope to read user's profile
};

// Initialize the MSAL instance
export const msalInstance = new PublicClientApplication(msalConfig);