"""
Redis cache for NLU query results.
Gracefully disabled when Redis is unavailable.
"""
import hashlib
import json
import logging
from typing import Optional

logger = logging.getLogger("nlu.cache")
_redis = None

def _get_client():
    global _redis
    if _redis is not None:
        return _redis if _redis is not False else None
    try:
        import redis
        from ..config import REDIS_URL
        client = redis.from_url(REDIS_URL, decode_responses=True, socket_connect_timeout=1)
        client.ping()
        logger.info("Redis cache connected at %s", REDIS_URL)
        _redis = client
        return _redis
    except Exception as e:
        logger.warning("Redis unavailable, caching disabled: %s", e)
        _redis = False
        return None

def cache_key(question: str) -> str:
    return "nlu:" + hashlib.md5(question.lower().strip().encode("utf-8")).hexdigest()

def get(question: str) -> Optional[dict]:
    r = _get_client()
    if not r:
        return None
    try:
        raw = r.get(cache_key(question))
        return json.loads(raw) if raw else None
    except Exception as e:
        logger.debug("Redis get failed: %s", e)
        return None

def set(question: str, response: dict, ttl: int = 300) -> None:
    r = _get_client()
    if not r:
        return
    try:
        r.setex(cache_key(question), ttl, json.dumps(response))
    except Exception as e:
        logger.debug("Redis set failed: %s", e)

def invalidate_all() -> int:
    """Call this after a new file upload to clear stale NLU cache."""
    r = _get_client()
    if not r:
        return 0
    try:
        keys = r.keys("nlu:*")
        if keys:
            return r.delete(*keys)
    except Exception as e:
        logger.warning("Redis cache invalidation failed: %s", e)
    return 0

