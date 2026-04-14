from abc import ABC, abstractmethod


class BaseConnector(ABC):
    service: str = ""
    display_name: str = ""

    @abstractmethod
    def verify(self, credentials: dict) -> bool:
        """Verify that the credentials actually work."""
        raise NotImplementedError

    @abstractmethod
    def get_credential_fields(self) -> list[dict]:
        """Return the fields required to configure this connector."""
        raise NotImplementedError
