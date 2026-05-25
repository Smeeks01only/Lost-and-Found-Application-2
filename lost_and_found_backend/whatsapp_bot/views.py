import datetime
import logging
import re
import xml.etree.ElementTree as ET
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt

from accounts.models import User
from items.models import LostItem, ItemCategory
from .models import WhatsAppSession


EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
logger = logging.getLogger(__name__)


def _normalize_incoming(body: str) -> str:
    return (body or "").strip()


def _twiml(message: str) -> HttpResponse:
    response_el = ET.Element("Response")
    message_el = ET.SubElement(response_el, "Message")
    message_el.text = message
    payload = ET.tostring(response_el, encoding="utf-8", xml_declaration=True)
    logger.info("Twilio webhook reply: %s", message)
    return HttpResponse(payload, content_type="application/xml; charset=utf-8")


def _get_or_create_session(phone_number: str) -> WhatsAppSession:
    session, _ = WhatsAppSession.objects.get_or_create(phone_number=phone_number)
    return session


def _normalize_phone(value: str) -> str:
    raw = (value or "").strip()
    raw = raw.replace("whatsapp:", "")
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


def _get_user_by_phone(phone_number: str):
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


def _category_help_text() -> str:
    labels = [choice[1] for choice in ItemCategory.choices]
    numbered = "\n".join([f"{i+1}) {label}" for i, label in enumerate(labels)])
    return (
        "Choose category (reply with the number or name):\n"
        + numbered
    )


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


def _start_message() -> str:
    return (
    "Welcome to Lost & Found bot. "
    "Reply 'report' to log a lost item, or 'cancel' to stop."
    )


def _summary_text(data: dict) -> str:
    return (
        "Confirm details:\n"
        f"Title: {data.get('title')}\n"
        f"Description: {data.get('description')}\n"
        f"Category: {data.get('category')}\n"
        f"Location: {data.get('location')}\n"
        f"Date lost: {data.get('date_lost')}\n"
        "Reply 'confirm' to submit or 'restart' to start over."
    )


