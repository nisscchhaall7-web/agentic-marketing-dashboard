import sys
import argparse
from google_auth_oauthlib.flow import InstalledAppFlow

# The Google Ads API OAuth 2.0 scope
SCOPES = ["https://www.googleapis.com/auth/adwords"]

def main(client_id, client_secret):
    """Generates a refresh token for the Google Ads API."""
    flow = InstalledAppFlow.from_client_config(
        {
            "installed": {
                "client_id": client_id,
                "client_secret": client_secret,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        },
        scopes=SCOPES,
    )

    # Run the flow using a local server if running locally,
    # or fallback to console-based auth if needed.
    credentials = flow.run_local_server(
        host="localhost",
        port=8080,
        authorization_prompt_message="Please visit this URL to authorize this application: {url}",
        success_message="The authorization flow was completed. You may close this window.",
        open_browser=True,
    )

    print("\nAuthorization successful! Copy the values below into your .env file:")
    print("=" * 60)
    print(f"GOOGLE_CLIENT_ID={client_id}")
    print(f"GOOGLE_CLIENT_SECRET={client_secret}")
    print(f"GOOGLE_REFRESH_TOKEN={credentials.refresh_token}")
    print("=" * 60)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate Google Ads API Refresh Token.")
    parser.add_argument("--client_id", required=True, help="Your OAuth 2.0 Client ID")
    parser.add_argument("--client_secret", required=True, help="Your OAuth 2.0 Client Secret")
    args = parser.parse_args()

    main(args.client_id, args.client_secret)
