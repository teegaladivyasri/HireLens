from app.core.config import settings
from app.ai_matching.providers.base import BaseAIProvider
from app.ai_matching.providers.native_provider import NativeAIProvider
from app.ai_matching.providers.gemini_provider import GeminiAIProvider
from app.ai_matching.providers.openai_provider import OpenAIProvider


def get_ai_provider() -> BaseAIProvider:
    """
    Factory helper to instantiate the configured AI Provider.
    If an external provider is selected without credentials, raises ValueError with explicit configuration instructions.
    """
    provider_name = (settings.AI_PROVIDER or "native").lower().strip()

    if provider_name == "native":
        return NativeAIProvider()

    elif provider_name == "gemini":
        if not settings.AI_API_KEY:
            raise ValueError(
                "AI Provider 'gemini' is configured but AI_API_KEY is missing. "
                "Please configure AI_API_KEY in backend/.env, or set AI_PROVIDER=native."
            )
        return GeminiAIProvider(api_key=settings.AI_API_KEY, model=settings.AI_MODEL)

    elif provider_name in {"openai", "ollama", "azure"}:
        if not settings.AI_API_KEY and provider_name != "ollama":
            raise ValueError(
                f"AI Provider '{provider_name}' is configured but AI_API_KEY is missing. "
                f"Please configure AI_API_KEY in backend/.env, or set AI_PROVIDER=native."
            )
        return OpenAIProvider(
            api_key=settings.AI_API_KEY or "ollama",
            model=settings.AI_MODEL,
            base_url=settings.AI_BASE_URL,
        )

    else:
        raise ValueError(
            f"Unsupported AI Provider '{settings.AI_PROVIDER}'. "
            f"Please set AI_PROVIDER to 'native', 'gemini', or 'openai' in backend/.env."
        )