@csrf_exempt
def webhook(request):
    if request.method != "POST":
        return HttpResponse(status=405)

    from_raw = request.POST.get("From", "")
    body = _normalize_incoming(request.POST.get("Body", ""))
    incoming_phone = _normalize_phone(from_raw)
    session_key = incoming_phone or (from_raw.replace("whatsapp:", "") if from_raw else "unknown")

    session = _get_or_create_session(session_key)
    safe_body = "***" if session.state == WhatsAppSession.StateChoices.ASK_PASSWORD else body
    logger.info("Twilio webhook received: From=%s Body=%r", from_raw, safe_body)

    if not body:
        return _twiml("Please send a message to begin.")

    lower = body.lower()
    if lower in {"cancel", "stop"}:
        session.reset()
        return _twiml("Canceled. Reply 'report' to start again.")

    if lower in {"hi", "hello", "hey", "start", "menu", "help"}:
        return _twiml(_start_message())

    if lower in {"restart", "start over"}:
        session.reset()
        return _twiml(_start_message())

    if lower in {"report", "lost", "report lost"} and session.state != WhatsAppSession.StateChoices.START:
        session.reset()
        existing_user = _get_user_by_phone(incoming_phone)
        if existing_user:
            session.data = {"user_id": str(existing_user.id)}
            session.state = WhatsAppSession.StateChoices.ASK_TITLE
            session.save(update_fields=["state", "data", "updated_at"])
            return _twiml("What is the item title?")
        session.state = WhatsAppSession.StateChoices.ASK_EMAIL
        session.save(update_fields=["state", "updated_at"])
        return _twiml("We couldn't verify your phone number. Please enter your email to sign in.")

    if session.state == WhatsAppSession.StateChoices.START:
        if lower not in {"report", "lost", "report lost"}:
            return _twiml(_start_message())
        existing_user = _get_user_by_phone(incoming_phone)
        if existing_user:
            session.data = {"user_id": str(existing_user.id)}
            session.state = WhatsAppSession.StateChoices.ASK_TITLE
            session.save(update_fields=["state", "data", "updated_at"])
            return _twiml("What is the item title?")
        session.state = WhatsAppSession.StateChoices.ASK_EMAIL
        session.save(update_fields=["state", "updated_at"])
        return _twiml("We couldn't verify your phone number. Please enter your email to sign in.")

    if session.state == WhatsAppSession.StateChoices.ASK_EMAIL:
        if not EMAIL_RE.match(body):
            return _twiml("That email looks invalid. Please enter a valid email.")
        session.data = {"pending_email": body.strip()}
        session.state = WhatsAppSession.StateChoices.ASK_PASSWORD
        session.save(update_fields=["state", "data", "updated_at"])
        return _twiml("Please enter your password.")

    if session.state == WhatsAppSession.StateChoices.ASK_PASSWORD:
        pending_email = (session.data or {}).get("pending_email")
        user = _authenticate_user(pending_email or "", body)
        if not user:
            session.data = {}
            session.state = WhatsAppSession.StateChoices.ASK_EMAIL
            session.save(update_fields=["state", "data", "updated_at"])
            return _twiml("Invalid credentials. Please enter your email again, or reply 'restart'.")
        if incoming_phone and not user.phone_number:
            user.phone_number = incoming_phone
            user.save(update_fields=["phone_number"])
        session.data = {"user_id": str(user.id)}
        session.state = WhatsAppSession.StateChoices.ASK_TITLE
        session.save(update_fields=["state", "data", "updated_at"])
        return _twiml("Signed in. What is the item title?")

    if session.state == WhatsAppSession.StateChoices.ASK_TITLE:
        session.data["title"] = body
        session.state = WhatsAppSession.StateChoices.ASK_DESCRIPTION
        session.save(update_fields=["state", "data", "updated_at"])
        return _twiml("Provide a short description of the item.")

    if session.state == WhatsAppSession.StateChoices.ASK_DESCRIPTION:
        session.data["description"] = body
        session.state = WhatsAppSession.StateChoices.ASK_CATEGORY
        session.save(update_fields=["state", "data", "updated_at"])
        return _twiml(_category_help_text())

    if session.state == WhatsAppSession.StateChoices.ASK_CATEGORY:
        category = _parse_category(body)
        if not category:
            return _twiml("Invalid category. " + _category_help_text())
        session.data["category"] = category
        session.state = WhatsAppSession.StateChoices.ASK_LOCATION
        session.save(update_fields=["state", "data", "updated_at"])
        return _twiml("Where did you lose it?")

    if session.state == WhatsAppSession.StateChoices.ASK_LOCATION:
        session.data["location"] = body
        session.state = WhatsAppSession.StateChoices.ASK_DATE
        session.save(update_fields=["state", "data", "updated_at"])
        return _twiml("When did you lose it? Use YYYY-MM-DD or 'today'.")

    if session.state == WhatsAppSession.StateChoices.ASK_DATE:
        date_val = _parse_date(body)
        if not date_val:
            return _twiml("Invalid date. Use YYYY-MM-DD or 'today'.")
        session.data["date_lost"] = str(date_val)
        session.state = WhatsAppSession.StateChoices.CONFIRM
        session.save(update_fields=["state", "data", "updated_at"])
        return _twiml(_summary_text(session.data))

    if session.state == WhatsAppSession.StateChoices.CONFIRM:
        if lower not in {"confirm", "yes", "submit"}:
            return _twiml(_summary_text(session.data))
        user_id = session.data.get("user_id")
        user = User.objects.filter(id=user_id).first()
        if not user:
            session.reset()
            return _twiml("User link missing. Reply 'report' to start again.")
        date_value = _parse_date(session.data.get("date_lost"))
        if not date_value:
            session.reset()
            return _twiml("Date missing. Reply 'report' to start again.")
        LostItem.objects.create(
            user=user,
            title=session.data.get("title", ""),
            description=session.data.get("description", ""),
            category=session.data.get("category", ItemCategory.OTHER),
            location_lost=session.data.get("location", ""),
            date_lost=date_value,
        )
        session.reset()
        return _twiml("Your lost item was logged. Thank you!")

    session.reset()
    return _twiml(_start_message())
