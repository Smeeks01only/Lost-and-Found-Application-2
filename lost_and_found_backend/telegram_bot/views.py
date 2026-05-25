import datetime
import json
import logging
import re

import httpx
from django.conf import settings
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt

from accounts.models import User
from items.models import LostItem, ItemCategory

from .models import TelegramSession


EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
logger = logging.getLogger(__name__)


def _normalize_phone(value: str) -> str:
    raw = (value or "").strip()
    raw = re.sub(r"\s+", "", raw)
    if not raw:
        return ""
    if raw.startswith("+"):
        digits = re.sub(r"\D", "", raw)
        return "+" + digits if digits else ""
    return re.sub(r"\D", "", raw)


def _phone_candidates(value: str) -> list[str]:
    normalized = _normalize_phone(value)
    if not normalized:
        return []
    digits = re.sub(r"\D", "", normalized)
    candidates = {normalized, digits}
    if digits:
        candidates.add("+" + digits)
    return [c for c in candidates if c]


def _get_user_by_phone(phone_number: str) -> User | None:
    candidates = _phone_candidates(phone_number)
    if not candidates:
        return None
    return User.objects.filter(phone_number__in=candidates).first()


def _authenticate_user(email: str, password: str) -> User | None:
    if not email or not password:
        return None
    user = User.objects.filter(email__iexact=email.strip()).first()
    if not user or not user.is_active or not user.has_usable_password():
        return None
    if not user.check_password(password):
        return None
    return user


def _normalize_text(text: str) -> str:
    return (text or "").strip()


def _start_message() -> str:
    return (
        "Welcome to Lost & Found bot.\n"
        "Commands:\n"
        "/report - log a lost item\n"
        "/restart - start over\n"
        "/cancel - stop\n"
        "/help - show this menu"
    )


def _category_help_text() -> str:
    labels = [choice[1] for choice in ItemCategory.choices]
    numbered = "\n".join([f"{i+1}) {label}" for i, label in enumerate(labels)])
    return "Choose category (reply with the number or name):\n" + numbered


def _parse_category(value: str):
    if not value:
        return None
    raw_in = value.strip()
    if raw_in.isdigit():
        idx = int(raw_in)
        if 1 <= idx <= len(ItemCategory.choices):
            return ItemCategory.choices[idx - 1][0]

    raw = raw_in.upper()
    for key, label in ItemCategory.choices:
        if raw == key or raw == label.upper():
            return key

    normalized = re.sub(r"[^A-Z]", "", raw)
    for key, label in ItemCategory.choices:
        if normalized == re.sub(r"[^A-Z]", "", label.upper()):
            return key

    synonyms = {
        "BACKPACK": ItemCategory.BAG,
        "BAG": ItemCategory.BAG,
        "PHONE": ItemCategory.PHONE,
        "MOBILE": ItemCategory.PHONE,
        "WALLET": ItemCategory.WALLET,
        "PURSE": ItemCategory.WALLET,
        "KEY": ItemCategory.KEYS,
        "KEYS": ItemCategory.KEYS,
        "LAPTOP": ItemCategory.LAPTOP,
        "COMPUTER": ItemCategory.LAPTOP,
        "CLOTHES": ItemCategory.CLOTHING,
        "CLOTHING": ItemCategory.CLOTHING,
        "JEWELRY": ItemCategory.JEWELRY,
        "DOCUMENT": ItemCategory.DOCUMENTS,
        "DOCUMENTS": ItemCategory.DOCUMENTS,
        "ELECTRONICS": ItemCategory.ELECTRONICS,
        "GLASSES": ItemCategory.GLASSES,
        "HEADPHONES": ItemCategory.HEADPHONES,
        "EARBUDS": ItemCategory.HEADPHONES,
        "UMBRELLA": ItemCategory.UMBRELLA,
        "BOOK": ItemCategory.BOOKS,
        "BOOKS": ItemCategory.BOOKS,
        "SPORT": ItemCategory.SPORTS,
        "SPORTS": ItemCategory.SPORTS,
    }
    return synonyms.get(raw) or synonyms.get(normalized)


def _parse_date(value: str):
    if not value:
        return None
    raw = value.strip().lower()
    if raw in {"today", "now"}:
        return datetime.date.today()
    try:
        return datetime.datetime.strptime(raw, "%Y-%m-%d").date()
    except ValueError:
        return None


def _get_or_create_session(chat_id: int) -> TelegramSession:
    session, _ = TelegramSession.objects.get_or_create(chat_id=chat_id)
    return session


def _summary_text(data: dict) -> str:
    return (
        "Confirm details:\n"
        f"Title: {data.get('title')}\n"
        f"Description: {data.get('description')}\n"
        f"Category: {data.get('category')}\n"
        f"Location: {data.get('location')}\n"
        f"Date lost: {data.get('date_lost')}\n\n"
        "Reply 'confirm' to submit or '/restart' to start over."
    )


