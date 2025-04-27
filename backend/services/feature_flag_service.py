from datetime import datetime
from typing import Dict, Any, List, Optional, Set
import json
from redis import Redis
from sqlalchemy.orm import Session

from models.audit import AuditEvent
from services.alert_service import AlertService

class FeatureFlag:
    """Feature flag configuration."""
    def __init__(
        self,
        key: str,
        description: str,
        enabled: bool = False,
        user_groups: Optional[Set[str]] = None,
        percentage_rollout: Optional[int] = None,
        enterprise_only: bool = False,
        killswitch_enabled: bool = True,
        alert_on_error: bool = True,
        metadata: Optional[Dict[str, Any]] = None
    ):
        self.key = key
        self.description = description
        self.enabled = enabled
        self.user_groups = user_groups or set()
        self.percentage_rollout = percentage_rollout
        self.enterprise_only = enterprise_only
        self.killswitch_enabled = killswitch_enabled
        self.alert_on_error = alert_on_error
        self.metadata = metadata or {}
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert feature flag to dictionary."""
        return {
            "key": self.key,
            "description": self.description,
            "enabled": self.enabled,
            "user_groups": list(self.user_groups),
            "percentage_rollout": self.percentage_rollout,
            "enterprise_only": self.enterprise_only,
            "killswitch_enabled": self.killswitch_enabled,
            "alert_on_error": self.alert_on_error,
            "metadata": self.metadata
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'FeatureFlag':
        """Create feature flag from dictionary."""
        return cls(
            key=data["key"],
            description=data["description"],
            enabled=data["enabled"],
            user_groups=set(data.get("user_groups", [])),
            percentage_rollout=data.get("percentage_rollout"),
            enterprise_only=data.get("enterprise_only", False),
            killswitch_enabled=data.get("killswitch_enabled", True),
            alert_on_error=data.get("alert_on_error", True),
            metadata=data.get("metadata", {})
        )

class FeatureFlagService:
    """Service for managing feature flags with Redis backend."""
    
    REDIS_KEY_PREFIX = "feature_flags:"
    REDIS_AUDIT_KEY = "feature_flags:audit_log"
    MAX_AUDIT_LOG_SIZE = 1000
    
    def __init__(self, redis_client: Redis):
        self.redis = redis_client
    
    def _get_redis_key(self, flag_key: str) -> str:
        """Get Redis key for feature flag."""
        return f"{self.REDIS_KEY_PREFIX}{flag_key}"
    
    def create_feature_flag(
        self,
        db: Session,
        flag: FeatureFlag,
        user_id: str
    ) -> None:
        """Create a new feature flag."""
        redis_key = self._get_redis_key(flag.key)
        if self.redis.exists(redis_key):
            raise ValueError(f"Feature flag '{flag.key}' already exists")
        
        # Store flag in Redis
        self.redis.set(redis_key, json.dumps(flag.to_dict()))
        
        # Audit log
        self._log_flag_change(db, flag.key, "created", user_id, flag.to_dict())
    
    def update_feature_flag(
        self,
        db: Session,
        flag: FeatureFlag,
        user_id: str
    ) -> None:
        """Update an existing feature flag."""
        redis_key = self._get_redis_key(flag.key)
        if not self.redis.exists(redis_key):
            raise ValueError(f"Feature flag '{flag.key}' does not exist")
        
        # Get old state for audit
        old_state = json.loads(self.redis.get(redis_key))
        
        # Update flag in Redis
        self.redis.set(redis_key, json.dumps(flag.to_dict()))
        
        # Audit log
        self._log_flag_change(
            db,
            flag.key,
            "updated",
            user_id,
            flag.to_dict(),
            old_state
        )
    
    def delete_feature_flag(
        self,
        db: Session,
        flag_key: str,
        user_id: str
    ) -> None:
        """Delete a feature flag."""
        redis_key = self._get_redis_key(flag_key)
        if not self.redis.exists(redis_key):
            raise ValueError(f"Feature flag '{flag_key}' does not exist")
        
        # Get old state for audit
        old_state = json.loads(self.redis.get(redis_key))
        
        # Delete from Redis
        self.redis.delete(redis_key)
        
        # Audit log
        self._log_flag_change(
            db,
            flag_key,
            "deleted",
            user_id,
            None,
            old_state
        )
    
    def get_feature_flag(self, flag_key: str) -> Optional[FeatureFlag]:
        """Get a feature flag by key."""
        redis_key = self._get_redis_key(flag_key)
        data = self.redis.get(redis_key)
        if not data:
            return None
        return FeatureFlag.from_dict(json.loads(data))
    
    def list_feature_flags(self) -> List[FeatureFlag]:
        """List all feature flags."""
        keys = self.redis.keys(f"{self.REDIS_KEY_PREFIX}*")
        flags = []
        for key in keys:
            if key.decode() == self.REDIS_AUDIT_KEY:
                continue
            data = self.redis.get(key)
            if data:
                flags.append(FeatureFlag.from_dict(json.loads(data)))
        return flags
    
    def is_feature_enabled(
        self,
        flag_key: str,
        user_id: Optional[str] = None,
        user_groups: Optional[Set[str]] = None,
        is_enterprise: bool = False
    ) -> bool:
        """Check if a feature is enabled for a user."""
        flag = self.get_feature_flag(flag_key)
        if not flag:
            return False
        
        if not flag.enabled:
            return False
        
        # Enterprise check
        if flag.enterprise_only and not is_enterprise:
            return False
        
        # User group check
        if flag.user_groups and user_groups:
            if not (flag.user_groups & user_groups):
                return False
        
        # Percentage rollout check
        if flag.percentage_rollout is not None and user_id:
            # Use consistent hashing for stable rollout
            import hashlib
            hash_input = f"{flag_key}:{user_id}".encode()
            hash_value = int(hashlib.sha256(hash_input).hexdigest(), 16)
            user_percentage = (hash_value % 100) + 1
            if user_percentage > flag.percentage_rollout:
                return False
        
        return True
    
    def _log_flag_change(
        self,
        db: Session,
        flag_key: str,
        action: str,
        user_id: str,
        new_state: Optional[Dict[str, Any]] = None,
        old_state: Optional[Dict[str, Any]] = None
    ) -> None:
        """Log feature flag changes to audit log and alert system."""
        timestamp = datetime.utcnow()
        
        # Create audit event
        audit_event = AuditEvent(
            timestamp=timestamp,
            user_id=user_id,
            event_type=f"feature_flag_{action}",
            resource_type="feature_flag",
            resource_id=flag_key,
            metadata={
                "action": action,
                "flag_key": flag_key,
                "new_state": new_state,
                "old_state": old_state
            }
        )
        db.add(audit_event)
        db.commit()
        
        # Add to Redis audit log
        audit_entry = {
            "timestamp": timestamp.isoformat(),
            "user_id": user_id,
            "action": action,
            "flag_key": flag_key,
            "new_state": new_state,
            "old_state": old_state
        }
        self.redis.lpush(self.REDIS_AUDIT_KEY, json.dumps(audit_entry))
        self.redis.ltrim(self.REDIS_AUDIT_KEY, 0, self.MAX_AUDIT_LOG_SIZE - 1)
        
        # Generate alert for critical changes
        if action in ["created", "deleted"] or (
            action == "updated" and
            new_state and
            old_state and
            new_state.get("enabled") != old_state.get("enabled")
        ):
            AlertService.get_all_alerts(db)  # Trigger alert check
    
    def get_audit_log(
        self,
        limit: int = 100,
        skip: int = 0
    ) -> List[Dict[str, Any]]:
        """Get feature flag audit log."""
        audit_log = self.redis.lrange(
            self.REDIS_AUDIT_KEY,
            skip,
            skip + limit - 1
        )
        return [json.loads(entry) for entry in audit_log]
    
    def emergency_killswitch(
        self,
        db: Session,
        flag_key: str,
        user_id: str,
        reason: str
    ) -> None:
        """Emergency killswitch for a feature flag."""
        flag = self.get_feature_flag(flag_key)
        if not flag:
            raise ValueError(f"Feature flag '{flag_key}' does not exist")
        
        if not flag.killswitch_enabled:
            raise ValueError(f"Killswitch not enabled for feature '{flag_key}'")
        
        # Disable the flag
        flag.enabled = False
        flag.metadata["killswitch_activated"] = {
            "timestamp": datetime.utcnow().isoformat(),
            "user_id": user_id,
            "reason": reason
        }
        
        # Update flag
        self.update_feature_flag(db, flag, user_id)
        
        # Generate high-priority alert
        AlertService.get_all_alerts(db)  # Trigger immediate alert 