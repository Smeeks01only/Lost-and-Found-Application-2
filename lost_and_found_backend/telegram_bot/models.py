from django.db import models


class TelegramSession(models.Model):
    """Persisted state for a Telegram demo conversation."""

    class StateChoices(models.TextChoices):
        START = "START", "Start"
        ASK_PHONE = "ASK_PHONE", "Ask Phone"
        ASK_EMAIL = "ASK_EMAIL", "Ask Email"
        ASK_PASSWORD = "ASK_PASSWORD", "Ask Password"
        ASK_TITLE = "ASK_TITLE", "Ask Title"
        ASK_DESCRIPTION = "ASK_DESCRIPTION", "Ask Description"
        ASK_CATEGORY = "ASK_CATEGORY", "Ask Category"
        ASK_LOCATION = "ASK_LOCATION", "Ask Location"
        ASK_DATE = "ASK_DATE", "Ask Date"
        CONFIRM = "CONFIRM", "Confirm"

    chat_id = models.BigIntegerField(unique=True)
    state = models.CharField(
        max_length=30,
        choices=StateChoices.choices,
        default=StateChoices.START,
    )
    data = models.JSONField(default=dict, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def reset(self):
        self.state = self.StateChoices.START
        self.data = {}
        self.save(update_fields=["state", "data", "updated_at"])
