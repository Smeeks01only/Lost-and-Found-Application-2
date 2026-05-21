import httpx
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = "Set Telegram webhook URL for the configured bot token."

    def add_arguments(self, parser):
        parser.add_argument(
            "webhook_url",
            type=str,
            help="Public HTTPS URL for Telegram updates, e.g. https://<ngrok>/api/v1/telegram/webhook/",
        )

    def handle(self, *args, **options):
        token = getattr(settings, "TELEGRAM_BOT_TOKEN", "")
        if not token:
            raise CommandError("TELEGRAM_BOT_TOKEN is not set.")

        webhook_url = options["webhook_url"].strip()
        if not webhook_url.startswith("https://"):
            raise CommandError("Telegram requires an https:// webhook_url")

        # Django endpoints in this repo use trailing slashes; Telegram will POST exactly
        # the URL you set, and Django can't APPEND_SLASH-redirect a POST while
        # preserving the request body.
        if webhook_url and not webhook_url.endswith("/") and ("?" not in webhook_url) and ("#" not in webhook_url):
            webhook_url += "/"

        api_url = f"https://api.telegram.org/bot{token}/setWebhook"
        payload = {"url": webhook_url}

        secret_token = getattr(settings, "TELEGRAM_WEBHOOK_SECRET_TOKEN", "")
        if secret_token:
            payload["secret_token"] = secret_token

        try:
            with httpx.Client(timeout=10.0) as client:
                resp = client.post(api_url, json=payload)
        except Exception as exc:
            raise CommandError(f"Failed calling Telegram setWebhook: {exc}")

        if resp.status_code >= 400:
            raise CommandError(f"Telegram setWebhook failed: {resp.status_code} {resp.text}")

        data = resp.json()
        if not data.get("ok"):
            raise CommandError(f"Telegram setWebhook returned ok=false: {data}")

        self.stdout.write(self.style.SUCCESS("Webhook set successfully."))
        self.stdout.write(str(data))