def _send_message(chat_id: int, text: str) -> bool:
    token = getattr(settings, "TELEGRAM_BOT_TOKEN", "")
    if not token:
        logger.warning("TELEGRAM_BOT_TOKEN not set; skipping sendMessage")
        return False

    url = f"https://api.telegram.org/bot{token}/sendMessage"
    payload = {"chat_id": chat_id, "text": text}
    try:
        with httpx.Client(timeout=4.0) as client:
            resp = client.post(url, json=payload)
            if resp.status_code >= 400:
                logger.error("Telegram sendMessage failed: %s %s", resp.status_code, resp.text)
                return False
            return True
    except Exception:
        logger.exception("Telegram sendMessage exception")
        return False


def _validate_secret(request) -> bool:
    if not getattr(settings, "TELEGRAM_VALIDATE_SECRET", False):
        return True
    expected = getattr(settings, "TELEGRAM_WEBHOOK_SECRET_TOKEN", "")
    if not expected:
        return False
    provided = request.headers.get("X-Telegram-Bot-Api-Secret-Token", "")
    return provided == expected


@csrf_exempt
def webhook(request):
    if request.method != "POST":
        return HttpResponse(status=405)

    if not _validate_secret(request):
        return HttpResponse(status=403)

    try:
        update = json.loads(request.body.decode("utf-8") or "{}")
    except Exception:
        logger.warning("Telegram webhook: invalid JSON")
        return JsonResponse({"ok": True, "ignored": True})

    message = update.get("message") or update.get("edited_message")
    if not message:
        return JsonResponse({"ok": True, "ignored": True})

    chat = message.get("chat") or {}
    chat_id = chat.get("id")
    if chat_id is None:
        return JsonResponse({"ok": True, "ignored": True})

    text = _normalize_text(message.get("text") or "")

    session = _get_or_create_session(int(chat_id))
    safe_text = "***" if session.state == TelegramSession.StateChoices.ASK_PASSWORD else text
    logger.info("Telegram webhook received: chat_id=%s text=%r", chat_id, safe_text)

    # Global commands
    lower = text.lower()
    if lower in {"/start", "/help", "help"}:
        reply = _start_message()
        _send_message(int(chat_id), reply)
        return JsonResponse({"ok": True, "reply": reply})

    if lower in {"/cancel", "cancel", "stop"}:
        session.reset()
        reply = "Canceled. Send /report to start again."
        _send_message(int(chat_id), reply)
        return JsonResponse({"ok": True, "reply": reply})

    if lower in {"/restart", "restart", "start over"}:
        session.reset()
        reply = _start_message()
        _send_message(int(chat_id), reply)
        return JsonResponse({"ok": True, "reply": reply})

    if lower in {"/report", "report", "lost", "report lost"} and session.state != TelegramSession.StateChoices.START:
        session.reset()

    if session.state == TelegramSession.StateChoices.START:
        if lower not in {"/report", "report", "lost", "report lost"}:
            reply = _start_message()
            _send_message(int(chat_id), reply)
            return JsonResponse({"ok": True, "reply": reply})

        # Start report flow: verify identity first
        session.state = TelegramSession.StateChoices.ASK_PHONE
        session.save(update_fields=["state", "updated_at"])
        reply = (
            "To verify your account, reply with your phone number (e.g. +263771234567).\n"
            "If you don't have a phone number, type 'email' to sign in with email + password."
        )
        _send_message(int(chat_id), reply)
        return JsonResponse({"ok": True, "reply": reply})

    if session.state == TelegramSession.StateChoices.ASK_PHONE:
        if lower in {"email", "e-mail"}:
            session.state = TelegramSession.StateChoices.ASK_EMAIL
            session.save(update_fields=["state", "updated_at"])
            reply = "Please enter your email to sign in."
            _send_message(int(chat_id), reply)
            return JsonResponse({"ok": True, "reply": reply})

        user = _get_user_by_phone(text)
        if user:
            session.data = {"user_id": str(user.id)}
            session.state = TelegramSession.StateChoices.ASK_TITLE
            session.save(update_fields=["state", "data", "updated_at"])
            reply = "Verified. What is the item title?"
            _send_message(int(chat_id), reply)
            return JsonResponse({"ok": True, "reply": reply})

        session.state = TelegramSession.StateChoices.ASK_EMAIL
        session.save(update_fields=["state", "updated_at"])
        reply = "Phone not found. Please enter your email to sign in."
        _send_message(int(chat_id), reply)
        return JsonResponse({"ok": True, "reply": reply})

    if session.state == TelegramSession.StateChoices.ASK_EMAIL:
        if not EMAIL_RE.match(text):
            reply = "That email looks invalid. Please enter a valid email."
            _send_message(int(chat_id), reply)
            return JsonResponse({"ok": True, "reply": reply})
        session.data = {"pending_email": text.strip()}
        session.state = TelegramSession.StateChoices.ASK_PASSWORD
        session.save(update_fields=["state", "data", "updated_at"])
        reply = "Please enter your password."
        _send_message(int(chat_id), reply)
        return JsonResponse({"ok": True, "reply": reply})

    if session.state == TelegramSession.StateChoices.ASK_PASSWORD:
        pending_email = (session.data or {}).get("pending_email")
        user = _authenticate_user(pending_email or "", text)
        if not user:
            session.data = {}
            session.state = TelegramSession.StateChoices.ASK_EMAIL
            session.save(update_fields=["state", "data", "updated_at"])
            reply = "Invalid credentials. Please enter your email again, or send /restart."
            _send_message(int(chat_id), reply)
            return JsonResponse({"ok": True, "reply": reply})

        session.data = {"user_id": str(user.id)}
        session.state = TelegramSession.StateChoices.ASK_TITLE
        session.save(update_fields=["state", "data", "updated_at"])
        reply = "Signed in. What is the item title?"
        _send_message(int(chat_id), reply)
        return JsonResponse({"ok": True, "reply": reply})

    if session.state == TelegramSession.StateChoices.ASK_TITLE:
        session.data["title"] = text
        session.state = TelegramSession.StateChoices.ASK_DESCRIPTION
        session.save(update_fields=["state", "data", "updated_at"])
        reply = "Provide a short description of the item."
        _send_message(int(chat_id), reply)
        return JsonResponse({"ok": True, "reply": reply})

    if session.state == TelegramSession.StateChoices.ASK_DESCRIPTION:
        session.data["description"] = text
        session.state = TelegramSession.StateChoices.ASK_CATEGORY
        session.save(update_fields=["state", "data", "updated_at"])
        reply = _category_help_text()
        _send_message(int(chat_id), reply)
        return JsonResponse({"ok": True, "reply": reply})

    if session.state == TelegramSession.StateChoices.ASK_CATEGORY:
        category = _parse_category(text)
        if not category:
            reply = "Invalid category. " + _category_help_text()
            _send_message(int(chat_id), reply)
            return JsonResponse({"ok": True, "reply": reply})
        session.data["category"] = category
        session.state = TelegramSession.StateChoices.ASK_LOCATION
        session.save(update_fields=["state", "data", "updated_at"])
        reply = "Where did you lose it?"
        _send_message(int(chat_id), reply)
        return JsonResponse({"ok": True, "reply": reply})

    if session.state == TelegramSession.StateChoices.ASK_LOCATION:
        session.data["location"] = text
        session.state = TelegramSession.StateChoices.ASK_DATE
        session.save(update_fields=["state", "data", "updated_at"])
        reply = "When did you lose it? Use YYYY-MM-DD or 'today'."
        _send_message(int(chat_id), reply)
        return JsonResponse({"ok": True, "reply": reply})

    if session.state == TelegramSession.StateChoices.ASK_DATE:
        date_val = _parse_date(text)
        if not date_val:
            reply = "Invalid date. Use YYYY-MM-DD or 'today'."
            _send_message(int(chat_id), reply)
            return JsonResponse({"ok": True, "reply": reply})
        session.data["date_lost"] = str(date_val)
        session.state = TelegramSession.StateChoices.CONFIRM
        session.save(update_fields=["state", "data", "updated_at"])
        reply = _summary_text(session.data)
        _send_message(int(chat_id), reply)
        return JsonResponse({"ok": True, "reply": reply})

    if session.state == TelegramSession.StateChoices.CONFIRM:
        if lower not in {"confirm", "yes", "submit"}:
            reply = _summary_text(session.data)
            _send_message(int(chat_id), reply)
            return JsonResponse({"ok": True, "reply": reply})

        user_id = session.data.get("user_id")
        user = User.objects.filter(id=user_id).first()
        if not user:
            session.reset()
            reply = "User link missing. Send /report to start again."
            _send_message(int(chat_id), reply)
            return JsonResponse({"ok": True, "reply": reply})

        date_value = _parse_date(session.data.get("date_lost"))
        if not date_value:
            session.reset()
            reply = "Date missing. Send /report to start again."
            _send_message(int(chat_id), reply)
            return JsonResponse({"ok": True, "reply": reply})

        LostItem.objects.create(
            user=user,
            title=session.data.get("title", ""),
            description=session.data.get("description", ""),
            category=session.data.get("category", ItemCategory.OTHER),
            location_lost=session.data.get("location", ""),
            date_lost=date_value,
        )

        session.reset()
        reply = "Your lost item was logged. Thank you!"
        _send_message(int(chat_id), reply)
        return JsonResponse({"ok": True, "reply": reply})

    session.reset()
    reply = _start_message()
    _send_message(int(chat_id), reply)
    return JsonResponse({"ok": True, "reply": reply})
