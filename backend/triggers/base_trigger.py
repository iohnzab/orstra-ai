from abc import ABC, abstractmethod


class BaseTrigger(ABC):
    trigger_type: str = ""

    @abstractmethod
    def start(self, agent_id: str, config: dict) -> None:
        raise NotImplementedError

    @abstractmethod
    def stop(self, agent_id: str) -> None:
        raise NotImplementedError
